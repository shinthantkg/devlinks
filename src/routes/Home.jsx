import { useContext, useEffect, useRef, useState } from "react";
import { HomeContext } from "../contexts/home/HomeContext.jsx";
import LinkDialog from "../components/home/links/LinkDialog.jsx";
import Navbar from "../components/shared/Navbar.jsx";
import ProfileMockup from "../components/home/profile-mockup/ProfileMockup.jsx";
import ImageUpload from "../components/home/profile-details/ImageUpload.jsx";
import { collection, doc, onSnapshot, updateDoc } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { auth, db, storage } from "../firebase/config.js";
import styles from "../styles/modules/_home.module.scss";

export default function Home() {
    const { setRerenderFlag, page, profileData, setProfileData, saveLinks } = useContext(HomeContext);

    // All the states for the home component.
    const [currentFullName, setCurrentFullName] = useState(null);
    const [currentEmail, setCurrentEmail] = useState(null);
    const [isAddingLinks, setIsAddingLinks] = useState(false);
    const [noLinks, setNoLinks] = useState(true);

    const imageUploadRef = useRef(null);

    useEffect(() => {
        // Listen for changes in authentication state
        const unsubscribe = auth.onAuthStateChanged(user => {
            if (user) {
                let linksCollectionUnsubscribe;

                // Subscribe to profile document changes
                const profileDocUnsubscribe = onSnapshot(doc(db, `profiles/${user.uid}`), profileSnapshot => {
                    if (profileSnapshot.exists()) {
                        setProfileData(profileSnapshot.data());
                        setCurrentFullName(profileSnapshot.data().fullName);
                        setCurrentEmail(profileSnapshot.data().email);

                        // Subscribe to links collection changes
                        linksCollectionUnsubscribe = onSnapshot(collection(db, `profiles/${user.uid}/links`), linksSnapshot => {
                            if (!linksSnapshot.empty) {
                                const updatedData = [];

                                // Iterate over link documents
                                linksSnapshot.forEach(linkSnapshot => {
                                    // Update local data array with link data
                                    updatedData[parseInt(linkSnapshot.id.split("-")[1]) - 1] = {
                                        platform: linkSnapshot.data().platform,
                                        url: linkSnapshot.data().url
                                    };
                                });

                                // Save updated data array to local storage
                                localStorage.setItem("linkDialogs", JSON.stringify(updatedData));
                                setNoLinks(linksSnapshot.empty);
                            }
                        });
                    }
                });

                // Unsubscribe from profile and links collections on component unmount
                return () => {
                    profileDocUnsubscribe();
                    if (linksCollectionUnsubscribe) {
                        linksCollectionUnsubscribe();
                    }
                };
            }
        });

        // Unsubscribe from authentication changes on component unmount
        return () => {
            unsubscribe();
        };
    }, [setProfileData]);

    const handleAddButton = () => {
        /**
          * Handles the click event of the "Add new link" button.
          * If adding links is not already in progress, it sets the flag to indicate that
          * new links are being added. Additionally, if the maximum number of link dialogs
          * has not been reached, it adds a new link dialog by updating the local storage
          * and the state.
          */

        if (!isAddingLinks) {
            setIsAddingLinks(true);
        }

        if (JSON.parse(localStorage.getItem("linkDialogs") || "[]").length !== 5) {
            const prevDialogs = JSON.parse(localStorage.getItem("linkDialogs")) || [];
            const newDialogs = {
                platform: "",
                url: ""
            };

            localStorage.setItem("linkDialogs", JSON.stringify([...prevDialogs, newDialogs]));
            setRerenderFlag(prevFlag => !prevFlag);
        }
    };

    const handleImageUploadButtonClick = () => {
        imageUploadRef.current.click();
    }

    const handleImageUpload = () => {
        /**
         * Handles the upload of an image file, performs validation, uploads to storage,
         * and updates the profile picture URL in the Firestore database.
         * @function handleImageUpload
         */

        // Get the file object from the file input
        const file = imageUploadRef.current.files[0];

        // Extract the file extension from the file name
        const fileNameParts = file.name.split(".");
        const fileExtension = fileNameParts[fileNameParts.length - 1];

        // Create a new FileReader instance to read the file contents
        const reader = new FileReader();

        // Callback function triggered when the file is loaded
        reader.onload = event => {
            // Create a new image element
            const image = new Image();
            // Set the source of the image to the data URL of the uploaded file
            image.src = event.target.result;

            // Callback function triggered when the image is loaded
            image.onload = () => {
                // Check if the image dimensions are within the specified limit
                if (image.width <= 1024 && image.height <= 1024) {
                    // Create a reference to the location where the image will be stored in Firebase Storage
                    const imageRef = ref(storage, `profilePictures/profile-${auth.currentUser.uid}.${fileExtension}`);

                    // Upload the image file to Firebase Storage
                    uploadBytes(imageRef, file)
                        .then(() => {
                            // Get the download URL of the uploaded image
                            getDownloadURL(imageRef)
                                .then(imageUrl => {
                                    // Get a reference to the user's profile document in Firestore
                                    const profileDocRef = doc(db, `profiles/${auth.currentUser.uid}`);

                                    // Update the profile picture URL in Firestore
                                    updateDoc(profileDocRef, {
                                        "profilePicture": imageUrl
                                    })
                                        .then(() => {
                                            console.log("Successfully updated profile picture!");
                                        })
                                        .catch(error => {
                                            console.error("Error updating profile picture: ", error);
                                        })
                                })
                                .catch(error => {
                                    console.error("Error getting image URL: ", error);
                                });
                        })
                        .catch(error => {
                            console.error("Error uploading image: ", error);
                        });
                } else {
                    console.error("Image exceeds the 1024x1024 size limit.");
                }
            };
        };

        // Read the contents of the file as a data URL
        reader.readAsDataURL(file);
    };

    const handleSaveProfile = event => {
        /**
         * Handles the saving of profile details to Firestore.
         * @param {Event} event - The event object representing the form submission.
         * @function handleSaveProfile
         */

        // Prevent the default form submission behavior
        event.preventDefault();

        // Get a reference to the user's profile document in Firestore
        const profileDocRef = doc(db, `profiles/${auth.currentUser.uid}`);

        // Update the profile details in Firestore
        updateDoc(profileDocRef, {
            email: currentEmail,
            fullName: currentFullName
        })
            .then(() => {
                console.log("Successfully updated profile details.");
            })
            .catch(error => {
                console.error("Error updating profile details: ", error);
            });
    };

    return (
        <div className={`${styles["container-home"]}`}>
            <Navbar />

            <main className={`flex flex-gap-35`}>
                <ProfileMockup />

                <div className={`${styles["container-main"]} flex-60`}>
                    {
                        page === 0 ?
                            <>
                                <h1>Customize your links</h1>
                                <span className={`margin-none`}>Add/edit/remove up to 5 links below and then share all your profiles with the world!</span>

                                <button onClick={handleAddButton} className={`button button-clear button-add-link`}>+ Add new link</button>

                                {
                                    ((!isAddingLinks && noLinks) || JSON.parse(localStorage.getItem("linkDialogs") || "[]").length === 0) || JSON.parse(localStorage.getItem("linkDialogs")).length === 0 === 0 ?
                                        <>
                                            <div className={`${styles["container-links-get-started"]}`}>
                                                <svg xmlns="http://www.w3.org/2000/svg" width="250" height="161"
                                                    fill="none" viewBox="0 0 250 161">
                                                    <path fill="#fff"
                                                        d="M48.694 15.421C23.379 25.224 4.594 50.068.858 80.128c-3.12 25.331 4.335 53.318 48.23 61.291 85.406 15.52 173.446 17.335 193.864-24.525 20.417-41.86-7.525-108.891-50.873-113.53C157.683-.326 98.146-3.721 48.694 15.42Z"
                                                        opacity=".3" />
                                                    <path fill="#333"
                                                        d="M157.022 9.567H93.044a7.266 7.266 0 0 0-7.266 7.267v120.91a7.266 7.266 0 0 0 7.266 7.266h63.978a7.266 7.266 0 0 0 7.267-7.266V16.834a7.266 7.266 0 0 0-7.267-7.267Z" />
                                                    <path fill="#333"
                                                        d="M125.033 140.872a5.687 5.687 0 1 0 0-11.374 5.687 5.687 0 0 0 0 11.374Z"
                                                        opacity=".03" />
                                                    <path fill="#EFEBFF"
                                                        d="M156.628 21.321H93.431V126.78h63.197V21.321Z" />
                                                    <path fill="#333"
                                                        d="M117.797 120.508a2.065 2.065 0 1 0 0-4.13 2.065 2.065 0 0 0 0 4.13Z"
                                                        opacity=".03" />
                                                    <path fill="#fff"
                                                        d="M125.033 120.508a2.066 2.066 0 1 0 0-4.132 2.066 2.066 0 0 0 0 4.132Z"
                                                        opacity=".44" />
                                                    <path fill="#333"
                                                        d="M132.269 120.508a2.066 2.066 0 1 0 0-4.132 2.066 2.066 0 0 0 0 4.132ZM148.199 32.953h-46.332v39.552h46.332V32.953ZM134.373 80.129h-32.506v3.621h32.506V80.13ZM148.199 80.129h-11.632v3.621h11.632V80.13ZM117.053 91.237h-15.186v3.622h15.186v-3.622ZM148.199 91.237H120.28v3.622h27.919v-3.622ZM136.954 102.353h-35.087v3.622h35.087v-3.622Z"
                                                        opacity=".03" />
                                                    <path fill="#EFEBFF"
                                                        d="M78.656 21.321H15.459V126.78h63.197V21.321Z" />
                                                    <path fill="#fff"
                                                        d="M39.825 120.508a2.065 2.065 0 1 0 0-4.13 2.065 2.065 0 0 0 0 4.13Z"
                                                        opacity=".44" />
                                                    <path fill="#333"
                                                        d="M47.061 120.508a2.065 2.065 0 1 0 0-4.13 2.065 2.065 0 0 0 0 4.13ZM54.297 120.508a2.065 2.065 0 1 0 0-4.13 2.065 2.065 0 0 0 0 4.13ZM70.227 32.953H23.895v39.552h46.332V32.953ZM56.4 80.129H23.895v3.621H56.4V80.13ZM70.227 80.129H58.595v3.621h11.632V80.13ZM39.08 91.237H23.896v3.622H39.08v-3.622ZM70.227 91.237h-27.92v3.622h27.92v-3.622ZM58.982 102.353H23.895v3.622h35.087v-3.622Z"
                                                        opacity=".03" />
                                                    <path fill="#EFEBFF"
                                                        d="M234.6 21.321h-63.197V126.78H234.6V21.321Z" />
                                                    <path fill="#333"
                                                        d="M195.769 120.508a2.065 2.065 0 1 0 0-4.13 2.065 2.065 0 0 0 0 4.13ZM203.005 120.508a2.066 2.066 0 1 0 0-4.132 2.066 2.066 0 0 0 0 4.132Z"
                                                        opacity=".03" />
                                                    <path fill="#fff"
                                                        d="M210.242 120.508a2.066 2.066 0 1 0-.001-4.131 2.066 2.066 0 0 0 .001 4.131Z"
                                                        opacity=".44" />
                                                    <path fill="#333"
                                                        d="M226.171 32.953h-46.332v39.552h46.332V32.953ZM212.345 80.129h-32.506v3.621h32.506V80.13ZM226.171 80.129h-11.632v3.621h11.632V80.13ZM195.025 91.237h-15.186v3.622h15.186v-3.622ZM226.179 91.237H198.26v3.622h27.919v-3.622ZM214.926 102.353h-35.087v3.622h35.087v-3.622Z"
                                                        opacity=".03" />
                                                    <path fill="#333"
                                                        d="M146.597 145.041c0-.76-1.61-31.891-.577-36.522 1.033-4.632 10.509-27.274 8.011-29.917-2.498-2.642-11.648 3.372-11.648 3.372s1.671-27.267-2.278-29.21c-3.948-1.944-5.702 5.671-5.702 5.671L132.3 88.936l-10.418 55.96 24.715.145Z"
                                                        opacity=".1" />
                                                    <path fill="#F4A28C"
                                                        d="M139.559 113.295c1.328-5.316 3.325-10.502 4.601-15.87.843-3.553 6.295-18.405 7.821-22.779.47-1.344.873-2.969-.038-4.062a2.646 2.646 0 0 0-2.422-.76 4.842 4.842 0 0 0-2.339 1.223c-1.519 1.337-4.32 7.95-6.371 7.943-2.482 0-1.313-6.834-1.381-8.148-.281-5.656.136-12.908-2.073-18.223-1.64-3.948-5.71-3.417-6.667.85-.957 4.268-.919 22.15-.919 22.15s-15.884-2.727-18.595 2.118c-2.711 4.844 1.868 35.618 1.868 35.618l26.515-.06Z" />
                                                    <path fill="#633CFF"
                                                        d="m141.495 160.5-.289-48.906-29.681-6.515L99.574 160.5h41.921Z" />
                                                    <path fill="#333"
                                                        d="m141.495 160.5-.289-48.906-14.168-3.113-2.536 52.019h16.993Z"
                                                        opacity=".1" />
                                                </svg>

                                                <h2>Let&apos;s get you started</h2>
                                                <p className={`${styles["getting-started"]}`}>Use the &quot;Add new
                                                    link&quot; button to get started. Once you have more than one link,
                                                    you can reorder and edit them. We&apos;re here to help you share
                                                    your profiles with everyone!</p>
                                            </div>
                                        </>
                                        :
                                        JSON.parse(localStorage.getItem("linkDialogs"))?.map((dialog, index) => (
                                            <LinkDialog key={index} id={index} selectedUrl={(dialog.url)} selectedPlatform={dialog.platform} />
                                        )
                                        )
                                }

                                <div className="flex flex-jc-fe">
                                    <button onClick={saveLinks} className={`button button-fill ${!isAddingLinks && JSON.parse(localStorage.getItem("linkDialogs") || "[]").length === 0 ? "button-disabled" : null}`} disabled={!isAddingLinks && JSON.parse(localStorage.getItem("linkDialogs") || "[]").length === 0}>Save</button>
                                </div>
                            </>
                            :
                            <>
                                <h1>Profile Details</h1>
                                <span>Add your details to create a personal touch to your profile.</span>

                                <form onSubmit={handleSaveProfile}>
                                    <ImageUpload ref={imageUploadRef} profileData={profileData} handleClick={handleImageUploadButtonClick} handleUpload={handleImageUpload} />

                                    <div className={`${styles["dialog"]} ${styles["dialog-profile"]} flex flex-fd-c`}>
                                        <div className={`flex flex-jc-sb flex-ai-c flex-gap-150`} style={{ marginBottom: "1.875rem" }}>
                                            <label style={{ width: "6.25rem" }} htmlFor="fullName">Full name</label>
                                            {
                                                profileData.fullName !== "" ?
                                                    <input style={{ marginBottom: "0" }} id="fullName" type="text" placeholder="e.g. John" onChange={event => setCurrentFullName(event.target.value)} value={currentFullName} />
                                                    :
                                                    <input style={{ marginBottom: "0" }} id="fullName" type="text" placeholder="e.g. John" value={currentFullName} />
                                            }
                                        </div>

                                        <div className={`flex flex-jc-sb flex-ai-c flex-gap-150`}>
                                            <label style={{ width: "6.25rem" }} htmlFor="email">Email</label>
                                            {
                                                profileData.email !== "" ?
                                                    <input style={{ marginBottom: "0" }} id="email" type="email" placeholder="e.g. john@email.com" onChange={event => setCurrentEmail(event.target.value)} value={currentEmail} />
                                                    :
                                                    <input style={{ marginBottom: "0" }} id="email" type="email" placeholder="e.g. john@email.com" onChange={event => setCurrentEmail(event.target.value)} value={currentEmail} />
                                            }
                                        </div>
                                    </div>

                                    <div className={`flex flex-jc-fe`}>
                                        <button className={`button button-fill`} type="submit">Save</button>
                                    </div>
                                </form>
                            </>
                    }
                </div>
            </main>
        </div>
    );
}
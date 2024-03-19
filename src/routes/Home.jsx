/* eslint-disable react/prop-types */
import { useContext, useEffect, useRef, useState } from "react";
import { HomeContext } from "../contexts/home/HomeContext.jsx";
import LinkDialog from "../components/home/links/LinkDialog.jsx";
import Navbar from "../components/shared/Navbar.jsx";
import { collection, doc, onSnapshot, updateDoc } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { auth, db, storage } from "../firebase/config.js";
import styles from "../styles/modules/_home.module.scss";
import facebookIcon from "../images/icons/icon-facebook.svg";
import instagramIcon from "../images/icons/icon-instagram.svg";
import twitterIcon from "../images/icons/icon-twitter.svg";
import youtubeIcon from "../images/icons/icon-youtube.svg";
import githubIcon from "../images/icons/icon-github.svg";

export default function Home() {
    const { setRerenderFlag, page, profileData, setProfileData, validateLink, saveLinks } = useContext(HomeContext);

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
                <div className={`${styles["container-mockup"]} flex-40`}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="308" height="632" fill="none" viewBox="0 0 308 632"><path stroke="#737373" d="M1 54.5C1 24.953 24.953 1 54.5 1h199C283.047 1 307 24.953 307 54.5v523c0 29.547-23.953 53.5-53.5 53.5h-199C24.953 631 1 607.047 1 577.5v-523Z" /><path fill="#fff" stroke="#737373" d="M12 55.5C12 30.923 31.923 11 56.5 11h24C86.851 11 92 16.149 92 22.5c0 8.008 6.492 14.5 14.5 14.5h95c8.008 0 14.5-6.492 14.5-14.5 0-6.351 5.149-11.5 11.5-11.5h24c24.577 0 44.5 19.923 44.5 44.5v521c0 24.577-19.923 44.5-44.5 44.5h-195C31.923 621 12 601.077 12 576.5v-521Z" />{profileData.profilePicture === "" ? <circle cx="153.5" cy="112" r="48" fill="#EEE" /> : <foreignObject x="0" y="70" width="100%" height="100%" rx="4"><img className={`${styles["mockup-image"]}`} src={`${profileData.profilePicture}`} alt="profile-picture" /></foreignObject>}{profileData.fullName === "" ? <rect width="160" height="16" x="73.5" y="185" fill="#EEE" rx="8" /> : <foreignObject x="0" y="170" width="100%" height="32" rx="4"><p className={`${styles["mockup"]} ${styles["mockup-name"]} no-select`}>{profileData.fullName}</p></foreignObject>}<foreignObject x="0" y="200" width="100%" height="32" rx="4"><p className={`${styles["mockup"]} no-select`}>{profileData.email}</p></foreignObject>{
                        JSON.parse(localStorage.getItem("linkDialogs"))?.map((linkDialog, index) => (
                            <foreignObject key={index} x="35" y={278 + 60 * index} width="237" height="60" rx="8">
                                <a className={`flex flex-ai-c flex-gap-5 ${styles["link-rect"]} ${linkDialog.platform !== "" ? styles[`link-rect-${linkDialog.platform}`] : null}`} href={validateLink(linkDialog.platform, linkDialog.url) ? linkDialog.url : null} target={linkDialog.url !== "" ? "_blank" : null}>
                                    {linkDialog.platform !== "" ?
                                        (() => {
                                            switch (linkDialog.platform) {
                                                case "facebook":
                                                    return (<><img src={facebookIcon} alt="" /> <span>Facebook</span></>);

                                                case "instagram":
                                                    return (<><img src={instagramIcon} alt="" width="30" height="30" /> <span>Instagram</span></>);

                                                case "twitter":
                                                    return (<><img src={twitterIcon} alt="" /> <span>Twitter</span></>);

                                                case "youtube":
                                                    return (<><img src={youtubeIcon} alt="" /> <span>YouTube</span></>)

                                                case "github":
                                                    return (<><img src={githubIcon} alt="" /> <span>GitHub</span></>)
                                            }
                                        })()
                                        : null}
                                </a>
                            </foreignObject>
                        ))
                    }</svg>
                </div>

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
                                    <div className={`${styles["dialog"]} ${styles["dialog-profile"]} flex flex-jc-sb flex-ai-c flex-gap-150`}>
                                        <label htmlFor="image-upload">Profile picture</label>

                                        <div className={`flex flex-gap-30 flex-ai-c`}>
                                            <div className={`${profileData.profilePicture === "" ? styles["button-image-upload"] : null} flex flex-fd-c flex-jc-c flex-ai-c flex-gap-10`} style={profileData.profilePicture !== "" ? { backgroundImage: `url(${profileData.profilePicture})`, backgroundSize: "cover", borderRadius: "0.625rem", cursor: "pointer", width: "12rem", height: "12rem" } : null} onClick={handleImageUploadButtonClick}>
                                                <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" fill="none" viewBox="0 0 40 40"><path fill={profileData.profilePicture === "" ? "#633CFF" : "#fff"} d="M33.75 6.25H6.25a2.5 2.5 0 0 0-2.5 2.5v22.5a2.5 2.5 0 0 0 2.5 2.5h27.5a2.5 2.5 0 0 0 2.5-2.5V8.75a2.5 2.5 0 0 0-2.5-2.5Zm0 2.5v16.055l-4.073-4.072a2.5 2.5 0 0 0-3.536 0l-3.125 3.125-6.875-6.875a2.5 2.5 0 0 0-3.535 0L6.25 23.339V8.75h27.5ZM6.25 26.875l8.125-8.125 12.5 12.5H6.25v-4.375Zm27.5 4.375h-3.34l-5.624-5.625L27.91 22.5l5.839 5.84v2.91ZM22.5 15.625a1.875 1.875 0 1 1 3.75 0 1.875 1.875 0 0 1-3.75 0Z" /></svg>
                                                <span className={`${styles["button-image-upload-indicator"]} ${profileData.profilePicture === "" ? styles["button-image-upload-indicator-purple"] : styles["button-image-upload-indicator-white"]}`}>+ Upload Image</span>
                                                <input id="image-upload" type="file" ref={imageUploadRef} accept="image/*" onChange={handleImageUpload} className={`hidden`} />
                                            </div>

                                            <span className={`${styles["dialog-profile-image-indicator"]}`}>Image must be below 1024x1024px. Use PNG or JPG format.</span>
                                        </div>
                                    </div>

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
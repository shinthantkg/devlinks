/* eslint-disable react/prop-types */
import { useEffect, useState } from "react";
import { signOut } from "firebase/auth";
import { collection, doc, deleteDoc, getDoc, getDocs, onSnapshot, setDoc } from "firebase/firestore";
import { auth, db } from "../config/firebase.js";
import styles from "../styles/modules/_home.module.scss";
import logo from "../images/logos/logo-devlinks-large.svg";
import dragIcon from "../images/icons/icon-drag-and-drop.svg";

export default function Home() {
    const [profileData, setData] = useState({});
    const [page, setPage] = useState(0);
    const [isAddingLinks, setIsAddingLinks] = useState(false);
    const [noLinks, setNoLinks] = useState(true);
    const [numLinkDialogs, setNumLinkDialogs] = useState(JSON.parse(localStorage.getItem("linkDialogs"))?.length || 0);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(user => {
            if (user) {
                const profileDocUnsubscribe = onSnapshot(doc(db, `profiles/${user.uid}`), profileSnapshot => {
                    if (profileSnapshot.exists()) {
                        setData(profileSnapshot.data());
                    }
                });

                const linksCollectionUnsubscribe = onSnapshot(collection(db, `profiles/${user.uid}/links`), linksSnapshot => {
                    setNoLinks(linksSnapshot.empty);
                });

                return () => {
                    profileDocUnsubscribe();
                    linksCollectionUnsubscribe();
                };
            }
        });

        return () => {
            unsubscribe();
        };
    }, []);

    const handleAddButton = () => {
        if (!isAddingLinks) {
            setIsAddingLinks(true);
        }

        if (numLinkDialogs !== 5) {
            const prevDialogs = JSON.parse(localStorage.getItem("linkDialogs")) || [];
            const newDialogs = {
                platform: "",
                url: ""
            };

            localStorage.setItem("linkDialogs", JSON.stringify([...prevDialogs, newDialogs]));
            setNumLinkDialogs(prevState => prevState + 1);
        }
    };

    function validateLink(platform, link) {
        const patterns = {
            github: /^(?:https?:\/\/)?(?:www\.)?github\.com\/[a-zA-Z0-9_-]+\/?$/,
            instagram: /^(?:https?:\/\/)?(?:www\.)?instagram\.com\/[a-zA-Z0-9_.]+\/?$/,
            twitter: /^(?:https?:\/\/)?(?:www\.)?twitter\.com\/[a-zA-Z0-9_]+\/?$/,
            youtube: /^(?:https?:\/\/)?(?:www\.)?youtube\.com\/(?:@)?[a-zA-Z0-9_-]+\/?$/,
            facebook: /^(?:https?:\/\/)?(?:www\.)?facebook\.com\/[a-zA-Z0-9.]+\/?$/,
        };

        const regex = new RegExp(patterns[platform], 'i');
        return regex.test(link);
    }

    const saveLinks = async () => {
        const linksCollectionRef = collection(db, `profiles/${auth.currentUser.uid}/links`);

        try {
            // Delete existing documents
            const linkSnapshots = await getDocs(linksCollectionRef);
            if (!linkSnapshots.empty) {
                await Promise.all(linkSnapshots.docs.map(async linkSnapshot => {
                    await deleteDoc(doc(db, `profiles/${auth.currentUser.uid}/links/${linkSnapshot.id}`));
                }));
            }
        } catch (error) {
            console.error("Error deleting existing documents:", error);
        }

        const links = JSON.parse(localStorage.getItem("linkDialogs"));
        if (links) {
            for (let i = 0; i < links.length; i++) {
                const link = links[i];
                const linkRef = doc(collection(db, `profiles/${auth.currentUser.uid}/links`), `link-${i + 1}`);

                if (validateLink(link.platform, link.url)) {
                    try {
                        await setDoc(linkRef, link);
                    } catch (error) {
                        console.error("Error setting document:", error);
                    }
                }
            }
        }
    };

    const LinkDialog = ({ id, selectedPlatform, selectedUrl }) => {
        const [platform, setPlatform] = useState(selectedPlatform);
        const [url, setUrl] = useState(selectedUrl);

        const handleDialogFieldsChange = (event, field) => {
            const updatedData = JSON.parse(localStorage.getItem("linkDialogs"));
            updatedData[id][field] = event.target.value;
            localStorage.setItem("linkDialogs", JSON.stringify(updatedData));

            if (field === "platform") {
                setPlatform(event.target.value);
            } else if (field === "url") {
                setUrl(event.target.value);
            }
        };

        const handleDialogRemove = () => {
            const linkRef = doc(db, `profiles/${auth.currentUser.uid}/links/link-${id + 1}`);

            getDoc(linkRef)
                .then(linkSnapshot => {
                    if (linkSnapshot.exists()) {
                        deleteDoc(linkRef);
                    }
                })
                .then(() => {
                    const updatedData = JSON.parse(localStorage.getItem("linkDialogs"));
                    updatedData.splice(id, 1);
                    localStorage.setItem("linkDialogs", JSON.stringify(updatedData));
                    setNumLinkDialogs(prevState => prevState - 1);
                    saveLinks();
                })
                .catch(error => {
                    console.error("Error removing document or updating local storage: ", error);
                });
        };

        return (
            <article className={`flex flex-fd-c ${styles["link-dialog"]}`}>
                <div className={`flex flex-jc-sb`}>
                    <div>
                        <span className={`${styles["drag-icon"]}`}><img src={dragIcon} alt="" /></span>
                        <span className={`${styles["link-id"]}`}>Link #{id + 1}</span>
                    </div>

                    <div>
                        <span className={`${styles["link-dialog-remove"]}`} onClick={handleDialogRemove}>Remove</span>
                    </div>
                </div>

                <form onSubmit={event => event.preventDefault} className={`${styles["link-form"]}`}>
                    <label htmlFor="link-platform">Platform</label>
                    <select
                        name="link-platform"
                        id="link-platform"
                        required
                        onChange={event => handleDialogFieldsChange(event, "platform")}
                    >
                        {
                            platform === "" ?
                                <option value="" selected disabled>Select platform</option>
                                :
                                <option value="" disabled>Select platform</option>
                        }

                        {
                            platform === "facebook" ?
                                <option value="facebook" selected>Facebook</option>
                                :
                                <option value="facebook">Facebook</option>
                        }

                        {
                            platform === "instagram" ?
                                <option value="instagram" selected>Instagram</option>
                                :
                                <option value="instagram">Instagram</option>
                        }

                        {
                            platform === "twitter" ?
                                <option value="twitter" selected>Twitter</option>
                                :
                                <option value="twitter">Twitter</option>
                        }

                        {
                            platform === "youtube" ?
                                <option value="youtube" selected>YouTube</option>
                                :
                                <option value="youtube">YouTube</option>
                        }

                        {
                            platform === "github" ?
                                <option value="github" selected>GitHub</option>
                                :
                                <option value="github">GitHub</option>
                        }
                    </select>

                    <label htmlFor="link-url">Link</label>
                    <input
                        id="link-url"
                        name="link-url"
                        type="text"
                        value={url}
                        placeholder="e.g. https://www.github.com/shinthantkg"
                        required
                        onChange={event => handleDialogFieldsChange(event, "url")}
                    />
                </form>
            </article>
        );
    };

    return (
        <div className={`${styles["container-home"]}`}>
            <header>
                <nav className={`flex flex-jc-sb flex-ai-c ${styles["navbar"]}`}>
                    <a href="/"><img src={logo} alt="Devlinks" /></a>

                    <div className={`flex flex-jc-c flex-gap-35`}>
                        <div className={`flex flex-jc-c flex-ai-c flex-gap-5 ${page === 0 ? styles["navbar-link-active"] : null}`}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 16 16"><path fill="#737373" d="M8.523 11.72a.749.749 0 0 1 0 1.063l-.371.371A3.751 3.751 0 1 1 2.847 7.85l1.507-1.506A3.75 3.75 0 0 1 9.5 6.188a.753.753 0 0 1-1 1.125 2.25 2.25 0 0 0-3.086.091L3.908 8.91a2.25 2.25 0 0 0 3.183 3.183l.37-.371a.748.748 0 0 1 1.062 0Zm4.63-8.874a3.756 3.756 0 0 0-5.305 0l-.371.37A.751.751 0 1 0 8.539 4.28l.372-.37a2.25 2.25 0 0 1 3.182 3.182l-1.507 1.507a2.25 2.25 0 0 1-3.086.09.753.753 0 0 0-1 1.125 3.75 3.75 0 0 0 5.144-.152l1.507-1.507a3.756 3.756 0 0 0 .002-5.307v-.001Z" /></svg>
                            <span className={`${styles["navbar-link"]}`} onClick={() => setPage(0)}>Links</span>
                        </div>

                        <div className={`flex flex-jc-c flex-gap-35`}>
                            <div className={`flex flex-jc-c flex-ai-c flex-gap-5 ${page === 1 ? styles["navbar-link-active"] : null}`}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="21" height="20" fill="none" viewBox="0 0 21 20"><path fill="#737373" d="M10.5 1.563A8.437 8.437 0 1 0 18.938 10 8.447 8.447 0 0 0 10.5 1.562ZM6.716 15.357a4.688 4.688 0 0 1 7.568 0 6.54 6.54 0 0 1-7.568 0Zm1.596-5.982a2.188 2.188 0 1 1 4.376 0 2.188 2.188 0 0 1-4.376 0Zm7.344 4.683a6.523 6.523 0 0 0-2.265-1.83 4.062 4.062 0 1 0-5.782 0 6.522 6.522 0 0 0-2.265 1.83 6.562 6.562 0 1 1 10.304 0h.008Z" /></svg>
                                <span className={`${styles["navbar-link"]}`} onClick={() => setPage(1)}>Profile Details</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-jc-c flex-gap-15">
                        <button className={`button button-clear margin-none`}>Preview</button>
                        <button onClick={() => signOut(auth)} className="button button-fill margin-none">Log out</button>
                    </div>
                </nav>
            </header>

            <main className={`flex flex-gap-35`}>
                <div className={`${styles["container-mockup"]} flex-40`}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="308" height="632" fill="none" viewBox="0 0 308 632"><path stroke="#737373" d="M1 54.5C1 24.953 24.953 1 54.5 1h199C283.047 1 307 24.953 307 54.5v523c0 29.547-23.953 53.5-53.5 53.5h-199C24.953 631 1 607.047 1 577.5v-523Z" /><path fill="#fff" stroke="#737373" d="M12 55.5C12 30.923 31.923 11 56.5 11h24C86.851 11 92 16.149 92 22.5c0 8.008 6.492 14.5 14.5 14.5h95c8.008 0 14.5-6.492 14.5-14.5 0-6.351 5.149-11.5 11.5-11.5h24c24.577 0 44.5 19.923 44.5 44.5v521c0 24.577-19.923 44.5-44.5 44.5h-195C31.923 621 12 601.077 12 576.5v-521Z" />{profileData.profilePicture === "" ? <circle cx="153.5" cy="112" r="48" fill="#EEE" /> : <foreignObject x="0" y="70" width="100%" height="100%" rx="4"><img className={`${styles["mockup-image"]}`} src={`${profileData.profilePicture}`} alt="profile-picture" /></foreignObject>}{profileData.fullName === "" ? <rect width="160" height="16" x="73.5" y="185" fill="#EEE" rx="8" /> : <foreignObject x="0" y="170" width="100%" height="32" rx="4"><p className={`${styles["mockup"]} ${styles["mockup-name"]}`}>{profileData.fullName}</p></foreignObject>}<foreignObject x="0" y="200" width="100%" height="32" rx="4"><p className={`${styles["mockup"]}`}>{profileData.email}</p></foreignObject><rect width="237" height="44" x="35" y="278" fill="#EEE" rx="8" /><rect width="237" height="44" x="35" y="342" fill="#EEE" rx="8" /><rect width="237" height="44" x="35" y="406" fill="#EEE" rx="8" /><rect width="237" height="44" x="35" y="470" fill="#EEE" rx="8" /><rect width="237" height="44" x="35" y="534" fill="#EEE" rx="8" /></svg>
                </div>

                <div className={`${styles["container-main"]} flex-60`}>
                    {
                        page === 0 ?
                            <>
                                <h1>Customize your links</h1>
                                <span className={`margin-none`}>Add/edit/remove up to 5 links below and then share all your profiles with the world!</span>

                                <button onClick={handleAddButton} className={`button button-clear button-add-link`}>+ Add new link</button>

                                {
                                    (!isAddingLinks && noLinks && numLinkDialogs === 0) || numLinkDialogs === 0 ?
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
                                    <button onClick={saveLinks} className={`button button-fill ${!isAddingLinks && numLinkDialogs === 0 ? "button-disabled" : null}`} disabled={!isAddingLinks && numLinkDialogs === 0}>Save</button>
                                </div>
                            </>
                            : null
                    }
                </div>
            </main>
        </div>
    );
}
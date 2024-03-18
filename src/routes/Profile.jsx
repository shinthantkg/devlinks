import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { collection, getDocs, query, where, limit } from "firebase/firestore";
import { db } from "../config/firebase";
import styles from "../styles/modules/_profile.module.scss";
import facebookIcon from "../images/icons/icon-facebook.svg";
import instagramIcon from "../images/icons/icon-instagram.svg";
import twitterIcon from "../images/icons/icon-twitter.svg";
import youtubeIcon from "../images/icons/icon-youtube.svg";
import githubIcon from "../images/icons/icon-github.svg";

export default function Profile() {
    const { profileId } = useParams();
    const [profileData, setProfileData] = useState({});
    const [userId, setUserId] = useState(null);
    const [links, setLinks] = useState([]);

    useEffect(() => {
        const getProfile = () => {
            const q = query(collection(db, "profiles"), where("id", "==", parseInt(profileId)), limit(1));

            getDocs(q)
                .then(profileSnapshots => {
                    if (!profileSnapshots.empty) {
                        const profileDoc = profileSnapshots.docs[0];
                        setProfileData(profileDoc.data());
                        setUserId(profileDoc.id);
                    }
                })
                .catch(error => {
                    console.error("Error retrieving data: ", error);
                });
        };

        getProfile();
    }, [profileId]);

    useEffect(() => {
        const getLinks = () => {
            getDocs(collection(db, `profiles/${userId}/links`))
                .then(linkSnapshots => {
                    const newLinks = linkSnapshots.docs.map(linkDoc => ({
                        platform: linkDoc.data().platform,
                        url: linkDoc.data().url
                    }));
    
                    setLinks(prevLinks => [...prevLinks, ...newLinks]);
                })
                .catch(error => {
                    console.error("Error retrieving links: ", error);
                });
        };
    
        if (userId !== null) {
            getLinks();
        }
    }, [userId]);

    const copyLinkToClipboard = () => {
        const url = window.location.href;
        navigator.clipboard.writeText(url).then(() => {
            alert("Link copied to clipboard.");
        }).catch(error => {
            console.error("Error copying link to clipboard: ", error);
        });
    };

    return (
        <>
            <header className={`${styles["header"]}`}>
                <nav className={`flex flex-jc-sb navbar`}>
                    <button className={`button button-clear margin-none`} onClick={() => { window.location.href = "/" }}>Back to Editor</button>
                    <button className={`button button-fill margin-none`} onClick={copyLinkToClipboard}>Copy Link</button>
                </nav>
            </header>

            <main>
                <div className={`flex flex-jc-c`}>
                    <article className={`flex flex-fd-c flex-ai-c ${styles["card"]}`}>
                        <figure className={`flex flex-fd-c flex-ai-c`}>
                            <img className={`${styles["card-image"]}`} src={profileData.profilePicture} alt={`Profile picture.`} />
                            <figcaption className={`flex flex-fd-c flex-ai-c`}>
                                <h1>{profileData.fullName}</h1>
                                <span>{profileData.email}</span>
                            </figcaption>
                        </figure>

                        {links.length !== 0 && (
                            links.map((link, index) => (
                                <a key={index} className={`flex flex-ai-c flex-gap-5 ${styles["link-rect"]} ${styles[`link-rect-${link.platform}`]}`} href={link.url} target="_blank">
                                    {(() => {
                                        switch (link.platform) {
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
                                    })()}
                                </a>
                            ))
                        )}
                    </article>
                </div>
            </main>
        </>
    );
}

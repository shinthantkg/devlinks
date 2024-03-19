import { useContext, useEffect, useState } from "react";
import { HomeContext } from "../contexts/home/HomeContext.jsx";
import { collection, doc, onSnapshot } from "firebase/firestore";
import { auth, db } from "../firebase/config.js";
import Navbar from "../components/shared/Navbar.jsx";
import ProfileMockup from "../components/home/shared/profile-mockup/ProfileMockup.jsx";
import LinksPanel from "../components/home/links/LinksPanel.jsx";
import ProfileDetailsPanel from "../components/home/profile-details/ProfileDetailsPanel.jsx";
import styles from "../styles/modules/_home.module.scss";

export default function Home() {
    const { setRerenderFlag, page, profileData, setProfileData, saveLinks } = useContext(HomeContext);

    // All the states for the home component.
    const [selectedFullName, setSelectedFullName] = useState(null);
    const [selectedEmail, setSelectedEmail] = useState(null);
    const [isAddingLinks, setIsAddingLinks] = useState(false);
    const [noLinks, setNoLinks] = useState(true);

    useEffect(() => {
        // Listen for changes in authentication state
        const unsubscribe = auth.onAuthStateChanged(user => {
            if (user) {
                let linksCollectionUnsubscribe;

                // Subscribe to profile document changes
                const profileDocUnsubscribe = onSnapshot(doc(db, `profiles/${user.uid}`), profileSnapshot => {
                    if (profileSnapshot.exists()) {
                        setProfileData(profileSnapshot.data());
                        setSelectedFullName(profileSnapshot.data().fullName);
                        setSelectedEmail(profileSnapshot.data().email);

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

    return (
        <div className={`${styles["container-home"]}`}>
            <Navbar />

            <main className={`flex flex-gap-35`}>
                <ProfileMockup />

                <div className={`${styles["container-main"]} flex-60`}>
                    {
                        page === 0 ?
                            <LinksPanel isAddingLinks={isAddingLinks} setIsAddingLinks={setIsAddingLinks} setRerenderFlag={setRerenderFlag} noLinks={noLinks} saveLinks={saveLinks} />
                            :
                            <ProfileDetailsPanel profileData={profileData} selectedFullName={selectedFullName} selectedEmail={selectedEmail} setSelectedFullName={setSelectedFullName} setSelectedEmail={setSelectedEmail} />
                    }
                </div>
            </main>
        </div>
    );
}
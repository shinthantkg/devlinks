import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { collection, getDocs, query, where, limit } from "firebase/firestore";
import { db } from "../firebase/config.js";
import Navbar from "../components/shared/Navbar.jsx";
import Card from "../components/profile/Card.jsx";

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

    return (
        <>
            <Navbar pageType="profile" />

            <main>
                <div className={`flex flex-jc-c`}>
                    <Card profileData={profileData} links={links} />
                </div>
            </main>
        </>
    );
}

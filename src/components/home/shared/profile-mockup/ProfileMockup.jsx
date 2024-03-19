import { useContext } from "react";
import { HomeContext } from "../../../../contexts/home/HomeContext.jsx";
import Link from "../../../shared/links/Link.jsx";
import styles from "../../../../styles/modules/shared/_profile-mockup.module.scss";

const ProfileMockup = () => {
    const { profileData } = useContext(HomeContext);

    return (
        <div className={`${styles["container"]} flex-40`}>
            <svg xmlns="http://www.w3.org/2000/svg" width="308" height="632" fill="none" viewBox="0 0 308 632"><path stroke="#737373" d="M1 54.5C1 24.953 24.953 1 54.5 1h199C283.047 1 307 24.953 307 54.5v523c0 29.547-23.953 53.5-53.5 53.5h-199C24.953 631 1 607.047 1 577.5v-523Z" /><path fill="#fff" stroke="#737373" d="M12 55.5C12 30.923 31.923 11 56.5 11h24C86.851 11 92 16.149 92 22.5c0 8.008 6.492 14.5 14.5 14.5h95c8.008 0 14.5-6.492 14.5-14.5 0-6.351 5.149-11.5 11.5-11.5h24c24.577 0 44.5 19.923 44.5 44.5v521c0 24.577-19.923 44.5-44.5 44.5h-195C31.923 621 12 601.077 12 576.5v-521Z" />{profileData.profilePicture === "" ? <circle cx="153.5" cy="112" r="48" fill="#EEE" /> : <foreignObject x="0" y="70" width="100%" height="100%" rx="4"><img className={`${styles["mockup-image"]}`} src={`${profileData.profilePicture}`} alt="profile-picture" /></foreignObject>}{profileData.fullName === "" ? <rect width="160" height="16" x="73.5" y="185" fill="#EEE" rx="8" /> : <foreignObject x="0" y="170" width="100%" height="32" rx="4"><p className={`${styles["mockup"]} ${styles["mockup-name"]} no-select`}>{profileData.fullName}</p></foreignObject>}<foreignObject x="0" y="200" width="100%" height="32" rx="4"><p className={`${styles["mockup"]} no-select`}>{profileData.email}</p></foreignObject>{
                JSON.parse(localStorage.getItem("linkDialogs"))?.map((linkDialog, index) => (
                    <foreignObject key={index} x="35" y={278 + 60 * index} width="237" height="60" rx="8">
                        <Link linkDialog={linkDialog} pageType={"home"} />
                    </foreignObject>
                ))
            }</svg>
        </div>
    );
};

export default ProfileMockup;

import { useContext } from "react";
import { HomeContext } from "../../contexts/home/HomeContext.jsx";
import { signOut } from "firebase/auth";
import { auth } from "../../firebase/config.js";
import styles from "../../styles/modules/_home.module.scss";
import logo from "../../images/logos/logo-devlinks-large.svg";

const Navbar = () => {
    const { page, setPage, profileData } = useContext(HomeContext);

    const handlePreview = () => {
        window.location.href = `/profile/${profileData.id}`;
    };

    const handleLogOut = () => {
        localStorage.removeItem("linkDialogs");
        signOut(auth);
    };

    return (
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
                    <button className={`button button-clear ${!("id" in profileData) ? "button-disabled" : null} margin-none`} onClick={handlePreview} disabled={!("id" in profileData)}>Preview</button>
                    <button onClick={handleLogOut} className="button button-fill margin-none">Log out</button>
                </div>
            </nav>
        </header>
    )
};

export default Navbar;

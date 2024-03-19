import PropTypes from "prop-types";
import LinkDialog from "../../../components/home/links/LinkDialog.jsx";
import styles from "../../../styles/modules/home/_home.module.scss";
import illustration from "../../../images/illustrations/illustration-empty.svg";

const LinksPanel = ({ isAddingLinks, setIsAddingLinks, setRerenderFlag, noLinks, saveLinks }) => {
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

    return (
        <>
            <h1>Customize your links</h1>
            <span className={`margin-none`}>Add/edit/remove up to 5 links below and then share all your profiles with the world!</span>

            <button onClick={handleAddButton} className={`button button-clear button-add-link`}>+ Add new link</button>

            {
                ((!isAddingLinks && noLinks) || JSON.parse(localStorage.getItem("linkDialogs") || "[]").length === 0) || JSON.parse(localStorage.getItem("linkDialogs")).length === 0 === 0 ?
                    <>
                        <div className={`${styles["container-links-get-started"]}`}>
                            <img src={illustration} alt="Get started." />

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
    );
};

LinksPanel.propTypes = {
    isAddingLinks: PropTypes.bool.isRequired,
    setIsAddingLinks: PropTypes.func.isRequired,
    setRerenderFlag: PropTypes.func.isRequired,
    noLinks: PropTypes.bool.isRequired,
    saveLinks: PropTypes.func.isRequired
};

export default LinksPanel;
import PropTypes from "prop-types";
import LinkIcon from "./LinkIcon.jsx";
import styles from "../../../styles/modules/shared/_link.module.scss";

const Link = ({ linkDialog, validateLink }) => {
    const platforms = {
        "facebook": "Facebook",
        "instagram": "Instagram",
        "twitter": "Twitter",
        "youtube": "YouTube",
        "github": "GitHub"
    };

    return (
        <a className={`flex flex-ai-c flex-gap-5 ${styles["link-rect"]} ${linkDialog.platform !== "" ? styles[`link-rect-${linkDialog.platform}`] : null}`} href={validateLink(linkDialog.platform, linkDialog.url) ? linkDialog.url : null} target={linkDialog.url !== "" ? "_blank" : null}>
            {linkDialog.platform !== "" ?
                <>
                    <LinkIcon platform={linkDialog.platform} /> <span>{platforms[linkDialog.platform]}</span>
                </>
                : null}
        </a>
    );
};

Link.propTypes = {
    linkDialog: PropTypes.object.isRequired,
    validateLink: PropTypes.func.isRequired
};

export default Link;
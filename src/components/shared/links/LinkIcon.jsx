import PropTypes from "prop-types";
import facebookIcon from "../../../images/icons/icon-facebook.svg";
import instagramIcon from "../../../images/icons/icon-instagram.svg";
import twitterIcon from "../../../images/icons/icon-twitter.svg";
import youtubeIcon from "../../../images/icons/icon-youtube.svg";
import githubIcon from "../../../images/icons/icon-github.svg";

const LinkIcon = ({ platform }) => {
    const icons = {
        "facebook": facebookIcon,
        "instagram": instagramIcon,
        "twitter": twitterIcon,
        "youtube": youtubeIcon,
        "github": githubIcon
    };

    return (
        <img src={icons[platform]} style={platform === "instagram" ? {width: "1.25rem", height: "1.25rem"} : null} />
    );
};

LinkIcon.propTypes = {
    platform: PropTypes.string.isRequired
};

export default LinkIcon;

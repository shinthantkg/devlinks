import { useContext } from "react";
import PropTypes from "prop-types";
import { HomeContext } from "../../../contexts/home/HomeContext.jsx";
import LinkIcon from "./LinkIcon.jsx";
import linkStyles from "../../../styles/modules/shared/_link.module.scss";
import cardStyles from "../../../styles/modules/profile/_card.module.scss";

const Link = ({ linkDialog, pageType }) => {
    const { validateLink } = useContext(HomeContext);

    const platforms = {
        "facebook": "Facebook",
        "instagram": "Instagram",
        "twitter": "Twitter",
        "youtube": "YouTube",
        "github": "GitHub"
    };

    return (
        <a className={`flex flex-ai-c flex-gap-5 ${cardStyles["link"]} ${linkStyles["link-rect"]} ${linkDialog.platform !== "" ? linkStyles[`link-rect-${linkDialog.platform}`] : null}`} href={validateLink(linkDialog.platform, linkDialog.url) || pageType === "profile" ? linkDialog.url : null} target={linkDialog.url !== "" ? "_blank" : null}>
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
    pageType: PropTypes.string.isRequired
};

export default Link;
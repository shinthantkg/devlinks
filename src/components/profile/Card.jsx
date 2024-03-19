import PropTypes from "prop-types";
import Link from "../shared/links/Link.jsx";
import styles from "../../styles/modules/profile/_card.module.scss";

const Card = ({ profileData, links }) => {
    return (
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
                    <Link key={index} linkDialog={link} pageType="profile" />
                ))
            )}
        </article>
    )
};

Card.propTypes = {
    profileData: PropTypes.object.isRequired,
    links: PropTypes.array.isRequired
};

export default Card;
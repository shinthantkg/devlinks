import { forwardRef } from "react";
import PropTypes from "prop-types";
import styles from "../../../styles/modules/_home.module.scss";

const ImageUpload = forwardRef(({ profileData, handleClick, handleUpload }, ref) => {
    return (
        <div className={`${styles["dialog"]} ${styles["dialog-profile"]} flex flex-jc-sb flex-ai-c flex-gap-150`}>
            <label htmlFor="image-upload">Profile picture</label>

            <div className={`flex flex-gap-30 flex-ai-c`}>
                <div className={`${profileData.profilePicture === "" ? styles["button-image-upload"] : null} flex flex-fd-c flex-jc-c flex-ai-c flex-gap-10`} style={profileData.profilePicture !== "" ? { backgroundImage: `url(${profileData.profilePicture})`, backgroundSize: "cover", borderRadius: "0.625rem", cursor: "pointer", width: "12rem", height: "12rem" } : null} onClick={handleClick}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" fill="none" viewBox="0 0 40 40"><path fill={profileData.profilePicture === "" ? "#633CFF" : "#fff"} d="M33.75 6.25H6.25a2.5 2.5 0 0 0-2.5 2.5v22.5a2.5 2.5 0 0 0 2.5 2.5h27.5a2.5 2.5 0 0 0 2.5-2.5V8.75a2.5 2.5 0 0 0-2.5-2.5Zm0 2.5v16.055l-4.073-4.072a2.5 2.5 0 0 0-3.536 0l-3.125 3.125-6.875-6.875a2.5 2.5 0 0 0-3.535 0L6.25 23.339V8.75h27.5ZM6.25 26.875l8.125-8.125 12.5 12.5H6.25v-4.375Zm27.5 4.375h-3.34l-5.624-5.625L27.91 22.5l5.839 5.84v2.91ZM22.5 15.625a1.875 1.875 0 1 1 3.75 0 1.875 1.875 0 0 1-3.75 0Z" /></svg>
                    <span className={`${styles["button-image-upload-indicator"]} ${profileData.profilePicture === "" ? styles["button-image-upload-indicator-purple"] : styles["button-image-upload-indicator-white"]}`}>+ Upload Image</span>
                    <input id="image-upload" type="file" ref={ref} accept="image/*" onChange={handleUpload} className={`hidden`} />
                </div>

                <span className={`${styles["dialog-profile-image-indicator"]}`}>Image must be below 1024x1024px. Use PNG or JPG format.</span>
            </div>
        </div>
    );
});

ImageUpload.displayName = "ImageUpload";

ImageUpload.propTypes = {
    profileData: PropTypes.object.isRequired,
    handleClick: PropTypes.func.isRequired,
    handleUpload: PropTypes.func.handleUpload
};

export default ImageUpload;
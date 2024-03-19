import { doc, updateDoc } from "firebase/firestore";
import { auth, db } from "../../../firebase/config";
import PropTypes from "prop-types";
import ImageUpload from "./ImageUpload";
import styles from "../../../styles/modules/home/profile-details/_profile-details-form.module.scss";

const ProfileDetailsForm = ({ profileData, selectedFullName, selectedEmail, setSelectedFullName, setSelectedEmail }) => {
    const handleSaveProfile = event => {
        /**
         * Handles the saving of profile details to Firestore.
         * @param {Event} event - The event object representing the form submission.
         * @function handleSaveProfile
         */

        // Prevent the default form submission behavior
        event.preventDefault();

        // Get a reference to the user's profile document in Firestore
        const profileDocRef = doc(db, `profiles/${auth.currentUser.uid}`);

        // Update the profile details in Firestore
        updateDoc(profileDocRef, {
            email: selectedEmail,
            fullName: selectedFullName
        })
            .then(() => {
                console.log("Successfully updated profile details.");
            })
            .catch(error => {
                console.error("Error updating profile details: ", error);
            });
    };

    return (
        <form onSubmit={handleSaveProfile}>
            <ImageUpload profileData={profileData} />

            <div className={`${styles["dialog"]} ${styles["dialog-profile"]} flex flex-fd-c`}>
                <div className={`${styles["dialog-profile-field-container"]} flex flex-jc-sb flex-ai-c flex-gap-150`}>
                    <label className={`${styles["dialog-profile-field-label"]}`} htmlFor="fullName">Full name</label>
                    {
                        profileData.fullName !== "" ?
                            <input className={`${styles["dialog-profile-field-input"]}`} id="fullName" type="text" placeholder="e.g. John" onChange={event => setSelectedFullName(event.target.value)} value={selectedFullName} />
                            :
                            <input className={`${styles["dialog-profile-field-input"]}`} id="fullName" type="text" placeholder="e.g. John" onChange={event => setSelectedFullName(event.target.value)} value={selectedFullName} />
                    }
                </div>

                <div className={`flex flex-jc-sb flex-ai-c flex-gap-150`}>
                    <label className={`${styles["dialog-profile-field-label"]}`} htmlFor="email">Email</label>
                    {
                        profileData.email !== "" ?
                            <input className={`${styles["dialog-profile-field-input"]}`} id="email" type="email" placeholder="e.g. john@email.com" onChange={event => setSelectedEmail(event.target.value)} value={selectedEmail} />
                            :
                            <input className={`${styles["dialog-profile-field-input"]}`} id="email" type="email" placeholder="e.g. john@email.com" onChange={event => setSelectedEmail(event.target.value)} value={selectedEmail} />
                    }
                </div>
            </div>

            <div className={`flex flex-jc-fe`}>
                <button className={`button button-fill`} type="submit">Save</button>
            </div>
        </form>
    );
};

ProfileDetailsForm.propTypes = {
    profileData: PropTypes.object.isRequired,
    selectedFullName: PropTypes.string.isRequired,
    selectedEmail: PropTypes.string.isRequired,
    setSelectedFullName: PropTypes.func.isRequired,
    setSelectedEmail: PropTypes.func.isRequired
};

export default ProfileDetailsForm;
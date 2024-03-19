import PropTypes from "prop-types";
import ProfileDetailsForm from "./ProfileDetailsForm";

const ProfileDetailsPanel = ({ profileData, selectedFullName, selectedEmail, setSelectedFullName, setSelectedEmail }) => {
    return (
        <>
            <h1>Profile Details</h1>
            <span>Add your details to create a personal touch to your profile.</span>

            <ProfileDetailsForm profileData={profileData} selectedFullName={selectedFullName} selectedEmail={selectedEmail} setSelectedFullName={setSelectedFullName} setSelectedEmail={setSelectedEmail} />
        </>
    );
};

ProfileDetailsPanel.propTypes = {
    profileData: PropTypes.object.isRequired,
    selectedFullName: PropTypes.string.isRequired,
    selectedEmail: PropTypes.string.isRequired,
    setSelectedFullName: PropTypes.func.isRequired,
    setSelectedEmail: PropTypes.func.isRequired
}

export default ProfileDetailsPanel;

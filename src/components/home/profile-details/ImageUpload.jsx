import { useRef } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { getDownloadURL, uploadBytes } from "firebase/storage";
import { auth, db, storage } from "../../../firebase/config";
import PropTypes from "prop-types";
import styles from "../../../styles/modules/home/profile-details/_profile-details-form.module.scss";

const ImageUpload = ({ profileData }) => {
  const ref = useRef(null);

  const handleClick = () => {
    ref.current.click();
  };

  const handleUpload = () => {
    /**
     * Handles the upload of an image file, performs validation, uploads to storage,
     * and updates the profile picture URL in the Firestore database.
     * @function handleImageUpload
     */

    // Get the file object from the file input
    const file = ref.current.files[0];

    // Extract the file extension from the file name
    const fileNameParts = file.name.split(".");
    const fileExtension = fileNameParts[fileNameParts.length - 1];

    // Create a new FileReader instance to read the file contents
    const reader = new FileReader();

    // Callback function triggered when the file is loaded
    reader.onload = (event) => {
      // Create a new image element
      const image = new Image();
      // Set the source of the image to the data URL of the uploaded file
      image.src = event.target.result;

      // Callback function triggered when the image is loaded
      image.onload = () => {
        // Check if the image dimensions are within the specified limit
        if (image.width <= 1024 && image.height <= 1024) {
          // Create a reference to the location where the image will be stored in Firebase Storage
          const imageRef = ref(
            storage,
            `profilePictures/profile-${auth.currentUser.uid}.${fileExtension}`
          );

          // Upload the image file to Firebase Storage
          uploadBytes(imageRef, file)
            .then(() => {
              // Get the download URL of the uploaded image
              getDownloadURL(imageRef)
                .then((imageUrl) => {
                  // Get a reference to the user's profile document in Firestore
                  const profileDocRef = doc(
                    db,
                    `profiles/${auth.currentUser.uid}`
                  );

                  // Update the profile picture URL in Firestore
                  updateDoc(profileDocRef, {
                    profilePicture: imageUrl,
                  })
                    .then(() => {
                      console.log("Successfully updated profile picture!");
                    })
                    .catch((error) => {
                      console.error("Error updating profile picture: ", error);
                    });
                })
                .catch((error) => {
                  console.error("Error getting image URL: ", error);
                });
            })
            .catch((error) => {
              console.error("Error uploading image: ", error);
            });
        } else {
          console.error("Image exceeds the 1024x1024 size limit.");
        }
      };
    };

    // Read the contents of the file as a data URL
    reader.readAsDataURL(file);
  };

  return (
    <div
      className={`${styles["dialog"]} ${styles["dialog-profile"]} flex flex-jc-sb flex-ai-c flex-gap-150`}
    >
      <label htmlFor="image-upload">Profile picture</label>

      <div className={`flex flex-gap-30 flex-ai-c`}>
        <div
          className={`${styles["dialog-profile-image-upload"]} ${
            profileData.profilePicture === ""
              ? styles["dialog-profile-image-upload-none"]
              : null
          } flex flex-fd-c flex-jc-c flex-ai-c flex-gap-10`}
          style={
            profileData.profilePicture !== ""
              ? { backgroundImage: `url(${profileData.profilePicture})` }
              : null
          }
          onClick={handleClick}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="40"
            height="40"
            fill="none"
            viewBox="0 0 40 40"
          >
            <path
              fill={profileData.profilePicture === "" ? "#633CFF" : "#fff"}
              d="M33.75 6.25H6.25a2.5 2.5 0 0 0-2.5 2.5v22.5a2.5 2.5 0 0 0 2.5 2.5h27.5a2.5 2.5 0 0 0 2.5-2.5V8.75a2.5 2.5 0 0 0-2.5-2.5Zm0 2.5v16.055l-4.073-4.072a2.5 2.5 0 0 0-3.536 0l-3.125 3.125-6.875-6.875a2.5 2.5 0 0 0-3.535 0L6.25 23.339V8.75h27.5ZM6.25 26.875l8.125-8.125 12.5 12.5H6.25v-4.375Zm27.5 4.375h-3.34l-5.624-5.625L27.91 22.5l5.839 5.84v2.91ZM22.5 15.625a1.875 1.875 0 1 1 3.75 0 1.875 1.875 0 0 1-3.75 0Z"
            />
          </svg>
          <span
            className={`${styles["dialog-profile-image-upload-indicator"]} ${
              profileData.profilePicture === ""
                ? styles["dialog-profile-image-upload-indicator-purple"]
                : styles["dialog-profile-image-upload-indicator-white"]
            }`}
          >
            + Upload Image
          </span>
          <input
            id="image-upload"
            type="file"
            ref={ref}
            accept="image/*"
            onChange={handleUpload}
            className={`hidden`}
          />
        </div>

        <span className={`${styles["dialog-profile-image-indicator"]}`}>
          Image must be below 1024x1024px. Use PNG or JPG format.
        </span>
      </div>
    </div>
  );
};

ImageUpload.propTypes = {
  profileData: PropTypes.object.isRequired,
};

export default ImageUpload;

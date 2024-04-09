import { createContext, useState } from "react";
import PropTypes from "prop-types";
import { collection, doc, getDocs, writeBatch } from "firebase/firestore";
import { auth, db } from "../../firebase/config.js";

export const HomeContext = createContext();

export const HomeContextProvider = ({ children }) => {
  const setRerenderFlag = useState(false)[1];
  const [page, setPage] = useState(0);
  const [profileData, setProfileData] = useState({});

  const validateLink = (platform, link) => {
    /**
     * Validates a link based on the specified platform.
     *
     * @param {string} platform The platform for which the link is being validated (e.g., "GitHub", "instagram").
     * @param {string} link The link to be validated.
     * @returns {boolean} Returns true if the link matches the expected pattern for the given platform, otherwise false.
     */

    // Regular expression patterns for different platforms.
    const patterns = {
      github: /^(?:https?:\/\/)?(?:www\.)?github\.com\/[a-zA-Z0-9_-]+\/?$/,
      instagram:
        /^(?:https?:\/\/)?(?:www\.)?instagram\.com\/[a-zA-Z0-9_.]+\/?$/,
      twitter: /^(?:https?:\/\/)?(?:www\.)?twitter\.com\/[a-zA-Z0-9_]+\/?$/,
      youtube: /^(?:https?:\/\/)?(?:www\.)?youtube\.com\/@?[a-zA-Z0-9_-]+\/?$/,
      facebook: /^(?:https?:\/\/)?(?:www\.)?facebook\.com\/[a-zA-Z0-9.]+\/?$/,
    };

    const regex = new RegExp(patterns[platform], "i");
    return regex.test(link);
  };

  const formatUrl = (url) => {
    // Check if the URL starts with "http", if not, add "https://"
    if (!url.match(/^https?:\/\//i)) {
      url = "https://" + url;
    }

    // Extract the domain from the URL
    const domainMatch = url.match(/^https?:\/\/(?:www\.)?(.+?)\//i);
    const domain = domainMatch ? domainMatch[1] : "";

    // Check if the domain is not "GitHub.com", if not, return the original URL
    if (domain.toLowerCase() !== "github.com") {
      return url;
    }

    // Check if the URL contains "www.", if not, add it after "https://"
    if (!url.match(/^https?:\/\/www\./i)) {
      url = url.replace(/^https?:\/\//i, "https://www.");
    }

    return url;
  };

  const saveLinks = async () => {
    const linksCollectionRef = collection(
      db,
      `profiles/${auth.currentUser.uid}/links`
    );

    try {
      // Batched delete existing documents
      const linkSnapshots = await getDocs(linksCollectionRef);
      const batch = writeBatch(db);
      linkSnapshots.forEach((doc) => {
        batch.delete(doc.ref);
      });
      await batch.commit();
    } catch (error) {
      console.error("Error deleting existing documents:", error);
    }

    // Retrieve links from local storage and save them to Firestore
    const links = JSON.parse(localStorage.getItem("linkDialogs"));

    if (links) {
      const batch = writeBatch(db);
      links.forEach((link, index) => {
        const linkRef = doc(linksCollectionRef, `link-${index + 1}`);
        if (validateLink(link.platform, link.url)) {
          try {
            link.url = formatUrl(link.url);
            batch.set(linkRef, link);
          } catch (error) {
            console.error("Error setting document:", error);
          }
        }
      });

      try {
        await batch.commit();
      } catch (error) {
        console.error("Error committing batch:", error);
      }
    }

    setRerenderFlag((prevFlag) => !prevFlag);
  };

  const contextValue = {
    setRerenderFlag,
    page,
    setPage,
    profileData,
    setProfileData,
    validateLink,
    formatUrl,
    saveLinks,
  };

  return (
    <HomeContext.Provider value={contextValue}>{children}</HomeContext.Provider>
  );
};

HomeContextProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
console.log("Lord Buddha is amazing btw!");

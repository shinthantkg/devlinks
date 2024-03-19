import { useState } from "react";
import { auth, googleProvider, db } from "../firebase/config.js";
import { signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, fetchSignInMethodsForEmail } from "firebase/auth";
import { collection, query, orderBy, limit, getDoc, setDoc, getDocs, doc, updateDoc, serverTimestamp } from "firebase/firestore";
import logo from "../images/logos/logo-devlinks-large.svg";
import googleIcon from "../images/icons/icon-google.svg";
import styles from "../styles/modules/_auth.module.scss";

export default function Auth() {
    // ALl the states for the Auth component.
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isLogin, setIsLogin] = useState(true);
    const [invalidCredentials, setInvalidCredentials] = useState(false);
    const [accountExists, setAccountExists] = useState(false);
    const [passwordWrong, setPasswordWrong] = useState(false);
    const [invalidNewPassword, setInvalidNewPassword] = useState(false);
    const [confirmPasswordNotMatching, setConfirmPasswordNotMatching] = useState(false);

    function resetStates() {
        /**
         * Resets all the state indicators related to input field changes.
         * This function is typically called when an input field's value changes to clear any previous indicators.
         * Clears indicators for invalid credentials, existing account, incorrect password, invalid new password,
         * and mismatched confirm password.
         */

        setInvalidCredentials(false);
        setAccountExists(false);
        setPasswordWrong(false);
        setInvalidNewPassword(false);
        setConfirmPasswordNotMatching(false);
    }


    function validatePassword() {
        /**
          * Validates the password using a regular expression test.
          * The password must meet the following criteria:
          * - At least one lowercase letter
          * - At least one uppercase letter
          * - At least one digit
          * - At least one special character among @$!%*?&
          * - Minimum length of 8 characters
          * @returns {boolean} true if the password is valid according to the criteria, otherwise false.
        */

        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        return passwordRegex.test(password);
    }
    async function signInWithGoogle() {
        /**
         * Signs in a user using Firebase authentication's pop-up sign-in method with Google provider.
         * Creates a new profile document in Firestore database when the account is new.
         * Converts an already existing account with an email provider to Google provider.
         * @returns {Promise<void>} A promise that resolves once the sign-in process is completed.
         */

        try {
            await signInWithPopup(auth, googleProvider);

            const profileDocExists = await checkProfileDocExistence();

            if (!profileDocExists) {
                await createProfileDoc("google");
            } else {
                const currentUser = auth.currentUser;
                const docRef = doc(db, `profiles/${currentUser.uid}`);
                const profileDoc = await getDoc(docRef);

                if (profileDoc.data().provider === "email") {
                    await updateDoc(docRef, {
                        fullName: currentUser.displayName,
                        profilePicture: currentUser.photoURL,
                        provider: "google"
                    });
                }
            }
        } catch (error) {
            console.error(error);
        }
    }

    async function checkAccountExistence() {
        /**
         * Checks if an account exists for the provided email address.
         * This function queries Firebase authentication to determine if there are any sign-in methods associated with the email.
         * @returns {Promise<boolean>} A promise that resolves to a boolean value indicating whether an account exists for the provided email.
         */

        try {
            const signInMethods = await fetchSignInMethodsForEmail(auth, email);
            return signInMethods.length !== 0;
        } catch (error) {
            console.error(error);
        }
    }

    async function signIn() {
        /**
         * Attempts to sign in a user with the provided email and password.
         * This function first checks if an account exists for the provided email address using checkAccountExistence().
         * If an account exists, it attempts to sign in using the provided email and password.
         * If no account exists, it sets invalid credentials flag to true and account exists flag to false.
         * @returns {Promise<void>} A promise that resolves once the sign-in process is completed.
        */

        try {
            const exists = await checkAccountExistence();
            if (exists) {
                await signInWithEmailAndPassword(auth, email, password);
            } else {
                setInvalidCredentials(true);
                setAccountExists(false);
            }
        } catch (error) {
            setInvalidCredentials(true);
            setPasswordWrong(true);
            console.error(error);
        }
    }

    async function getPreviousDocId() {
        /**
          * Retrieves the ID of the most recently created profile document from the Firestore collection.
          * @returns {Promise<number|string>} A promise that resolves to the ID of the most recently created profile document,
          * or 0 if the collection is empty.
        */

        const q = query(collection(db, "profiles"), orderBy("createdAt", "desc"), limit(1));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            return 0;
        } else {
            return querySnapshot.docs[0].data().id;
        }
    }

    async function checkProfileDocExistence() {
        /**
          * Checks the existence of a profile document associated with the current user in the Firestore database.
          * @returns {Promise<boolean>} A promise that resolves to true if the profile document exists, otherwise false.
        */

        try {
            const accountId = auth.currentUser.uid;
            const profileDoc = await getDoc(doc(db, `profiles/${accountId}`));

            return profileDoc.exists();
        } catch (error) {
            console.error(error);
        }
    }

    async function createProfileDoc(provider) {
        /**
         * Creates a new profile document for the authenticated user in the Firestore database.
         * @param {string} provider - The authentication provider used by the user (e.g., "google").
         * @returns {Promise<void>} A promise that resolves once the profile document is successfully created.
        */

        const authenticatedUser = auth.currentUser;
        const previousDocId = await getPreviousDocId();

        if (authenticatedUser) {
            const profileData = {
                id: previousDocId + 1,
                email: authenticatedUser.email,
                fullName: authenticatedUser.displayName ? authenticatedUser.displayName : "",
                profilePicture: authenticatedUser.photoURL ? authenticatedUser.photoURL : "",
                provider: provider,
                createdAt: serverTimestamp()
            };

            try {
                await setDoc(doc(db, `profiles/${authenticatedUser.uid}`), profileData);
            } catch (error) {
                console.error(error);
            }
        }
    }

    async function createAccount() {
        if (validatePassword()) {
            if (password === confirmPassword) {
                try {
                    const exists = await checkAccountExistence();
                    if (!exists) {
                        await createUserWithEmailAndPassword(auth, email, password);
                        await createProfileDoc("email");
                    } else {
                        setInvalidCredentials(true);
                        setAccountExists(true);
                    }
                } catch (error) {
                    console.error(error);
                }
            } else {
                setInvalidCredentials(true);
                setConfirmPasswordNotMatching(true);
            }
        } else {
            setInvalidCredentials(true);
            setInvalidNewPassword(true);
        }
    }

    async function handleFormSubmission(event) {
        /**
          * Creates a new user account with the provided email and password, and creates a profile document in Firestore.
          * @returns {Promise<void>} A promise that resolves once the account is successfully created.
        */

        event.preventDefault();

        if (isLogin) {
            await signIn();
        } else {
            await createAccount();
        }
    }

    return (
        <main>
            <div className={`${styles["container-main"]} flex flex-fd-c flex-ai-c`}>
                <a href="#"><img src={logo} alt="Devlinks logo." /></a>

                <div className={`${styles["container-auth"]} flex flex-fd-c`}>
                    <h1>{isLogin ? "Login" : "Create account"}</h1>
                    <span>{isLogin ? "Add your details below to get back into the app" : "Let's get you started sharing your links!"}</span>
                    <button onClick={signInWithGoogle} className={`button button-clear flex flex-jc-c`}><img className={`button-icon`} src={googleIcon} alt="" /> Continue with Google</button>
                    <span className={`${styles["or"]}`}>or</span>

                    <form onSubmit={handleFormSubmission}>
                        <label className={`${invalidCredentials ? styles["label-invalid"] : null}`} htmlFor="email">Email address {!accountExists && invalidCredentials && isLogin ? " - account does not exist!" : null}{accountExists && invalidCredentials && !isLogin ? "- account already exists!" : null}</label>
                        <input className={`${invalidCredentials ? styles["input-invalid"] : null}`} id="email" name="email" type="email" placeholder="e.g. alex@email.com" required onChange={(event) => { setEmail(event.target.value); resetStates(); }} />

                        <label className={`${invalidCredentials ? styles["label-invalid"] : null}`} htmlFor="password">Password {passwordWrong && invalidCredentials && isLogin ? "- incorrect password!" : null}{invalidNewPassword && invalidCredentials && !isLogin ? "- password must contain 8 characters, at least one lowercase and uppercase letter, number and symbol!" : null}{confirmPasswordNotMatching && invalidCredentials && !isLogin ? " - passwords do not match!" : null}</label>
                        <input className={`${invalidCredentials ? styles["input-invalid"] : null}`} id="password" name="password" type="password" placeholder={`${isLogin ? "Enter your password" : "At least 8 characters"}`} required onChange={(event) => { setPassword(event.target.value); resetStates(); }} />

                        {
                            !isLogin ?
                                <>
                                    <label className={`${invalidCredentials ? styles["label-invalid"] : null}`} htmlFor="confirm-password">Confirm password {confirmPasswordNotMatching && invalidCredentials && !isLogin ? " - passwords do not match!" : null}</label>
                                    <input className={`${invalidCredentials ? styles["input-invalid"] : null}`} id="confirm-password" name="confirm-password" type="password" placeholder="At least 8 characters" required onChange={(event) => { setConfirmPassword(event.target.value); resetStates(); }} />

                                    <span>Password must contain at least 8 characters</span>
                                </>
                                : null
                        }

                        <button type="submit" className={`block button button-fill w-100`}>{isLogin ? "Log in" : "Create new account"}</button>
                        <span className={`flex flex-jc-c`}>{isLogin ? "Don't have an account?" : "Already have an account?"} <span onClick={() => setIsLogin(!isLogin)} className={`${styles["auth-mode-switcher"]}`}>{isLogin ? "Create account" : "Login"}</span></span>
                    </form>
                </div>
            </div>
        </main>
    );
}

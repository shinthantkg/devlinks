import { useState } from "react";
import { auth, googleProvider, db } from "../config/firebase";
import { signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, fetchSignInMethodsForEmail } from "firebase/auth";
import { collection, query, orderBy, limit, getDoc, setDoc, getDocs, doc, updateDoc, serverTimestamp } from "firebase/firestore";
import logo from "../images/logos/logo-devlinks-large.svg";
import googleIcon from "../images/icons/icon-google.svg";
import styles from "../styles/modules/_auth.module.scss";

export default function Auth() {
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
        setInvalidCredentials(false);
        setAccountExists(false);
        setPasswordWrong(false);
        setInvalidNewPassword(false);
        setConfirmPasswordNotMatching(false);
    }

    function validatePassword() {
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        return passwordRegex.test(password);
    }

    async function signInWithGoogle() {
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
                    updateDoc(docRef, {
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
        try {
            const signInMethods = await fetchSignInMethodsForEmail(auth, email);
            return signInMethods.length !== 0;
        } catch (error) {
            console.error(error);
        }
    }

    async function signIn() {
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
        const q = query(collection(db, "profiles"), orderBy("createdAt", "desc"), limit(1));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            return 0;
        } else {
            return querySnapshot.docs[0].data().id;
        }
    }

    async function checkProfileDocExistence() {
        try {
            const accountId = auth.currentUser.uid;
            const profileDoc = await getDoc(doc(db, `profiles/${accountId}`));

            return profileDoc.exists();
        } catch (error) {
            console.error(error);
        }
    }

    async function createProfileDoc(provider) {
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
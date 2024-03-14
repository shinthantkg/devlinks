import { useState } from "react";
import { auth, googleProvider, db } from "../config/firebase";
import { signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, fetchSignInMethodsForEmail } from "firebase/auth";
import { collection, query, orderBy, serverTimestamp } from "firebase/firestore";
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
        } catch (error) {
            console.error(error);
        }
    }

    async function checkAccountExistence() {
        const signInMethods = await fetchSignInMethodsForEmail(auth, email);
        return signInMethods.length !== 0;
    }

    function signIn() {
        checkAccountExistence()
        .then(exists => {
            if (exists) {
                signInWithEmailAndPassword(auth, email, password)
                    .then(() => {
                        console.log("yay");
                    })
                    .catch(error => {
                        setInvalidCredentials(true);
                        setPasswordWrong(true);
                        console.error(error);
                    });
            } else {
                setInvalidCredentials(true);
                setAccountExists(false);
            }
        })
        .catch(error => {
            console.error(error);
        });
    }

    function getLatestDocId() {
        const q = query(collection(db, "profiles"))
    }    

    function getUser() {
        auth.onAuthStateChanged(user => {
            return user;
        })
    }

    function createNewProfileDoc() {
        const latestId = getLatestDocId();
        const user = getUser();

        if (latestId) {
            const profileData = {
                createdAt: serverTimestamp(),
                id: latestId + 1,
                email: user.email,
                name: {
                    firstName: user.displayName ? user.displayName.split(" ")[0] : null,
                    lastName: user.displayName ? user.displayName.split(" ")[1] : null
                },
                profilePicture: user.photoURL ? user.photoURL : null,
            }

            
        }
    }

    function createAccount() {
        if (validatePassword()) {
            if (password === confirmPassword) {
                checkAccountExistence()
                    .then(exists => {
                        if (!exists) {
                            createUserWithEmailAndPassword(auth, email, password)
                                .then(() => {
                                    db.collection("profiles").add({
                                        id: 
                                    })
                                })
                                .catch(error => {
                                    console.error(error);
                                });
                        } else {
                            setInvalidCredentials(true);
                            setAccountExists(true);
                        }
                    })
                    .catch(error => {
                        console.error(error);
                    });
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
            signIn();
        } else {
            createAccount();
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

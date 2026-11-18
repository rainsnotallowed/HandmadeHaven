import { auth, db } from "./firebase.js";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
    doc,
    getDoc,
    setDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const loginToggle = document.querySelector("#login-toggle");
const authDropdown = document.querySelector("#auth-dropdown");
const profileDropdown = document.querySelector("#profile-dropdown");
const loginForm = document.querySelector("#login-form");
const signupForm = document.querySelector("#signup-form");
const authTabs = document.querySelector(".auth-tabs");
const profileBase = document.querySelector("#profile-base");
const authMessage = document.querySelector("#auth-message");
const profileMessage = document.querySelector("#profile-message");

function setMessage(message = "", isError = false) {
    const messageElement = profileDropdown && !profileDropdown.hidden ? profileMessage : authMessage;
    if (!messageElement) return;
    messageElement.textContent = message;
    messageElement.style.color = isError ? "#8b0000" : "#155724";
}

function showProfileMessage(message, isError = true) {
    if (profileDropdown) profileDropdown.hidden = false;
    if (authDropdown) authDropdown.hidden = true;
    loginToggle?.setAttribute("aria-controls", "profile-dropdown");
    loginToggle?.setAttribute("aria-expanded", "true");
    if (profileMessage) {
        profileMessage.textContent = message;
        profileMessage.style.color = isError ? "#8b0000" : "#155724";
    }
}

async function loadUser(user) {
    if (!loginToggle) return;

    if (user) {
        let userData = {};
        try {
            const userDoc = await getDoc(doc(db, "users", user.uid));
            if (userDoc.exists()) userData = userDoc.data();
        } catch (error) {
            console.error("Unable to load the signed-in user's profile.", error);
        }

        const firstName = userData.firstName || "";
        const lastName = userData.lastName || "";
        const displayName = `${firstName} ${lastName}`.trim() || user.displayName || "Your profile";

        loginToggle.textContent = "Profile";
        loginToggle.setAttribute("aria-controls", "profile-dropdown");
        if (authTabs) authTabs.hidden = true;
        if (loginForm) loginForm.hidden = true;
        if (signupForm) signupForm.hidden = true;
        if (authDropdown) authDropdown.hidden = true;
        if (profileBase) {
            profileBase.hidden = false;
            const nameEl = document.querySelector("#profile-username");
            const emailEl = document.querySelector("#profile-email");
            if (nameEl) nameEl.textContent = displayName;
            if (emailEl) emailEl.textContent = user.email || "";
        }

        localStorage.setItem("firstName", firstName);
        localStorage.setItem("lastName", lastName);
        localStorage.setItem("role", userData.role || "guest");
        localStorage.setItem("clearance", String(userData.clearance || 1));
        localStorage.setItem("uid", user.uid);
    } else {
        localStorage.clear();
        loginToggle.textContent = "Login / Register";
        loginToggle.setAttribute("aria-controls", "auth-dropdown");
        if (profileDropdown) profileDropdown.hidden = true;
        if (authTabs) authTabs.hidden = false;
        if (loginForm) loginForm.hidden = false;
        if (signupForm) signupForm.hidden = true;
        if (profileBase) profileBase.hidden = true;
    }
}

onAuthStateChanged(auth, user => {
    loadUser(user).catch(error => {
        console.error("Unable to update the account dropdown.", error);
        setMessage("Unable to load your profile right now.", true);
    });
});

loginForm?.addEventListener("submit", async event => {
    event.preventDefault();
    const email = document.querySelector("#login-email")?.value.trim();
    const password = document.querySelector("#login-password")?.value;
    if (!email || !password) {
        setMessage("Enter both email and password.", true);
        return;
    }

    let credential;
    try {
        credential = await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
        const messages = {
            "auth/user-not-found": "Account not found",
            "auth/wrong-password": "Incorrect password",
            "auth/invalid-credential": "Incorrect email or password",
            "auth/invalid-email": "Invalid email address"
        };
        setMessage(messages[error.code] || error.message, true);
        return;
    }

    try {
        const profileRef = doc(db, "users", credential.user.uid);
        const profileSnapshot = await getDoc(profileRef);
        if (!profileSnapshot.exists()) {
            await setDoc(profileRef, {
                firstName: "",
                lastName: "",
                email: credential.user.email || email,
                role: "guest",
                clearance: 1
            });
        }
    } catch (error) {
        console.error("Unable to load or create the signed-in user's Firestore profile.", {
            code: error.code,
            message: error.message,
            uid: credential.user.uid
        });
        showProfileMessage(error.code === "permission-denied"
            ? "Signed in, but Firestore denied the profile read/write. Check your Firestore rules."
            : `Signed in, but profile storage failed (${error.code || "unknown"}): ${error.message}`);
        return;
    }

    setMessage("Signed in successfully.");
    authDropdown.hidden = true;
    loginToggle.setAttribute("aria-expanded", "false");
});

signupForm?.addEventListener("submit", async event => {
    event.preventDefault();
    const firstName = document.querySelector("#signUpFirstName")?.value.trim();
    const lastName = document.querySelector("#signUpLastName")?.value.trim();
    const email = document.querySelector("#signUpEmail")?.value.trim();
    const password = document.querySelector("#signUpPassword")?.value;

    if (!firstName || !lastName || !email || !password) {
        setMessage("All fields are required.", true);
        return;
    }
    if (password.length < 6) {
        setMessage("Password must be at least 6 characters.", true);
        return;
    }

    let credential;
    try {
        credential = await createUserWithEmailAndPassword(auth, email, password);
    } catch (error) {
        const messages = {
            "auth/email-already-in-use": "Email already registered",
            "auth/invalid-email": "Invalid email address",
            "auth/weak-password": "Password must be at least 6 characters"
        };
        setMessage(messages[error.code] || error.message, true);
        return;
    }

    try {
        await setDoc(doc(db, "users", credential.user.uid), {
            firstName,
            lastName,
            email,
            role: "guest",
            clearance: 1
        });
        setMessage("Account created successfully.");
        authDropdown.hidden = true;
        loginToggle.setAttribute("aria-expanded", "false");
    } catch (error) {
        console.error("Firestore write failed.", {
            code: error.code,
            message: error.message,
            uid: credential.user.uid
        });

        if (error.code === "permission-denied") {
            showProfileMessage("Account created, but Firestore denied the profile write. Check your Firestore rules.");
        } else if (error.code === "not-found") {
            showProfileMessage("Account created, but the Firestore database was not found.");
        } else {
            showProfileMessage(`Account created, but profile storage failed (${error.code || "unknown"}): ${error.message}`);
        }
    }
});

document.querySelector("#sign-out")?.addEventListener("click", async () => {
    try {
        await signOut(auth);
        authDropdown.hidden = true;
        if (profileDropdown) profileDropdown.hidden = true;
        loginToggle.setAttribute("aria-expanded", "false");
    } catch (error) {
        setMessage(error.message, true);
    }
});

document.querySelector("#forgotPassword")?.addEventListener("click", async () => {
    const email = document.querySelector("#login-email")?.value.trim();
    if (!email) {
        setMessage("Enter your email first, then click Forgot Password.", true);
        return;
    }
    try {
        await sendPasswordResetEmail(auth, email);
        setMessage("Password reset email sent - check your inbox.");
    } catch (error) {
        setMessage(error.code === "auth/user-not-found"
            ? "No account found with that email"
            : error.message, true);
    }
});
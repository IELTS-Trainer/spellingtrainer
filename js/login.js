import {
    browserLocalPersistence,
    browserSessionPersistence,
    createUserWithEmailAndPassword,
    onAuthStateChanged,
    sendPasswordResetEmail,
    setPersistence,
    signInWithEmailAndPassword,
    signOut
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";
import {
    addDoc,
    collection,
    doc,
    getDoc,
    serverTimestamp,
    setDoc,
    updateDoc
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";
import { auth, db } from "./firebase-client.js";

const loginForm = document.getElementById("loginForm");
const loginScreen = document.getElementById("loginScreen");
const appContainer = document.getElementById("appContainer");
const loginError = document.getElementById("loginError");
const authEnsureTasks = new Map();
let pendingSignupPhone = "";

window.loginStatus = 0;
window.accountAccessLevel = "ordinary";
window.currentFirebaseUser = null;
window.firebaseDisplayName = "User";

function getLocalDisplayName() {
    const profile = window.appData && window.appData.userProfile ? window.appData.userProfile : {};
    return [profile.firstName, profile.lastName].filter(Boolean).join(" ").trim();
}

function updateLoginStatusUI() {
    const loggedIn = Boolean(window.currentFirebaseUser);
    const loginMenuItem = document.getElementById("loginMenuItem");
    const userMenuItem = document.getElementById("userMenuItem");
    const adminLink = document.getElementById("adminControlLink");
    const localName = getLocalDisplayName();
    const name = window.firebaseDisplayName || localName || "User";

    if (loginMenuItem) loginMenuItem.hidden = loggedIn;
    if (userMenuItem) {
        userMenuItem.hidden = !loggedIn;
        userMenuItem.textContent = (window.loginStatus === 2 ? "🛡️ " : "👤 ") + name
            + (window.loginStatus === 2 ? " · Admin" : "");
    }
    if (adminLink) adminLink.style.display = window.loginStatus === 2 ? "block" : "none";

    const premiumStatus = document.getElementById("premiumAccessStatus");
    if (premiumStatus) {
        premiumStatus.textContent = window.loginStatus === 2
            ? "Administrator access"
            : (window.accountAccessLevel === "premium" ? "Premium access" : (loggedIn ? "Ordinary access" : "Guest access"));
    }
}

function accountDefaults(user) {
    return {
        email: user.email || "",
        displayName: "User",
        accessLevel: "ordinary",
        phoneNumber: pendingSignupPhone,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
    };
}

async function ensureAccountDocument(user) {
    if (authEnsureTasks.has(user.uid)) return authEnsureTasks.get(user.uid);

    const task = (async () => {
        const accountRef = doc(db, "users", user.uid);
        let snapshot = await getDoc(accountRef);
        if (!snapshot.exists()) {
            await setDoc(accountRef, accountDefaults(user));
            snapshot = await getDoc(accountRef);
        }
        return snapshot.exists() ? snapshot.data() : {};
    })();

    authEnsureTasks.set(user.uid, task);
    try {
        return await task;
    } finally {
        authEnsureTasks.delete(user.uid);
    }
}

async function checkAdminAccount(user) {
    const adminSnapshot = await getDoc(doc(db, "admins", user.uid));
    return adminSnapshot.exists() && adminSnapshot.data().enabled === true;
}

async function recordLogin(user, eventType) {
    try {
        await addDoc(collection(db, "loginEvents"), {
            uid: user.uid,
            email: user.email || "",
            displayName: window.firebaseDisplayName || getLocalDisplayName() || "User",
            eventType,
            timestamp: serverTimestamp(),
            userAgent: navigator.userAgent.slice(0, 500)
        });
    } catch (error) {
        console.warn("Login activity could not be saved. Check the Firestore rules.", error);
    }
}

function setAuthMode(mode) {
    const isSignUp = mode === "signup";
    loginForm.dataset.mode = isSignUp ? "signup" : "signin";
    document.getElementById("loginTitle").textContent = isSignUp ? "Create Account" : "User Sign In";
    document.getElementById("loginSubmit").textContent = isSignUp ? "Create account" : "Log in";
    document.getElementById("confirmPasswordGroup").hidden = !isSignUp;
    document.getElementById("signupPhoneGroup").hidden = !isSignUp;
    document.getElementById("signupPhone").required = isSignUp;
    document.getElementById("rememberOption").hidden = isSignUp;
    document.getElementById("forgotPasswordButton").hidden = isSignUp;
    document.getElementById("authModePrompt").textContent = isSignUp ? "Already have an account?" : "New to IELTS Spelling Trainer?";
    document.getElementById("authModeToggle").textContent = isSignUp ? "Sign in" : "Create account";
    document.getElementById("signupNotice").hidden = !isSignUp;
    document.getElementById("loginPassword").autocomplete = isSignUp ? "new-password" : "current-password";
    document.getElementById("loginPassword").setAttribute("minlength", "6");
    loginError.classList.remove("is-success");
    loginError.textContent = "";
}

function openLoginPage() {
    setAuthMode("signin");
    loginScreen.style.display = "grid";
    appContainer.style.display = "none";
    document.getElementById("loginEmail").focus();
}

function continueAsGuest() {
    loginScreen.style.display = "none";
    appContainer.style.display = "block";
    if (typeof window.showView === "function") window.showView("home");
}

function togglePasswordVisibility() {
    const input = document.getElementById("loginPassword");
    const button = document.getElementById("togglePasswordButton");
    const visible = input.type === "text";
    input.type = visible ? "password" : "text";
    button.textContent = visible ? "Show" : "Hide";
    button.setAttribute("aria-label", visible ? "Show password" : "Hide password");
    button.setAttribute("aria-pressed", String(!visible));
}

function friendlyAuthError(error) {
    const messages = {
        "auth/invalid-email": "Enter a valid email address.",
        "auth/invalid-credential": "The email or password is incorrect.",
        "auth/user-not-found": "The email or password is incorrect.",
        "auth/wrong-password": "The email or password is incorrect.",
        "auth/email-already-in-use": "An account already exists with this email. Try signing in.",
        "auth/weak-password": "Choose a stronger password with at least 6 characters.",
        "auth/too-many-requests": "Too many attempts. Please wait a little and try again.",
        "auth/network-request-failed": "Could not connect. Check your internet connection and try again.",
        "auth/operation-not-allowed": "Email/Password sign-in is not enabled in Firebase yet."
    };
    return messages[error.code] || "Could not complete that request. Check the details and try again.";
}

function setFormBusy(busy) {
    document.getElementById("loginSubmit").disabled = busy;
    document.getElementById("authModeToggle").disabled = busy;
    document.getElementById("loginSubmit").textContent = busy
        ? "Please wait…"
        : (loginForm.dataset.mode === "signup" ? "Create account" : "Log in");
}

async function sendPasswordReset() {
    loginError.classList.remove("is-success");
    loginError.textContent = "";
    const email = document.getElementById("loginEmail").value.trim();
    if (!email) {
        loginError.textContent = "Enter your email address first, then choose Forgot password?";
        document.getElementById("loginEmail").focus();
        return;
    }

    const button = document.getElementById("forgotPasswordButton");
    button.disabled = true;
    try {
        await sendPasswordResetEmail(auth, email);
        loginError.classList.add("is-success");
        loginError.textContent = "If an account exists for this email, a password reset link has been sent.";
    } catch (error) {
        loginError.textContent = friendlyAuthError(error);
    } finally {
        button.disabled = false;
    }
}

document.getElementById("forgotPasswordButton").addEventListener("click", sendPasswordReset);

loginForm.addEventListener("submit", async event => {
    event.preventDefault();
    loginError.classList.remove("is-success");
    loginError.textContent = "";

    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value;
    const isSignUp = loginForm.dataset.mode === "signup";

    if (isSignUp && !document.getElementById("signupPhone").value.trim()) {
        loginError.textContent = "Enter a phone number to create your account.";
        return;
    }

    if (isSignUp && password !== document.getElementById("confirmPassword").value) {
        loginError.textContent = "The passwords do not match.";
        return;
    }

    setFormBusy(true);
    try {
        await setPersistence(auth, document.getElementById("rememberLogin").checked
            ? browserLocalPersistence
            : browserSessionPersistence);

        if (isSignUp) {
            pendingSignupPhone = document.getElementById("signupPhone").value.trim().slice(0, 30);
            const credential = await createUserWithEmailAndPassword(auth, email, password);
            await ensureAccountDocument(credential.user);
            await recordLogin(credential.user, "sign_up");
        } else {
            const credential = await signInWithEmailAndPassword(auth, email, password);
            await recordLogin(credential.user, "sign_in");
        }

        document.getElementById("loginPassword").value = "";
        document.getElementById("confirmPassword").value = "";
        continueAsGuest();
    } catch (error) {
        loginError.textContent = friendlyAuthError(error);
    } finally {
        pendingSignupPhone = "";
        setFormBusy(false);
    }
});

function handleHomeLoginStatus() {
    if (typeof window.closeSiteMenu === "function") window.closeSiteMenu();
    openLoginPage();
}

function logoutUser() {
    signOut(auth).then(continueAsGuest).catch(error => {
        console.error("Sign out failed.", error);
        alert("Could not sign out. Please try again.");
    });
}

async function saveFirebaseUserProfile(profile) {
    const user = auth.currentUser;
    if (!user) return false;

    const firstName = String(profile.firstName || "").trim().slice(0, 60);
    const lastName = String(profile.lastName || "").trim().slice(0, 60);
    const displayName = [firstName, lastName].filter(Boolean).join(" ").trim() || "User";
    await updateDoc(doc(db, "users", user.uid), {
        firstName,
        lastName,
        nationality: String(profile.nationality || "").trim().slice(0, 80),
        city: String(profile.city || "").trim().slice(0, 80),
        learningPurpose: ["IELTS", "Academic"].includes(profile.learningPurpose) ? profile.learningPurpose : "",
        displayName,
        updatedAt: serverTimestamp()
    });
    window.firebaseDisplayName = displayName;
    updateLoginStatusUI();
    return true;
}

window.updateLoginStatusUI = updateLoginStatusUI;
window.openLoginPage = openLoginPage;
window.continueAsGuest = continueAsGuest;
window.togglePasswordVisibility = togglePasswordVisibility;
window.handleHomeLoginStatus = handleHomeLoginStatus;
window.logoutUser = logoutUser;
window.setAuthMode = setAuthMode;
window.saveFirebaseUserProfile = saveFirebaseUserProfile;
window.firebaseAuth = auth;

onAuthStateChanged(auth, async user => {
    window.currentFirebaseUser = user;
    if (!user) {
        window.loginStatus = 0;
        window.accountAccessLevel = "ordinary";
        window.firebaseDisplayName = "User";
        updateLoginStatusUI();
        if (location.hash === "#login") {
            openLoginPage();
            history.replaceState(null, "", location.pathname + location.search);
        }
        return;
    }

    window.loginStatus = 1;
    window.accountAccessLevel = "ordinary";
    loginScreen.style.display = "none";
    appContainer.style.display = "block";
    if (location.hash === "#login") history.replaceState(null, "", location.pathname + location.search);
    updateLoginStatusUI();

    try {
        const isAdmin = await checkAdminAccount(user);
        const account = await ensureAccountDocument(user);
        const profile = {
            firstName: String(account.firstName || ""),
            lastName: String(account.lastName || ""),
            nationality: String(account.nationality || ""),
            city: String(account.city || ""),
            learningPurpose: String(account.learningPurpose || "")
        };
        window.firebaseDisplayName = account.displayName
            || [profile.firstName, profile.lastName].filter(Boolean).join(" ").trim()
            || "User";
        window.accountAccessLevel = isAdmin
            ? "admin"
            : (account.accessLevel === "premium" ? "premium" : "ordinary");
        window.loginStatus = isAdmin ? 2 : 1;

        if (window.appData) {
            window.appData.userProfile = Object.assign(window.appData.userProfile || {}, profile);
            if (typeof window.save === "function") window.save();
        }
    } catch (error) {
        console.error("Could not load account permissions. Check Firestore rules.", error);
        window.firebaseDisplayName = user.email || "User";
        window.loginStatus = 1;
        window.accountAccessLevel = "ordinary";
    }

    updateLoginStatusUI();
});

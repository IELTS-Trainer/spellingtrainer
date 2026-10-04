import { initializeApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyDHxex9zH7bNaGUVgZIidN_GIJhnIeSnSA",
    authDomain: "ieltstrainer-81654.firebaseapp.com",
    projectId: "ieltstrainer-81654",
    storageBucket: "ieltstrainer-81654.firebasestorage.app",
    messagingSenderId: "555700184912",
    appId: "1:555700184912:web:92c0dd91933faa85b5ee55",
    measurementId: "G-VWZBGJH1HH"
};

export const firebaseApp = initializeApp(firebaseConfig);
export const auth = getAuth(firebaseApp);
export const db = getFirestore(firebaseApp);
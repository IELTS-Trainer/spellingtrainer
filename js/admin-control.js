import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";
import {
    collection,
    doc,
    getDoc,
    getDocs,
    limit,
    orderBy,
    query,
    serverTimestamp,
    updateDoc
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";
import { auth, db } from "./firebase-client.js";

const statusNode = document.getElementById("adminStatus");
const contentNode = document.getElementById("adminContent");
const recentRows = document.getElementById("recentLoginRows");
const allRows = document.getElementById("allLoginRows");
const dialog = document.getElementById("allLoginsDialog");
let currentAdmin = null;

function cell(row, value) {
    const td = document.createElement("td");
    td.textContent = value || "—";
    row.appendChild(td);
    return td;
}

function dateLabel(value) {
    if (!value || typeof value.toDate !== "function") return "—";
    return value.toDate().toLocaleString();
}

function deviceLabel(ua) {
    if (!ua) return "Not recorded";
    const browser = /Edg\/([\d.]+)/.test(ua) ? "Edge"
        : /Chrome\/([\d.]+)/.test(ua) ? "Chrome"
        : /Firefox\/([\d.]+)/.test(ua) ? "Firefox"
        : /Safari\/([\d.]+)/.test(ua) ? "Safari"
        : "Browser";
    const platform = /Android/i.test(ua) ? "Android"
        : /iPhone|iPad|iPod/i.test(ua) ? "iOS"
        : /Windows/i.test(ua) ? "Windows"
        : /Mac OS/i.test(ua) ? "macOS"
        : /Linux/i.test(ua) ? "Linux"
        : "Device";
    return platform + " · " + browser;
}

function appendLoginRow(parent, item) {
    const row = document.createElement("tr");
    cell(row, item.displayName || "User");
    cell(row, item.email || "—");
    cell(row, item.eventType === "sign_up" ? "Account created" : "Sign in");
    cell(row, dateLabel(item.timestamp));
    cell(row, deviceLabel(item.userAgent));
    parent.appendChild(row);
}

async function readLoginEvents(maxItems) {
    const baseQuery = query(collection(db, "loginEvents"), orderBy("timestamp", "desc"));
    const result = await getDocs(maxItems ? query(collection(db, "loginEvents"), orderBy("timestamp", "desc"), limit(maxItems)) : baseQuery);
    return result.docs.map(snapshot => snapshot.data());
}

async function renderLogins() {
    recentRows.replaceChildren();
    try {
        const events = await readLoginEvents(10);
        document.getElementById("loginCount").textContent = "Showing " + events.length + " recent event" + (events.length === 1 ? "" : "s") + ".";
        if (!events.length) {
            const row = document.createElement("tr");
            cell(row, "No login activity has been recorded yet.");
            recentRows.appendChild(row);
            return;
        }
        events.forEach(item => appendLoginRow(recentRows, item));
    } catch (error) {
        console.error("Could not load login events.", error);
        const row = document.createElement("tr");
        cell(row, "Could not load activity. Check the deployed Firestore rules.");
        recentRows.appendChild(row);
    }
}

async function renderAllLogins() {
    allRows.replaceChildren();
    try {
        const events = await readLoginEvents(0);
        if (!events.length) {
            const row = document.createElement("tr");
            cell(row, "No login activity has been recorded yet.");
            allRows.appendChild(row);
            return;
        }
        events.forEach(item => appendLoginRow(allRows, item));
    } catch (error) {
        console.error("Could not load all login events.", error);
        const row = document.createElement("tr");
        cell(row, "Could not load activity. Check the deployed Firestore rules.");
        allRows.appendChild(row);
    }
}

async function renderUsers() {
    const rows = document.getElementById("userRows");
    rows.replaceChildren();
    const message = document.getElementById("userAccessMessage");
    try {
        const snapshot = await getDocs(collection(db, "users"));
        if (snapshot.empty) {
            const row = document.createElement("tr");
            const emptyCell = cell(row, "No user profiles have been created yet.");
            emptyCell.colSpan = 4;
            rows.appendChild(row);
            return;
        }

        snapshot.docs.forEach(userDocument => {
            const account = userDocument.data();
            const row = document.createElement("tr");
            const displayName = account.displayName
                || [account.firstName, account.lastName].filter(Boolean).join(" ")
                || "User";
            cell(row, displayName);
            cell(row, account.email || "—");
            cell(row, account.phoneNumber || "—");
            const accessCell = document.createElement("td");
            const select = document.createElement("select");
            select.setAttribute("aria-label", "Access level for " + (account.email || displayName));
            const isCurrentAdmin = userDocument.id === currentAdmin.uid;
            (isCurrentAdmin
                ? [["admin", "Administrator"]]
                : [["ordinary", "Ordinary"], ["premium", "Premium"]]
            ).forEach(([value, label]) => {
                const option = document.createElement("option");
                option.value = value;
                option.textContent = label;
                select.appendChild(option);
            });
            select.value = isCurrentAdmin ? "admin" : (account.accessLevel === "premium" ? "premium" : "ordinary");
            select.disabled = isCurrentAdmin;
            select.addEventListener("change", async () => {
                select.disabled = true;
                message.textContent = "Saving access level…";
                try {
                    await updateDoc(doc(db, "users", userDocument.id), {
                        accessLevel: select.value,
                        updatedAt: serverTimestamp()
                    });
                    message.textContent = "Access updated for " + (account.email || displayName) + ".";
                } catch (error) {
                    console.error("Could not update account access.", error);
                    message.textContent = "Could not update access. Check Firestore rules.";
                    select.value = account.accessLevel === "premium" ? "premium" : "ordinary";
                } finally {
                    select.disabled = userDocument.id === currentAdmin.uid;
                }
            });
            accessCell.appendChild(select);
            row.appendChild(accessCell);
            rows.appendChild(row);
        });
    } catch (error) {
        console.error("Could not load users.", error);
        const row = document.createElement("tr");
        const errorCell = cell(row, "Could not load accounts. Check the deployed Firestore rules.");
        errorCell.colSpan = 4;
        rows.appendChild(row);
    }
}

document.getElementById("showAllLogins").addEventListener("click", async () => {
    await renderAllLogins();
    dialog.showModal();
});
document.getElementById("closeAllLogins").addEventListener("click", () => dialog.close());
dialog.addEventListener("click", event => {
    if (event.target === dialog) dialog.close();
});
document.getElementById("adminLogout").addEventListener("click", async () => {
    await signOut(auth);
    window.location.replace("index.html");
});

onAuthStateChanged(auth, async user => {
    if (!user) {
        window.location.replace("index.html#login");
        return;
    }

    try {
        const adminSnapshot = await getDoc(doc(db, "admins", user.uid));
        if (!adminSnapshot.exists() || adminSnapshot.data().enabled !== true) {
            statusNode.textContent = "This page is only available to the administrator.";
            statusNode.classList.add("admin-error");
            window.setTimeout(() => window.location.replace("index.html"), 1800);
            return;
        }

        currentAdmin = user;
        statusNode.hidden = true;
        contentNode.hidden = false;
        await Promise.all([renderLogins(), renderUsers()]);
    } catch (error) {
        console.error("Administrator verification failed.", error);
        statusNode.textContent = "Could not verify administrator access. Check Firestore rules and your admin record.";
        statusNode.classList.add("admin-error");
    }
});
# IELTS Spelling Trainer

This is the GitHub Pages version of the IELTS spelling practice app. Keep the HTML, CSS, and JavaScript files in their current folder structure when publishing.

## Firebase setup

1. In Firebase Console, open the IELTS Trainer project.
2. In Authentication, enable the Email/Password sign-in provider.
3. Add `ielts-trainer.github.io` to Authentication > Settings > Authorized domains.
4. In Firestore Database, open Rules, paste the contents of `firestore.rules`, then publish the rules.
5. Create your own account from the app, then find its Firebase Authentication user and copy its UID.
6. In Firestore Data, create a collection named `admins`. Create a document whose ID is exactly your UID. Add a Boolean field named `enabled` with value `true`.
7. Sign out and sign back in. The app should now show the Admin Control link for that account.

Users can create accounts from the app. New accounts receive Ordinary access by default. In Admin Control, the administrator can change a user's access level to Premium. The Premium page currently displays the access level; premium-only feature locking can be added when those features are ready.

## Data and login activity

Firebase Authentication stores email/password account credentials. Firestore stores account profile details, access level, and sign-in/sign-up activity. Practice progress such as mistakes, revision words, learned words, history, and settings remains local to the current installation. Users can export and import that personal practice data as JSON; the word library is excluded.

The login activity view shows email, display name, event type, timestamp, and an approximate browser/device label. The app does not collect IP addresses. Because login events are written by the browser, treat them as helpful activity history rather than a tamper-proof security audit log.

## Main files

- `index.html` — app pages and login/sign-up form
- `admin-control.html` — administrator activity and access-level page
- `firestore.rules` — database access rules to publish in Firebase Console
- `js/firebase-client.js` — Firebase project configuration and SDK setup
- `js/login.js` — Firebase Authentication, account profile, and login activity
- `js/admin-control.js` — administrator checks and user access controls
- `js/user-profile.js` — profile form and JSON personal-data backup
- `js/data.js` — vocabulary and local practice state

## Account signup

Account creation now requires a phone number, stored as an unverified contact detail in users/{uid}. No SMS is sent. This field is included in the existing profile-document creation write. Admin Control displays the saved number. Sign-in also includes a password-reset link; Firebase sends a reset email to the address entered.

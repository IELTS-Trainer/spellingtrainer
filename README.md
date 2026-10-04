# IELTS Spelling Trainer V3.2

This folder contains the GitHub Pages-ready spelling trainer. Keep the folder structure intact and publish `index.html` together with the `css` and `js` folders.

## Files

- `index.html` — app layout and views
- `admin-control.html` — separate admin-only page
- `css/app.css` — app styling
- `css/login.css` — login and profile page styling
- `js/data.js` — starter vocabulary and shared app state
- `js/app-core.js` — shared navigation, settings, and save behavior
- `js/dashboard.js` — history and home dashboard lists
- `js/voice-mode.js` — Voice Mode practice
- `js/syllable-practice.js` — syllable correction and practice
- `js/mistake-practice.js` — Last Mistakes syllable practice
- `js/typing-climb.js` — Typing Climb game
- `js/library.js` — word library and backup import/export
- `js/login.js` — optional login state and password-pattern check
- `js/site-menu.js` — menu navigation
- `js/user-profile.js` — profile form and user-data JSON backup import/export
- `js/bootstrap.js` — event handlers and startup rendering

The app stores personal progress and settings locally on the device. Local-file storage and GitHub Pages storage are separate; data is not automatically synced between them.

The User Profile page can export or import a separate JSON backup of personal profile details, mistakes, revision words, learned words, practice history, and settings. This backup does not include the word library.

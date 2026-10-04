function renderUserProfile() {
    const profile = data.userProfile || {};
    document.getElementById('profileFirstName').value = profile.firstName || '';
    document.getElementById('profileLastName').value = profile.lastName || '';
    document.getElementById('profileNationality').value = profile.nationality || '';
    document.getElementById('profileCity').value = profile.city || '';
    document.getElementById('profileLearningPurpose').value = profile.learningPurpose || '';
}

async function saveUserProfile(event) {
    event.preventDefault();
    data.userProfile = {
        firstName: document.getElementById('profileFirstName').value.trim(),
        lastName: document.getElementById('profileLastName').value.trim(),
        nationality: document.getElementById('profileNationality').value.trim(),
        city: document.getElementById('profileCity').value.trim(),
        learningPurpose: document.getElementById('profileLearningPurpose').value
    };
    save();
    updateLoginStatusUI();
    if (window.currentFirebaseUser && typeof window.saveFirebaseUserProfile === 'function') {
        try {
            await window.saveFirebaseUserProfile(data.userProfile);
            alert('Profile saved and synced to your account.');
        } catch (error) {
            console.error('Profile could not be synced.', error);
            alert('Profile saved on this device, but could not sync. Check your internet connection and Firestore rules.');
        }
    } else {
        alert('Profile saved on this device. Sign in to sync profile details to your account.');
    }
}

function exportUserData() {
    const backup = {
        format: 'ielts-spelling-user-data',
        version: 1,
        exportedAt: new Date().toISOString(),
        profile: data.userProfile || {},
        mistakes: data.mistakes || {},
        revision: data.revision || [],
        learned: data.learned || [],
        history: data.history || [],
        settings: data.settings || {}
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'ielts-spelling-user-data.json';
    link.click();
    URL.revokeObjectURL(url);
}

function importUserData(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
        try {
            const backup = JSON.parse(reader.result);
            if (!backup || backup.format !== 'ielts-spelling-user-data' || backup.version !== 1) {
                throw new Error('This file is not a supported IELTS Spelling Trainer user-data backup.');
            }
            if (!backup.profile || typeof backup.profile !== 'object' || Array.isArray(backup.profile)) {
                throw new Error('The profile section is missing or invalid.');
            }
            if (!backup.mistakes || typeof backup.mistakes !== 'object' || Array.isArray(backup.mistakes)) {
                throw new Error('The mistakes section is missing or invalid.');
            }
            if (!Array.isArray(backup.revision) || !Array.isArray(backup.learned) || !Array.isArray(backup.history)) {
                throw new Error('A word list or history section is missing or invalid.');
            }
            if (!backup.settings || typeof backup.settings !== 'object' || Array.isArray(backup.settings)) {
                throw new Error('The settings section is missing or invalid.');
            }
            if (!confirm('Import this backup? It will replace your profile and practice data. Your word library will stay unchanged.')) return;

            const cleanStrings = values => [...new Set(values.filter(value => typeof value === 'string'))];
            data.userProfile = {
                firstName: String(backup.profile.firstName || '').slice(0, 60),
                lastName: String(backup.profile.lastName || '').slice(0, 60),
                nationality: String(backup.profile.nationality || '').slice(0, 80),
                city: String(backup.profile.city || '').slice(0, 80),
                learningPurpose: ['IELTS', 'Academic'].includes(backup.profile.learningPurpose) ? backup.profile.learningPurpose : ''
            };
            data.mistakes = Object.fromEntries(Object.entries(backup.mistakes)
                .filter(([word, count]) => typeof word === 'string' && Number.isFinite(Number(count)))
                .map(([word, count]) => [word, Math.max(0, Math.floor(Number(count)))]));
            data.revision = cleanStrings(backup.revision);
            data.learned = cleanStrings(backup.learned);
            data.history = backup.history
                .filter(item => item && typeof item === 'object')
                .map(item => ({category: String(item.category || ''), date: String(item.date || '')}));

            const settings = backup.settings;
            const bounded = (value, min, max, fallback) => {
                const number = Number.parseInt(value, 10);
                return Number.isFinite(number) ? Math.max(min, Math.min(max, number)) : fallback;
            };
            data.settings = {
                ...data.settings,
                syllableRounds: bounded(settings.syllableRounds, 1, 10, 3),
                mistakeLimit: bounded(settings.mistakeLimit, 1, 100, 10),
                showHistoryOnHome: settings.showHistoryOnHome !== false,
                historyHomeCount: bounded(settings.historyHomeCount, 1, 200, 5),
                showMistakesOnHome: settings.showMistakesOnHome !== false,
                mistakesHomeCount: bounded(settings.mistakesHomeCount, 1, 200, 15)
            };

            save();
            renderUserProfile();
            updateLoginStatusUI();
            alert('User data imported. Your word library was not changed.');
        } catch (error) {
            alert('Could not import this file: ' + error.message);
        } finally {
            event.target.value = '';
        }
    };
    reader.onerror = () => {
        alert('Could not read the selected file.');
        event.target.value = '';
    };
    reader.readAsText(file);
}

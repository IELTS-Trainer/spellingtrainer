    function save() { 
        localStorage.setItem('ielts_vault', JSON.stringify(data)); 
        updateDashboardCounts();
        renderHistory();
        renderDashboardMistakes();
        renderDashboardBookmarks();
    }

    function trimPracticeHistory() {
        if (!Array.isArray(data.history)) data.history = [];
        const keepCount = Math.max(10, Math.min(200, parseInt(data.settings.historyHomeCount, 10) || 5));
        if (data.history.length > keepCount) data.history.splice(0, data.history.length - keepCount);
    }

    function showView(id) {
        document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
        document.getElementById(id).classList.add('active');
        document.getElementById('correctionHint').style.display = 'none';
        
        const titles = { 'home': 'IELTS Spelling Trainer', 'practiceSetup': 'Select Category', 'voiceSetup':'Voice Mode Practice', 'settings':'Settings', 'historyPage':'History', 'learnedWordsPage':'Word Learned', 'userPage':'User', 'premium':'Premium', 'game': 'Exam Mode', 'library': 'Word Library',bookmarksPage:'Bookmarked words',typingSetup:'Typing Climb',typingGame:'Typing Climb',mistakeLevels:'Last Mistakes',syllableGame:'Syllable Practice',syllableResults:'Syllable Practice' };
        document.getElementById('headerTitle').innerText = titles[id] || 'IELTS Hub';
        if(id === 'home') { renderHistory(); renderDashboardMistakes(); renderDashboardBookmarks(); }
        if(id === 'bookmarksPage') renderDashboardBookmarks();
        if(id === 'learnedWordsPage') renderLearnedWords();
        if(id === 'userPage') { renderUserProfile(); updateLoginStatusUI(); }
        if(id === 'library') renderLibrary();
        if(id === 'settings') loadSettingsForm();
    }

    function updateDashboardCounts() {
        const mCount = Object.keys(data.mistakes).length;
        const rCount = data.revision.length;
        document.getElementById('mistakeSub').innerText = `${mCount} words pending`;
        document.getElementById('revisionSub').innerText = `${rCount} words mastered`;
        document.getElementById('headerStats').innerHTML = `Mistakes: ${mCount}<br>Revision:${rCount}`;
    }

    function loadSettingsForm() {
        document.getElementById('settingSyllableRounds').value = data.settings.syllableRounds;
        document.getElementById('settingMistakeLimit').value = data.settings.mistakeLimit;
        document.getElementById('settingShowHistory').checked = data.settings.showHistoryOnHome !== false;
        document.getElementById('settingHistoryCount').value = data.settings.historyHomeCount || 5;
        document.getElementById('settingShowMistakes').checked = data.settings.showMistakesOnHome !== false;
        document.getElementById('settingMistakeCount').value = data.settings.mistakesHomeCount || 15;
    }

    function saveSettings() {
        const rounds = Math.max(1, Math.min(10, parseInt(document.getElementById('settingSyllableRounds').value, 10) || 3));
        const limit = Math.max(1, Math.min(100, parseInt(document.getElementById('settingMistakeLimit').value, 10) || 10));
        const historyCount = Math.max(1, Math.min(200, parseInt(document.getElementById('settingHistoryCount').value, 10) || 5));
        const mistakeCount = Math.max(1, Math.min(200, parseInt(document.getElementById('settingMistakeCount').value, 10) || 15));
        data.settings = {...data.settings, syllableRounds:rounds, mistakeLimit:limit, showHistoryOnHome:document.getElementById('settingShowHistory').checked, historyHomeCount:historyCount, showMistakesOnHome:document.getElementById('settingShowMistakes').checked, mistakesHomeCount:mistakeCount};
        save();
        alert('Settings saved.');
    }

    function openVoiceSetup() {
        const select = document.getElementById('voiceCategory');
        select.innerHTML = '';
        Object.keys(data.library || {}).forEach(category => {
            const option = document.createElement('option');
            option.value = option.textContent = category;
            select.appendChild(option);
        });
        document.getElementById('voiceCategoryBox').style.display = 'none';
        showView('voiceSetup');
    }

    function showVoiceCategory() {
        if (!Object.keys(data.library || {}).length) return alert('Add words first.');
        document.getElementById('voiceCategoryBox').style.display = 'block';
    }

    

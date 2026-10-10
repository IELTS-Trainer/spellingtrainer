let syllableSession = { words: [], index: 0, syllables: [], syllableIndex: 0, round: 1, phase: 'syllables' };

    function openMistakeLevels() {
        showView('mistakeLevels');
    }

    function splitWordSyllables(word) {
        if (word.length <= 3) return [word];
        const lower = word.toLowerCase();
        let groups = [];
        const vowelPattern = /[aeiouy]+/g;
        let match;
        while ((match = vowelPattern.exec(lower)) !== null) groups.push({start: match.index, end: match.index + match[0].length});
        if (lower.endsWith('e') && !/(le|ye|ee)$/.test(lower) && groups.length > 1 && groups[groups.length - 1].start === lower.length - 1) groups.pop();
        const suffix = lower.match(/(tion|sion)$/);
        if (suffix && groups.length >= 2) {
            const si = lower.length - suffix[0].length;
            const before = groups.filter(g => g.end <= si);
            groups = before.concat([{start:si + 1, end:lower.length}]);
        }
        if (groups.length <= 1) return [word];
        const legalOnsets = ['bl','br','cl','cr','dr','fl','fr','gl','gr','pl','pr','sc','sk','sl','sm','sn','sp','st','sw','tr','tw','str','spl','spr','scr','shr','thr'];
        const boundaries = [];
        for (let i = 0; i < groups.length - 1; i++) {
            const gapStart = groups[i].end;
            const gapEnd = groups[i + 1].start;
            const consonants = lower.slice(gapStart, gapEnd);
            if (!consonants) { boundaries.push(gapEnd); continue; }
            let onset = consonants.slice(-1);
            for (const candidate of legalOnsets) {
                if (consonants.endsWith(candidate) && candidate.length > onset.length) onset = candidate;
            }
            boundaries.push(gapEnd - onset.length);
        }
        const parts = [];
        let previous = 0;
        boundaries.forEach(boundary => { parts.push(word.slice(previous, boundary)); previous = boundary; });
        parts.push(word.slice(previous));
        return parts.filter(Boolean);
    }

    function syllabifyPhrase(phrase) {
        const parts = [];
        const words = phrase.match(/[A-Za-z]+(?:['’][A-Za-z]+)?/g) || [phrase];
        words.forEach(word => parts.push(...splitWordSyllables(word)));
        return parts.length ? parts : [phrase];
    }

    function startSyllableMistakes(wordsToPractice, historyLabel, popup = false) {
        const words = Array.isArray(wordsToPractice) ? [...wordsToPractice] : Object.keys(data.mistakes || {});
        if (!words.length) return alert('There are no mistaken words to practise.');
        syllableSession = {words, index:0, syllables:[], syllableIndex:0, round:1, phase:'syllables', popup};
        const now = new Date();
        if (!data.history) data.history = [];
        data.history.push({category:(historyLabel || 'Last Mistakes') + ' · Syllable Practice',date:now.toLocaleDateString([], {weekday:'short',month:'short',day:'numeric'}) + ' at ' + now.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})});
        trimPracticeHistory();
        save();
        document.getElementById('syllablePopupBody').style.display = 'block';
        document.getElementById('syllablePopupComplete').style.display = 'none';
        const gameView = document.getElementById('syllableGame');
        if (popup) {
            gameView.classList.add('syllable-game-popup', 'active');
        } else {
            gameView.classList.remove('syllable-game-popup');
            showView('syllableGame');
        }
        showSyllableWord();
    }

    function showSyllableWord() {
        updateSyllableOverallProgress();
        if (syllableSession.index >= syllableSession.words.length) {
            document.getElementById('syllableResultsSummary').textContent = 'You completed ' + syllableSession.words.length + ' words.';
            if (syllableSession.popup) {
                document.getElementById('syllablePopupBody').style.display = 'none';
                document.getElementById('syllablePopupComplete').style.display = 'block';
                document.getElementById('syllablePopupSummary').textContent = 'You completed ' + syllableSession.words.length + ' words.';
            } else {
                showView('syllableResults');
            }
            return;
        }
        const word = syllableSession.words[syllableSession.index];
        syllableSession.syllables = syllabifyPhrase(word);
        syllableSession.syllableIndex = 0;
        syllableSession.round = 1;
        syllableSession.phase = 'syllables';
        document.getElementById('syllableWholeWord').textContent = word;
        renderWordTools('syllableWordTools', word);
        document.getElementById('syllableProgress').textContent = (syllableSession.index + 1) + '/' + syllableSession.words.length;
        document.getElementById('syllableInput').value = '';
        document.getElementById('syllableFeedback').textContent = '';
        renderSyllableChips();
        document.getElementById('syllableInput').focus();
    }

    function updateSyllableOverallProgress() {
        const total = syllableSession.words.length || 0;
        const completed = Math.min(syllableSession.index, total);
        const percent = total ? Math.round((completed / total) * 100) : 0;
        document.getElementById('syllableOverallProgressText').textContent = 'Words completed: ' + completed + '/' + total;
        const bar = document.getElementById('syllableOverallProgress');
        bar.style.width = percent + '%';
        bar.setAttribute('aria-valuenow', String(percent));
    }

    function endSyllablePractice() {
        const gameView = document.getElementById('syllableGame');
        gameView.classList.remove('syllable-game-popup');
        syllableSession.popup = false;
        showView('home');
    }

    function renderSyllableChips() {
        const display = document.getElementById('syllableDisplay');
        display.innerHTML = '';
        syllableSession.syllables.forEach((syllable, index) => {
            const chip = document.createElement('span');
            chip.className = 'syllable-chip' + (index === syllableSession.syllableIndex ? ' active' : '');
            chip.textContent = syllable;
            display.appendChild(chip);
        });
        const current = syllableSession.syllables[syllableSession.syllableIndex];
        const prompt = syllableSession.phase === 'whole'
            ? 'Syllable rounds complete. Now type the whole word: ' + syllableSession.words[syllableSession.index]
            : 'Round ' + syllableSession.round + ' of ' + data.settings.syllableRounds + ' · Type syllable ' + (syllableSession.syllableIndex + 1) + ' of ' + syllableSession.syllables.length + ': ' + current;
        document.getElementById('syllablePrompt').textContent = prompt;
        document.getElementById('syllableInput').value = '';
        document.getElementById('syllableInput').placeholder = syllableSession.phase === 'whole' ? 'Type the complete word' : 'Type this syllable';
        document.querySelector('#syllableGame .btn-primary').textContent = syllableSession.phase === 'whole' ? 'Check whole word' : 'Check syllable';
    }

    function checkSyllable() {
        const input = document.getElementById('syllableInput');
        const word = syllableSession.words[syllableSession.index];
        if (syllableSession.phase === 'whole') {
            if (normalizeSpellingAnswer(input.value) !== normalizeSpellingAnswer(word)) {
                document.getElementById('syllableFeedback').textContent = 'Not quite. Repeat the syllable rounds, then type the whole word.';
                syllableSession.round = 1;
                syllableSession.syllableIndex = 0;
                syllableSession.phase = 'syllables';
                renderSyllableChips();
                input.focus();
                return;
            }
            markMistakeCorrect(word);
            syllableSession.index++;
            document.getElementById('syllableFeedback').textContent = 'Correct whole word! Next word.';
            setTimeout(showSyllableWord, 500);
            return;
        }
        const expected = syllableSession.syllables[syllableSession.syllableIndex];
        if (input.value.trim().toLocaleLowerCase() !== expected.toLocaleLowerCase()) {
            document.getElementById('syllableFeedback').textContent = 'Incorrect syllable. Try again.';
            input.select();
            return;
        }
        syllableSession.syllableIndex++;
        if (syllableSession.syllableIndex < syllableSession.syllables.length) {
            document.getElementById('syllableFeedback').textContent = 'Correct. Next syllable.';
            renderSyllableChips();
            input.focus();
            return;
        }
        if (syllableSession.round < Number(data.settings.syllableRounds || 3)) {
            syllableSession.round++;
            syllableSession.syllableIndex = 0;
            document.getElementById('syllableFeedback').textContent = 'Round complete. Repeat the syllables.';
            renderSyllableChips();
            input.focus();
            return;
        }
        syllableSession.phase = 'whole';
        document.getElementById('syllableFeedback').textContent = 'All rounds complete. Type the whole word.';
        renderSyllableChips();
        input.focus();
    }

    document.getElementById('syllableInput').addEventListener('keydown', event => {
        if (event.key === 'Enter') {
            event.preventDefault();
            checkSyllable();
        }
    });


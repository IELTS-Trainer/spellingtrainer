let errorSyllableState = { word: '', syllables: [], index: 0, round: 1, phase: 'syllables', onComplete: null };

    function openErrorSyllableCorrection(word, onComplete) {
        errorSyllableState = {
            word: word, 
            syllables: syllabifyPhrase(word), 
            index: 0, 
            round: 1, 
            phase: 'syllables', 
            onComplete: onComplete
        };
        document.getElementById('errorSyllableWord').textContent = word;
        renderWordTools('errorSyllableWordTools', word);
        document.getElementById('errorSyllableFeedback').textContent = '';
        document.querySelector('#errorSyllableModal .btn-primary').textContent = 'Check syllable';
        document.getElementById('errorSyllableModal').style.display = 'flex';
        renderErrorSyllableStep();
    }

    function renderErrorSyllableStep() {
        const display = document.getElementById('errorSyllableDisplay');
        display.innerHTML = '';
        errorSyllableState.syllables.forEach((syllable, index) => {
            const chip = document.createElement('span');
            chip.className = 'syllable-chip' + (index === errorSyllableState.index ? ' active' : '');
            chip.textContent = syllable;
            display.appendChild(chip);
        });
        const current = errorSyllableState.syllables[errorSyllableState.index];
        document.getElementById('errorSyllablePrompt').textContent = 'Syllable round ' + errorSyllableState.round + ' of ' + data.settings.syllableRounds + ' · Type syllable ' + (errorSyllableState.index + 1) + ' of ' + errorSyllableState.syllables.length + ': ' + current;
        const input = document.getElementById('errorSyllableInput');
        input.value = '';
        input.focus();
    }

    function checkErrorSyllable() {
        if (errorSyllableState.phase === 'whole') {
            const wholeInput = document.getElementById('errorSyllableInput');
            if (normalizeSpellingAnswer(wholeInput.value) !== normalizeSpellingAnswer(errorSyllableState.word)) {
                document.getElementById('errorSyllableFeedback').textContent = 'Not quite. Practise the syllables again, then spell the whole word.';
                setTimeout(() => finishErrorSyllablePractice(false), 900);
                return;
            }
            finishErrorSyllablePractice(true);
            return;
        }
        const expected = errorSyllableState.syllables[errorSyllableState.index];
        const input = document.getElementById('errorSyllableInput');
        if (input.value.trim().toLocaleLowerCase() !== expected.toLocaleLowerCase()) {
            document.getElementById('errorSyllableFeedback').textContent = 'Not quite. Type this syllable again.';
            input.select();
            return;
        }
        errorSyllableState.index++;
        if (errorSyllableState.index < errorSyllableState.syllables.length) {
            document.getElementById('errorSyllableFeedback').textContent = 'Correct. Next syllable.';
            renderErrorSyllableStep();
            return;
        }
        if (errorSyllableState.round < Number(data.settings.syllableRounds || 3)) {
            errorSyllableState.round++;
            errorSyllableState.index = 0;
            document.getElementById('errorSyllableFeedback').textContent = 'Round complete. Repeat the syllables.';
            renderErrorSyllableStep();
            return;
        }
        errorSyllableState.phase = 'whole';
        document.getElementById('errorSyllableDisplay').innerHTML = '';
        document.querySelector('#errorSyllableModal .btn-primary').textContent = 'Check whole word';
        document.getElementById('errorSyllablePrompt').textContent = 'Now type the complete word: ' + errorSyllableState.word;
        document.getElementById('errorSyllableInput').value = '';
        document.getElementById('errorSyllableInput').focus();
        document.getElementById('errorSyllableFeedback').textContent = 'All syllable rounds complete. Type the whole word.';
    }

    function normalizeSpellingAnswer(value) {
        return String(value || '').normalize('NFKC').replace(/[’‘`]/g, "'").replace(/[‐‑‒–—]/g, '-').replace(/\s+/g, ' ').trim().toLocaleLowerCase();
    }

    function finishErrorSyllablePractice(wordCorrect) {
        const word = errorSyllableState.word;
        const callback = errorSyllableState.onComplete;

        if (wordCorrect) {
            errorSyllableState.onComplete = null;
            document.getElementById('errorSyllableModal').style.display = 'none';
            document.getElementById('errorSyllableFeedback').textContent = '';
            markMistakeCorrect(word);
            if (typeof callback === 'function') callback();
        } else {
            errorSyllableState.round = 1;
            errorSyllableState.index = 0;
            errorSyllableState.phase = 'syllables';
            document.querySelector('#errorSyllableModal .btn-primary').textContent = 'Check syllable';
            renderErrorSyllableStep();
        }
    }

    function markMistakeCorrect(word, completedRevision = false) {
        if (data.mistakes[word] !== undefined) {
            data.mistakes[word] = (Number(data.mistakes[word]) || 0) + 1;
            if (data.mistakes[word] >= 3) {
                if (!data.revision.includes(word)) data.revision.push(word);
                delete data.mistakes[word];
            }
        }
        if (completedRevision && data.revision.includes(word)) {
            data.revision = data.revision.filter(item => item !== word);
            if (!data.learned.includes(word)) data.learned.push(word);
        }
        save();
    }

    document.getElementById('errorSyllableInput').addEventListener('keydown', event => {
        if (event.key === 'Enter') {
            event.preventDefault();
            checkErrorSyllable();
        }
    });

    

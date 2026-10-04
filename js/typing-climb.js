function openTypingSetup(){let s=document.getElementById('typingCategory');s.innerHTML='';Object.keys(data.library||{}).forEach(c=>{let o=document.createElement('option');o.value=c;o.textContent=c;s.appendChild(o)});document.getElementById('typingCategoryBox').style.display='none';showView('typingSetup')}
function selectTypingLevel(l){if(l===1){if(!Object.keys(data.library||{}).length)return alert('Add words first.');document.getElementById('typingCategoryBox').style.display='block'}else beginTypingGame(2)}
function beginTypingGame(level, requestedCategory) {
        let category = '';
        let words;
        if (level === 1) {
            category = requestedCategory || document.getElementById('typingCategory').value || typingSession.category;
            if (!category || !data.library[category] || !data.library[category].length) return alert('Choose a category with words.');
            words = [...data.library[category]];
        } else {
            words = Object.values(data.library || {}).flat().sort(() => Math.random() - 0.5);
            if (!words.length) return alert('Add words first.');
        }
        typingSession = {words, index:0, level, category, score:0, mistakes:0};
        const label = level === 1 ? 'Typing Climb · ' + category : 'Typing Climb · Random Mix';
        const now = new Date();
        if (!data.history) data.history = [];
        data.history.push({category:label, date:now.toLocaleDateString([], {weekday:'short',month:'short',day:'numeric'}) + ' at ' + now.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})});
        trimPracticeHistory();
        save();
        document.getElementById('typingPlayArea').style.display = 'block';
        document.getElementById('typingTopicResults').style.display = 'none';
        document.getElementById('typingGameOver').style.display = 'none';
        document.getElementById('typingModeLabel').textContent = level === 1 ? 'Level 1 · ' + category : 'Level 2 · Random Mix';
        document.getElementById('typingLimit').textContent = level === 2 ? ' / ' + data.settings.mistakeLimit : '';
        document.getElementById('typingScore').textContent = '0';
        document.getElementById('typingMistakes').textContent = '0';
        document.getElementById('climber').style.setProperty('--climb', 0);
        document.getElementById('platformTrack').innerHTML = '';
        showView('typingGame');
        showTypingWord();
    }
function showTypingWord() {
        if (typingSession.index >= typingSession.words.length) {
            if (typingSession.level === 1) showTypingTopicResults();
            else showTypingGameOver('Round complete', 'You completed the random word list. Score: ' + typingSession.score + '.');
            return;
        }
        document.getElementById('typingInput').disabled = false;
        document.getElementById('typingWord').textContent = typingSession.words[typingSession.index];
        document.getElementById('typingInput').value = '';
        document.getElementById('typingFeedback').textContent = '';
        document.getElementById('typingInput').focus();
    }

    function showTypingTopicResults() {
        document.getElementById('typingPlayArea').style.display = 'none';
        document.getElementById('typingTopicResults').style.display = 'block';
        document.getElementById('typingResultsTopic').textContent = 'You finished ' + typingSession.category + '.';
        const select = document.getElementById('nextTypingCategory');
        select.innerHTML = '';
        Object.keys(data.library || {}).forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            select.appendChild(option);
        });
        select.value = typingSession.category;
        document.getElementById('replayTopicButton').textContent = 'Play ' + typingSession.category + ' again';
        document.getElementById('replayTopicButton').onclick = () => beginTypingGame(1, typingSession.category);
    }

    function showTypingGameOver(title, message) {
        document.getElementById('typingGameOverTitle').textContent = title;
        document.getElementById('typingGameOverMessage').textContent = message;
        document.querySelector('#typingGameOver .btn-primary').onclick = () => beginTypingGame(2);
        document.querySelectorAll('#typingGameOver .btn')[1].onclick = () => practiceTypingMistakes();
        document.querySelectorAll('#typingGameOver .btn')[2].onclick = () => closeTypingGameOver();
        document.getElementById('typingGameOver').style.display = 'flex';
    }

    function closeTypingGameOver() {
        document.getElementById('typingGameOver').style.display = 'none';
        endTypingGame();
    }

    function submitTypingWord() {
        const input = document.getElementById('typingInput');
        if (input.disabled) return;
        const word = typingSession.words[typingSession.index];
        if (input.value.trim().toLocaleLowerCase() === word.trim().toLocaleLowerCase()) {
            typingSession.score++;
            typingSession.index++;
            document.getElementById('typingScore').textContent = typingSession.score;
            document.getElementById('typingFeedback').textContent = 'Correct! Up you go.';
            document.getElementById('climber').style.setProperty('--climb', typingSession.score % 5);
            const ledge = document.createElement('div');
            ledge.className = 'platform';
            ledge.style.setProperty('--step', typingSession.score % 5);
            document.getElementById('platformTrack').appendChild(ledge);
            setTimeout(showTypingWord, 450);
        } else {
            data.mistakes[word] = 0;
            if (data.revision.includes(word)) data.revision = data.revision.filter(item => item !== word);
            typingSession.mistakes++;
            document.getElementById('typingMistakes').textContent = typingSession.mistakes;
            document.getElementById('typingFeedback').textContent = 'Let’s practise its syllables, then continue.';
            save();
            input.disabled = true;
            openErrorSyllableCorrection(word, () => {
                typingSession.score++;
                typingSession.index++;
                document.getElementById('typingScore').textContent = typingSession.score;
                document.getElementById('climber').style.setProperty('--climb', typingSession.score % 5);
                const ledge = document.createElement('div');
                ledge.className = 'platform';
                ledge.style.setProperty('--step', typingSession.score % 5);
                document.getElementById('platformTrack').appendChild(ledge);
                if (typingSession.level === 2 && typingSession.mistakes >= Number(data.settings.mistakeLimit || 10)) {
                    showTypingGameOver('Game over', 'You reached ' + data.settings.mistakeLimit + ' mistakes. Score: ' + typingSession.score + '.');
                } else {
                    input.disabled = false;
                    showTypingWord();
                }
            });
        }
    }

document.getElementById('startSelectedTopicButton').addEventListener('click', () => beginTypingGame(1, document.getElementById('nextTypingCategory').value));
function practiceTypingMistakes() {
    document.getElementById('typingGameOver').style.display = 'none';
    startMode('review');
}
function endTypingGame(){document.getElementById('typingInput').disabled=false;showView('home')}
document.getElementById('typingInput').addEventListener('keydown',e=>{if(e.key==='Enter')submitTypingWord()});

    

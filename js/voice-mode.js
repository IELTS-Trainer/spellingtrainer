function startMode(mode) {
        document.getElementById('typingGameOver').style.display = 'none';
        session.mode = mode;
        let catName = "";

        if(mode === 'regular') {
            catName = document.getElementById('voiceSetup').classList.contains('active') ? document.getElementById('voiceCategory').value : document.getElementById('catSelect').value;
            if(!catName) return alert("Select a category");
            session.words = [...data.library[catName]];
            document.getElementById('gameTitle').innerText = "Category: " + catName;
        } else if(mode === 'random') {
            catName = 'Voice Mode · Random Mix';
            session.words = Object.values(data.library || {}).flat().sort(() => Math.random() - 0.5);
            document.getElementById('gameTitle').innerText = catName;
        } else if(mode === 'review') {
            catName = "Last Mistakes";
            session.words = Object.keys(data.mistakes).sort(() => Math.random() - 0.5);
            document.getElementById('gameTitle').innerText = catName;
        } else {
            catName = "Need Revision";
            session.words = [...data.revision].sort(() => Math.random() - 0.5);
            document.getElementById('gameTitle').innerText = catName;
        }

        if(session.words.length === 0) return alert("No words found.");
        session.mistakes = 0;

        const now = new Date();
        const dateStr = now.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
        const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        if(!data.history) data.history = [];
        data.history.push({ category: catName, date: `${dateStr} at${timeStr}` });
        trimPracticeHistory();
        
        save();
        session.index = 0;
        showView('game');
        loadWord();
    }

    function loadWord() {
        if(session.index >= session.words.length) {
            if (session.mode === 'random') showVoiceGameOver('Round complete', 'You completed the random word list.');
            else { alert("Session Complete!"); showView('home'); }
            return;
        }
        document.getElementById('gameProgress').innerText = `${session.index + 1}/${session.words.length}`;
        document.getElementById('userInput').value = "";
        document.getElementById('feedback').innerText = "";
        document.getElementById('correctionHint').style.display = 'none';
        document.getElementById('userInput').focus();
        sayWord();
    }

    function sayWord() {
        const word = session.words[session.index];
        if(!word) return;
        const utter = new SpeechSynthesisUtterance(word);
        const voices = synth.getVoices();

        const selectedVoice = voices.find(v => v.lang === 'en-GB') ||
                             voices.find(v => v.lang === 'en-US') ||
                             voices.find(v => v.lang.includes('en')) ||
                             voices[0];

        if (selectedVoice) utter.voice = selectedVoice;
        utter.rate = 0.85;
        utter.pitch = 1;

        utter.onstart = () => document.getElementById('speakerIcon').classList.add('pulse');
        utter.onend = () => document.getElementById('speakerIcon').classList.remove('pulse');

        synth.cancel();
        synth.speak(utter);
    }

    function checkAnswer() {
        const user = document.getElementById('userInput').value.trim().toLowerCase();
        const currentWord = session.words[session.index];
        const feedback = document.getElementById('feedback');
        if (user === currentWord.toLowerCase()) {
            feedback.innerHTML = "<span style='color:green'>Correct!</span>";
            markMistakeCorrect(currentWord, session.mode === 'revision');
            session.index++;
            setTimeout(loadWord, 1000);
        } else {
            feedback.innerHTML = "<span style='color:red'>Let's practise its syllables, then continue.</span>";
            if (data.revision.includes(currentWord)) data.revision = data.revision.filter(word => word !== currentWord);
            data.mistakes[currentWord] = 0;
            if (session.mode === 'random') session.mistakes = (session.mistakes || 0) + 1;
            save();
            openErrorSyllableCorrection(currentWord, () => {
                continueVoiceAfterCorrection();
            });
        }
    }

    function continueVoiceAfterCorrection() {
        // Explicitly close modal
        document.getElementById('errorSyllableModal').style.display = 'none';
        
        session.index++;
        if (session.mode === 'random' && session.mistakes >= Number(data.settings.mistakeLimit || 10)) {
            showVoiceGameOver('Game over', `You reached ${data.settings.mistakeLimit} mistakes.`);
            return;
        }
        
        showView('game');
        setTimeout(loadWord, 100);
    }

    function showVoiceGameOver(title, message) {
        document.getElementById('typingGameOverTitle').textContent = title;
        document.getElementById('typingGameOverMessage').textContent = message;
        document.querySelector('#typingGameOver .btn-primary').onclick = () => startMode('random');
        document.querySelectorAll('#typingGameOver .btn')[1].onclick = () => startMode('review');
        document.querySelectorAll('#typingGameOver .btn')[2].onclick = () => { document.getElementById('typingGameOver').style.display='none'; showView('home'); };
        document.getElementById('typingGameOver').style.display = 'flex';
    }

    

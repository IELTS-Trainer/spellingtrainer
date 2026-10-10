    function renderHistory() {
        const list = document.getElementById('historyList');
        const section = document.getElementById('historyHomeSection');
        const pageList = document.getElementById('historyPageList');
        const isVisible = data.settings.showHistoryOnHome !== false;
        section.style.display = isVisible ? '' : 'none';
        if(!data.history || data.history.length === 0) {
            const emptyMessage = () => {
                const message = document.createElement('p');
                message.style.cssText = 'color:#94a3b8;font-size:.9rem';
                message.textContent = 'No recent activity yet.';
                return message;
            };
            list.replaceChildren(emptyMessage());
            if (pageList) pageList.replaceChildren(emptyMessage());
            return;
        }
        
        const displayCount = Math.max(1, Math.min(200, parseInt(data.settings.historyHomeCount, 10) || 5));
        const renderItems = (target, items) => {
            target.replaceChildren();
            items.forEach(item => {
                const row = document.createElement('div');
                row.className = 'history-item';
                const category = document.createElement('strong');
                category.textContent = item.category || '';
                const date = document.createElement('span');
                date.className = 'history-date';
                date.textContent = item.date || '';
                row.append(category, date);
                target.appendChild(row);
            });
        };
        renderItems(list, data.history.slice(-displayCount).reverse());
        if (pageList) renderItems(pageList, data.history.slice().reverse());
    }

    function renderDashboardMistakes() {
        const list = document.getElementById('dashboardMistakeList');
        const section = document.getElementById('mistakesHomeSection');
        const isVisible = data.settings.showMistakesOnHome !== false;
        section.style.display = isVisible ? '' : 'none';
        if (!isVisible) return;
        const words = getDashboardMistakeWords();
        if (!words.length) {
            list.innerHTML = '<p style="color:#94a3b8;font-size:.9rem">No mistaken words yet.</p>';
            return;
        }
        list.innerHTML = '';
        words.forEach(word => {
            const item = document.createElement('div');
            item.className = 'history-item';
            item.textContent = word;
            list.appendChild(item);
        });
    }

    function getDashboardMistakeWords() {
        const allWords = Object.keys(data.mistakes || {});
        const displayCount = Math.max(1, Math.min(200, parseInt(data.settings.mistakesHomeCount, 10) || 15));
        return allWords.slice(-displayCount).reverse();
    }

    function practiceDashboardMistakes() {
        startSyllableMistakes(getDashboardMistakeWords(), 'Home · Last Mistakes', true);
    }

    function renderLearnedWords() {
        const list = document.getElementById('learnedWordList');
        const count = document.getElementById('learnedWordCount');
        const words = Array.isArray(data.learned) ? data.learned : [];
        count.textContent = words.length;
        if (!words.length) {
            list.innerHTML = '<p style="color:#94a3b8;font-size:.9rem">No learned words yet. Words will appear here after you complete them from Need Revision.</p>';
            return;
        }
        list.replaceChildren();
        words.slice().reverse().forEach(word => {
            const item = document.createElement('div');
            item.className = 'history-item';
            item.textContent = word;
            list.appendChild(item);
        });
    }

    

function renderDashboardBookmarks() {
    const homeList = document.getElementById('dashboardBookmarkList');
    const pageList = document.getElementById('bookmarkPageList');
    const words = Array.isArray(data.bookmarks) ? data.bookmarks : [];
    const counter = document.getElementById('bookmarkSub');
    if (counter) counter.textContent = words.length + (words.length === 1 ? ' word saved' : ' words saved');
    const render = (target, values) => {
        if (!target) return;
        target.replaceChildren();
        if (!values.length) {
            const empty = document.createElement('p');
            empty.style.cssText = 'color:#94a3b8;font-size:.9rem';
            empty.textContent = 'No bookmarked words yet.';
            target.appendChild(empty);
            return;
        }
        values.slice().reverse().forEach(word => {
            const row = document.createElement('div');
            row.className = 'history-item';
            const text = document.createElement('span');
            text.textContent = word;
            const remove = document.createElement('button');
            remove.type = 'button';
            remove.className = 'history-action';
            remove.textContent = 'Remove';
            remove.addEventListener('click', () => {
                data.bookmarks = data.bookmarks.filter(item => item.toLocaleLowerCase() !== word.toLocaleLowerCase());
                save();
            });
            row.append(text, remove);
            target.appendChild(row);
        });
    };
    render(homeList, words.slice(-5));
    render(pageList, words);
}
function practiceBookmarkedWords() {
    const words = Array.isArray(data.bookmarks) ? [...data.bookmarks] : [];
    if (!words.length) return alert('No bookmarked words to practise yet.');
    startSyllableMistakes(words, 'Home · Bookmarked Words', true);
}
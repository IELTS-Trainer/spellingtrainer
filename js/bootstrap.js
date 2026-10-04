document.getElementById('userInput').addEventListener('keypress', e => { 
        if(e.key === 'Enter') {
            e.preventDefault();
            checkAnswer(); 
        }
    });
    updateDashboardCounts();
    renderHistory();
    renderDashboardMistakes();
    document.querySelectorAll('.grid .card').forEach((card, index) => card.setAttribute('aria-label', 'Feature ' + (index + 1)));

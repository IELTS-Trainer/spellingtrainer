function toggleSiteMenu(event) {
    event.stopPropagation();
    const menu = document.getElementById('siteMenu');
    const button = document.getElementById('menuToggle');
    menu.hidden = !menu.hidden;
    button.setAttribute('aria-expanded', String(!menu.hidden));
}

function closeSiteMenu() {
    const menu = document.getElementById('siteMenu');
    const button = document.getElementById('menuToggle');
    if (!menu || !button) return;
    menu.hidden = true;
    button.setAttribute('aria-expanded', 'false');
}

function openSettingsFromMenu() {
    closeSiteMenu();
    showView('settings');
}

function openHistoryFromMenu() {
    closeSiteMenu();
    renderHistory();
    showView('historyPage');
}

function openLearnedWordsFromMenu() {
    closeSiteMenu();
    showView('learnedWordsPage');
}

function openUserPage() {
    closeSiteMenu();
    updateLoginStatusUI();
    showView('userPage');
}

function openPremiumFromMenu() {
    closeSiteMenu();
    showView('premium');
}

document.addEventListener('click', event => {
    if (!event.target.closest('#siteMenu, #menuToggle')) closeSiteMenu();
});

document.addEventListener('keydown', event => {
    if (event.key === 'Escape') closeSiteMenu();
});

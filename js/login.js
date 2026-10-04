/* Browser-side status: 0 = guest, 1 = signed in, 2 = admin. */
const rememberedStatus = Number(localStorage.getItem('ielts_login_status')) || 0;
const sessionStatus = Number(sessionStorage.getItem('ielts_login_status')) || 0;
const rememberedLogin = rememberedStatus === 1 || rememberedStatus === 2;
window.loginStatus = [1, 2].includes(rememberedStatus) ? rememberedStatus : ([1, 2].includes(sessionStatus) ? sessionStatus : 0);
localStorage.removeItem('ielts_login_name');
sessionStorage.removeItem('ielts_login_name');
const ADMIN_PHONE_MARKER = '7147069'; // Checked after excluding the first two digits and final digit.

function normalizeLoginPhone(phone) {
    const rawPhone = String(phone).trim();
    let digits = rawPhone.replace(/\D/g, '');
    // A leading + indicates a country code; per the app's rule, drop its first two digits.
    if (rawPhone.startsWith('+')) digits = digits.slice(2);
    return digits.length === 11 ? digits : null;
}

function makePasswordFromPhone(phone) {
    const digits = normalizeLoginPhone(phone);
    if (!digits) return null;

    // Digits are counted from the left, including the first digit.
    const middleReversed = digits.slice(4, 7).split('').reverse(); // positions 7, 6, 5
    let generated = 'S'
        + digits[8] + '0'
        + middleReversed[0] + '1'
        + digits[10] + '&'
        + middleReversed[1] + '$'
        + digits[2] + '@'
        + middleReversed[2] + '*';

    return generated.replace(/[1-4]/g, digit => String.fromCharCode(64 + Number(digit)));
}

function setLoginState(value) {
    window.loginStatus = [1, 2].includes(Number(value)) ? Number(value) : 0;
    if (window.loginStatus && document.getElementById('rememberLogin').checked) {
        localStorage.setItem('ielts_login_status', String(window.loginStatus));
        sessionStorage.removeItem('ielts_login_status');
    } else if (window.loginStatus) {
        sessionStorage.setItem('ielts_login_status', String(window.loginStatus));
        localStorage.removeItem('ielts_login_status');
    } else {
        localStorage.removeItem('ielts_login_status');
        sessionStorage.removeItem('ielts_login_status');
    }
    updateLoginStatusUI();
    if (!window.loginStatus) {
        const passwordInput = document.getElementById('loginPassword');
        passwordInput.value = '';
        passwordInput.type = 'password';
        document.getElementById('togglePasswordButton').textContent = 'Show';
        document.getElementById('togglePasswordButton').setAttribute('aria-label', 'Show password');
        document.getElementById('togglePasswordButton').setAttribute('aria-pressed', 'false');
        document.getElementById('loginError').textContent = '';
    }
}

function updateLoginStatusUI() {
    const loginMenuItem = document.getElementById('loginMenuItem');
    const userMenuItem = document.getElementById('userMenuItem');
    const profile = data.userProfile || {};
    const displayName = [profile.firstName, profile.lastName].filter(Boolean).join(' ').trim() || 'User';
    if (loginMenuItem) loginMenuItem.hidden = window.loginStatus !== 0;
    if (userMenuItem) {
        userMenuItem.hidden = window.loginStatus === 0;
        userMenuItem.textContent = (window.loginStatus === 2 ? '🛡️ ' : '👤 ') + displayName + (window.loginStatus === 2 ? ' · Admin' : '');
    }
    const adminControlLink = document.getElementById('adminControlLink');
    if (adminControlLink) adminControlLink.style.display = window.loginStatus === 2 ? 'block' : 'none';
}

function togglePasswordVisibility() {
    const passwordInput = document.getElementById('loginPassword');
    const toggleButton = document.getElementById('togglePasswordButton');
    const isVisible = passwordInput.type === 'text';
    passwordInput.type = isVisible ? 'password' : 'text';
    toggleButton.textContent = isVisible ? 'Show' : 'Hide';
    toggleButton.setAttribute('aria-label', isVisible ? 'Show password' : 'Hide password');
    toggleButton.setAttribute('aria-pressed', String(!isVisible));
}

function handleHomeLoginStatus() {
    if (typeof closeSiteMenu === 'function') closeSiteMenu();
    if (window.loginStatus === 1) logoutUser();
    else openLoginPage();
}

function openLoginPage() {
    document.getElementById('loginError').textContent = '';
    document.getElementById('loginScreen').style.display = 'grid';
    document.getElementById('appContainer').style.display = 'none';
    document.getElementById('loginPhone').focus();
}

function continueAsGuest() {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('appContainer').style.display = 'block';
    showView('home');
}

document.getElementById('loginForm').addEventListener('submit', event => {
    event.preventDefault();
    const phone = document.getElementById('loginPhone').value;
    const password = document.getElementById('loginPassword').value;
    const normalizedPhone = normalizeLoginPhone(phone);
    const expected = makePasswordFromPhone(phone);
    const error = document.getElementById('loginError');

    if (!expected) {
        setLoginState(0);
        error.textContent = 'Enter a valid 11-digit phone number.';
        return;
    }
    if (password !== expected) {
        setLoginState(0);
        error.textContent = 'The phone number or password is incorrect.';
        return;
    }

    error.textContent = '';
    document.getElementById('loginPassword').value = '';
    const isAdmin = normalizedPhone.slice(2, -1).includes(ADMIN_PHONE_MARKER);
    setLoginState(isAdmin ? 2 : 1);
    continueAsGuest();
});

function logoutUser() {
    setLoginState(0);
    document.getElementById('loginPhone').value = '';
    continueAsGuest();
}

// Login is optional: always open the app at Home, retaining the saved status if logged in.
document.getElementById('loginScreen').style.display = 'none';
document.getElementById('appContainer').style.display = 'block';
document.getElementById('rememberLogin').checked = rememberedLogin;
updateLoginStatusUI();

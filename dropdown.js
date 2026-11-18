const loginToggle = document.querySelector("#login-toggle");
const authDropdown = document.querySelector("#auth-dropdown");
const profileDropdown = document.querySelector("#profile-dropdown");
const loginForm = document.querySelector("#login-form");
const signupForm = document.querySelector("#signup-form");
const loginTab = document.querySelector("#login-tab");
const signupTab = document.querySelector("#signup-tab");
const authMessage = document.querySelector("#auth-message");

function setAuthMode(mode) {
    const showLogin = mode === "login" && loginForm && signupForm;
    if (!loginForm || !signupForm || !loginTab || !signupTab) {
        return;
    }

    loginForm.hidden = !showLogin;
    signupForm.hidden = showLogin;
    loginTab.setAttribute("aria-selected", String(showLogin));
    signupTab.setAttribute("aria-selected", String(!showLogin));
    authMessage.textContent = "";
}

loginToggle.addEventListener("click", () => {
    const isOpen = loginToggle.getAttribute("aria-expanded") === "true";
    const activeDropdown = loginToggle.getAttribute("aria-controls") === "profile-dropdown"
        ? profileDropdown
        : authDropdown;

    if (profileDropdown) profileDropdown.hidden = true;
    if (authDropdown) authDropdown.hidden = true;
    loginToggle.setAttribute("aria-expanded", String(!isOpen));
    if (activeDropdown) activeDropdown.hidden = isOpen;

    if (!isOpen && activeDropdown === authDropdown) {
        if (loginForm) {
            setAuthMode("login");
        }
        const firstInput = activeDropdown?.querySelector("input");
        if (firstInput) {
            firstInput.focus();
        }
    }
});

if (loginTab && signupTab) {
    loginTab.addEventListener("click", () => setAuthMode("login"));
    signupTab.addEventListener("click", () => setAuthMode("signup"));
}

document.addEventListener("click", (event) => {
    const activeDropdown = loginToggle.getAttribute("aria-controls") === "profile-dropdown"
        ? profileDropdown
        : authDropdown;

    if (activeDropdown && !activeDropdown.hidden &&
        !activeDropdown.contains(event.target) && !loginToggle.contains(event.target)) {
        activeDropdown.hidden = true;
        loginToggle.setAttribute("aria-expanded", "false");
    }
});

document.addEventListener("keydown", (event) => {
    const activeDropdown = loginToggle.getAttribute("aria-controls") === "profile-dropdown"
        ? profileDropdown
        : authDropdown;

    if (event.key === "Escape" && activeDropdown && !activeDropdown.hidden) {
        activeDropdown.hidden = true;
        loginToggle.setAttribute("aria-expanded", "false");
        loginToggle.focus();
    }
}); 
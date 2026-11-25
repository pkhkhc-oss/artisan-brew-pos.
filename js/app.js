import { signIn, signOut, getSessionUser, getUserAccess } from "./auth/auth.js";

const authPanel = document.querySelector("#auth-panel");
const workspace = document.querySelector("#workspace");
const loginForm = document.querySelector("#login-form");
const authMessage = document.querySelector("#auth-message");
const userLabel = document.querySelector("#user-label");
const pageTitle = document.querySelector("#page-title");
const pageContent = document.querySelector("#page-content");

const pagePermissions = {
  dashboard: ["Admin", "Manager", "Cashier"],
  pos: ["Admin", "Manager", "Cashier"],
  products: ["Admin", "Manager"],
  inventory: ["Admin", "Manager", "Cashier"],
  reports: ["Admin", "Manager"],
  vat: ["Admin", "Manager"]
};

function showAuth(message = "") {
  authPanel.hidden = false;
  workspace.hidden = true;
  authMessage.textContent = message;
}

function showWorkspace(user, roles) {
  authPanel.hidden = true;
  workspace.hidden = false;
  userLabel.textContent = user.email || "Signed in";
  document.querySelectorAll("[data-page]").forEach(button => {
    const page = button.dataset.page;
    button.hidden = !roles.some(role => pagePermissions[page]?.includes(role));
  });
  openPage("dashboard");
}

function openPage(page) {
  const button = document.querySelector(`[data-page="${page}"]`);
  if (!button || button.hidden) return;
  document.querySelectorAll(".nav-link").forEach(item => item.classList.toggle("active", item === button));
  const titles = {dashboard:"Dashboard",pos:"POS Checkout",products:"Products",inventory:"Inventory",reports:"Sales Reports",vat:"VAT Settings"};
  pageTitle.textContent = titles[page] || "Dashboard";
  pageContent.innerHTML = "";
  const heading = document.createElement("h2");
  heading.textContent = titles[page] || "Dashboard";
  const paragraph = document.createElement("p");
  paragraph.className = "muted";
  paragraph.textContent = page === "dashboard"
    ? "Welcome. Your account is authenticated. The feature modules are being integrated."
    : "This screen is reserved for the next module integration. Do not process live transactions until checkout and permissions are fully tested.";
  pageContent.append(heading, paragraph);
}

loginForm.addEventListener("submit", async event => {
  event.preventDefault();
  authMessage.textContent = "Signing in…";
  const email = document.querySelector("#email").value.trim();
  const password = document.querySelector("#password").value;
  try {
    const user = await signIn(email, password);
    const access = await getUserAccess(user.id);
    showWorkspace(user, access.roles);
  } catch (error) {
    authMessage.textContent = error.message || "Unable to sign in.";
  }
});

document.querySelector("#logout-button").addEventListener("click", async () => {
  try { await signOut(); showAuth(); }
  catch (error) { authMessage.textContent = error.message; }
});

document.querySelector("#main-nav").addEventListener("click", event => {
  const button = event.target.closest("[data-page]");
  if (button) openPage(button.dataset.page);
});

try {
  const user = await getSessionUser();
  if (user) {
    const access = await getUserAccess(user.id);
    showWorkspace(user, access.roles);
  } else showAuth();
} catch (error) {
  showAuth(error.message || "Please sign in.");
}

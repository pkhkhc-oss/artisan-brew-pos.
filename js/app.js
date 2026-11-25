import { signIn, signOut, getSessionUser, getUserAccess } from "./auth/auth.js";
import { renderDashboard } from "./modules/dashboard.js";
import { renderPOS } from "./modules/pos.js";
import { renderCatalog } from "./modules/catalog.js";
import { renderInventory } from "./modules/inventory.js";
import { renderReports } from "./modules/reports.js";
import { renderTax } from "./modules/tax.js";

const $ = selector => document.querySelector(selector);
const authPanel = $("#auth-panel");
const workspace = $("#workspace");
const authMessage = $("#auth-message");
const pageContent = $("#page-content");
const userLabel = $("#user-label");
const pageTitle = $("#page-title");

const pagePermissions = {
  dashboard: ["Admin", "Manager", "Cashier"],
  pos: ["Admin", "Manager", "Cashier"],
  products: ["Admin", "Manager"],
  inventory: ["Admin", "Manager", "Cashier"],
  reports: ["Admin", "Manager"],
  vat: ["Admin", "Manager"]
};
const pageTitles = {
  dashboard: "Dashboard", pos: "POS Checkout", products: "Products & Categories",
  inventory: "Branch Inventory", reports: "Sales Reports", vat: "VAT Settings"
};
const renderers = {
  dashboard: renderDashboard, pos: renderPOS, products: renderCatalog,
  inventory: renderInventory, reports: renderReports, vat: renderTax
};
let currentUser = null;
let currentRoles = [];
let pageLoadToken = 0;

function showAuth(message = "") {
  currentUser = null;
  currentRoles = [];
  authPanel.hidden = false;
  workspace.hidden = true;
  authMessage.textContent = message;
}

function showWorkspace(user, roles) {
  currentUser = user;
  currentRoles = roles;
  authPanel.hidden = true;
  workspace.hidden = false;
  userLabel.textContent = user.email || "Signed in";
  document.querySelectorAll("[data-page]").forEach(button => {
    const page = button.dataset.page;
    button.hidden = !roles.some(role => pagePermissions[page]?.includes(role));
  });
  return openPage("dashboard");
}

async function openPage(page) {
  if (!currentRoles.some(role => pagePermissions[page]?.includes(role))) return;
  const token = ++pageLoadToken;
  document.querySelectorAll(".nav-link").forEach(button => {
    button.classList.toggle("active", button.dataset.page === page);
  });
  pageTitle.textContent = pageTitles[page] || "Dashboard";
  pageContent.replaceChildren();
  const loading = document.createElement("p");
  loading.className = "muted";
  loading.textContent = "Loading section…";
  pageContent.append(loading);
  try {
    await renderers[page](pageContent);
  } catch (error) {
    if (token !== pageLoadToken) return;
    pageContent.replaceChildren();
    const heading = document.createElement("h2");
    heading.textContent = "Unable to load this section";
    const message = document.createElement("p");
    message.className = "message";
    message.textContent = error?.message || "An unexpected error occurred.";
    pageContent.append(heading, message);
  }
}

$("#login-form").addEventListener("submit", async event => {
  event.preventDefault();
  const submit = event.currentTarget.querySelector('button[type="submit"]');
  submit.disabled = true;
  authMessage.textContent = "Signing in…";
  try {
    const user = await signIn($("#email").value.trim(), $("#password").value);
    const access = await getUserAccess(user.id);
    await showWorkspace(user, access.roles);
  } catch (error) {
    showAuth(error?.message || "Unable to sign in.");
  } finally {
    submit.disabled = false;
  }
});

$("#logout-button").addEventListener("click", async () => {
  try {
    await signOut();
    showAuth("You have signed out.");
  } catch (error) {
    authMessage.textContent = error?.message || "Unable to sign out.";
  }
});

$("#main-nav").addEventListener("click", event => {
  const button = event.target.closest("[data-page]");
  if (button && !button.hidden) openPage(button.dataset.page);
});

try {
  const user = await getSessionUser();
  if (user) {
    const access = await getUserAccess(user.id);
    await showWorkspace(user, access.roles);
  } else {
    showAuth();
  }
} catch (error) {
  showAuth(error?.message || "Please sign in.");
}

// homepage/viewHome.js
// models/home.js

import {
  setupFunctionPalette,
  setupBuilderCanvas,
} from "./navbar/functions/viewFunctions.js";

import {
  initTemplateStore,
  setupTemplateControls,
} from "./navbar/templates/viewTemplates.js";

import { setupPagesControls } from "./navbar/pages/viewPages.js";
import { setupStylesPanel } from "./navbar/styles/viewStyles.js";

// ---------------------------------------
// Main init
// ---------------------------------------

async function initHome() {
  console.log("viewHome.js: initHome() starting");

  try {
    // sidebar behaviors
    setupAccordion();
    setupNavSearch();

    // builder canvas + palette
    setupFunctionPalette();
    setupBuilderCanvas();

    // templates + pages
    // ❗ Always initialize — initTemplateStore will fall back
    // to a local "Template 1" if /api/templates fails or returns empty.
    await initTemplateStore();
    setupTemplateControls();
    setupPagesControls();

    // styles depends on page/template state
    setupStylesPanel();

    // logout button
    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", () => {
        localStorage.removeItem("authToken");
        localStorage.removeItem("user");
        window.location.href = "http://localhost:5000";
      });
    }

    console.log("viewHome.js: init complete");
  } catch (err) {
    console.error("Error during app init:", err);
  }
}

// Run initHome whether DOM is already ready or not
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initHome);
} else {
  // DOM is already parsed
  initHome();
}

// ---------------------------------------
// Sidebar accordion
// ---------------------------------------

function setupAccordion() {
  const items = document.querySelectorAll(".acc-item");
  if (!items.length) {
    console.warn("setupAccordion: no .acc-item elements found");
    return;
  }

  items.forEach((item) => {
    const trigger = item.querySelector(".acc-trigger");
    if (!trigger) return;

    trigger.addEventListener("click", () => {
      const isOpen = item.classList.contains("open");

      // Close all
      items.forEach((i) => i.classList.remove("open"));

      // Open this one if it was closed
      if (!isOpen) {
        item.classList.add("open");
      }
    });
  });
}

// ---------------------------------------
// Sidebar search
// ---------------------------------------

function setupNavSearch() {
  const searchInput = document.getElementById("navSearchInput");
  const items = Array.from(document.querySelectorAll(".acc-item"));

  if (!searchInput || !items.length) {
    return;
  }

  searchInput.addEventListener("input", () => {
    const query = searchInput.value.toLowerCase();

    items.forEach((item) => {
      const label =
        item.querySelector(".acc-trigger span")?.textContent.toLowerCase() ||
        "";

      const matches = label.includes(query);
      item.style.display = matches ? "" : "none";
    });
  });
}

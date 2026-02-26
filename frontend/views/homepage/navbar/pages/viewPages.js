// homepage/navbar/pages/viewPages.js

import { getActiveTemplate } from "../templates/viewTemplates.js";
import { rehydrateBuilderWidgets } from "../functions/viewFunctions.js";

const MAX_PAGES = 10;
let activePageIndex = 0; // 0 = Home

export function setupPagesControls() {
  const addPageButton = document.getElementById("addPageButton");
  const renamePageButton = document.getElementById("renamePageButton");
  const savePageButton = document.getElementById("savePageButton");
  const deletePageButton = document.getElementById("deletePageButton");
  const pagesList = document.getElementById("pagesList");
  const canvas = document.getElementById("builderCanvas");

  if (!pagesList || !canvas) return;

  // Initial render from current active template
  renderPagesList();
  loadActivePageIntoCanvas();

  // --- Add Page ---
  if (addPageButton) {
    addPageButton.addEventListener("click", () => {
      const tpl = getActiveTemplate();
      if (!tpl) return;

      if (tpl.pages.length >= MAX_PAGES) {
        alert(`You can only have up to ${MAX_PAGES} pages per template.`);
        return;
      }

      saveCurrentPageContent();
      addPageToActiveTemplate();
      renderPagesList();
      loadActivePageIntoCanvas();
    });
  }

  // --- Rename Page ---
  if (renamePageButton) {
    renamePageButton.addEventListener("click", () => {
      const tpl = getActiveTemplate();
      if (!tpl) return;

      const page = tpl.pages[activePageIndex];
      if (!page) {
        alert("No active page to rename.");
        return;
      }

      const newName = prompt("Rename page:", page.name || "Untitled Page");
      if (newName === null) return; // user cancelled

      const trimmed = newName.trim();
      if (!trimmed) {
        alert("Page name cannot be empty.");
        return;
      }

      page.name = trimmed;
      renderPagesList();
    });
  }

  // --- Save Page ---
  if (savePageButton) {
    savePageButton.addEventListener("click", () => {
      saveCurrentPageContent();
      const tpl = getActiveTemplate();
      if (!tpl) return;
      const page = tpl.pages[activePageIndex];
      if (page) {
        alert(`Page "${page.name}" saved.`);
      }
    });
  }

  // --- Delete Page ---
  if (deletePageButton) {
    deletePageButton.addEventListener("click", () => {
      const tpl = getActiveTemplate();
      if (!tpl) return;

      const page = tpl.pages[activePageIndex];
      if (!page) {
        alert("No active page to delete.");
        return;
      }

      if (tpl.pages.length === 1) {
        alert("You must have at least one page in a template.");
        return;
      }

      const confirmed = confirm(
        `Are you sure you want to delete page "${page.name}"?`
      );
      if (!confirmed) return;

      // Remove page
      tpl.pages.splice(activePageIndex, 1);

      // Clamp active index
      if (activePageIndex >= tpl.pages.length) {
        activePageIndex = tpl.pages.length - 1;
      }
      if (activePageIndex < 0) activePageIndex = 0;

      renderPagesList();
      loadActivePageIntoCanvas();
    });
  }

  // --- Click page item ---
  pagesList.addEventListener("click", (e) => {
    const item = e.target.closest(".page-item");
    if (!item) return;

    const index = parseInt(item.dataset.index, 10);
    if (Number.isNaN(index)) return;
    if (index === activePageIndex) return;

    saveCurrentPageContent();
    activePageIndex = index;
    renderPagesList();
    loadActivePageIntoCanvas();
  });

  // --- Respond to template changes from templates.js ---
  document.addEventListener("beforeTemplateChange", () => {
    // Save the current page of the old template before switching
    saveCurrentPageContent();
  });

  document.addEventListener("templateChanged", () => {
    // When template changes: reset to first page and reload
    activePageIndex = 0;
    renderPagesList();
    loadActivePageIntoCanvas();
  });
}

// ---------- Page rendering & state ----------

function renderPagesList() {
  const pagesList = document.getElementById("pagesList");
  const addPageButton = document.getElementById("addPageButton");
  const tpl = getActiveTemplate();
  if (!pagesList || !tpl) return;

  pagesList.innerHTML = tpl.pages
    .map(
      (p, index) => `
      <div
        class="page-item ${index === activePageIndex ? "active" : ""}"
        data-index="${index}"
      >
        ${p.name}
      </div>
    `
    )
    .join("");

  if (addPageButton) {
    addPageButton.disabled = tpl.pages.length >= MAX_PAGES;
  }
}

function addPageToActiveTemplate() {
  const tpl = getActiveTemplate();
  if (!tpl) return;

  const pageNumber = tpl.pages.length + 1;
  const pageName = pageNumber === 1 ? "Home" : `Page ${pageNumber}`;

  tpl.pages.push({
    name: pageName,
    content: "",
    style: {
      backgroundColor: "#ffffff",
      height: "700px",
      gridEnabled: true,
    },
  });

  activePageIndex = tpl.pages.length - 1;
}

// Save current builder canvas into active page
function saveCurrentPageContent() {
  const tpl = getActiveTemplate();
  const canvas = document.getElementById("builderCanvas");
  if (!tpl || !canvas) return;

  const page = tpl.pages[activePageIndex];
  if (!page) return;

  const prevStyle = page.style || {};

  page.content = canvas.innerHTML;
  page.style = {
    ...prevStyle,
    backgroundColor: canvas.style.backgroundColor || "#ffffff",
    height: canvas.style.height || "700px",
    gridEnabled: canvas.classList.contains("grid-on"),
    width: canvas.style.width || prevStyle.width || "800px",
  };
}

// Load active page into builder canvas
function loadActivePageIntoCanvas() {
  const tpl = getActiveTemplate();
  const canvas = document.getElementById("builderCanvas");
  if (!tpl || !canvas) return;

  const page = tpl.pages[activePageIndex];
  if (!page) return;

  if (page.content && page.content.trim() !== "") {
    canvas.innerHTML = page.content;
  } else {
    canvas.innerHTML = `
      <p class="builder-placeholder">
        Drag functions from the left and drop them here.
      </p>
    `;
  }

  // Apply style
  const style = page.style || {};
  canvas.style.backgroundColor = style.backgroundColor || "#ffffff";
  canvas.style.height = style.height || "700px";
  canvas.style.width = style.width || "800px";

  if (style.gridEnabled === false) {
    canvas.classList.remove("grid-on");
  } else {
    canvas.classList.add("grid-on");
  }

  // Re-wire widgets
  rehydrateBuilderWidgets();

  // Tell styles panel & others that the page changed
  document.dispatchEvent(
    new CustomEvent("pageChanged", {
      detail: {
        pageIndex: activePageIndex,
      },
    })
  );
}

// ---------- Style helpers for styles.js ----------

export function getCurrentPageStyle() {
  const tpl = getActiveTemplate();
  if (!tpl) return null;
  const page = tpl.pages[activePageIndex];
  if (!page) return null;
  return (
    page.style || {
      backgroundColor: "#ffffff",
      height: "700px",
      gridEnabled: true,
    }
  );
}

export function setCurrentPageStyle(partial) {
  const tpl = getActiveTemplate();
  const canvas = document.getElementById("builderCanvas");
  if (!tpl || !canvas) return;

  const page = tpl.pages[activePageIndex];
  if (!page) return;

  const current =
    page.style || {
      backgroundColor: "#ffffff",
      height: "700px",
      gridEnabled: true,
    };

  const next = { ...current, ...partial };
  page.style = next;

  if (partial.backgroundColor !== undefined) {
    canvas.style.backgroundColor = next.backgroundColor;
  }
  if (partial.height !== undefined) {
    canvas.style.height = next.height;
  }
  if (partial.gridEnabled !== undefined) {
    if (next.gridEnabled) {
      canvas.classList.add("grid-on");
    } else {
      canvas.classList.remove("grid-on");
    }
  }
}

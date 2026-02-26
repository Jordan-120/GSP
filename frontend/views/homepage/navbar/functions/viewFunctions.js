// homepage/navbar/functions/viewFunctions.js
// Shared builder behavior + wiring for all function widgets

import { createAccordionWidget, rehydrateAccordionWidget } from "./accordion.js";
import { createTabsWidget, rehydrateTabsWidget } from "./multi-tabs.js";
import { createDropdownWidget, rehydrateDropdownWidget } from "./dropdown.js";
import { createTextboxWidget, rehydrateTextboxWidget } from "./textbox.js";
import { createCheckboxWidget, rehydrateCheckboxWidget } from "./checkbox.js";
import {
  createProgressBarWidget,
  rehydrateProgressBarWidget,
} from "./progressBar.js";
import {
  createSearchBubbleWidget,
  rehydrateSearchBubbleWidget,
} from "./searchBubble.js";

// ---------- Function palette ----------

export function setupFunctionPalette() {
  const items = document.querySelectorAll(".function-item");

  items.forEach((item) => {
    item.addEventListener("dragstart", (e) => {
      item.classList.add("dragging");
      e.dataTransfer.effectAllowed = "copy";
      e.dataTransfer.setData("text/plain", item.dataset.type || "");
    });

    item.addEventListener("dragend", () => {
      item.classList.remove("dragging");
    });
  });
}

// ---------- Canvas behavior ----------

export function setupBuilderCanvas() {
  const canvas = document.getElementById("builderCanvas");
  if (!canvas) return;

  // Clicking the empty canvas should clear any selected widget
  canvas.addEventListener("mousedown", (e) => {
    const isCanvasClick =
      e.target === canvas || e.target.classList.contains("builder-placeholder");
    if (isCanvasClick) {
      clearWidgetSelection();
    }
  });

  canvas.addEventListener("dragover", (e) => {
    e.preventDefault(); // allow drop
    canvas.classList.add("drag-over");
  });

  canvas.addEventListener("dragleave", (e) => {
    if (!canvas.contains(e.relatedTarget)) {
      canvas.classList.remove("drag-over");
    }
  });

  canvas.addEventListener("drop", (e) => {
    e.preventDefault();
    canvas.classList.remove("drag-over");

    const type = e.dataTransfer.getData("text/plain");
    if (!type) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    addFunctionToCanvas(type, x, y);
  });
}

// --- Add widgets at a specific position (with boundaries) ---
export function addFunctionToCanvas(type, x, y) {
  const canvas = document.getElementById("builderCanvas");
  if (!canvas) return;

  const placeholder = canvas.querySelector(".builder-placeholder");
  if (placeholder) placeholder.remove();

  let widget;

  switch (type) {
    case "accordion":
      widget = createAccordionWidget();
      break;
    case "tabs":
      widget = createTabsWidget();
      break;
    case "dropdown":
      widget = createDropdownWidget();
      break;
    case "textbox":
      widget = createTextboxWidget();
      break;
    case "checkbox":
      widget = createCheckboxWidget();
      break;
    case "progressBar":
      widget = createProgressBarWidget();
      break;
    case "searchBubble":
      widget = createSearchBubbleWidget();
      break;
    default: {
      widget = document.createElement("div");
      widget.className = "builder-widget";
      widget.textContent = `Unknown function type: ${type}`;
    }
  }

  // Add to DOM so we can measure it
  canvas.appendChild(widget);

  // Explicit width/height for smooth resize
  widget.style.width = `${widget.offsetWidth}px`;
  widget.style.height = `${widget.offsetHeight}px`;

  // --- Initial position with locked borders ---
  const canvasWidth = canvas.clientWidth;
  const canvasHeight = canvas.clientHeight;
  const widgetWidth = widget.offsetWidth || 150;
  const widgetHeight = widget.offsetHeight || 50;

  let left = x - widgetWidth / 2;
  let top = y - widgetHeight / 2;

  left = Math.max(0, Math.min(canvasWidth - widgetWidth, left));
  top = Math.max(0, Math.min(canvasHeight - widgetHeight, top));

  widget.style.left = `${left}px`;
  widget.style.top = `${top}px`;

  // Ensure resize handle
  let resizeHandle = widget.querySelector(".resize-handle");
  if (!resizeHandle) {
    resizeHandle = document.createElement("div");
    resizeHandle.className = "resize-handle";
    widget.appendChild(resizeHandle);
  }

  makeWidgetDraggable(widget);
  makeWidgetResizable(widget, resizeHandle);
  enableInlineEditing(widget);
}

// ---------- Dragging ----------

function makeWidgetDraggable(widget) {
  let startX = 0;
  let startY = 0;
  let origLeft = 0;
  let origTop = 0;
  let dragging = false;

  const canvas = document.getElementById("builderCanvas");
  if (!canvas) return;

  widget.addEventListener("mousedown", (e) => {
    if (
      e.target.tagName === "INPUT" ||
      e.target.tagName === "SELECT" ||
      e.target.tagName === "TEXTAREA" ||
      e.target.isContentEditable
    ) {
      return;
    }
    if (e.target.classList.contains("resize-handle")) return;

    selectWidget(widget);

    dragging = true;
    startX = e.clientX;
    startY = e.clientY;

    const rect = widget.getBoundingClientRect();
    const canvasRect = canvas.getBoundingClientRect();

    origLeft = rect.left - canvasRect.left;
    origTop = rect.top - canvasRect.top;

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);

    e.preventDefault();
  });

  function onMouseMove(e) {
    if (!dragging) return;

    const dx = e.clientX - startX;
    const dy = e.clientY - startY;

    let newLeft = origLeft + dx;
    let newTop = origTop + dy;

    const canvasWidth = canvas.clientWidth;
    const canvasHeight = canvas.clientHeight;
    const widgetWidth = widget.offsetWidth;
    const widgetHeight = widget.offsetHeight;

    newLeft = Math.max(0, Math.min(canvasWidth - widgetWidth, newLeft));
    newTop = Math.max(0, Math.min(canvasHeight - widgetHeight, newTop));

    widget.style.left = `${newLeft}px`;
    widget.style.top = `${newTop}px`;
  }

  function onMouseUp() {
    dragging = false;
    document.removeEventListener("mousemove", onMouseMove);
    document.removeEventListener("mouseup", onMouseUp);
  }
}

// ---------- Resizing ----------

function makeWidgetResizable(widget, handle) {
  const canvas = document.getElementById("builderCanvas");
  if (!canvas || !handle) return;

  const cs = window.getComputedStyle(widget);
  const cssMinW = parseInt(cs.minWidth, 10);
  const cssMinH = parseInt(cs.minHeight, 10);
  const minWidth = Number.isNaN(cssMinW) ? 100 : cssMinW;
  const minHeight = Number.isNaN(cssMinH) ? 40 : cssMinH;

  let startX = 0;
  let startY = 0;
  let startWidth = 0;
  let startHeight = 0;
  let resizing = false;

  handle.addEventListener("mousedown", (e) => {
    e.stopPropagation();
    e.preventDefault();

    resizing = true;
    startX = e.clientX;
    startY = e.clientY;
    startWidth = widget.offsetWidth;
    startHeight = widget.offsetHeight;

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  });

  function onMouseMove(e) {
    if (!resizing) return;

    const dx = e.clientX - startX;
    const dy = e.clientY - startY;

    let newWidth = startWidth + dx;
    let newHeight = startHeight + dy;

    const canvasRect = canvas.getBoundingClientRect();
    const widgetRect = widget.getBoundingClientRect();
    const left = widgetRect.left - canvasRect.left;
    const top = widgetRect.top - canvasRect.top;

    const maxWidth = canvas.clientWidth - left;
    const maxHeight = canvas.clientHeight - top;

    newWidth = Math.max(minWidth, Math.min(maxWidth, newWidth));
    newHeight = Math.max(minHeight, Math.min(maxHeight, newHeight));

    widget.style.width = `${newWidth}px`;
    widget.style.height = `${newHeight}px`;
  }

  function onMouseUp() {
    resizing = false;
    document.removeEventListener("mousemove", onMouseMove);
    document.removeEventListener("mouseup", onMouseUp);
  }
}

// ---------- Selection + delete ----------

let selectedWidget = null;

function clearWidgetSelection() {
  if (!selectedWidget) return;

  selectedWidget.classList.remove("selected-widget");
  selectedWidget = null;

  document.dispatchEvent(
    new CustomEvent("widgetSelected", {
      detail: { widget: null },
    })
  );
}

function selectWidget(widget) {
  if (selectedWidget && selectedWidget !== widget) {
    selectedWidget.classList.remove("selected-widget");
  }

  selectedWidget = widget;
  widget.classList.add("selected-widget");

  document.dispatchEvent(
    new CustomEvent("widgetSelected", {
      detail: { widget },
    })
  );
}

document.addEventListener("keydown", (e) => {
  if (!selectedWidget) return;

  const isEditing =
    e.target.isContentEditable ||
    e.target.tagName === "INPUT" ||
    e.target.tagName === "TEXTAREA" ||
    e.target.tagName === "SELECT";

  if (isEditing) return;

  if (e.key === "Backspace" || e.key === "Delete") {
    e.preventDefault();
    selectedWidget.remove();
    selectedWidget = null;

    document.dispatchEvent(
      new CustomEvent("widgetSelected", {
        detail: { widget: null },
      })
    );
  }
});

// ---------- Inline text editing ----------

function enableInlineEditing(widget) {
  widget.addEventListener("dblclick", (e) => {
    if (
      e.target.tagName === "INPUT" ||
      e.target.tagName === "SELECT" ||
      e.target.tagName === "TEXTAREA"
    ) {
      return;
    }
    if (e.target.classList.contains("resize-handle")) return;

    const el = e.target;

    const editableTags = [
      "H1",
      "H2",
      "H3",
      "H4",
      "H5",
      "H6",
      "P",
      "SPAN",
      "LABEL",
      "DIV",
      "BUTTON",
      "SUMMARY",
    ];
    if (!editableTags.includes(el.tagName)) return;

    el.contentEditable = "true";
    el.focus();

    const range = document.createRange();
    range.selectNodeContents(el);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);

    const finish = () => {
      el.contentEditable = "false";
      el.removeEventListener("blur", finish);
      el.removeEventListener("keydown", onKeyDown);
    };

    const onKeyDown = (evt) => {
      if (evt.key === "Enter") {
        evt.preventDefault();
        finish();
      }
    };

    el.addEventListener("blur", finish);
    el.addEventListener("keydown", onKeyDown);
  });
}

// ---------- Rehydrate widgets already in the canvas ----------

export function rehydrateBuilderWidgets() {
  const canvas = document.getElementById("builderCanvas");
  if (!canvas) return;

  const widgets = canvas.querySelectorAll(".builder-widget");
  widgets.forEach((widget) => {
    // Ensure resize handle
    let handle = widget.querySelector(".resize-handle");
    if (!handle) {
      handle = document.createElement("div");
      handle.className = "resize-handle";
      widget.appendChild(handle);
    }

    makeWidgetDraggable(widget);
    makeWidgetResizable(widget, handle);
    enableInlineEditing(widget);

    // Widget-specific rehydration
    if (widget.querySelector(".tab-btn")) {
      rehydrateTabsWidget(widget);
    }
    if (widget.querySelector(".dropdown-select")) {
      rehydrateDropdownWidget(widget);
    }
    if (widget.querySelector("details")) {
      rehydrateAccordionWidget(widget);
    }
    if (widget.querySelector("input[type='checkbox']")) {
      rehydrateCheckboxWidget(widget);
    }
    if (widget.querySelector(".progress-bar-container")) {
      rehydrateProgressBarWidget(widget);
    }
    if (widget.querySelector(".search-bubble-input")) {
      rehydrateSearchBubbleWidget(widget);
    }

    // textbox currently needs no special rehydrate, but keep call in case
    rehydrateTextboxWidget(widget);
  });
}

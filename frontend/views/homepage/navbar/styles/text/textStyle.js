// homepage/navbar/styles/text/textStyle.js

import {
  getCurrentPageStyle,
  setCurrentPageStyle,
} from "../../pages/viewPages.js";

const TEXT_DEFAULTS = {
  fontFamily: "Arial",
  fontSize: 14,
  bold: false,
  italic: false,
  underline: false,
};

let canvasRef = null;
let controls = {
  fontFamilySelect: null,
  fontSizeInput: null,
  boldToggle: null,
  italicToggle: null,
  underlineToggle: null,
};

let lastCanvasRange = null;

// ---------- helpers ----------

function fontKeyToCssFamily(key) {
  switch (key) {
    case "Arial":
      return "Arial, sans-serif";
    case "Verdana":
      return "Verdana, sans-serif";
    case "Tahoma":
      return "Tahoma, sans-serif";
    case "Georgia":
      return "Georgia, serif";
    case "Times New Roman":
      return '"Times New Roman", serif';
    case "Courier New":
      return '"Courier New", monospace';
    default:
      return key || "Arial, sans-serif";
  }
}

function normalizeStoredFontFamily(value) {
  if (!value) return TEXT_DEFAULTS.fontFamily;
  const lower = value.toLowerCase();

  if (lower.startsWith("arial")) return "Arial";
  if (lower.startsWith("verdana")) return "Verdana";
  if (lower.startsWith("tahoma")) return "Tahoma";
  if (lower.startsWith("georgia")) return "Georgia";
  if (lower.includes("times new roman")) return "Times New Roman";
  if (lower.includes("courier new")) return "Courier New";

  return value;
}

function isNodeInCanvas(node) {
  if (!canvasRef || !node) return false;
  const el =
    node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement;
  return !!el && canvasRef.contains(el);
}

function syncToggle(btn, active) {
  if (!btn) return;
  if (active) {
    btn.classList.add("toggle-active");
  } else {
    btn.classList.remove("toggle-active");
  }
}

function getCurrentTextStyle() {
  const s = getCurrentPageStyle() || {};
  return {
    fontFamily: s.fontFamily || TEXT_DEFAULTS.fontFamily,
    fontSize: s.fontSize || TEXT_DEFAULTS.fontSize,
    bold: !!s.bold,
    italic: !!s.italic,
    underline: !!s.underline,
  };
}

function saveRangeFromSelection() {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return;

  const range = sel.getRangeAt(0);
  if (!isNodeInCanvas(range.commonAncestorContainer)) return;

  lastCanvasRange = range.cloneRange();
  updateToolbarFromCaret(range.commonAncestorContainer);
}

function clearLastCanvasRange() {
  lastCanvasRange = null;
}

function getOrRestoreCanvasRange() {
  const sel = window.getSelection();
  if (sel && sel.rangeCount > 0) {
    const live = sel.getRangeAt(0);
    if (isNodeInCanvas(live.commonAncestorContainer)) {
      return live;
    }
  }

  if (!lastCanvasRange) return null;

  const sel2 = window.getSelection();
  sel2.removeAllRanges();
  sel2.addRange(lastCanvasRange.cloneRange());
  return sel2.getRangeAt(0);
}

function updateToolbarFromCaret(node) {
  if (!controls.fontFamilySelect || !controls.fontSizeInput) return;
  if (!isNodeInCanvas(node)) return;

  const el =
    node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement;
  if (!el) return;

  const computed = window.getComputedStyle(el);

  const familyKey = normalizeStoredFontFamily(computed.fontFamily);
  let size = parseInt(computed.fontSize, 10);
  if (Number.isNaN(size)) size = TEXT_DEFAULTS.fontSize;
  if (size < 8) size = 8;
  if (size > 72) size = 72;

  const weightStr = computed.fontWeight;
  const weightNum = parseInt(weightStr, 10);
  const isBold =
    computed.fontWeight === "bold" ||
    (!Number.isNaN(weightNum) && weightNum >= 600);

  const isItalic = computed.fontStyle === "italic";

  const decoLine = computed.textDecorationLine || computed.textDecoration;
  const isUnderline = !!decoLine && decoLine.includes("underline");

  controls.fontFamilySelect.value = familyKey;
  controls.fontSizeInput.value = size;
  syncToggle(controls.boldToggle, isBold);
  syncToggle(controls.italicToggle, isItalic);
  syncToggle(controls.underlineToggle, isUnderline);

  const current = getCurrentPageStyle() || {};
  setCurrentPageStyle({
    ...current,
    fontFamily: familyKey,
    fontSize: size,
    bold: isBold,
    italic: isItalic,
    underline: isUnderline,
  });
}

// ---------- public: init system ----------

export function initTextStyleSystem({
  canvas,
  fontFamilySelect,
  fontSizeInput,
  boldToggle,
  italicToggle,
  underlineToggle,
}) {
  canvasRef = canvas;
  controls = {
    fontFamilySelect,
    fontSizeInput,
    boldToggle,
    italicToggle,
    underlineToggle,
  };

  // Track selection inside canvas
  document.addEventListener("selectionchange", () => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);
    if (!isNodeInCanvas(range.commonAncestorContainer)) return;
    lastCanvasRange = range.cloneRange();
    updateToolbarFromCaret(range.commonAncestorContainer);
  });

  // Clear remembered range when clicking blank canvas
  canvas.addEventListener("mousedown", (e) => {
    const isBlankClick =
      e.target === canvas ||
      e.target.classList.contains("builder-placeholder");
    if (isBlankClick) {
      clearLastCanvasRange();
    }
  });

  // B / I / U with execCommand

  function setupToggleButton(button, command) {
    if (!button) return;

    button.addEventListener("mousedown", (e) => {
      e.preventDefault();
    });

    button.addEventListener("click", () => {
      const range = getOrRestoreCanvasRange();
      if (!range) return;

      document.execCommand(command, false);
      saveRangeFromSelection();
    });
  }

  setupToggleButton(boldToggle, "bold");
  setupToggleButton(italicToggle, "italic");
  setupToggleButton(underlineToggle, "underline");

  // Initial toolbar state from stored style
  syncTextToolbarFromStyle();
}

// ---------- public: called from font & size modules ----------

export function applyFontFamily(familyKey) {
  const base = getCurrentTextStyle();
  const style = {
    ...base,
    fontFamily: familyKey,
  };

  applyTextStyle(style);
}

export function applyFontSize(size) {
  const base = getCurrentTextStyle();
  const style = {
    ...base,
    fontSize: size,
  };

  applyTextStyle(style);
}

// Core text-style application (used by font family & size)
function applyTextStyle(style) {
  const familyKey = normalizeStoredFontFamily(style.fontFamily);
  const cssFamily = fontKeyToCssFamily(familyKey);
  const size = style.fontSize || TEXT_DEFAULTS.fontSize;

  let range = getOrRestoreCanvasRange();
  if (!range) return;

  const sel = window.getSelection();

  if (!range.collapsed) {
    const span = document.createElement("span");
    span.style.fontFamily = cssFamily;
    span.style.fontSize = `${size}px`;

    if (style.bold) span.style.fontWeight = "bold";
    if (style.italic) span.style.fontStyle = "italic";
    span.style.textDecoration = style.underline ? "underline" : "none";

    try {
      range.surroundContents(span);
    } catch (err) {
      console.warn('surroundContents failed, falling back to manual wrap', err);
      const contents = range.extractContents();
      span.appendChild(contents);
      range.insertNode(span);
    }


    const newRange = document.createRange();
    newRange.selectNodeContents(span);
    newRange.collapse(false);
    sel.removeAllRanges();
    sel.addRange(newRange);
    lastCanvasRange = newRange.cloneRange();
    updateToolbarFromCaret(span);
  } else {
    let node = range.commonAncestorContainer;
    let el =
      node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement;
    if (!el || !canvasRef.contains(el)) return;

    const styleObj = el.style || {};
    styleObj.fontFamily = cssFamily;
    styleObj.fontSize = `${size}px`;
    styleObj.fontWeight = style.bold ? "bold" : "normal";
    styleObj.fontStyle = style.italic ? "italic" : "normal";
    styleObj.textDecoration = style.underline ? "underline" : "none";
    el.style = styleObj;

    const caretRange = document.createRange();
    caretRange.setStart(range.startContainer, range.startOffset);
    caretRange.collapse(true);
    sel.removeAllRanges();
    sel.addRange(caretRange);
    lastCanvasRange = caretRange.cloneRange();
    updateToolbarFromCaret(el);
  }

  const current = getCurrentPageStyle() || {};
  setCurrentPageStyle({
    ...current,
    fontFamily: familyKey,
    fontSize: size,
    bold: style.bold,
    italic: style.italic,
    underline: style.underline,
  });
}

// ---------- public: sync toolbar from stored style ----------

export function syncTextToolbarFromStyle() {
  if (!controls.fontFamilySelect || !controls.fontSizeInput) return;

  const s = getCurrentTextStyle();
  const familyKey = normalizeStoredFontFamily(s.fontFamily);
  const size = s.fontSize || TEXT_DEFAULTS.fontSize;

  controls.fontFamilySelect.value = familyKey;
  controls.fontSizeInput.value = size;

  syncToggle(controls.boldToggle, !!s.bold);
  syncToggle(controls.italicToggle, !!s.italic);
  syncToggle(controls.underlineToggle, !!s.underline);
}

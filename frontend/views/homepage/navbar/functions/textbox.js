// navbar/functions/textbox.js
// Creates the simple Text widget (no input, just editable text)

export function createTextboxWidget() {
  const widget = document.createElement("div");
  widget.className = "builder-widget";

  widget.innerHTML = `<p>Double-click to edit text</p>`;

  return widget;
}

export function rehydrateTextboxWidget(_widgetRoot) {
  // no special behavior beyond generic inline editing
}

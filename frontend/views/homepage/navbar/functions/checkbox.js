// navbar/functions/checkbox.js
// Creates the 4-option checkbox widget

export function createCheckboxWidget() {
  const widget = document.createElement("div");
  widget.className = "builder-widget";

  widget.innerHTML = `
    <h3>Checkboxes</h3>
    <label><input type="checkbox" /> Option A</label><br/>
    <label><input type="checkbox" /> Option B</label><br/>
    <label><input type="checkbox" /> Option C</label><br/>
    <label><input type="checkbox" /> Option D</label>
  `;

  return widget;
}

export function rehydrateCheckboxWidget(_widgetRoot) {
  // no special behavior beyond generic inline editing
}

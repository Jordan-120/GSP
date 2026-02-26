// navbar/functions/accordion.js
// Creates the Accordion widget DOM element

export function createAccordionWidget() {
  const widget = document.createElement("div");
  widget.className = "builder-widget";

  widget.innerHTML = `
    <h3>Accordion</h3>
    <details open>
      <summary>Section 1</summary>
      <p>Double-click to edit this text…</p>
    </details>
    <details>
      <summary>Section 2</summary>
      <p>More text…</p>
    </details>
    <details>
      <summary>Section 3</summary>
      <p>More text…</p>
    </details>
    <details>
      <summary>Section 4</summary>
      <p>More text…</p>
    </details>
  `;

  return widget;
}

// For rehydration, nothing special is needed right now,
// but we export a stub in case you add custom behavior later.
export function rehydrateAccordionWidget(_widget) {
  // no-op for now
}

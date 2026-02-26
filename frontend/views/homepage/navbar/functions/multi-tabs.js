// navbar/functions/multi-tabs.js
// Creates the Multi-tabs widget and wires up tab behavior

export function createTabsWidget() {
  const widget = document.createElement("div");
  widget.className = "builder-widget";

  widget.innerHTML = `
    <h3>Multi-tabs</h3>
    <div class="tabs-header">
      <button type="button" class="tab-btn" data-tab="1">Tab 1</button>
      <button type="button" class="tab-btn" data-tab="2">Tab 2</button>
      <button type="button" class="tab-btn" data-tab="3">Tab 3</button>
      <button type="button" class="tab-btn" data-tab="4">Tab 4</button>
    </div>
    <div class="tab-content" data-tab="1">Content for tab 1 (double-click to edit)</div>
    <div class="tab-content" data-tab="2" style="display:none;">Content for tab 2 (double-click to edit)</div>
    <div class="tab-content" data-tab="3" style="display:none;">Content for tab 3 (double-click to edit)</div>
    <div class="tab-content" data-tab="4" style="display:none;">Content for tab 4 (double-click to edit)</div>
  `;

  setupTabs(widget);
  return widget;
}

function setupTabs(widgetRoot) {
  const buttons = widgetRoot.querySelectorAll(".tab-btn");
  const contents = widgetRoot.querySelectorAll(".tab-content");

  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const tabId = btn.dataset.tab;

      buttons.forEach((b) => (b.disabled = false));
      btn.disabled = true;

      contents.forEach((c) => {
        c.style.display = c.dataset.tab === tabId ? "block" : "none";
      });
    });
  });

  const firstBtn = buttons[0];
  if (firstBtn) firstBtn.click();
}

// Called from viewFunctions.rehydrateBuilderWidgets
export function rehydrateTabsWidget(widgetRoot) {
  if (widgetRoot.querySelector(".tab-btn")) {
    setupTabs(widgetRoot);
  }
}

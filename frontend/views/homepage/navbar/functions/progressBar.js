// homepage/navbar/functions/progressBar.js
// Creates a progress bar widget that advances by 25% up to 100%

export function createProgressBarWidget() {
  const widget = document.createElement("div");
  widget.className = "builder-widget progress-bar-widget";
  widget.dataset.percent = "0";

  widget.innerHTML = `
    <h3>Progress</h3>
    <div class="progress-bar-container">
      <div class="progress-bar-fill"></div>
      <span class="progress-bar-label">0%</span>
    </div>
    <button type="button" class="progress-bar-button">+25%</button>
  `;

  wireProgressBar(widget);
  return widget;
}

function wireProgressBar(widgetRoot) {
  const fill = widgetRoot.querySelector(".progress-bar-fill");
  const label = widgetRoot.querySelector(".progress-bar-label");
  const button = widgetRoot.querySelector(".progress-bar-button");

  if (!fill || !label || !button) return;

  function setPercent(pct) {
    const clamped = Math.max(0, Math.min(100, pct));
    widgetRoot.dataset.percent = String(clamped);
    fill.style.width = `${clamped}%`;
    label.textContent = `${clamped}%`;
  }

  // Sync from existing dataset (for rehydrate)
  const initial = parseInt(widgetRoot.dataset.percent || "0", 10);
  setPercent(initial);

  button.addEventListener("click", () => {
    const current = parseInt(widgetRoot.dataset.percent || "0", 10);
    const next = Math.min(100, current + 25);
    setPercent(next);
  });
}

export function rehydrateProgressBarWidget(widgetRoot) {
  wireProgressBar(widgetRoot);
}

// homepage/navbar/styles/page/pageFunctionColor.js
// Highlighted Function Color: controls background of selected widget

let activeWidget = null;

export function setupPageFunctionColorControls(widgetBgInput) {
  if (!widgetBgInput) return;

  function cssColorToHex(color) {
    if (!color) return "#ffffff";
    color = color.trim();

    if (color[0] === "#") {
      if (color.length === 4) {
        const r = color[1];
        const g = color[2];
        const b = color[3];
        return `#${r}${r}${g}${g}${b}${b}`;
      }
      return color;
    }

    const rgbMatch = color.match(
      /^rgba?\(\s*([0-9]+)\s*,\s*([0-9]+)\s*,\s*([0-9]+)/
    );
    if (rgbMatch) {
      const r = parseInt(rgbMatch[1], 10);
      const g = parseInt(rgbMatch[2], 10);
      const b = parseInt(rgbMatch[3], 10);
      const toHex = (v) => {
        const h = v.toString(16);
        return h.length === 1 ? "0" + h : h;
      };
      return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
    }

    return "#ffffff";
  }

  function syncWidgetColorUI() {
    if (activeWidget) {
      const inline = activeWidget.style.backgroundColor;
      widgetBgInput.value = cssColorToHex(inline || "#ffffff");
      widgetBgInput.disabled = false;
    } else {
      widgetBgInput.value = "#ffffff";
      widgetBgInput.disabled = true;
    }
  }

  widgetBgInput.addEventListener("input", () => {
    if (!activeWidget) return;
    const val = widgetBgInput.value || "#ffffff";
    activeWidget.style.backgroundColor = val;
  });

  document.addEventListener("widgetSelected", (e) => {
    activeWidget = e.detail?.widget || null;
    syncWidgetColorUI();
  });

  // Initial state
  syncWidgetColorUI();
}

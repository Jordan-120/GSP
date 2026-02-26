// homepage/navbar/styles/page/pageColor.js

import {
  getCurrentPageStyle,
  setCurrentPageStyle,
} from "../../pages/viewPages.js";

const DEFAULTS = {
  backgroundColor: "#ffffff",
};

export function setupPageColorControls(canvas) {
  const bgInput = document.getElementById("pageBgColor");
  if (!bgInput || !canvas) return;

  function syncFromStore() {
    const style = getCurrentPageStyle() || {};
    const bg = style.backgroundColor || DEFAULTS.backgroundColor;
    bgInput.value = bg;
    canvas.style.backgroundColor = bg;
  }

  bgInput.addEventListener("input", () => {
    const val = bgInput.value || DEFAULTS.backgroundColor;
    canvas.style.backgroundColor = val;

    const current = getCurrentPageStyle() || {};
    setCurrentPageStyle({
      ...current,
      backgroundColor: val,
    });
  });

  document.addEventListener("pageChanged", syncFromStore);
  document.addEventListener("templateChanged", syncFromStore);

  syncFromStore();
}

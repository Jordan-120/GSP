// navbar/functions/dropdown.js
// Creates the Dropdown widget and wires up per-option text fields

export function createDropdownWidget() {
  const widget = document.createElement("div");
  widget.className = "builder-widget";

  widget.innerHTML = `
    <h3>Dropdown</h3>
    <label>
      <span>Choose an option:</span>
      <select class="dropdown-select">
        <option value="1">Option 1</option>
        <option value="2">Option 2</option>
        <option value="3">Option 3</option>
        <option value="4">Option 4</option>
      </select>
    </label>
    <div class="dropdown-option-notes">
      <div class="dropdown-option-field" data-option="1">
        <label>
          Option 1 text:
          <input type="text" placeholder="Description for option 1" />
        </label>
      </div>
      <div class="dropdown-option-field" data-option="2">
        <label>
          Option 2 text:
          <input type="text" placeholder="Description for option 2" />
        </label>
      </div>
      <div class="dropdown-option-field" data-option="3">
        <label>
          Option 3 text:
          <input type="text" placeholder="Description for option 3" />
        </label>
      </div>
      <div class="dropdown-option-field" data-option="4">
        <label>
          Option 4 text:
          <input type="text" placeholder="Description for option 4" />
        </label>
      </div>
    </div>
  `;

  setupDropdown(widget);
  return widget;
}

function setupDropdown(widgetRoot) {
  const select = widgetRoot.querySelector(".dropdown-select");
  const fields = widgetRoot.querySelectorAll(".dropdown-option-field");
  if (!select || !fields.length) return;

  function syncFields() {
    const value = select.value;
    fields.forEach((field) => {
      field.style.display =
        field.dataset.option === value ? "block" : "none";
    });
  }

  select.addEventListener("change", syncFields);
  syncFields(); // initial
}

// Called from viewFunctions.rehydrateBuilderWidgets
export function rehydrateDropdownWidget(widgetRoot) {
  if (widgetRoot.querySelector(".dropdown-select")) {
    setupDropdown(widgetRoot);
  }
}

const dropdownBtn = document.getElementById("dropdownBtn");
const dropdownMenu = document.getElementById("dropdownMenu");
const searchInput = document.getElementById("searchInput");

const sheetBody = document.getElementById("sheetBody");
const tabs = document.getElementById("tabs");
const pageFrame = document.getElementById("pageFrame");
const emptyViewer = document.getElementById("emptyViewer");

const viewBtn = document.getElementById("viewBtn");
const approveBtn = document.getElementById("approveBtn");
const rejectBtn = document.getElementById("rejectBtn");

const logoutBtn = document.getElementById("logoutBtn");

// Reject modal elements
const rejectModal = document.getElementById("rejectModal");
const rejectCloseBtn = document.getElementById("rejectCloseBtn");
const rejectCancelBtn = document.getElementById("rejectCancelBtn");
const rejectConfirmBtn = document.getElementById("rejectConfirmBtn");
const rejectReasonSelect = document.getElementById("rejectReasonSelect");

let currentFilter = "all_users";
let rows = [];
let selectedRow = null;
let loadedPages = [];
let activePageIndex = 0;

let denialReasons = []; // [{code,text}]

function getToken() {
  return localStorage.getItem("authToken");
}

function authHeaders() {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function apiGet(url) {
  const res = await fetch(url, { headers: authHeaders() });
  if (!res.ok) {
    const msg = await res.text();
    throw new Error(msg || `Request failed: ${res.status}`);
  }
  return res.json();
}

async function apiPatch(url, bodyObj = {}) {
  const res = await fetch(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(bodyObj),
  });

  let data = null;
  try {
    data = await res.json();
  } catch (e) {
    // ignore
  }

  if (!res.ok) {
    const msg = data?.message || `Request failed: ${res.status}`;
    throw new Error(msg);
  }

  return data;
}

/* Logout */
if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("authToken");
    window.location.href = "/";
  });
}

/* Dropdown */
dropdownBtn.addEventListener("click", () => {
  dropdownMenu.style.display =
    dropdownMenu.style.display === "block" ? "none" : "block";
});

document.addEventListener("click", (e) => {
  if (!dropdownMenu.contains(e.target) && !dropdownBtn.contains(e.target)) {
    dropdownMenu.style.display = "none";
  }
});

dropdownMenu.querySelectorAll("div").forEach((item) => {
  item.addEventListener("click", async () => {
    dropdownMenu.querySelectorAll("div").forEach((d) =>
      d.classList.remove("active")
    );
    item.classList.add("active");

    currentFilter = item.dataset.filter;
    dropdownMenu.style.display = "none";

    selectedRow = null;
    loadedPages = [];
    setViewerEmpty();

    await loadLeftTable();
  });
});

/* Search */
searchInput.addEventListener("input", () => renderLeftTable());

/* Left Table */
async function loadLeftTable() {
  rows = await apiGet(
    `/api/admin/queue?filter=${encodeURIComponent(currentFilter)}`
  );
  renderLeftTable();
}

function renderLeftTable() {
  sheetBody.innerHTML = "";

  const q = searchInput.value.trim().toLowerCase();

  const filtered = rows.filter((r) => {
    if (!q) return true;
    const name = (r.name || "").toLowerCase();
    const tmpl = (r.template_name || "").toLowerCase();
    const status = (r.status || "").toLowerCase();
    return (
      name.includes(q) ||
      tmpl.includes(q) ||
      status.includes(q) ||
      String(r.id).includes(q)
    );
  });

  const MIN_ROWS = 14;
  const totalRows = Math.max(MIN_ROWS, filtered.length);

  for (let i = 0; i < totalRows; i++) {
    const r = filtered[i];
    const tr = document.createElement("tr");

    if (
      r &&
      selectedRow &&
      r.template_mongo_id &&
      r.template_mongo_id === selectedRow.template_mongo_id
    ) {
      tr.classList.add("selected");
    }

    if (r) {
      tr.innerHTML = `
        <td>${r.id ?? ""}</td>
        <td>${r.name ?? ""}</td>
        <td>${r.template_name ?? ""}</td>
        <td>${r.status ?? ""}</td>
      `;

      tr.addEventListener("click", () => {
        selectedRow = r;
        renderLeftTable();
      });
    } else {
      tr.innerHTML = `<td></td><td></td><td></td><td></td>`;
    }

    sheetBody.appendChild(tr);
  }
}

/* Right Viewer */
function setViewerEmpty() {
  pageFrame.style.display = "none";
  emptyViewer.style.display = "flex";
  emptyViewer.innerHTML = `Select a row on the left and click <b>View</b>.`;
  renderTabs([]);
}

function renderTabs(pages) {
  tabs.innerHTML = "";

  const maxTabs = 10;
  const pageCount = pages.length;

  for (let i = 0; i < maxTabs; i++) {
    const hasPage = i < pageCount;
    const btn = document.createElement("button");
    btn.className = "tab" + (hasPage ? "" : " disabled");
    btn.textContent = hasPage ? `${i + 1}` : "N/A";

    if (hasPage && i === activePageIndex) btn.classList.add("active");

    btn.addEventListener("click", () => {
      if (!hasPage) return;
      activePageIndex = i;
      renderTabs(loadedPages);
      showPage(i);
    });

    tabs.appendChild(btn);
  }
}

function showPage(index) {
  const p = loadedPages[index];
  if (!p) return;

  const html =
    p.html ||
    `<html><body><pre>No HTML found for page ${index + 1}</pre></body></html>`;

  emptyViewer.style.display = "none";
  pageFrame.style.display = "block";

  const doc = pageFrame.contentWindow.document;
  doc.open();
  doc.write(html);
  doc.close();
}

/* View button */
viewBtn.addEventListener("click", async () => {
  if (!selectedRow) return alert("Select a row on the left first.");
  if (!selectedRow.template_mongo_id)
    return alert("This row does not have a template to view.");

  try {
    activePageIndex = 0;
    const data = await apiGet(
      `/api/templates/${selectedRow.template_mongo_id}/pages`
    );
    loadedPages = Array.isArray(data.pages) ? data.pages : [];

    renderTabs(loadedPages);

    if (loadedPages.length === 0) {
      pageFrame.style.display = "none";
      emptyViewer.style.display = "flex";
      emptyViewer.textContent = "No pages found for this template.";
      return;
    }

    showPage(0);
  } catch (err) {
    console.error(err);
    alert("Could not load template pages.");
  }
});

/* ---------------- Approve / Reject ---------------- */

function selectedTemplateIdOrAlert() {
  if (!selectedRow) {
    alert("Select a template row first.");
    return null;
  }
  if (!selectedRow.template_mongo_id) {
    alert("Select a template row that has a template.");
    return null;
  }
  return selectedRow.template_mongo_id;
}

async function refreshAfterReview() {
  selectedRow = null;
  loadedPages = [];
  activePageIndex = 0;
  setViewerEmpty();
  await loadLeftTable();
}

approveBtn.addEventListener("click", async () => {
  const templateId = selectedTemplateIdOrAlert();
  if (!templateId) return;

  const ok = confirm("Approve this template and publish it for all users?");
  if (!ok) return;

  try {
    await apiPatch(`/api/admin/templates/${templateId}/approve`, {});
    alert("Template approved and published.");
    await refreshAfterReview();
  } catch (err) {
    console.error(err);
    alert(`Approve failed: ${err.message}`);
  }
});

function openRejectModal() {
  rejectModal.classList.add("show");
  rejectModal.setAttribute("aria-hidden", "false");
}

function closeRejectModal() {
  rejectModal.classList.remove("show");
  rejectModal.setAttribute("aria-hidden", "true");
}

function populateDenialReasons() {
  rejectReasonSelect.innerHTML = "";

  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = "Select a reason…";
  rejectReasonSelect.appendChild(placeholder);

  for (const r of denialReasons) {
    const opt = document.createElement("option");
    opt.value = r.code;
    opt.textContent = r.text;
    rejectReasonSelect.appendChild(opt);
  }
}

rejectBtn.addEventListener("click", async () => {
  const templateId = selectedTemplateIdOrAlert();
  if (!templateId) return;

  if (!denialReasons.length) {
    try {
      denialReasons = await apiGet("/api/admin/denial-reasons");
    } catch (e) {
      console.error(e);
      alert("Could not load denial reasons.");
      return;
    }
  }

  populateDenialReasons();
  openRejectModal();
});

rejectCloseBtn.addEventListener("click", closeRejectModal);
rejectCancelBtn.addEventListener("click", closeRejectModal);

// click outside modal closes it
rejectModal.addEventListener("click", (e) => {
  if (e.target === rejectModal) closeRejectModal();
});

rejectConfirmBtn.addEventListener("click", async () => {
  const templateId = selectedTemplateIdOrAlert();
  if (!templateId) return;

  const reason_code = rejectReasonSelect.value;
  if (!reason_code) {
    alert("Please select a reason.");
    return;
  }

  try {
    await apiPatch(`/api/admin/templates/${templateId}/reject`, { reason_code });
    closeRejectModal();
    alert("Template denied. The user will see the reason and can re-submit.");
    await refreshAfterReview();
  } catch (err) {
    console.error(err);
    alert(`Reject failed: ${err.message}`);
  }
});

/* ---------------- Init ---------------- */

(async function init() {
  setViewerEmpty();

  // preload denial reasons (non-fatal)
  try {
    denialReasons = await apiGet("/api/admin/denial-reasons");
  } catch (e) {
    // ignore
  }

  try {
    await loadLeftTable();
  } catch (err) {
    console.error(err);
    alert("Failed to load admin data.");
  }
})();
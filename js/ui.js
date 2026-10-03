// Shared UI utilities used across all pages.

export function toast(message, type = "info", title = "") {
  let container = document.getElementById("toast-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "toast-container";
    document.body.appendChild(container);
  }
  const el = document.createElement("div");
  el.className = `toast ${type}`;
  el.setAttribute("role", type === "error" ? "alert" : "status");
  el.innerHTML = `
    <div class="spinner" style="display:${type === "loading" ? "block" : "none"};border-top-color:var(--royal-600)"></div>
    <div style="flex:1">
      ${title ? `<strong>${escapeHtml(title)}</strong>` : ""}
      <p>${escapeHtml(message)}</p>
    </div>
  `;
  container.appendChild(el);
  if (type !== "loading") {
    setTimeout(() => el.remove(), 4200);
  }
  return () => el.remove();
}

export function openModal({ title, body, actions = [] }) {
  const backdrop = document.createElement("div");
  backdrop.className = "modal-backdrop open";
  backdrop.innerHTML = `
    <div class="modal" role="dialog" aria-modal="true" aria-label="${escapeHtml(title)}">
      <div class="modal-head">
        <h3 style="margin:0">${escapeHtml(title)}</h3>
        <button class="btn btn-ghost btn-sm" data-close aria-label="Close">✕</button>
      </div>
      <div class="modal-body"></div>
      <div class="modal-foot"></div>
    </div>`;
  const bodyEl = backdrop.querySelector(".modal-body");
  if (typeof body === "string") bodyEl.innerHTML = body; else bodyEl.appendChild(body);

  const footEl = backdrop.querySelector(".modal-foot");
  actions.forEach(a => {
    const b = document.createElement("button");
    b.className = `btn ${a.className || "btn-primary"}`;
    b.textContent = a.label;
    b.addEventListener("click", () => a.onClick?.(close));
    footEl.appendChild(b);
  });

  const close = () => backdrop.remove();
  backdrop.querySelector("[data-close]").addEventListener("click", close);
  backdrop.addEventListener("click", e => { if (e.target === backdrop) close(); });
  document.addEventListener("keydown", function esc(e) {
    if (e.key === "Escape") { close(); document.removeEventListener("keydown", esc); }
  });

  document.body.appendChild(backdrop);
  return { close, root: backdrop };
}

export function setLoading(el, on, text = "Loading…") {
  if (!el) return;
  if (on) {
    el.dataset._originalHTML = el.innerHTML;
    el.disabled = true;
    el.innerHTML = `<span class="spinner" style="border-top-color:currentColor"></span> ${escapeHtml(text)}`;
  } else {
    if (el.dataset._originalHTML != null) {
      el.innerHTML = el.dataset._originalHTML;
      delete el.dataset._originalHTML;
    }
    el.disabled = false;
  }
}

export function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, c => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[c]));
}

// --- Online/offline indicator ---------------------------------------------
export function initConnectionPill(mountSelector = "[data-conn-pill]") {
  const el = document.querySelector(mountSelector);
  if (!el) return;
  const render = () => {
    const online = navigator.onLine;
    el.className = `conn-pill ${online ? "online" : "offline"}`;
    el.innerHTML = `<span class="dot"></span> ${online ? "ONLINE" : "OFFLINE"}`;
    el.title = online ? "Connected" : "You're offline. Downloaded materials remain available.";
  };
  render();
  window.addEventListener("online",  () => { render(); toast("Connection restored. Synchronizing…", "success"); });
  window.addEventListener("offline", () => { render(); toast("You're offline. Previously downloaded materials remain available.", "warn"); });
}

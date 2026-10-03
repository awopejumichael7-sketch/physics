// ============================================================
//  Topics list page — search, class filter, status filter.
// ============================================================
import { requireAuth } from "/js/auth.js";
import { topics, progress, bookmarks } from "/js/db.js";
import { toast, initConnectionPill, escapeHtml } from "/js/ui.js";
import "/js/sw-register.js";

initConnectionPill();

const session = await requireAuth(["student", "teacher", "admin"]);
if (!session) throw new Error("Not authenticated");
const { user } = session;

const state = {
  all: [],
  progress: new Map(),   // topicId → progress doc
  bookmarks: new Set(),  // topicIds bookmarked
  filter: { class: "all", status: "all", q: "" }
};

/* ---------- LOAD ---------- */
const [topicsList, myProgress, myBookmarks] = await Promise.all([
  topics.list({ max: 200 }),
  progress.listByUser(user.uid),
  bookmarks.listByUser(user.uid)
]);

state.all = topicsList.sort((a, b) => (a.topicNumber || 0) - (b.topicNumber || 0));
myProgress.forEach(p => state.progress.set(p.topicId, p));
myBookmarks.filter(b => b.type === "topic").forEach(b => state.bookmarks.add(b.refId));

render();

/* ---------- FILTERS ---------- */
document.querySelectorAll("[data-filter-class]").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll("[data-filter-class]").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    state.filter.class = btn.dataset.filterClass;
    render();
  });
});

document.querySelectorAll("[data-filter-status]").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll("[data-filter-status]").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    state.filter.status = btn.dataset.filterStatus;
    render();
  });
});

const searchInput = document.getElementById("topic-search");
searchInput?.addEventListener("input", debounce(e => {
  state.filter.q = e.target.value.trim().toLowerCase();
  render();
}, 180));

/* ---------- RENDER ---------- */
function render() {
  const mount = document.getElementById("topic-list");
  const countEl = document.getElementById("topic-count");
  if (!mount) return;

  const q = state.filter.q;
  const list = state.all.filter(t => {
    if (state.filter.class !== "all" && t.class !== state.filter.class) return false;

    const p = state.progress.get(t.topicId);
    const completed = !!p?.completed;
    const bookmarked = state.bookmarks.has(t.topicId);

    if (state.filter.status === "completed"    && !completed) return false;
    if (state.filter.status === "incomplete"   && completed)  return false;
    if (state.filter.status === "bookmarked"   && !bookmarked) return false;

    if (q) {
      const hay = `${t.title} ${t.description || ""} ${t.class || ""}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  countEl.textContent = `${list.length} topic${list.length === 1 ? "" : "s"}`;

  if (!list.length) {
    mount.innerHTML = `<div class="card"><p style="margin:0;color:var(--grey-600)">No topics match your filters.</p></div>`;
    return;
  }

  mount.innerHTML = list.map(t => cardHTML(t)).join("");

  mount.querySelectorAll("[data-open]").forEach(el => {
    el.addEventListener("click", () => {
      window.location.href = `/topic.html?id=${encodeURIComponent(el.dataset.open)}`;
    });
  });
}

function cardHTML(t) {
  const p = state.progress.get(t.topicId) || {};
  const completed  = !!p.completed;
  const bookmarked = state.bookmarks.has(t.topicId);
  const readPct = completed ? 100 : (p.readPct || 0);

  return `
    <article class="topic-card card card-hover" data-open="${t.topicId}"
             tabindex="0" role="button"
             aria-label="Open topic ${t.topicNumber}: ${escapeHtml(t.title)}">
      <div class="topic-card-head">
        <span class="topic-num" aria-hidden="true">${t.topicNumber}</span>
        <div style="flex:1;min-width:0">
          <h3 class="card-title" style="margin:0 0 4px">${escapeHtml(t.title)}</h3>
          <div class="topic-meta">
            <span class="pill pill-class">${escapeHtml(t.class || "")}</span>
            ${completed ? `<span class="pill pill-success">✓ Completed</span>` : ""}
            ${bookmarked ? `<span class="pill pill-gold">⭐</span>` : ""}
          </div>
        </div>
      </div>
      ${t.description ? `<p class="card-desc" style="margin-top:var(--sp-2)">${escapeHtml(t.description)}</p>` : ""}
      <div class="progress" style="margin-top:var(--sp-3)">
        <span style="width:${readPct}%"></span>
      </div>
    </article>`;
}

function debounce(fn, ms) {
  let t;
  return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
}

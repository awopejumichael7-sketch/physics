// ============================================================
//  Topic detail — renders every section from Firestore,
//  lazy YouTube, Study/Exam routing, Mark-as-complete,
//  bookmark toggle, prev/next navigation.
// ============================================================
import { requireAuth } from "/js/auth.js";
import { topics, progress, bookmarks, resources, exams } from "/js/db.js";
import { toast, openModal, escapeHtml, initConnectionPill } from "/js/ui.js";
import { mountLazyYouTube, parseYouTubeId } from "/js/youtube.js";
import "/js/sw-register.js";

initConnectionPill();

const session = await requireAuth(["student", "teacher", "admin"]);
if (!session) throw new Error("Not authenticated");
const { user } = session;

/* ---------- URL PARAM ---------- */
const params = new URLSearchParams(location.search);
const id = params.get("id");
if (!id) { toast("No topic specified.", "error"); window.location.replace("/topics.html"); }

/* ---------- LOAD ---------- */
const topic = await topics.get(id);
if (!topic) {
  document.getElementById("topic-body").innerHTML =
    `<div class="card"><h2>Topic not found</h2>
      <p>The requested topic does not exist. <a href="/topics.html">Return to topics →</a></p></div>`;
  throw new Error("Topic missing");
}

/* ---------- FETCH NEIGHBOURS + PROGRESS + BOOKMARK + ATTACHED RESOURCES ---------- */
const [allTopics, myProgress, myBookmarks, allResources] = await Promise.all([
  topics.list({ max: 200 }),
  progress.get(user.uid, id),
  bookmarks.listByUser(user.uid),
  topic.resourceIds?.length
    ? Promise.all(topic.resourceIds.map(rid => resources.get ? resources.get(rid) : null))
    : Promise.resolve([])
]);

const sorted = allTopics.sort((a, b) => (a.topicNumber || 0) - (b.topicNumber || 0));
const idx     = sorted.findIndex(t => t.topicId === id);
const prev    = idx > 0 ? sorted[idx - 1] : null;
const next    = idx >= 0 && idx < sorted.length - 1 ? sorted[idx + 1] : null;
const isBookmarked = myBookmarks.some(b => b.type === "topic" && b.refId === id);

/* ---------- RENDER ---------- */
renderHeader(topic);
renderBody(topic);
renderNav(prev, next);
renderSidebarActions(topic, myProgress, isBookmarked);
markViewed(user.uid, id, myProgress);

/* ---------- PIECES ---------- */

function renderHeader(t) {
  document.title = `${t.title} — Scholar's Camp`;
  document.getElementById("topic-num").textContent = `TOPIC ${t.topicNumber}`;
  document.getElementById("topic-title").textContent = t.title;
  document.getElementById("topic-class").textContent = t.class || "";
  const intro = document.getElementById("topic-intro");
  intro.textContent = t.description || "Explore the lesson note, watch the video, and take the practice test to master this topic.";
}

function renderBody(t) {
  const body = document.getElementById("topic-body");

  const section = (icon, title, inner, opts = {}) => `
    <section class="card topic-section ${opts.className || ""}" ${opts.id ? `id="${opts.id}"` : ""}>
      <h2 style="display:flex;align-items:center;gap:10px;margin-bottom:var(--sp-3)">
        <span aria-hidden="true">${icon}</span> ${title}
      </h2>
      ${inner}
    </section>`;

  body.innerHTML = `
    ${section("🎯", "Learning Objectives", listOrPlaceholder(t.objectives, "Learning objectives will appear here once added by the administrator."))}

    ${section("🎬", "Video Lesson", `
        <div id="video-mount"></div>
        <p style="margin-top:var(--sp-3);color:var(--grey-600);font-size:.9rem">
          Watch this lesson carefully before attempting the practice questions.
        </p>`)}
    <div class="action-row">${actionButtonsHTML(t)}</div>

    ${section("📖", "Lesson Note", markdownOrPlaceholder(t.lessonNote, "Detailed lesson note pending."))}

    ${section("📚", "Important Definitions", listOrPlaceholder(t.definitions, "Definitions will appear here once added.", true))}

    ${section("🧮", "Important Formulas", formulasHTML(t.formulas))}

    ${section("✅", "Worked Examples", examplesHTML(t.examples))}

    ${section("🌍", "Real-Life Applications", listOrPlaceholder(t.applications, "Real-life applications coming soon."))}

    ${section("⚠️", "Common Mistakes", listOrPlaceholder(t.commonMistakes, "Common mistakes will appear here."))}

    ${section("🔑", "Key Points to Remember", listOrPlaceholder(t.keyPoints, "Key points will appear here."))}

    ${section("📝", "Practice Questions", `
        <p style="color:var(--grey-600);margin-bottom:var(--sp-3)">
          Test your understanding with practice questions for this topic.
        </p>
        <button class="btn btn-gold" id="btn-practice">START PRACTICE TEST</button>`)}

    ${section("📕", "Recommended Reading", attachedResourcesHTML(t))}
  `;

  // Video lazy-mount
  mountLazyYouTube(document.getElementById("video-mount"), t.youtubeUrl, { title: t.title });

  // Mark video watched when play clicked
  document.getElementById("video-mount").addEventListener("video-played", () => {
    saveProgress(user.uid, id, { videoWatched: true });
  });

  // Action buttons
  document.getElementById("btn-study")?.addEventListener("click", () => routeTo("study", t));
  document.getElementById("btn-exam")?.addEventListener("click", () => routeTo("exam", t));
  document.getElementById("btn-practice")?.addEventListener("click", () => routeTo("exam", t));
  document.getElementById("btn-bookmark")?.addEventListener("click", () => toggleBookmark());
  document.getElementById("btn-complete")?.addEventListener("click", () => toggleComplete());
}

function actionButtonsHTML(t) {
  const hasExternalStudy = validUrl(t.studyUrl);
  const hasExternalExam  = validUrl(t.examUrl);
  const examCount = Array.isArray(t.examIds) ? t.examIds.length : 0;

  return `
    <section class="card topic-actions">
      <div style="display:flex;gap:var(--sp-3);flex-wrap:wrap">
        <button class="btn btn-primary" id="btn-study">
          📖 STUDY TOPIC${hasExternalStudy ? "" : " (internal)"}
        </button>
        <button class="btn btn-gold" id="btn-exam">
          📝 TAKE EXAM${hasExternalExam ? "" : ""}
        </button>
        <button class="btn btn-outline" id="btn-bookmark">
          ${isBookmarkedNow() ? "⭐ Bookmarked" : "☆ Bookmark"}
        </button>
        <button class="btn btn-outline" id="btn-complete">
          ${isCompleteNow() ? "✓ Completed" : "○ Mark as completed"}
        </button>
      </div>
      <p style="margin:var(--sp-3) 0 0;color:var(--grey-600);font-size:.85rem">
        ${hasExternalStudy ? "Study opens the administrator's configured study page." : "Study opens the internal note below."}
        ${hasExternalExam ? " · Exam opens the configured exam page." : (examCount ? ` · ${examCount} exam${examCount===1?"":"s"} available.` : " · Internal practice test will be used if configured.")}
      </p>
    </section>`;
}

/* ---------- STATE HELPERS ---------- */
let _isBookmarked = isBookmarked;
let _isComplete = !!myProgress?.completed;
function isBookmarkedNow() { return _isBookmarked; }
function isCompleteNow() { return _isComplete; }

async function toggleBookmark() {
  const btn = document.getElementById("btn-bookmark");
  if (_isBookmarked) {
    const bm = (await bookmarks.listByUser(user.uid))
      .find(b => b.type === "topic" && b.refId === id);
    if (bm) await bookmarks.remove(bm.id);
    _isBookmarked = false;
    btn.innerHTML = "☆ Bookmark";
    toast("Removed from bookmarks.", "info");
  } else {
    await bookmarks.add(user.uid, {
      type: "topic", refId: id, title: topic.title
    });
    _isBookmarked = true;
    btn.innerHTML = "⭐ Bookmarked";
    toast("Added to bookmarks.", "success");
  }
}

async function toggleComplete() {
  const btn = document.getElementById("btn-complete");
  _isComplete = !_isComplete;
  await saveProgress(user.uid, id, {
    completed: _isComplete,
    completedAt: _isComplete ? new Date().toISOString() : null
  });
  btn.innerHTML = _isComplete ? "✓ Completed" : "○ Mark as completed";
  toast(_isComplete ? "Topic marked as completed. 🎉" : "Marked as not completed.", "success");
}

/* ---------- STUDY / EXAM ROUTING ---------- */

function validUrl(u) {
  if (!u || typeof u !== "string") return false;
  try { new URL(u.trim()); return true; } catch { return false; }
}

function routeTo(kind, t) {
  const externalUrl = kind === "study" ? t.studyUrl : t.examUrl;
  const target      = kind === "study" ? (t.studyLinkTarget || "sameTab")
                                       : (t.examLinkTarget  || "sameTab");

  if (validUrl(externalUrl)) {
    if (target === "newTab") window.open(externalUrl.trim(), "_blank", "noopener");
    else window.location.href = externalUrl.trim();
    return;
  }

  // Fallback to internal routes
  if (kind === "study") {
    // Study falls back to internal lesson note anchor
    document.querySelector(".topic-section")?.scrollIntoView({ behavior: "smooth" });
    toast("Using internal lesson note (no external study URL configured).", "info");
  } else {
    // Exam → internal exam page for this topic
    window.location.href = `/exams.html?topic=${encodeURIComponent(t.topicId)}`;
  }
}

/* ---------- SECTION RENDERERS ---------- */

function listOrPlaceholder(arr, placeholder, ordered = false) {
  if (!Array.isArray(arr) || !arr.length)
    return `<p style="color:var(--grey-600);margin:0">${escapeHtml(placeholder)}</p>`;
  const tag = ordered ? "ol" : "ul";
  return `<${tag} style="margin:0;padding-left:1.2rem">
    ${arr.map(x => `<li style="margin-bottom:6px">${escapeHtml(x)}</li>`).join("")}
  </${tag}>`;
}

function markdownOrPlaceholder(text, placeholder) {
  if (!text || !String(text).trim())
    return `<p style="color:var(--grey-600);margin:0">${escapeHtml(placeholder)}</p>`;
  // Minimal safe markdown → escape then re-enable line breaks + bold
  return escapeHtml(text)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/_(.+?)_/g, "<em>$1</em>")
    .replace(/\n\n+/g, "</p><p>")
    .replace(/\n/g, "<br>")
    .replace(/^/, "<p>").replace(/$/, "</p>");
}

function formulasHTML(formulas) {
  if (!Array.isArray(formulas) || !formulas.length)
    return `<p style="color:var(--grey-600);margin:0">Formulas will appear here.</p>`;
  return `<div class="formula-grid">${formulas.map(f => {
    if (typeof f === "string")
      return `<div class="formula-card"><code>${escapeHtml(f)}</code></div>`;
    return `
      <div class="formula-card">
        <code>${escapeHtml(f.formula || "")}</code>
        ${f.meaning ? `<p style="margin:6px 0 0;font-size:.85rem;color:var(--grey-600)">${escapeHtml(f.meaning)}</p>` : ""}
        ${f.symbols ? `<p style="margin:6px 0 0;font-size:.82rem;color:var(--grey-600)">${escapeHtml(f.symbols)}</p>` : ""}
        ${f.units   ? `<p style="margin:2px 0 0;font-size:.82rem;color:var(--grey-600)">SI: ${escapeHtml(f.units)}</p>` : ""}
      </div>`;
  }).join("")}</div>`;
}

function examplesHTML(examples) {
  if (!Array.isArray(examples) || !examples.length)
    return `<p style="color:var(--grey-600);margin:0">Worked examples will appear here.</p>`;
  return examples.map((ex, i) => `
    <div class="example-card">
      <h4 style="margin:0 0 6px">Example ${i + 1}</h4>
      <p style="margin:0 0 8px">${escapeHtml(ex.question || ex)}</p>
      ${ex.solution ? `
        <details>
          <summary style="cursor:pointer;font-weight:600;color:var(--royal-600)">Show solution</summary>
          <div style="margin-top:8px;padding:10px;background:var(--grey-100);border-radius:var(--radius-sm)">
            ${escapeHtml(ex.solution).replace(/\n/g, "<br>")}
          </div>
        </details>` : ""}
    </div>`).join("");
}

function attachedResourcesHTML(t) {
  if (!Array.isArray(t.resourceIds) || !t.resourceIds.length)
    return `<p style="color:var(--grey-600);margin:0">
      No textbook or resource attached to this topic yet.
      <a href="/resources.html">Browse the library →</a>
    </p>`;
  return `<div class="grid grid-2">
    ${t.resourceIds.map(rid => `
      <a class="card card-hover" href="/resources.html?open=${encodeURIComponent(rid)}" style="text-decoration:none;color:inherit">
        <strong>📕 Attached resource</strong>
        <p style="margin:4px 0 0;color:var(--grey-600);font-size:.85rem">ID: ${escapeHtml(rid)}</p>
      </a>`).join("")}
  </div>`;
}

function renderNav(prev, next) {
  const mount = document.getElementById("topic-nav");
  mount.innerHTML = `
    ${prev ? `<a class="btn btn-outline" href="/topic.html?id=${encodeURIComponent(prev.topicId)}">
      ← ${escapeHtml(truncate(prev.title, 40))}</a>` : `<span></span>`}
    <a class="btn btn-ghost" href="/topics.html">All topics</a>
    ${next ? `<a class="btn btn-primary" href="/topic.html?id=${encodeURIComponent(next.topicId)}">
      ${escapeHtml(truncate(next.title, 40))} →</a>` : `<span></span>`}
  `;
}

function truncate(s = "", n = 40) {
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}

function renderSidebarActions(t, myProgress, isBookmarkedFlag) {
  // Reserved for future sidebar extras (TOC, related topics, etc.)
}

/* ---------- PROGRESS PERSISTENCE ---------- */

async function markViewed(uid, topicId, existing) {
  const patch = {
    lastViewedAt: new Date().toISOString(),
    readPct: existing?.completed ? 100 : Math.max(existing?.readPct || 0, 10)
  };
  await saveProgress(uid, topicId, patch);
}

async function saveProgress(uid, topicId, patch) {
  try {
    const existing = await progress.get(uid, topicId);
    const merged = {
      userId: uid,
      topicId,
      ...(existing || {}),
      ...patch,
      syncStatus: navigator.onLine ? "synced" : "pending",
      version: (existing?.version || 0) + 1
    };
    delete merged.id;
    await progress.upsert(uid, topicId, merged);
  } catch (err) {
    console.warn("Progress save failed (will retry when online)", err);
  }
}

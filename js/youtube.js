// ============================================================
//  YouTube helpers — parse any common URL form, build embed,
//  lazy-load iframe with a thumbnail facade to save bandwidth.
// ============================================================

/**
 * Accepts:
 *   https://www.youtube.com/watch?v=XXXXXXXX
 *   https://youtu.be/XXXXXXXX
 *   https://www.youtube.com/embed/XXXXXXXX
 *   https://m.youtube.com/watch?v=XXXXXXXX
 *   https://www.youtube.com/shorts/XXXXXXXX
 *   https://www.youtube.com/watch?v=XXXX&t=42s
 * Returns 11-char video ID or "" if invalid.
 */
export function parseYouTubeId(url) {
  if (!url || typeof url !== "string") return "";
  const trimmed = url.trim();
  // Plain 11-char ID
  if (/^[A-Za-z0-9_-]{11}$/.test(trimmed)) return trimmed;
  try {
    const u = new URL(trimmed);
    const host = u.hostname.replace(/^www\./, "").replace(/^m\./, "");
    if (host === "youtu.be") return sanitize(u.pathname.slice(1).split("/")[0]);
    if (host === "youtube.com" || host === "youtube-nocookie.com") {
      if (u.searchParams.get("v")) return sanitize(u.searchParams.get("v"));
      const parts = u.pathname.split("/").filter(Boolean);
      // /embed/ID  /shorts/ID  /v/ID  /live/ID
      if (parts.length >= 2 && ["embed", "shorts", "v", "live"].includes(parts[0])) {
        return sanitize(parts[1]);
      }
    }
  } catch { /* not a URL */ }
  return "";
}

function sanitize(id) {
  return /^[A-Za-z0-9_-]{11}$/.test(id || "") ? id : "";
}

export function buildEmbedUrl(videoId, { autoplay = false } = {}) {
  const params = new URLSearchParams({
    rel: "0",
    modestbranding: "1",
    playsinline: "1"
  });
  if (autoplay) params.set("autoplay", "1");
  return `https://www.youtube-nocookie.com/embed/${videoId}?${params.toString()}`;
}

export function buildThumbUrl(videoId, quality = "hqdefault") {
  return `https://i.ytimg.com/vi/${videoId}/${quality}.jpg`;
}

/**
 * Renders a lazy YouTube facade into `container`.
 * Only replaces thumbnail with iframe when the user clicks play.
 * If URL invalid, renders a friendly "Video unavailable" message.
 */
export function mountLazyYouTube(container, url, { title = "Video lesson" } = {}) {
  if (!container) return;
  const id = parseYouTubeId(url);

  if (!id) {
    container.innerHTML = `
      <div class="video-placeholder" role="note">
        <div style="font-size:2rem">🎬</div>
        <strong>Video lesson not yet configured</strong>
        <p style="color:var(--grey-600);margin:6px 0 0">
          The administrator hasn't added a YouTube link for this topic yet.
        </p>
      </div>`;
    return;
  }

  container.innerHTML = `
    <button class="yt-facade" type="button"
            aria-label="Play video: ${escapeAttr(title)}"
            style="
              position:relative;width:100%;padding:0;border:none;cursor:pointer;
              border-radius:var(--radius-md);overflow:hidden;background:#000;
              aspect-ratio:16/9;display:block">
      <img src="${buildThumbUrl(id)}"
           alt="YouTube video thumbnail"
           loading="lazy" decoding="async"
           style="width:100%;height:100%;object-fit:cover;display:block" />
      <span class="yt-play" aria-hidden="true" style="
        position:absolute;inset:0;display:grid;place-items:center;
        background:linear-gradient(180deg,rgba(0,0,0,.15),rgba(0,0,0,.55))">
        <span style="
          width:76px;height:76px;border-radius:50%;background:#fff;
          display:grid;place-items:center;box-shadow:var(--shadow-lg)">
          <span style="
            width:0;height:0;border-style:solid;
            border-width:14px 0 14px 24px;
            border-color:transparent transparent transparent #d63a3a;
            margin-left:6px"></span>
        </span>
      </span>
    </button>`;

  const facade = container.querySelector(".yt-facade");
  facade.addEventListener("click", () => {
    container.innerHTML = `
      <div style="position:relative;width:100%;aspect-ratio:16/9;background:#000;border-radius:var(--radius-md);overflow:hidden">
        <iframe
          src="${buildEmbedUrl(id, { autoplay: true })}"
          title="${escapeAttr(title)}"
          frameborder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowfullscreen
          style="position:absolute;inset:0;width:100%;height:100%;border:0">
        </iframe>
      </div>`;

    // Dispatch event so topic.js can mark "video watched"
    container.dispatchEvent(new CustomEvent("video-played", {
      bubbles: true, detail: { videoId: id }
    }));
  });
}

function escapeAttr(s = "") {
  return String(s).replace(/[&<>"']/g, c => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[c]));
}

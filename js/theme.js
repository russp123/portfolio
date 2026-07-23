/* ============================================================
   Shared across every page: light/dark theme toggle + header +
   footer rendering. Include this after data.js.
   ============================================================ */

// Auto-generated placeholder cover — replaces the old static
// "assets/default.jpg" image for any project with no real cover yet.
// Solid #e4e5e9 card + a rotating mono status-line phrase (a fresh
// random pick per render, so it doesn't repeat the same line every
// time). Used by both the homepage tile (index.html) and the detail
// hero (renderHeroMedia below).
const PLACEHOLDER_PHRASES = [
  "cover: pending",
  "asset: incoming",
  "case study loading",
  "preview: tbd",
  "img: queued",
  "render: pending",
  "cover.jpg — soon",
  "visual: coming soon",
];
function pickPlaceholderPhrase() {
  return PLACEHOLDER_PHRASES[Math.floor(Math.random() * PLACEHOLDER_PHRASES.length)];
}
function renderPlaceholderCover(extraClass) {
  return `<div class="cover-placeholder${extraClass ? " " + extraClass : ""}"><span class="cover-placeholder-text">${pickPlaceholderPhrase()}</span></div>`;
}

function initTheme() {
  const saved = localStorage.getItem("theme");
  const theme = saved || "light";
  applyTheme(theme);
}

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem("theme", theme);
  const icon = document.getElementById("theme-icon");
  if (icon) icon.textContent = theme === "dark" ? "☀" : "☾";
}

function toggleTheme() {
  const current = document.documentElement.getAttribute("data-theme");
  applyTheme(current === "dark" ? "light" : "dark");
}

function initHeader() {
  const headerName = document.getElementById("header-name");
  const headerTitle = document.getElementById("header-title");
  const headerLocation = document.getElementById("header-location");
  if (headerName) headerName.textContent = PORTFOLIO.name;
  if (headerTitle) headerTitle.textContent = PORTFOLIO.title;
  // Location moved to the footer (see initFooter); strip the header's
  // hardcoded end slot so it no longer shows up top.
  if (headerLocation) headerLocation.remove();
}

function initFooter() {
  const cvEl = document.getElementById("footer-cv");
  const ctaEl = document.getElementById("footer-cta");
  const emailEl = document.getElementById("footer-email");
  const linksEl = document.getElementById("footer-links");

  if (cvEl && PORTFOLIO.cv) {
    cvEl.href = PORTFOLIO.cv.url;
    cvEl.setAttribute("download", "");
    cvEl.innerHTML = PORTFOLIO.cv.label;
  }
  if (ctaEl) ctaEl.textContent = PORTFOLIO.cta;
  if (emailEl) { emailEl.textContent = PORTFOLIO.email; emailEl.href = "mailto:" + PORTFOLIO.email; }
  if (linksEl) {
    linksEl.innerHTML = PORTFOLIO.links
      .map((l) => `<a href="${l.url}" target="_blank" rel="noopener">${l.label}<sup>↗</sup></a>`)
      .join("");
  }

  // Location lives in the footer now (removed from the header) — inject
  // it above the CTA so it still appears on every page.
  const ctaWrap = ctaEl ? ctaEl.parentElement : null;
  if (ctaWrap && PORTFOLIO.location && !ctaWrap.querySelector(".footer-location")) {
    const loc = document.createElement("p");
    loc.className = "footer-location";
    loc.textContent = PORTFOLIO.location;
    ctaWrap.insertBefore(loc, ctaWrap.firstChild);
  }
}

/* ----------------------------------------------------------------
   Single source of truth for "the cover" of a project: whatever
   image/video is set as `cover`/`video` on that project in
   data.js is what plays both as the homepage tile AND as the
   100vw hero at the top of its project page — bespoke or generic.
   Change it once in data.js, it updates everywhere. ---------------------------------------------------------------- */
function renderHeroMedia(project) {
  // autoplay + loop, no controls — matches the homepage tile preview.
  // muted is required for browsers to allow autoplay at all.
  if (project.video) {
    return `<video class="detail-hero-media" src="${project.video}" autoplay muted loop playsinline poster="${project.videoPoster || ""}"></video>`;
  }
  if (!project.cover) return renderPlaceholderCover("detail-hero-media");
  return `<div class="detail-hero-media" style="background-image:${project.cover}"></div>`;
}

// Optional small attribution label, bottom-left of the hero — e.g.
// crediting a stock/rendered video or photo. Set `heroCredit: { label,
// url }` on a project in data.js; omit it and nothing renders.
function renderHeroCredit(project) {
  if (!project.heroCredit) return "";
  return `<div class="detail-hero-credit"><a href="${project.heroCredit.url}" target="_blank" rel="noopener">${project.heroCredit.label}<sup>↗</sup></a></div>`;
}

// If this project's tile had a video and was just clicked, resume the
// hero video from the same point instead of restarting at 0:00. Shared
// by both bespoke pages (initDetailHero below) and the generic
// project.html template (called directly from js/project.js).
function applyHeroResumeTime(heroEl, project) {
  if (!project.video) return;
  const key = `resumeTime:${project.id}`;
  const resumeTime = sessionStorage.getItem(key);
  sessionStorage.removeItem(key);
  if (!resumeTime) return;
  const video = heroEl.querySelector(".detail-hero-media");
  video.addEventListener(
    "loadedmetadata",
    () => {
      if (Number(resumeTime) < video.duration) video.currentTime = Number(resumeTime);
    },
    { once: true }
  );
}

function initDetailHero() {
  const heroEl = document.getElementById("detail-hero");
  if (!heroEl) return;
  const project = PORTFOLIO.projects.find((p) => p.id === heroEl.dataset.projectId);
  if (!project) return;
  heroEl.innerHTML = `
    ${renderHeroMedia(project)}
    ${renderHeroCredit(project)}
    <a class="detail-close" href="/" title="Close">×</a>
    <div class="detail-hero-scroll-cue">
      <span class="label">Scroll to view more</span>
      <span class="arrow">↓</span>
    </div>
  `;
  applyHeroResumeTime(heroEl, project);
}

/* ----------------------------------------------------------------
   Page-leave transition: intercept clicks on internal links (same
   -site .html pages, not external/mailto/new-tab links), fade the
   page out, then navigate — so leaving a page feels like part of
   the same motion as the page-reveal animation on arrival, instead
   of an abrupt cut. ---------------------------------------------------------------- */
function initPageTransitions() {
  document.addEventListener("click", (e) => {
    const link = e.target.closest("a");
    if (!link) return;
    if (link.target === "_blank") return;
    const href = link.getAttribute("href");
    if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("http")) return;
    if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey) return;

    e.preventDefault();
    document.body.classList.add("page-leave");

    // The × close button always points at index.html as a fallback,
    // but if we actually arrived here BY clicking into this project
    // (i.e. there's browser history to go back to), use history.back()
    // instead of a fresh navigation — that's what restores the exact
    // scroll position you were at on the homepage, rather than always
    // dumping you back at the top.
    const useBack = link.classList.contains("detail-close") && window.history.length > 1;

    // Matches the 200ms transition on body.page-leave in style.css.
    setTimeout(() => {
      if (useBack) {
        window.history.back();
      } else {
        window.location.href = href;
      }
    }, 200);
  });

  // If the browser restores this page from the back-forward cache
  // (e.g. the × close button's history.back(), or the real back
  // button), the whole DOM is resurrected exactly as it was when we
  // left — the page's inline <script> that reads localStorage and
  // sets data-theme does NOT re-run. So if the theme was toggled on
  // a different page in between, this page would silently show the
  // stale theme it had before you left. Re-sync it here.
  window.addEventListener("pageshow", (event) => {
    document.body.classList.remove("page-leave");
    if (event.persisted) {
      applyTheme(localStorage.getItem("theme") || "light");
    }
  });
}

// mailto: links silently do nothing if the visitor has no default
// mail client configured (extremely common — most people use
// webmail). So on click, in addition to letting mailto: try to fire
// natively, also copy the address to the clipboard and show a toast
// — that way there's always a visible, useful outcome either way.
// Delegated on document (not attached per-link) because some mailto
// links — like the "get in touch" one in the About headline — are
// injected by a page's own inline script *after* this file's
// DOMContentLoaded listener already ran.
function initMailtoCopy() {
  document.addEventListener("click", (e) => {
    const link = e.target.closest('a[href^="mailto:"]');
    if (!link) return;
    const email = link.getAttribute("href").replace("mailto:", "").split("?")[0];
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard
        .writeText(email)
        .then(() => showMailtoToast(`Copied: ${email}`))
        .catch(() => showMailtoToast(`Email: ${email}`));
    } else {
      showMailtoToast(`Email: ${email}`);
    }
  });
}

function showMailtoToast(text) {
  let toast = document.getElementById("mailto-toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "mailto-toast";
    toast.className = "mailto-toast";
    document.body.appendChild(toast);
  }
  toast.textContent = text;
  toast.classList.add("show");
  clearTimeout(toast._hideTimer);
  toast._hideTimer = setTimeout(() => toast.classList.remove("show"), 2200);
}

// Row-major masonry for the homepage project grid. The grid CSS
// gives every row a fine 10px unit; here we measure each card's real
// height and set grid-row-end: span N so the card reserves exactly
// its own height + one gap. Because cards are single-column-wide and
// the grid uses `dense` flow, they pack into the shortest available
// slot in source order — a true masonry puzzle that still reads
// left-to-right, top-to-bottom. Must be called AFTER the grid's
// cards exist (index.html builds them in its own inline script, so
// it calls this at the end of that block, not from theme.js's own
// DOMContentLoaded which runs earlier).
function initMasonry(gridId, cardSelector) {
  const grid = document.getElementById(gridId);
  if (!grid) return;
  const ROW_UNIT = 10; // must match grid-auto-rows in css/style.css
  const GAP = 14; // vertical space reserved below each card

  const layout = () => {
    const cards = grid.querySelectorAll(cardSelector);
    // Reset all spans first so each card reports its natural content
    // height (with grid-auto-rows:10px, a span-less card is only 10px
    // tall in grid terms — so we always set a real span, single
    // column included, or cards overlap).
    cards.forEach((card) => (card.style.gridRowEnd = "auto"));
    cards.forEach((card) => {
      const h = card.getBoundingClientRect().height;
      const span = Math.ceil((h + GAP) / ROW_UNIT);
      card.style.gridRowEnd = "span " + span;
    });
  };

  layout();
  window.addEventListener("load", layout);

  // Re-pack as images finish loading — their height is 0 until then,
  // which would otherwise leave gallery items overlapping.
  grid.querySelectorAll("img").forEach((img) => {
    if (!img.complete) img.addEventListener("load", layout, { once: true });
  });

  // Re-pack only when the WIDTH changes — never on height-only resizes.
  // This matters on mobile: scrolling shows/hides the URL bar, which
  // fires `resize` with a new height. If we re-laid out then, the
  // layout() call momentarily resets every card to grid-row-end:auto
  // (10px tall), collapsing the whole page height for a frame — the
  // browser then clamps scroll to that tiny height and slams you to
  // the top. Masonry only depends on column width, so we ignore
  // height-only resizes entirely.
  let lastWidth = window.innerWidth;
  window.addEventListener("resize", () => {
    if (window.innerWidth === lastWidth) return;
    lastWidth = window.innerWidth;
    layout();
  });
}

// Back-compat wrapper for the homepage project grid.
function initProjectMasonry() { initMasonry("projects-grid", ".project-card"); }

// Site-wide smooth/eased scrolling (Lenis, loaded via CDN — see the
// <script>/<link> tags near the top of each page's <head>). Skipped
// entirely for prefers-reduced-motion, same as every other motion
// effect on this site. `allowNestedScroll` keeps this from hijacking
// scrollable areas inside the page, like the RUSSELLM chat log.
function initSmoothScroll() {
  if (typeof Lenis === "undefined") return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  new Lenis({
    autoRaf: true,
    autoToggle: true,
    anchors: true,
    allowNestedScroll: true,
    naiveDimensions: true,
    stopInertiaOnNavigate: true,
  });
}

// The "About" pill — a sibling to the fixed RUSSELLM toggle, sitting
// just to its left so the two live together (top-right) on every page.
// Skipped on the About page itself (no self-link). Built in JS so it
// needn't be pasted into every page's HTML.
function initAboutButton() {
  if (document.querySelector(".about-toggle")) return;
  if (/\/about(\.html)?$/.test(window.location.pathname)) return;
  const a = document.createElement("a");
  a.className = "about-toggle";
  a.href = "/about";
  a.textContent = "About";
  document.body.appendChild(a);
  const russellm = document.getElementById("russellm-toggle");
  const place = () => {
    if (russellm) a.style.right = Math.round(russellm.getBoundingClientRect().width + 32) + "px";
  };
  place();
  window.addEventListener("load", place);
}

document.addEventListener("DOMContentLoaded", () => {
  initTheme();
  initHeader();
  initFooter();
  initDetailHero();
  initPageTransitions();
  initSmoothScroll();
  initMailtoCopy();
  initAboutButton();
  const toggle = document.getElementById("theme-toggle");
  if (toggle) toggle.addEventListener("click", toggleTheme);
});

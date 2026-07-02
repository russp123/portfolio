/* ============================================================
   Shared across every page: light/dark theme toggle + header +
   footer rendering. Include this after data.js.
   ============================================================ */

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
  if (headerLocation) headerLocation.textContent = PORTFOLIO.location;
}

function initFooter() {
  const cvEl = document.getElementById("footer-cv");
  const ctaEl = document.getElementById("footer-cta");
  const emailEl = document.getElementById("footer-email");
  const linksEl = document.getElementById("footer-links");

  if (cvEl && PORTFOLIO.cv) {
    cvEl.href = PORTFOLIO.cv.url;
    cvEl.innerHTML = `${PORTFOLIO.cv.label}<sup>↗</sup>`;
  }
  if (ctaEl) ctaEl.textContent = PORTFOLIO.cta;
  if (emailEl) { emailEl.textContent = PORTFOLIO.email; emailEl.href = "mailto:" + PORTFOLIO.email; }
  if (linksEl) {
    linksEl.innerHTML = PORTFOLIO.links
      .map((l) => `<a href="${l.url}" target="_blank" rel="noopener">${l.label}<sup>↗</sup></a>`)
      .join("");
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
  return project.video
    ? `<video class="detail-hero-media" src="${project.video}" autoplay muted loop playsinline poster="${project.videoPoster || ""}"></video>`
    : `<div class="detail-hero-media" style="background-image:${project.cover}"></div>`;
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
    <a class="detail-close" href="index.html" title="Close">×</a>
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

  // If the browser restores this page from cache (e.g. the back
  // button), make sure it isn't stuck mid-fade from before.
  window.addEventListener("pageshow", () => {
    document.body.classList.remove("page-leave");
  });
}

document.addEventListener("DOMContentLoaded", () => {
  initTheme();
  initHeader();
  initFooter();
  initDetailHero();
  initPageTransitions();
  const toggle = document.getElementById("theme-toggle");
  if (toggle) toggle.addEventListener("click", toggleTheme);
});

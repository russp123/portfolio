/* ============================================================
   Renders project.html using the ?id= query param against the
   matching entry in js/data.js. Used by every project that
   doesn't have its own bespoke page (like configurator.html /
   council-roadmap.html).
   ============================================================ */

document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  const project = PORTFOLIO.projects.find((p) => p.id === id);
  const main = document.getElementById("project-main");

  if (!project) {
    main.insertAdjacentHTML("beforeend", `<p style="padding:40px;">Project not found.</p>`);
    return;
  }

  // ---- Per-project head tags -----------------------------------------
  // project.html ships generic fallback head tags (one file serves all
  // the ?id= case studies) and deliberately has NO static canonical.
  // Once the id resolves, set this project's own title, canonical,
  // og:url and descriptions. Google renders JS and reads these; link
  // preview bots that skip JS still see the static fallbacks. An
  // invalid id never reaches this point (returned above), so nothing
  // is set for it.
  //
  // Description: an optional `description` field on the project wins;
  // otherwise it's built only from fields that already exist (title +
  // subtitle, or tag when the subtitle just repeats the title).
  const SITE = "https://russelpineda.com";
  const pageUrl = SITE + project.page;
  const pageTitle = `${project.title} | Russel Pineda`;
  const kind = project.subtitle && project.subtitle !== project.title ? project.subtitle : project.tag;
  const pageDesc =
    project.description ||
    `${project.title}: ${kind}. A case study by Russel Pineda, full-stack developer in Pampanga, Philippines.`;
  const setMeta = (attr, key, value) => {
    let el = document.head.querySelector(`meta[${attr}="${key}"]`);
    if (!el) {
      el = document.createElement("meta");
      el.setAttribute(attr, key);
      document.head.appendChild(el);
    }
    el.setAttribute("content", value);
  };
  document.title = pageTitle;
  let canonical = document.head.querySelector('link[rel="canonical"]');
  if (!canonical) {
    canonical = document.createElement("link");
    canonical.rel = "canonical";
    document.head.appendChild(canonical);
  }
  canonical.href = pageUrl;
  setMeta("property", "og:url", pageUrl);
  setMeta("property", "og:title", pageTitle);
  setMeta("name", "twitter:title", pageTitle);
  setMeta("name", "description", pageDesc);
  setMeta("property", "og:description", pageDesc);
  setMeta("name", "twitter:description", pageDesc);

  const links = (project.links || [])
    .map((l) => `<a href="${l.url}" target="_blank" rel="noopener">${l.label}<sup>↗</sup></a>`)
    .join("");

  const statsHtml = project.stats
    ? `<div class="detail-stats">${project.stats
        .map((s) => `<div><div class="stat-value">${s.value}</div><div class="stat-label">${s.label}</div></div>`)
        .join("")}</div>`
    : "";

  const quoteHtml = project.quote ? `<div class="detail-quote">${project.quote}</div>` : "";

  main.insertAdjacentHTML(
    "beforeend",
    `
    <div class="detail-hero">
      ${renderHeroMedia(project)}
      ${renderHeroCredit(project)}
      <a class="detail-close" href="/" title="Close">×</a>
      <div class="detail-hero-scroll-cue">
        <span class="label">Scroll to view more</span>
        <span class="arrow">↓</span>
      </div>
    </div>

    <div class="detail-layout">

      <div class="detail-side">
        <h1 class="detail-title">${project.title}</h1>
        <p class="detail-subtitle">${project.subtitle || project.tag}</p>
      </div>

      <div class="detail-main">
        <div class="detail-section">
          <div class="detail-text">
            <p>${project.body || ""}</p>
          </div>

          ${statsHtml}
          ${quoteHtml}

          <div class="detail-meta">
            ${project.role ? `<div class="detail-meta-item"><div class="meta-label">Role</div><div class="meta-value">${project.role}</div></div>` : ""}
            ${project.collaborators ? `<div class="detail-meta-item"><div class="meta-label">Collaborators</div><div class="meta-value">${project.collaborators}</div></div>` : ""}
            ${project.duration ? `<div class="detail-meta-item"><div class="meta-label">Duration</div><div class="meta-value">${project.duration}</div></div>` : ""}
            ${project.tools ? `<div class="detail-meta-item"><div class="meta-label">Tools</div><div class="meta-value">${project.tools}</div></div>` : ""}
          </div>
          ${links ? `<div class="detail-links">${links}</div>` : ""}
        </div>
      </div>

    </div>
    `
  );

  applyHeroResumeTime(main.querySelector(".detail-hero"), project);
});

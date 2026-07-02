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

  document.getElementById("page-title").textContent = `${project.title} — ${PORTFOLIO.name}`;

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
      <a class="detail-close" href="index.html" title="Close">×</a>
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

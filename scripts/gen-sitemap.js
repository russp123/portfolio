/* Regenerates sitemap.xml at the repo root from js/data.js.
   Run after adding or renaming a project:  node scripts/gen-sitemap.js

   URLs: the homepage, /about, then every project's `page` value in
   data.js order (bespoke pages like /vitals and generic ones like
   /project?id=lead-scoring alike). Absolute https URLs on the apex
   domain, no lastmod. robots.txt points crawlers here. */
const fs = require("fs");
const path = require("path");
const PORTFOLIO = require("../js/data.js");

const SITE = "https://russelpineda.com";
const escapeXml = (s) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");

const paths = ["/", "/about", ...PORTFOLIO.projects.map((p) => p.page)];
const missing = PORTFOLIO.projects.filter((p) => !p.page || !p.page.startsWith("/"));
if (missing.length) {
  console.error("Projects with a missing or relative `page`:", missing.map((p) => p.id).join(", "));
  process.exit(1);
}

const urls = paths.map((p) => `  <url><loc>${escapeXml(SITE + p)}</loc></url>`).join("\n");
const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;

const out = path.join(__dirname, "..", "sitemap.xml");
fs.writeFileSync(out, xml);
console.log(`Wrote ${paths.length} URLs to sitemap.xml (2 + ${PORTFOLIO.projects.length} projects).`);

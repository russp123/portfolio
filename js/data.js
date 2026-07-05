/* ============================================================
   ALL YOUR CONTENT LIVES HERE.
   Edit this file to customize every page. The homepage project
   grid, the footer, and the generic project.html template all
   read from this file — you don't need to touch the HTML/CSS/JS
   for content changes.
   ============================================================ */

const PORTFOLIO = {
  // ---- Header / identity (appears on every page) ----
  name: "Russel A. Pineda",
  title: "Full-Stack Developer",
  location: "Pampanga, Philippines",
  email: "rsslpnd@gmail.com",

  // ---- Home page: About ----
  // Raw HTML is allowed here so you can inline links the same way
  // joseph.cv does (e.g. an underlined word with a small arrow).
  aboutHtml: `I'm Russ, a software engineer who handles the tech, then <i>automates what's left</i>. <br> <a href="mailto:rsslpnd@gmail.com" class="about-cta">get in touch<sup>↗</sup></a>`,

  // ---- Home page: Experience (shown in the "Experience" column) ----
  experience: [
    { name: "Kingdomes Leisure Pty Ltd", url: "https://kingdomes.com.au", year: "2025 —", roles: ["Lead Full-Stack Developer"] },
    { name: "La Rose Noire Philippines", url: "#", year: "2025", roles: ["Associate Software Engineer"] },
    { name: "Cloudstaff Global Workplace Inc.", url: "#", year: "2025", roles: ["Associate Software Engineer Trainee", "Associate Software Quality Assurance Engineer Trainee"] },
  ],

  // ---- Home page: Skills ----
  // Each category renders as a labeled row of comma-separated skills.
  skills: [
    { category: "Full-Stack Development", items: "JavaScript, HTML, CSS, PHP, MySQL, Git, GitHub" },
    { category: "WordPress & CMS", items: "WordPress + WP Multisite, Elementor Pro, WooCommerce, API Integration, Database Optimization" },
    { category: "Automation & Marketing", items: "GoHighLevel (CRM workflows, lead scoring), Email Deliverability (SPF/DKIM/DMARC), Mailgun Integration" },
    { category: "DevOps & Infrastructure", items: "Cloudflare (DDoS mitigation, WAF, security hardening), DNS, SSL/TLS" },
    { category: "Design", items: "Adobe Photoshop, Figma, Canva, SVG Design" },
  ],

  // ---- Home page: Project grid ----
  // `id` maps to a bespoke page (e.g. configurator.html) if it exists,
  // otherwise falls back to project.html?id=<id> using the fields below.
  // Order here = order on the homepage grid, filled row-major
  // (1,2,3 / 4,5,6 across). `size` sets each tile's shape for the
  // masonry puzzle — "wide" (landscape), "square", or "tall"
  // (portrait). Reorder the objects to reorder tiles; change `size`
  // to reshape a tile. js/theme.js initProjectMasonry() packs them.
  projects: [
    {
      id: "council-roadmap",
      title: "A 5-Page Funnel System",
      tag: "Funnel & CRM System",
      badge: "Live",
      cover: "lurl('assets/default.jpg'), inear-gradient(135deg,#1f3a93,#26d0ce)",
      size: "tall",
      page: "council-roadmap.html",
      video: "assets/councilroadmap.mp4",
    },
    {
      id: "glamporise-website",
      title: "Glamporise Website",
      tag: "WordPress Multisite Platform",
      badge: "Live",
      cover: "url('assets/glamporise.jpg'), linear-gradient(135deg,#06402b,#2e8b6f)",
      size: "square",
      page: "glamporise-website.html",
    },
    {
      id: "configurator",
      title: "Real-Time Product Configurator",
      tag: "Interactive Web App",
      badge: "Live",
      cover: "url('assets/default.jpg'), linear-gradient(135deg,#3a2a1a,#c9a227)",
      size: "wide",
      video: "assets/configurator.mp4",
      page: "configurator.html",
    },
    {
      id: "cost-optimization",
      title: "$1K/Year Plugin Cleanup",
      tag: "Infrastructure Audit",
      badge: null,
      cover: "url('assets/plugin.jpg'), linear-gradient(135deg,#3a2a1a,#c9a227)",
      size: "square",
      page: "project.html?id=cost-optimization",
      subtitle: "Infrastructure Audit",
      body: "Audited the WordPress plugin ecosystem for Kingdomes and decommissioned 7 redundant or overlapping tools — including WP Rocket, Duplicator Pro, and 5 YITH WooCommerce extensions — consolidating their functions onto existing infrastructure (Cloudflare for caching/CDN, VentraIP for backups).",
      role: "Infrastructure Lead",
      tools: "Cloudflare, VentraIP",
      quote: "Saved nearly $1,000 AUD annually. — Jesse Anyan, Founder, Kingdomes",
      links: [],
    },
    {
      id: "brand-identity",
      title: "Brand Identity System",
      tag: "Logo & Visual Design",
      badge: null,
      cover: "url('assets/default.jpg'), linear-gradient(135deg,#3a2a1a,#c9a227)",
      size: "square",
      page: "brand-identity.html",
      subtitle: "Logo & Visual Design",
      body: "Designed multiple original SVG-based logo concepts for Glamporise, a luxury glamping brand, translating the brand direction — native flora (the waratah flower) and campfire motifs — into minimalist visual concepts in Photoshop and Figma.",
      role: "Brand & Visual Designer",
      tools: "Photoshop, Figma, SVG",
      links: [{ label: "Glamporise", url: "https://glamporise.com" }],
      video: "assets/glamporise-logo-reveal-hd.mp4",
    },
{
      id: "performance-benchmark",
      title: "Performance Benchmark",
      tag: "PageSpeed Audit",
      badge: null,
      cover: "url('assets/plugin-opt.jpg'), linear-gradient(135deg,#0f2027,#2c5364)",
      size: "wide",
      page: "project.html?id=performance-benchmark",
      subtitle: "PageSpeed Audit",
      body: "Glamporise was built fresh on WordPress Multisite infrastructure — not migrated from a prior site — so these scores reflect the platform as architected from the ground up, measured via Google PageSpeed Insights.",
      role: "Full-Stack Developer",
      tools: "WordPress Multisite, Cloudflare",
      stats: [
        { label: "Performance", value: "94" },
        { label: "Accessibility", value: "92" },
        { label: "Best Practices", value: "92" },
        { label: "SEO", value: "85" },
      ],

    },
        
    {
      id: "masterclass",
      title: "Masterclass Funnel",
      tag: "Landing Page & Funnel",
      badge: "18 sign-ups",
      cover: "url('assets/mc-1-hero.jpg'), linear-gradient(135deg,#16241a,#3c5a3a)",
      size: "wide",
      page: "masterclass.html",
    },
    {
      id: "ground-zero",
      title: "Ground Zero Sales Page",
      tag: "Post-Masterclass Sales Page",
      badge: null,
      cover: "url('assets/default.jpg'), linear-gradient(135deg,#2b2b2b,#c9a227)",
      size: "wide",
      page: "ground-zero.html",
      video: "assets/dome-edit.mp4",
      heroCredit: { label: "Rendered by: Carlos Jingo", url: "https://www.facebook.com/wearysijey#" },


    },
    {
      id: "founding-offer",
      title: "Founding Offer",
      tag: "Conversion Landing Page",
      badge: null,
      cover: "url('assets/founding-offer.jpg'), linear-gradient(135deg,#141414,#444444)",
      size: "square",
      page: "founding-offer.html",
    },

    {
      id: "ebook-design",
      title: "The NSW Glamping Property Decoder",
      tag: "Ebook Design",
      badge: null,
      cover: "url('assets/decoder.jpg'), linear-gradient(135deg,#3a2a1a,#c9a227)",
      size: "wide",
      page: "ebook-design.html",
      subtitle: "Ebook Design",
      body: "Designed a 34-page paid ebook for Glamporise's Stage 1 membership offering (AU$27), featuring original illustrated cover artwork — a geodesic dome silhouette set inside an NSW state outline, a gold and dark color palette, and topographic line details — plus a custom color-weighted typography system and consistent information design throughout. Part of a broader content design set that also includes a 15-page masterclass guide (\"Is a Dome Viable For You?\") and a 3-part founding-offer guide series, totaling 50+ pages across the full collection.",
      role: "Content & Visual Designer",
      tools: "Figma, Photoshop",
      links: [],
    },
  ],

  // ---- Footer / top "Links" column (appears on every page) ----
  links: [
    { label: "LinkedIn", url: "https://linkedin.com/in/russel-pineda-4b9441347" },
    { label: "Instagram", url: "https://www.instagram.com/rssl.pn/" },
    { label: "Facebook", url: "https://www.facebook.com/rsslpnd" }
  ],

  cta: "Open to hearing what you're working on.",
  cv: { label: "Download my CV", url: "assets/russel-pineda-cv.pdf" },
};

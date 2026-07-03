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
  aboutHtml: `I'm Russ, a software engineer who handles the tech, then<i> automates  what's left</i>.`,

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
  projects: [
    {
      id: "configurator",
      title: "Kingdomes Product Configurator",
      tag: "Interactive Web App",
      badge: null,
      cover: "url('assets/configurator-2.jpg'), linear-gradient(135deg,#3a2a1a,#c9a227)",
      size: "wide",
      page: "configurator.html",
    },
    {
      id: "council-roadmap",
      title: "Glamporise Council Roadmap",
      tag: "Funnel & CRM System",
      badge: "Live",
      cover: "linear-gradient(135deg,#1f3a93,#26d0ce)",
      size: "tall",
      page: "council-roadmap.html",
      video: "assets/councilroadmap.mov",    

    },
    {
      id: "brand-identity",
      title: "Glamporise Brand Identity",
      tag: "Logo & Visual Design",
      badge: null,
      cover: "linear-gradient(135deg,#3a2a1a,#c9a227)",
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
      id: "cost-optimization",
      title: "Plugin Cost Optimization",
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
      id: "performance-benchmark",
      title: "Glamporise Performance Benchmark",
      tag: "PageSpeed Audit",
      badge: null,
      cover: "linear-gradient(135deg,#0f2027,#2c5364)",
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
      links: [],
      video: "assets/dome-edit.mp4",  
      // Optional — shows a small credit label, bottom-left of the hero.
      heroCredit: { label: "Rendered by: Carlos Jingo", url: "https://www.facebook.com/wearysijey#" },
    },
    {
      id: "ebook-design",
      title: "The NSW Glamping Property Decoder",
      tag: "Ebook Design",
      badge: null,
      cover: "url('assets/decoder.jpg'), linear-gradient(135deg,#3a2a1a,#c9a227)",
      size: "tall",
      page: "project.html?id=ebook-design",
      subtitle: "Ebook Design",
      body: "Designed a 34-page paid ebook for Glamporise's Stage 1 membership offering (AU$50), featuring original illustrated cover artwork — a geodesic dome silhouette set inside an NSW state outline, a gold and dark color palette, and topographic line details — plus a custom color-weighted typography system and consistent information design throughout. Part of a broader content design set that also includes a 15-page masterclass guide (\"Is a Dome Viable For You?\") and a 3-part founding-offer guide series, totaling 50+ pages across the full collection.",
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
  // TODO: replace "#" with your actual Google Drive (or other) share
  // link to your CV file.
  cv: { label: "Download my CV", url: "#" },
};

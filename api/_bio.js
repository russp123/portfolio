/* ============================================================
   Server-side mirror of the bio facts in js/data.js — used only
   by api/chat.js to build the RUSSELLM system prompt.

   js/data.js is a browser <script> global (`PORTFOLIO`), not a
   Node module, so it can't be require()'d from a serverless
   function without adding a bundler. This is a small, trimmed,
   plain-text duplicate instead (no cover images/videos/HTML tags
   — none of that is useful to an LLM prompt).

   KEEP IN SYNC WITH js/data.js. The bio changes rarely; when it
   does, update both files.
   ============================================================ */

module.exports = {
  name: "Russel A. Pineda",
  title: "Full-Stack Developer",
  location: "Pampanga, Philippines",
  email: "rsslpnd@gmail.com",

  about:
    "I'm interested in what happens when one person ends up holding the whole picture of a business's tech instead of just one slice of it — the website, the automation, the security, the brand. That's mostly how things unfolded with my current work, as trust-building did its thing, one piece kept leading to the next. If something you're working on needs that kind of range, get in touch.",

  experience: [
    "Kingdomes Leisure Pty Ltd — 2025 to present",
    "La Rose Noire Philippines — 2025",
    "Cloudstaff Global Workplace Inc. — 2025",
  ],

  skills: [
    "Full-Stack Development: JavaScript, HTML, CSS, PHP, MySQL, Git, GitHub",
    "WordPress & CMS: WordPress Multisite, Elementor Pro, WooCommerce, API Integration, Database Optimization",
    "DevOps & Infrastructure: Cloudflare (DDoS mitigation, WAF, security hardening), DNS, SSL/TLS",
    "Automation & Marketing: GoHighLevel (CRM workflows, lead scoring), Email Deliverability (SPF/DKIM/DMARC), Mailgun Integration",
    "Design: Adobe Photoshop, Figma, Canva, SVG Design",
  ],

  projects: [
    "Kingdomes Product Configurator — an interactive web app for Kingdomes: procedurally generated SVG dome previews, a carousel state machine with selection-hierarchy logic, real-time pricing across 5 dome sizes, and GoHighLevel webhook integration for lead capture.",
    "Glamporise Council Roadmap — a live, complete customer-acquisition system for Glamporise: a primary landing page plus four stage-specific funnel pages, spanning design, web deployment, GoHighLevel membership infrastructure, email marketing, and workflow automation end-to-end. Converted an immediate Stage 2 membership sale shortly after launch.",
    "Glamporise Brand Identity — designed multiple original SVG-based logo concepts for Glamporise, a luxury glamping brand, translating native flora (the waratah flower) and campfire motifs into minimalist visual concepts in Photoshop and Figma.",
    "Plugin Cost Optimization — audited the WordPress plugin ecosystem for Kingdomes and decommissioned 7 redundant tools, consolidating their functions onto existing Cloudflare/VentraIP infrastructure and saving nearly $1,000 AUD annually.",
    "Glamporise Performance Benchmark — WordPress Multisite site built fresh (not migrated), scoring 94 Performance / 92 Accessibility / 92 Best Practices / 85 SEO on Google PageSpeed Insights.",
    "The NSW Glamping Property Decoder — a 34-page paid ebook for Glamporise's Stage 1 membership offering, with original illustrated cover art, a custom color-weighted typography system, and consistent information design throughout.",
  ],

  links: [
    "LinkedIn: https://linkedin.com/in/russel-pineda-4b9441347",
    "Instagram: https://www.instagram.com/rssl.pn/",
    "Facebook: https://www.facebook.com/rsslpnd",
  ],

  cta: "Open to hearing what you're working on.",
};

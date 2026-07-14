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

  // Availability pill in the header. Flip `available` to false when
  // you're booked — the pill hides entirely.
  available: true,
  availableText: "Open to work",

  // ---- Home page: About ----
  // Raw HTML is allowed here so you can inline links the same way
  // joseph.cv does (e.g. an underlined word with a small arrow).
  aboutHtml: `I'm Russ, a software engineer who handles the tech, then <i>automates what's left</i>. <a href="mailto:rsslpnd@gmail.com" class="about-cta">rsslpnd@gmail.com<sup>↗</sup></a>`,

  // ---- Long-form bio (plain text) ----
  // The homepage shows `aboutHtml` above; the RUSSELLM chat speaks from
  // this fuller version instead. api/_bio.js reads it as `about`.
  bio: "I'm interested in what happens when one person ends up holding the whole picture of a business's tech instead of just one slice of it — the website, the automation, the security, the brand. That's mostly how things unfolded with my current work, as trust-building did its thing, one piece kept leading to the next. If something you're working on needs that kind of range, get in touch.",

  // ---- Home page: Experience (shown in the "Experience" column) ----
  experience: [
    { name: "Kingdomes Leisure Pty Ltd", url: "https://kingdomes.com.au", year: "2025 —", roles: ["Lead Full-Stack Developer"] },
    { name: "La Rose Noire Philippines", url: "https://la-rose-noire.com/", year: "2025", roles: ["Associate Software Engineer"] },
    { name: "Cloudstaff Global Workplace Inc.", url: "https://www.cloudstaff.com/", year: "2025", roles: ["Associate Software Engineer Trainee", "Associate Software Quality Assurance Engineer Trainee"] },
  ],

  // ---- Home page: Skills ----
  // The source of truth for skill categories + their items. On the home
  // page these render as chips under the "What I do" pillars (each pillar
  // lists which categories it covers, below); clicking a chip reveals its
  // items. Also fed to RUSSELLM via api/_bio.js.
  skills: [
    { category: "Full-Stack Development", items: "JavaScript, HTML, CSS, PHP, MySQL, Git, GitHub" },
    { category: "WordPress & CMS", items: "WordPress + WP Multisite, Elementor Pro, WooCommerce, API Integration, Database Optimization" },
    { category: "Automation & Marketing", items: "GoHighLevel (CRM workflows, lead scoring), Email Deliverability (SPF/DKIM/DMARC), Mailgun Integration" },
    { category: "DevOps & Infrastructure", items: "Cloudflare (DDoS mitigation, WAF, security hardening), DNS, SSL/TLS" },
    { category: "Design", items: "Adobe Photoshop, Figma, Canva, SVG Design" },
  ],

  // ---- Home page: "What I do" pillars ----
  // Each pillar carries a description + the skill categories it covers
  // (must match a `category` in `skills` above). Rendered in the right
  // column; the categories appear as click-to-reveal chips.
  services: [
    {
      title: "Websites & Platforms",
      body: "WordPress & Multisite builds, high-converting landing pages, and the front end to match — architected to load fast and hold up.",
      skills: ["Full-Stack Development", "WordPress & CMS", "Design", "DevOps & Infrastructure"],
    },
    {
      title: "Automation & CRM",
      body: "GoHighLevel funnels, lead capture, and the workflows that run the follow-up so you don't have to.",
      skills: ["Automation & Marketing"],
    },
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
      llm: "Glamporise Council Roadmap — a live, complete customer-acquisition system for Glamporise: a primary landing page plus four stage-specific funnel pages, spanning design, web deployment, GoHighLevel membership infrastructure, email marketing, and workflow automation end-to-end. Converted an immediate Stage 2 membership sale shortly after launch.",
      title: "A 5-Page Funnel System",
      tag: "Funnel & CRM System",
      badge: "Live",
      cover: "url('assets/default.jpg')",
      size: "tall",
      page: "/council-roadmap",
      video: "assets/councilroadmap.mp4",
    },
    {
      id: "glamporise-website",
      llm: "Glamporise Website — the complete glamporise.com platform, built from scratch: an Apple-style multi-region WordPress Multisite architecture (glamporise.com/au/, /nz/, /ph/ — one installation, each region its own localized site, ccTLDs redirecting in), Elementor Pro front end wearing the Glamporise brand identity, Cloudflare security (DDoS/WAF/SSL), Mailgun email deliverability (SPF/DKIM/DMARC), and the Council Roadmap funnels running on top. Scored 94 Performance on PageSpeed as architected.",
      title: "Glamporise Website",
      tag: "WordPress Multisite Platform",
      badge: "Live",
      cover: "url('assets/glamporise.jpg')",
      size: "square",
      page: "/glamporise-website",
    },
    {
      id: "configurator",
      llm: "Kingdomes Product Configurator — a live product configurator on kingdomes.com.au: a 7-step guided flow (range, size, colours, upgrades, chimney, specs, quote) across two dome ranges and seven sizes, real-time multi-currency pricing (AUD/USD/NZD), and quote submissions posted straight into GoHighLevel as structured CRM leads. Built as a single self-contained HTML file with zero dependencies.",
      title: "Real-Time Product Configurator",
      tag: "Interactive Web App",
      badge: "Live",
      cover: "url('assets/default.jpg')",
      size: "wide",
      video: "assets/configurator.mp4",
      page: "/configurator",
    },
    {
      id: "kingdomes-assistant",
      llm: "Kingdomes AI Assistant — a conversational AI embedded on the Kingdomes website and connected to the brand's Facebook and Instagram inboxes, answering dome-kit questions instantly and in the brand's own voice across web and social from a single assistant. Grounded in a curated knowledge base and a friendly, plain-spoken Australian tone that stays helpful rather than salesy. In roughly six months live it engaged 71 unique contacts across 212 messages, doubled average engagement per contact (+100%), and triggered 28 automated actions.",
      title: "An Omnichannel AI Assistant",
      tag: "Conversational AI",
      badge: "Live",
      cover: "url('assets/chatbot.jpg')",
      size: "wide",
      page: "/project?id=kingdomes-assistant",
      subtitle: "Conversational AI",
      body: "A conversational AI assistant embedded on the Kingdomes site and wired into their Facebook and Instagram inboxes, so an inbound question gets an instant, on-brand answer on whichever channel a customer reaches out from. It's grounded in a curated knowledge base and speaks in the brand's own voice — friendly, plain-spoken Australian English, kept short and genuinely helpful rather than salesy — fielding the routine questions about dome kits for glamping, homes, and wellness spaces the moment they land, day or night, before they ever need a human.",
      role: "Conversational AI & Automation",
      tools: "GoHighLevel, Meta (Messenger & Instagram)",
      duration: "~6 months live",
      stats: [
        { label: "Unique Contacts", value: "71" },
        { label: "Messages Handled", value: "212" },
        { label: "Engagement Lift", value: "+100%" },
        { label: "Automated Actions", value: "28" },
      ],
      links: [{ label: "Kingdomes", url: "https://kingdomes.com.au" }],
    },
    {
      id: "cost-optimization",
      llm: "Plugin Cost Optimization — audited the WordPress plugin ecosystem for Kingdomes and decommissioned 7 redundant tools, consolidating their functions onto existing Cloudflare/VentraIP infrastructure and saving nearly $1,000 AUD annually.",
      title: "$1K/Year Plugin Cleanup",
      tag: "Infrastructure Audit",
      badge: null,
      cover: "url('assets/plugin.jpg')",
      size: "square",
      page: "/project?id=cost-optimization",
      subtitle: "Infrastructure Audit",
      body: "Audited the WordPress plugin ecosystem for Kingdomes and decommissioned 7 redundant or overlapping tools — including WP Rocket, Duplicator Pro, and 5 YITH WooCommerce extensions — consolidating their functions onto existing infrastructure (Cloudflare for caching/CDN, VentraIP for backups).",
      role: "Infrastructure Lead",
      tools: "Cloudflare, VentraIP",
      quote: "Saved nearly $1,000 AUD annually. — Jesse Anyan, Founder, Kingdomes",
      links: [],
    },
    {
      id: "brand-identity",
      llm: "Glamporise Brand Identity — designed the complete visual identity for Glamporise, Kingdomes' luxury glamping brand: 25+ exploratory logo concepts narrowed to a final mark combining waratah petals, a crown (the Kingdomes connection), and campfire flames; a five-colour palette led by Deep Sage Emerald (#06402B); a Cartesius + Poppins type system; and a 12-page brand guidelines document. Built in Photoshop and Figma.",
      title: "Brand Identity System",
      tag: "Logo & Visual Design",
      badge: null,
      cover: "url('assets/default.jpg')",
      size: "square",
      page: "/brand-identity",
      subtitle: "Logo & Visual Design",
      body: "Designed multiple original SVG-based logo concepts for Glamporise, a luxury glamping brand, translating the brand direction — native flora (the waratah flower) and campfire motifs — into minimalist visual concepts in Photoshop and Figma.",
      role: "Brand & Visual Designer",
      tools: "Photoshop, Figma, SVG",
      links: [{ label: "Glamporise", url: "https://glamporise.com" }],
      video: "assets/glamporise-logo-reveal-hd.mp4",
    },
{
      id: "performance-benchmark",
      llm: "Glamporise Performance Benchmark — WordPress Multisite site built fresh (not migrated), scoring 94 Performance / 92 Accessibility / 92 Best Practices / 85 SEO on Google PageSpeed Insights.",
      title: "Performance Benchmark",
      tag: "PageSpeed Audit",
      badge: null,
      cover: "url('assets/plugin-opt.jpg')",
      size: "wide",
      page: "/project?id=performance-benchmark",
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
      llm: "Kingdomes Masterclass — a single-scroll landing page and lead funnel on kingdomes.com.au for a free live masterclass ('Get your dome right the first time'), designed and built end to end: hero, value proposition, an attendee-qualifier section, a host bio, and a closing call-to-action, all driving to an embedded GoHighLevel registration form. Converted 18 sign-ups.",
      title: "Masterclass Funnel",
      tag: "Landing Page & Funnel",
      badge: "18 sign-ups",
      cover: "url('assets/mc-1-hero.jpg')",
      size: "wide",
      page: "/masterclass",
    },
        {
      id: "ebook-design",
      llm: "The NSW Glamping Property Decoder — a 34-page paid ebook for Glamporise's Stage 1 membership offering, with original illustrated cover art, a custom color-weighted typography system, and consistent information design throughout.",
      title: "The NSW Glamping Property Decoder",
      tag: "Ebook Design",
      badge: null,
      cover: "url('assets/837shots_so.jpeg')",
      size: "wide",
      page: "/ebook-design",
      subtitle: "Ebook Design",
      body: "Designed a 34-page paid ebook for Glamporise's Stage 1 membership offering (AU$27), featuring original illustrated cover artwork — a geodesic dome silhouette set inside an NSW state outline, a gold and dark color palette, and topographic line details — plus a custom color-weighted typography system and consistent information design throughout. Part of a broader content design set that also includes a 15-page masterclass guide (\"Is a Dome Viable For You?\") and a 3-part founding-offer guide series, totaling 50+ pages across the full collection.",
      role: "Content & Visual Designer",
      tools: "Figma, Photoshop",
      links: [],
    },
    {
      id: "founding-offer",
      llm: "Founding Offer — a long-form founding-offer landing page for the Kingdomes dome range ('first 5 deposits only'): a scarcity hook, the two dome ranges, an over-$10,000 value stack, buyer track selection, a competitor comparison table, a 36-month guarantee, and the Ground Zero add-on. The same funnel was replicated across two brands (Kingdomes and Glamporise) with copy tweaked to each brand's voice.",
      title: "Founding Offer",
      tag: "Conversion Landing Page",
      badge: null,
      cover: "url('assets/founding-offer.jpg')",
      size: "square",
      page: "/founding-offer",
    },
    {
      id: "ground-zero",
      llm: "Ground Zero Sales Page — a post-masterclass sales page (for Kingdomes / Glamporise) that turns warm leads into a paid next step. It presents a two-path offer — a full Ground Zero design-and-consultation package with a tiered pricing table, or a lower-commitment viability consultation — alongside a 3D design-service explainer, a breakdown of what happens in the consultation, and an FAQ.",
      title: "Ground Zero Sales Page",
      tag: "Post-Masterclass Sales Page",
      badge: null,
      cover: "url('assets/default.jpg')",
      size: "wide",
      page: "/ground-zero",
      video: "assets/dome-edit.mp4",
      heroCredit: { label: "Rendered by: Carlos Jingo", url: "https://www.facebook.com/wearysijey#" },


    },


  ],

  // ---- Home page: "What clients say" ----
  // Real client reviews (verbatim, originally left on Upwork before
  // moving off-platform). Both from Jesse Anyan, Founder of Kingdomes
  // Leisure Pty Ltd (and Glamporise, the brand under it) — credited by
  // role rather than repeating "Kingdomes" twice.
  testimonials: [
    {
      quote:
        "Russ was an absolute whizz at his job. Above and beyond with both work quality and speed. Our website got hacked and he managed to override and remove all traces and abilities for them to continue. That alone was amazing as it wasn't even part of the job. It is time for us to move forward but I would highly recommend Russ. Incredibly knowledgeable, always a pleasant person to work with.",
      name: "Jesse Anyan",
      role: "Founder, Kingdomes & Glamporise",
    },
    {
      quote:
        "I had the opportunity to work with Russel at La Rose Noire Philippines as part of the Software Development team, and it has been a great experience working with him. Russel is someone you can count on. He's hardworking, easy to work with, and always willing to help the team whenever needed. He approaches his tasks with a positive attitude, takes feedback well, and is always looking for ways to improve both his technical skills and the quality of his work.",
      name: "Ashley San Pedro",
      role: "Software Developer Team Lead, La Rose Noire Philippines",
    },
      {
      quote:
        "Russel is collaborative, easy to work with, and always willing to support the team when needed. He takes ownership of his work, pays attention to detail, and is committed to continuously improving his skills. His professionalism and positive attitude make him a valuable member of any development team. I highly recommend Russel to any organization looking for a dependable Software Developer who is dedicated to delivering high-quality work and contributing to team success.",
      name: "Stephen Karlle Dimitui",
      role: "Full Stack Developer, P&A Grant Thornton",
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

// This file is the single source of truth. It works as a browser
// <script> global (PORTFOLIO) AND as a Node module: api/_bio.js
// require()s it to build the RUSSELLM chat prompt. In the browser
// `module` is undefined, so this line is a harmless no-op.
if (typeof module !== "undefined" && module.exports) module.exports = PORTFOLIO;

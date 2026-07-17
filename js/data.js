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
    { name: "<a href=\"https://kingdomes.com.au\">Kingdomes Leisure Pty Ltd</a> & <a href=\"https://glamporise.com\">Glamporise</a>", url: null, year: "2025 —", roles: ["Lead Full-Stack Developer"] },
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

  // ---- Home page: Niche filter bar (above the project grid) ----
  // Each entry becomes a segment in the centered filter pill. `id` must
  // match the `niche` field on the projects below ("all" is built in).
  niches: [
    { id: "web", label: "Websites & Apps" },
    { id: "funnels", label: "Funnels & Pages" },
    { id: "automation", label: "Automation & AI" },
    { id: "design", label: "Design" },
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
      niche: "funnels",
      llm: "Membership Sales Funnel (the Glamporise Council Roadmap) — a live, complete customer-acquisition system for Glamporise: a primary landing page plus four stage-specific funnel pages, spanning design, web deployment, GoHighLevel membership infrastructure, email marketing, and workflow automation end-to-end. Converted an immediate Stage 2 membership sale shortly after launch.",
      title: "Membership Sales Funnel",
      tag: "Funnel & CRM System",
      badge: "Live",
      cover: "url('assets/default.jpg')",
      size: "tall",
      page: "/council-roadmap",
      video: "assets/councilroadmap.mp4",
    },
    {
      id: "glamporise-website",
      niche: "web",
      llm: "Brand Website Build (glamporise.com) — the complete glamporise.com platform, built from scratch: an Apple-style multi-region WordPress Multisite architecture (glamporise.com/au/, /nz/, /ph/ — one installation, each region its own localized site, ccTLDs redirecting in), Elementor Pro front end wearing the Glamporise brand identity, Cloudflare security (DDoS/WAF/SSL), Mailgun email deliverability (SPF/DKIM/DMARC), and the Council Roadmap funnels running on top. Scored 94 Performance on PageSpeed as architected.",
      title: "Brand Website Build",
      tag: "WordPress Multisite Platform",
      badge: "Live",
      cover: "url('assets/glamporise.jpg')",
      size: "square",
      page: "/glamporise-website",
    },
    {
      id: "configurator",
      niche: "web",
      llm: "Interactive Shop Experience (the Kingdomes product configurator) — a live product configurator on kingdomes.com.au: a 7-step guided flow (range, size, colours, upgrades, chimney, specs, quote) across two dome ranges and seven sizes, real-time multi-currency pricing (AUD/USD/NZD), and quote submissions posted straight into GoHighLevel as structured CRM leads. Built as a single self-contained HTML file with zero dependencies.",
      title: "Interactive Shop Experience",
      tag: "Interactive Web App",
      badge: "Live",
      cover: "url('assets/default.jpg')",
      size: "wide",
      video: "assets/configurator.mp4",
      page: "/configurator",
    },
    {
      id: "kingdomes-assistant",
      niche: "automation",
      llm: "AI Customer Assistant (Kingdomes) — a conversational AI answering inbound questions for Kingdomes across three channels (website chat, Facebook DMs, Instagram DMs) from one unified inbox. Rolled out in phases: website first, trained on FAQ content, the product range, and qualifying questions; then extended to the Meta channels once the logic was stable. When a conversation hits a qualification threshold it's flagged for human follow-up, so the team only steps in for warm leads. Production-readiness took systematic QA through realistic test conversations — catching and fixing premature contact-detail requests, false availability confirmations, and references to documents not yet ready to share. In roughly six months live it engaged 71 unique contacts across 212 messages, doubled average engagement per contact (+100%), and triggered 28 automated actions.",
      title: "AI Customer Assistant",
      tag: "Conversational AI",
      badge: "Live",
      cover: "url('assets/chatbot.jpg')",
      size: "wide",
      page: "/project?id=kingdomes-assistant",
      subtitle: "Conversational AI",
      body: "Inbound inquiries were arriving faster than the team could answer, and slow replies on social DMs were costing warm leads mid-purchase-decision. This assistant now fields them instantly, 24/7, across three channels — website chat, Facebook, and Instagram — all visible in one unified inbox. It was rolled out in phases: the website first, trained on FAQ content, the product range, and qualifying questions, then extended to the Meta channels once the logic was stable. It speaks in the brand's own voice — friendly, plain-spoken Australian English, helpful rather than salesy — and when a conversation reaches a qualification threshold, it's flagged for human follow-up, so the team only steps in when a lead is genuinely warm. Getting there took systematic QA through realistic test conversations, not just configuration review: catching and fixing an early habit of asking for contact details too soon, false 'yes' answers on configurations that weren't available, and references to documents that weren't ready to be shared.",
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
      id: "security-response",
      niche: "web",
      llm: "Security Breach Response — in March 2026 kingdomes.com.au came under a layered attack: an 867,000-request volumetric DDoS used as cover while attackers planted four backdoor admin accounts and injected a gambling-spam script into site files. Russel detected, scoped, and contained the breach in two hours — removed all four backdoor accounts, cleaned the injected code, closed the entry point — then spent five more hours hardening the platform (edge-level rate limiting and geographic filtering, CMS file-edit lockdown, credential rotation, active monitoring). No data loss, no extended downtime, no recurrence. It wasn't part of the job scope; the client publicly credited it in a review.",
      title: "Cybersecurity",
      tag: "Security Incident Response",
      badge: null,
      cover: "url('assets/kingdomes-bg.jpg')",
      size: "wide",
      page: "/security-response",
    },
    {
      id: "cost-optimization",
      niche: "web",
      llm: "Plugin Cost Optimization — audited the WordPress plugin ecosystem for Kingdomes and decommissioned 7 redundant tools, consolidating their functions onto existing Cloudflare/VentraIP infrastructure and saving nearly $1,000 AUD annually.",
      title: "Infrastructure Audit",
      tag: "$1K/Year Plugin Cleanup",
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
      id: "ebook-design",
      niche: "design",
      llm: "Paid Ebook Design ('The NSW Glamping Property Decoder') — a 34-page paid ebook for Glamporise's Stage 1 membership offering, with original illustrated cover art, a custom color-weighted typography system, and consistent information design throughout.",
      title: "Paid Ebook Design",
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
      id: "brand-identity",
      niche: "design",
      llm: "Logo & Brand Design (Glamporise) — designed the complete visual identity for Glamporise, Kingdomes' luxury glamping brand: 25+ exploratory logo concepts narrowed to a final mark combining waratah petals, a crown (the Kingdomes connection), and campfire flames; a five-colour palette led by Deep Sage Emerald (#06402B); a Cartesius + Poppins type system; and a 12-page brand guidelines document. Built in Photoshop and Figma.",
      title: "Logo & Brand Design",
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
      id: "membership-stack",
      niche: "automation",
      llm: "Automated Membership Platform — the payments and content-delivery backend behind Glamporise's four-tier offer, built natively in GoHighLevel with Stripe: one funnel per stage, each with its own Stripe product; on payment the customer is tagged by tier (cumulatively, so their full history lives on one contact record), membership content unlocks in a custom-domain client portal, a welcome sequence fires, and the next stage's upsell is presented automatically. Includes a $0 test product so the full purchase flow could be QA'd end-to-end without processing real payments. Debugging highlights: GHL treats Stripe test-mode events differently from live (workflows silently don't fire), and a DND contact flag silently suppresses all workflow triggers — two non-obvious failure modes identified and resolved.",
      title: "Automated Membership Platform",
      tag: "Payments & Membership Automation",
      badge: "Live",
      cover: "url('assets/membership.jpg')",
      size: "tall",
      page: "/project?id=membership-stack",
      subtitle: "Payments & Membership Automation",
      body: "The engine behind Glamporise's four-tier offer — everything that happens after a visitor clicks buy. Each stage runs its own funnel and Stripe product; the moment a payment clears, GoHighLevel workflows take over: the customer is tagged by tier (cumulatively, so one contact record carries their whole history), membership content unlocks in a client portal served under the brand's own domain, a welcome sequence fires, and the next stage's upsell is presented automatically. A $0 test product made the whole chain — form, Stripe, workflow, content access — testable end-to-end without real payments. Two non-obvious platform quirks were diagnosed along the way: GHL handles Stripe test-mode events differently from live (workflows silently don't fire), and a DND flag on a contact silently suppresses every workflow trigger — the kind of failure most operators burn days on.",
      role: "Automation Architect",
      tools: "GoHighLevel, Stripe",
      stats: [
        { label: "Offer Tiers, One Record", value: "4" },
        { label: "Third-Party Course Tools", value: "0" },
      ],
      links: [{ label: "Council Roadmap", url: "https://glamporise.com/council-roadmap" }],
    },
{
      id: "performance-benchmark",
      niche: "web",
      llm: "Website Speed Audit (Glamporise) — WordPress Multisite site built fresh (not migrated), scoring 94 Performance / 92 Accessibility / 92 Best Practices / 85 SEO on Google PageSpeed Insights.",
      title: "Website Speed Audit",
      tag: "PageSpeed Audit",
      badge: null,
      cover: "url('assets/plugin-opt.jpg')",
      size: "tall",
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
      id: "email-deliverability",
      niche: "automation",
      llm: "Branded Email Sending — dedicated transactional email sending for both Kingdomes and Glamporise via Mailgun, each brand on its own sending subdomain with SPF, DKIM, and DMARC verified in DNS, giving each an isolated sender reputation instead of GoHighLevel's shared infrastructure. Also fixed an Outlook 'sent on behalf of' display issue caused by a mismatched From/Sender header, and reworked email content structure to escape Gmail's Promotions tab. Result: both brands land reliably in the Primary inbox and display correctly across clients.",
      title: "Email Marketing",
      tag: "Email Deliverability",
      badge: "Live",
      cover: "url('assets/mailgun.jpg')",
      size: "square",
      page: "/project?id=email-deliverability",
      subtitle: "Email Deliverability",
      body: "GoHighLevel's default sending rides shared infrastructure — shared IPs, shared reputation, no domain authentication — which for a brand doing real outbound (nurture sequences, purchase confirmations, ebook delivery) means flirting with the spam folder. Both Kingdomes and Glamporise were moved onto dedicated Mailgun sending subdomains with SPF, DKIM, and DMARC verified in DNS, so each brand owns an isolated sender reputation. Two subtler fixes rode along: an Outlook 'sent on behalf of' display issue traced to a mismatched From/Sender header — the kind of flaw that doesn't block delivery, just quietly looks unprofessional — and email content restructured to land in Gmail's Primary tab instead of Promotions.",
      role: "Infrastructure & Deliverability",
      tools: "Mailgun, DNS (SPF/DKIM/DMARC), GoHighLevel",
      stats: [
        { label: "Brands, Isolated Reputations", value: "2" },
        { label: "Auth Records per Domain", value: "3" },
        { label: "Inbox Placement", value: "Primary" },
      ],
      links: [],
    },
    {
      id: "masterclass",
      niche: "funnels",
      llm: "Webinar Sign-Up Page (the Kingdomes Masterclass) — a single-scroll landing page and lead funnel on kingdomes.com.au for a free live masterclass ('Get your dome right the first time'), designed and built end to end: hero, value proposition, an attendee-qualifier section, a host bio, and a closing call-to-action, all driving to an embedded GoHighLevel registration form. Converted 18 sign-ups.",
      title: "Webinar Sign-Up Page",
      tag: "Landing Page & Funnel",
      badge: "18 sign-ups",
      cover: "url('assets/mc-1-hero.jpg')",
      size: "wide",
      page: "/masterclass",
    },

    {
      id: "lead-scoring",
      niche: "automation",
      llm: "CRM Lead Scoring — a lead-scoring engine built inside GoHighLevel for Kingdomes and Glamporise: behavioral triggers assign score tags on key actions (form submissions, email opens, funnel page visits), workflow logic accumulates them into a total score, and contacts are grouped into Cold / Warm / Hot / Priority engagement tiers surfaced on a scoreboard view. Cooldown windows prevent repeated actions (like re-opening the same email) from inflating scores. Result: sales-ready leads are visible at a glance without manually reviewing hundreds of raw entries.",
      title: "CRM Lead Scoring",
      tag: "CRM Automation",
      badge: null,
      cover: "url('assets/leadscoring.jpg')",
      size: "square",
      page: "/project?id=lead-scoring",
      subtitle: "CRM Automation",
      body: "Not all leads are equal — but without a system to tell them apart, a cold inquiry gets the same attention as a repeat-engaged prospect. This is a tag-based scoring engine built inside GoHighLevel: behavioral triggers assign score tags on key actions (form submissions, email opens, funnel page visits), workflow logic accumulates them into a running total, and contacts land in Cold / Warm / Hot / Priority tiers surfaced on a scoreboard view. Cooldown windows are built into the workflows so repeated actions — opening the same email three times — can't inflate a score artificially; an action only counts once per defined window. The team opens the CRM and immediately sees who's worth calling today.",
      role: "Automation Architect",
      tools: "GoHighLevel (workflows, tags, smart lists)",
      stats: [
        { label: "Engagement Tiers", value: "4" },
        { label: "Manual Lead Review", value: "0" },
      ],
      links: [],
    },

    {
      id: "email-designs",
      niche: "design",
      llm: "Email Campaign Design — a four-email launch sequence designed for Kingdomes' Aura Dome (Australia's first frameless geodesic dome), taking a subscriber from reveal to booked call: (1) the launch announcement, (2) a  trial-night offer at Bilpin with the full amount credited toward a deposit if they buy within 30 days, (3) a manufacturing/delivery update (50 units in 2026, priority vs standard delivery windows), and (4) a last-call follow-up (10 trial slots left, priority delivery nearly allocated). Scrolling story layouts with polaroid collages and a gold-and-white palette, sent through authenticated Mailgun infrastructure.",
      title: "Email Campaign Design",
      tag: "Email Campaign Design",
      badge: null,
      cover: "url('assets/email-campaign.jpg')",
      size: "wide",
      page: "/email-designs",
    },
    {
      id: "founding-offer",
      niche: "funnels",
      llm: "Sales Landing Page (the Founding Offer) — a long-form founding-offer landing page for the Kingdomes dome range ('first 5 deposits only'): a scarcity hook, the two dome ranges, an over-$10,000 value stack, buyer track selection, a competitor comparison table, a 36-month guarantee, and the Ground Zero add-on. The same funnel was replicated across two brands (Kingdomes and Glamporise) with copy tweaked to each brand's voice.",
      title: "Sales Landing Page",
      tag: "Conversion Landing Page",
      badge: null,
      cover: "url('assets/founding-offer.jpg')",
      size: "square",
      page: "/founding-offer",
    },
    {
      id: "ground-zero",
      niche: "funnels",
      llm: "Service Offer Page (Ground Zero) — a post-masterclass sales page (for Kingdomes / Glamporise) that turns warm leads into a paid next step. It presents a two-path offer — a full Ground Zero design-and-consultation package with a tiered pricing table, or a lower-commitment viability consultation — alongside a 3D design-service explainer, a breakdown of what happens in the consultation, and an FAQ.",
      title: "Service Offer Page",
      tag: "Post-Masterclass Sales Page",
      badge: null,
      cover: "url('assets/default.jpg')",
      size: "wide",
      page: "/ground-zero",
      video: "assets/dome-edit.mp4",
      heroCredit: { label: "Rendered by: Carlos Jingco", url: "https://www.facebook.com/wearysijey#" },


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
          {
      quote:
        "Russ and I worked together in Kingdomes and Glamporise, in which a somewhat of a real estate companies but outdoor. I’m the marketer of the team, and I really need to work with Russ in various marketing tasks simultaneously. Basically he’s in charge on execution, such as building various landing pages and websites to creating AI automations. One thing and only one thing is I can say while working is Russ. Bloody legend of a person. Character and work ethic are just peak. Highly recommend this bloke for any IT stuff you guys need. Even I would always come back to him every time I would be needing his skills. ",
      name: "Joshua Lampa",
      role: "Digital Marketer, Kingdomes & Glamporise",
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

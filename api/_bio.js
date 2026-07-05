/* ============================================================
   RUSSELLM knowledge — DERIVED from js/data.js, the single source
   of truth. api/chat.js requires this to build the system prompt.

   Nothing here is hand-maintained anymore. To change what the chat
   bot knows, edit js/data.js:
     - `bio`                     → the long-form "about" it speaks from
     - each project's `llm`      → the plain-text summary of that project
     - experience / skills / links → reused as-is
   js/data.js exports itself as a Node module (via a guard at its end)
   while still working as a browser <script>, so we can require() it
   here without a bundler — no more duplicate file to keep in sync.
   ============================================================ */

const P = require("../js/data.js");

module.exports = {
  name: P.name,
  title: P.title,
  location: P.location,
  email: P.email,
  about: P.bio,
  experience: P.experience.map(
    (e) => `${e.name} — ${e.year}${e.roles && e.roles.length ? ` (${e.roles.join(", ")})` : ""}`
  ),
  skills: P.skills.map((s) => `${s.category}: ${s.items}`),
  // Only projects that carry an `llm` summary are exposed to the bot.
  projects: P.projects.map((p) => p.llm).filter(Boolean),
  links: P.links.map((l) => `${l.label}: ${l.url}`),
  cta: P.cta,
};

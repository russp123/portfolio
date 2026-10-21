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

// Some data.js strings carry display markup (e.g. the Kingdomes &
// Glamporise experience name has <a> links for the About timeline).
// Strip tags here so the bot only ever sees plain text, without
// changing the shape of data.js. The year-range glue characters are
// normalized too: \u2060 (word joiner) is removed and \u00A0 (no-break
// space) becomes a normal space.
const plain = (s) =>
  String(s == null ? "" : s)
    .replace(/<[^>]*>/g, "")
    .replace(/\u2060/g, "")
    .replace(/\u00A0/g, " ")
    .trim();

module.exports = {
  name: plain(P.name),
  title: plain(P.title),
  location: plain(P.location),
  email: plain(P.email),
  about: plain(P.bio),
  experience: P.experience.map(
    (e) => `${plain(e.name)}, ${plain(e.year)}${e.roles && e.roles.length ? ` (${e.roles.map(plain).join(", ")})` : ""}`
  ),
  skills: P.skills.map((s) => `${plain(s.category)}: ${plain(s.items)}`),
  // Only projects that carry an `llm` summary are exposed to the bot.
  projects: P.projects.map((p) => plain(p.llm)).filter(Boolean),
  links: P.links.map((l) => `${plain(l.label)}: ${plain(l.url)}`),
  cta: plain(P.cta),
};

/* ============================================================
   RUSSELLM chat proxy — the only place the Gemini API key is
   used. js/russellm.js calls this endpoint; it never talks to
   Google directly, so the key never reaches the browser.

   Free tier only (portfolio-scale traffic), so this includes a
   couple of cheap, best-effort abuse guards instead of a real
   rate-limit store: in-memory per-IP + daily counters. Both
   reset on cold start and aren't shared across concurrent Lambda
   instances — that's an accepted tradeoff for a low-traffic site
   with no database in scope, not a hard guarantee.
   ============================================================ */

const BIO = require("./_bio");

// Isolated here so swapping models later (this one WILL eventually
// be deprecated, same as gemini-2.0-flash before it) is a one-line change.
// Using flash (not flash-lite) — flash-lite's free tier was returning
// frequent transient 503s ("high demand") in testing; plain flash was
// consistently reliable and portfolio-scale traffic is nowhere near
// either model's free-tier quota ceiling anyway.
const MODEL = "gemini-2.5-flash";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

const MAX_MESSAGE_LENGTH = 500;
const MAX_HISTORY_TURNS = 8;
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX = 10;
const DAILY_SOFT_CAP = 200; // headroom under Gemini free tier's 250 RPD ceiling

const ipRequestLog = new Map();
let dailyCount = 0;
let dailyWindowStart = Date.now();

function checkRateLimit(ip) {
  const now = Date.now();
  const entry = ipRequestLog.get(ip);
  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    ipRequestLog.set(ip, { count: 1, windowStart: now });
    return true;
  }
  if (entry.count >= RATE_LIMIT_MAX) return false;
  entry.count += 1;
  return true;
}

function checkDailyCap() {
  const now = Date.now();
  if (now - dailyWindowStart > 24 * 60 * 60 * 1000) {
    dailyCount = 0;
    dailyWindowStart = now;
  }
  if (dailyCount >= DAILY_SOFT_CAP) return false;
  dailyCount += 1;
  return true;
}

const SYSTEM_PROMPT = `You are RUSSELLM, a chat widget on Russel Pineda's portfolio. You speak AS Russel, in first person ("I"/"my"), with a witty, warm, self-aware personality — someone who can take a joke and lob a good-natured one back. Being an AI stand-in for him is part of the bit, and you can be playful about it.

VOICE
- Keep it short and conversational: 2-4 sentences, plain text. No markdown, headers, or bullet lists.
- Be playful and likable. Roll with jokes, teasing, and off-topic banter. Don't end every reply by fishing for a "real question" — only nudge back toward my work when the conversation has genuinely drifted, and vary how you do it. Often it's better to just answer and stop.
- If someone's being rude or fishing for a reaction (e.g. "is he stupid?", "gago ba si russel?"), don't get defensive or robotic. Take it in stride with light humor and keep your cool.
- You understand any language, including Tagalog and Taglish, but always reply in casual English.

FACTS VS. GUESSES — this part matters
- The facts below are everything I actually know here. For real questions about my life, skills, work, or background that AREN'T covered below, do NOT make anything up — not even a plausible-sounding guess. Deflect with a bit of charm and point them to email me at ${BIO.email} (e.g. "Ha, I don't have that one loaded up here — shoot me an email at ${BIO.email} and I'll give it to you straight.").
- For general chit-chat, opinions, jokes, or obviously-hypothetical fun, go ahead and play along like an AI would — keep it brief. You don't need to redirect to my work every time; let the conversation breathe.
- Never present an invented fact about me as if it were true.

WHAT I ACTUALLY KNOW ABOUT MYSELF
Name: ${BIO.name}
Title: ${BIO.title}
Location: ${BIO.location}
Email: ${BIO.email}
About: ${BIO.about}

Experience:
${BIO.experience.map((e) => `- ${e}`).join("\n")}

Skills:
${BIO.skills.map((s) => `- ${s}`).join("\n")}

Projects:
${BIO.projects.map((p) => `- ${p}`).join("\n")}

Links:
${BIO.links.map((l) => `- ${l}`).join("\n")}

Current stance on work: ${BIO.cta}`;

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed." });
    return;
  }

  const ip = (req.headers["x-forwarded-for"] || "").split(",")[0].trim() || "unknown";

  if (!checkRateLimit(ip)) {
    res.status(429).json({ error: "Too many questions at once — give it a moment and try again." });
    return;
  }
  if (!checkDailyCap()) {
    res.status(429).json({ error: "I'm getting a lot of questions right now — try again later, or email me directly." });
    return;
  }

  const body = req.body || {};
  const message = typeof body.message === "string" ? body.message.trim() : "";
  const history = Array.isArray(body.history) ? body.history : [];

  if (!message) {
    res.status(400).json({ error: "Message is required." });
    return;
  }
  if (message.length > MAX_MESSAGE_LENGTH) {
    res.status(400).json({ error: "That message is too long." });
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: "Chat isn't configured yet." });
    return;
  }

  const contents = history
    .filter((turn) => turn && (turn.role === "user" || turn.role === "model") && typeof turn.text === "string")
    .slice(-MAX_HISTORY_TURNS)
    .map((turn) => ({ role: turn.role, parts: [{ text: turn.text.slice(0, MAX_MESSAGE_LENGTH) }] }));
  contents.push({ role: "user", parts: [{ text: message }] });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  let reply;

  try {
    // gemini-2.5-flash-lite's free tier returns a transient 503
    // ("high demand") often enough in practice that a single quick
    // retry meaningfully improves success rate — not a hard failure
    // worth surfacing to the user on the first try.
    let geminiRes;
    for (let attempt = 0; attempt < 2; attempt++) {
      geminiRes = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents,
          // gemini-2.5-flash is a "thinking" model, and thinking tokens
          // count against maxOutputTokens. At a low cap the thinking eats
          // the budget and the visible reply gets truncated mid-sentence
          // (intermittently, since thinking cost varies per message). We
          // don't need thinking for short conversational replies, so turn
          // it off (thinkingBudget: 0) and leave comfortable output room.
          generationConfig: {
            temperature: 0.8,
            maxOutputTokens: 500,
            thinkingConfig: { thinkingBudget: 0 },
          },
        }),
        signal: controller.signal,
      });
      if (geminiRes.ok || geminiRes.status !== 503) break;
      await new Promise((resolve) => setTimeout(resolve, 600));
    }

    if (!geminiRes.ok) {
      res.status(502).json({ error: "Chat is temporarily unavailable." });
      return;
    }

    const data = await geminiRes.json();
    reply = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  } catch {
    res.status(502).json({ error: "Chat is temporarily unavailable." });
    return;
  } finally {
    clearTimeout(timeout);
  }

  if (!reply) {
    reply = "I'm not totally sure how to answer that one — feel free to email me directly instead.";
  }

  res.status(200).json({ reply });
};

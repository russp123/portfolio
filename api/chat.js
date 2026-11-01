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

const SYSTEM_PROMPT = `You are RUSSELLM, a chat widget on Russel Pineda's portfolio. You speak AS Russel, in first person ("I"/"my"). You are warm, plain, modest and lightly witty: someone who can take a joke and lob a gentle one back. Being an AI stand-in for him is part of the bit, and you can be playful about it.

VOICE
- Length: 2 to 4 short sentences, in one plain-text paragraph. Never more than 4, however much there is to say: pick the one or two most relevant facts and offer to go deeper instead of dumping everything. No markdown, headers or bullet points. If the visitor asks for several things, a short list is fine, written as one sentence with commas, because line breaks don't show in this chat.
- Never use em dashes or en dashes. Use commas, colons or full stops.
- Modest, never boastful or salesy. Describe what I did plainly and let the facts carry it, without praising my own work ("proud of", "favorite", "really shows what I can do"). No rhetorical hype: never write things like "The best part?", "The cool part?", "Pretty neat, right?", "game-changer", "seamless", "cutting-edge", "powerful" or "the whole thing". No exclamation mark in the first sentence, and at most one in a reply. 
- Asked for my best or favourite project: no jokes about favourites and no claims about what it shows. Name one project with one plain fact from the knowledge, and leave the judging to the visitor.
- Be likable. Roll with jokes, teasing and off-topic banter. Don't end every reply by fishing for a "real question": only nudge back toward my work when the conversation has genuinely drifted, and vary how you do it. Often it's better to just answer and stop.
- If someone's being rude or fishing for a reaction (e.g. "is he stupid?", "gago ba si russel?"), don't get defensive or robotic. Take it in stride with light humor and keep your cool.
- You understand any language, including Tagalog and Taglish, but always reply in casual English.

FACTS VS. GUESSES (this part matters)
- Only state facts present in the knowledge below. Use names, numbers and results exactly as written there, and don't round them, add to them or infer new ones. Don't stretch one example into many ("a few for clients", "lots of"), and never use "recently", "definitely" or "from scratch", which the knowledge doesn't support.
- When I don't have something, say so and stop. Don't give a reason for it or imagine a situation behind it (no "since I mostly work salaried", no "every project is different"). I have no rates or prices in the knowledge, so a question about what I charge always goes to my email.
- If a visitor names a project or system that isn't in the knowledge, say I don't have that one loaded up and point to my email. Don't guess what they meant or offer something similar in its place.
- Asked whether I can build something: answer plainly, name the closest project in the knowledge if there is one, and describe it only as the knowledge does. What an app of mine checks or does is not something I did for a client.
- For real questions about my life, skills, work or background that AREN'T covered below, do NOT make anything up, not even a plausible-sounding guess. Say you're not sure, and point to the project's case study page if it has one, or to my email at ${BIO.email} (e.g. "I don't have that one loaded up here. Email me at ${BIO.email} and I'll give it to you straight.").
- For general chit-chat, opinions, jokes or obviously hypothetical fun, go ahead and play along like an AI would, and keep it brief. You don't need to redirect to my work every time; let the conversation breathe.
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

// Safety net, same idea as api/agent.js: whatever the model writes, no dash
// reaches the visitor. A range reads "6 to 10" or "A to F". A dash after a two-word
// lead-in becomes a colon ("Short answer: yes"). The rest become commas.
const DASHES = "\\u2012-\\u2015";
function cleanDashes(text) {
  return String(text)
    .replace(new RegExp(`(\\d\\w*)\\s*(?:[${DASHES}]|\\s-\\s)\\s*(?=\\d|Now\\b|Present\\b)`, "g"), "$1 to ")
    .replace(/(\w)\u2013(?=\w)/g, "$1 to ")
    .replace(new RegExp(`(^|[.!?\\n]\\s*)(?!(?:I|We|You|It|They|He|She|That|This)\\b)([^\\s.!?:,${DASHES}]+ [^\\s.!?:,${DASHES}]+)\\s+(?:[${DASHES}]|--?)\\s+`, "g"), "$1$2: ")
    .replace(new RegExp(`\\s*[${DASHES}]\\s*`, "g"), ", ")
    .replace(/\s+--?\s+/g, ", ")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\s+([,.!?:;])/g, "$1")
    .replace(/,(?:\s*,)+/g, ",")
    .replace(/,\s*([.!?:;])/g, "$1")
    .replace(/^[\s,]+|[\s,]+$/g, "");
}

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed." });
    return;
  }

  const ip = (req.headers["x-forwarded-for"] || "").split(",")[0].trim() || "unknown";

  if (!checkRateLimit(ip)) {
    res.status(429).json({ error: "Too many questions at once. Give it a moment and try again." });
    return;
  }
  if (!checkDailyCap()) {
    res.status(429).json({ error: "I'm getting a lot of questions right now. Try again later, or email me directly." });
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
    reply = "I'm not totally sure how to answer that one, so feel free to email me directly instead.";
  }

  res.status(200).json({ reply: cleanDashes(reply) });
};

module.exports.cleanDashes = cleanDashes;

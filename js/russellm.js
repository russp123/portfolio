/* ============================================================
   RUSSELLM: the "ask me about myself" chat widget. A launcher
   bottom-right with an unread badge and a preview card, and a chat
   panel above it. Self-contained: wires its own
   launcher/panel/log/chips/form and talks only to /api/chat (never to Gemini directly). Follows
   the same plain-function, single DOMContentLoaded-init pattern
   as js/theme.js.
   ============================================================ */

// Static suggestion pool — no extra LLM calls just to pick
// follow-up questions, keeps the free-tier quota spent on real
// replies only. Grouped by topic so renderChips() can avoid
// repeating whatever was just asked.
const RUSSELLM_CHIP_POOL = [
  { topic: "about", text: "What do you do?" },
  { topic: "about", text: "Where are you based?" },
  { topic: "experience", text: "What's your experience?" },
  { topic: "experience", text: "Where do you currently work?" },
  { topic: "skills", text: "What are your technical skills?" },
  { topic: "skills", text: "Do you work with WordPress?" },
  { topic: "projects", text: "What projects have you worked on?" },
  { topic: "projects", text: "Tell me about the Kingdomes configurator." },
  { topic: "contact", text: "How can I get in touch?" },
  { topic: "contact", text: "Are you open to new work?" },
];

let russellmHistory = [];
let russellmOpen = false;
let russellmSending = false;
let russellmLastTopic = null;
// The greeting isn't part of russellmHistory (it's not sent to the API),
// so gate it with its own flag — otherwise every open/close/open before
// the first real message appends another copy of the greeting.
let russellmGreeted = false;

function initRussellm() {
  const toggle = document.getElementById("russellm-toggle");
  const drawer = document.getElementById("russellm-drawer");
  const overlay = document.getElementById("russellm-overlay");
  const closeBtn = document.getElementById("russellm-close");
  const form = document.getElementById("russellm-form");
  const input = document.getElementById("russellm-input");
  if (!toggle || !drawer || !overlay || !closeBtn || !form || !input) return;

  toggle.addEventListener("click", () => (russellmOpen ? closeRussellmDrawer() : openRussellmDrawer()));
  initRussellmPreview();
  closeBtn.addEventListener("click", closeRussellmDrawer);
  overlay.addEventListener("click", closeRussellmDrawer);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && russellmOpen) closeRussellmDrawer();
  });
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const text = input.value;
    input.value = "";
    russellmSendMessage(text);
  });

  // Keep the drawer fitted to the *visible* viewport. On mobile the
  // on-screen keyboard covers the bottom of the screen, but a
  // `height:100vh` fixed drawer doesn't know that — so the input row
  // ends up hidden behind the keyboard. The visualViewport API reports
  // the area actually visible above the keyboard; syncing the drawer's
  // height/top to it lifts the input right above the keyboard.
  if (window.visualViewport) {
    window.visualViewport.addEventListener("resize", syncRussellmViewport);
    window.visualViewport.addEventListener("scroll", syncRussellmViewport);
  }
  // When the input gains focus (keyboard opening), make sure the latest
  // message + the input are scrolled into view.
  input.addEventListener("focus", () => {
    setTimeout(scrollRussellmLog, 300);
  });
}

// The preview card shows once per visit, not on every page. The badge
// stays until the chat has been opened.
const RUSSELLM_SEEN_KEY = "russellm.seen";
const RUSSELLM_PREVIEW_KEY = "russellm.previewShown";
function russellmFlag(key) {
  try { return window.sessionStorage.getItem(key) === "1"; } catch (e) { return false; }
}
function setRussellmFlag(key) {
  try { window.sessionStorage.setItem(key, "1"); } catch (e) { /* in-memory only */ }
}
function markRussellmSeen() {
  setRussellmFlag(RUSSELLM_SEEN_KEY);
  hideRussellmPreview();
  const badge = document.getElementById("russellm-badge");
  if (badge) badge.hidden = true;
}
function hideRussellmPreview() {
  const card = document.getElementById("russellm-preview");
  if (card) card.classList.remove("show");
}
function initRussellmPreview() {
  if (russellmFlag(RUSSELLM_SEEN_KEY)) {
    const badge = document.getElementById("russellm-badge");
    if (badge) badge.hidden = true;
    return;
  }
  if (russellmFlag(RUSSELLM_PREVIEW_KEY)) return;
  const card = document.createElement("div");
  card.className = "russellm-preview";
  card.id = "russellm-preview";
  card.setAttribute("role", "button");
  card.setAttribute("tabindex", "0");
  card.setAttribute("aria-label", "Open chat with RUSSELLM");
  card.innerHTML = `<img src="assets/russellm-avatar.jpg" alt="" width="38" height="38" />
    <span class="russellm-preview-text"><strong>Hi there, ask me anything about Russel's work.</strong><small>RUSSELLM AI · Just now</small></span>
    <button type="button" class="russellm-preview-close" aria-label="Dismiss">×</button>`;
  document.body.appendChild(card);
  card.addEventListener("click", (e) => {
    if (e.target.closest(".russellm-preview-close")) return hideRussellmPreview();
    openRussellmDrawer();
  });
  card.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openRussellmDrawer();
    }
  });
  setTimeout(() => {
    if (russellmOpen) return;
    card.classList.add("show");
    setRussellmFlag(RUSSELLM_PREVIEW_KEY);
  }, 1200);
  // On a phone it would sit over the page, so it doesn't stay. The badge does.
  if (russellmIsPhone()) setTimeout(hideRussellmPreview, 9000);
}
const russellmIsPhone = () => window.matchMedia("(max-width: 600px)").matches;

function syncRussellmViewport() {
  const drawer = document.getElementById("russellm-drawer");
  if (!drawer) return;
  const vv = window.visualViewport;
  if (!russellmOpen || !vv || !russellmIsPhone()) {
    // Not open (or unsupported) — hand height/position back to the CSS.
    drawer.style.height = "";
    drawer.style.top = "";
    return;
  }
  drawer.style.height = vv.height + "px";
  drawer.style.top = vv.offsetTop + "px";
}

function openRussellmDrawer() {
  const drawer = document.getElementById("russellm-drawer");
  const overlay = document.getElementById("russellm-overlay");
  if (!drawer || !overlay) return;
  russellmOpen = true;
  drawer.classList.add("open");
  overlay.classList.add("open");
  drawer.setAttribute("aria-hidden", "false");
  document.getElementById("russellm-toggle").setAttribute("aria-expanded", "true");
  markRussellmSeen();
  if (!russellmGreeted) {
    russellmGreeted = true;
    renderRussellmGreeting();
  }
  syncRussellmViewport();
  // Don't auto-focus on touch devices — it forces the keyboard open
  // the instant the drawer appears, which is jarring; let the user tap
  // the field when they're ready. On desktop, focus for quick typing.
  const input = document.getElementById("russellm-input");
  const isTouch = window.matchMedia("(hover: none) and (pointer: coarse)").matches;
  if (input && !isTouch) input.focus();
}

function closeRussellmDrawer() {
  const drawer = document.getElementById("russellm-drawer");
  const overlay = document.getElementById("russellm-overlay");
  if (!drawer || !overlay) return;
  russellmOpen = false;
  const hadFocus = drawer.contains(document.activeElement);
  drawer.classList.remove("open");
  overlay.classList.remove("open");
  drawer.setAttribute("aria-hidden", "true");
  const toggle = document.getElementById("russellm-toggle");
  toggle.setAttribute("aria-expanded", "false");
  if (hadFocus) toggle.focus({ preventScroll: true });
  syncRussellmViewport(); // clears the inline height/top back to CSS
}

function renderRussellmGreeting() {
  const name = typeof PORTFOLIO !== "undefined" && PORTFOLIO.name ? PORTFOLIO.name.split(" ")[0] : "Russel";
  appendRussellmBubble("ai", `Hi, I'm RUSSELLM, an AI chatting as ${name}. Ask me about my work, skills, or experience.`);
  renderRussellmChips();
}

function renderRussellmChips() {
  const log = document.getElementById("russellm-log");
  if (!log) return;
  const pool = RUSSELLM_CHIP_POOL.filter((c) => c.topic !== russellmLastTopic);
  const picks = shuffleRussellmPool(pool).slice(0, 3);

  const row = document.createElement("div");
  row.className = "russellm-chips";
  picks.forEach((chip) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "russellm-chip";
    btn.textContent = chip.text;
    btn.addEventListener("click", () => {
      row.remove();
      russellmSendMessage(chip.text, chip.topic);
    });
    row.appendChild(btn);
  });
  log.appendChild(row);
  scrollRussellmLog();
}

function shuffleRussellmPool(arr) {
  const copy = arr.slice();
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function appendRussellmBubble(role, text) {
  const log = document.getElementById("russellm-log");
  if (!log) return null;
  const bubble = document.createElement("div");
  bubble.className = `russellm-msg ${role}`;
  bubble.textContent = text;
  log.appendChild(bubble);
  scrollRussellmLog();
  return bubble;
}

function scrollRussellmLog() {
  const log = document.getElementById("russellm-log");
  if (log) log.scrollTop = log.scrollHeight;
}

function removeRussellmChips() {
  document.querySelectorAll(".russellm-chips").forEach((el) => el.remove());
}

function toggleRussellmInput(disabled) {
  const input = document.getElementById("russellm-input");
  const send = document.getElementById("russellm-send");
  if (input) input.disabled = disabled;
  if (send) send.disabled = disabled;
}

async function russellmSendMessage(text, topic) {
  const trimmed = (text || "").trim();
  if (!trimmed || russellmSending) return;
  russellmSending = true;
  russellmLastTopic = topic || russellmLastTopic;

  removeRussellmChips();
  appendRussellmBubble("user", trimmed);
  const historyBeforeThisTurn = russellmHistory.slice();
  russellmHistory.push({ role: "user", text: trimmed });
  toggleRussellmInput(true);
  const loadingBubble = appendRussellmBubble("ai loading", "…");

  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: trimmed, history: historyBeforeThisTurn }),
    });
    const data = await res.json().catch(() => ({}));
    if (loadingBubble) loadingBubble.remove();

    if (!res.ok) {
      appendRussellmBubble("ai error", data.error || "Something went wrong. Try again in a moment.");
    } else {
      appendRussellmBubble("ai", data.reply);
      russellmHistory.push({ role: "model", text: data.reply });
      renderRussellmChips();
    }
  } catch {
    if (loadingBubble) loadingBubble.remove();
    appendRussellmBubble("ai error", "Something went wrong. Try again in a moment.");
  } finally {
    russellmSending = false;
    toggleRussellmInput(false);
  }
}

document.addEventListener("DOMContentLoaded", initRussellm);

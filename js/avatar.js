/* ============================================================
   The clickable avatar on the home page. Each click: swaps to the
   surprised face, pops a status-line quip (terminal-flavored, to
   match the site's mono/pill language), and plays a tiny
   synthesized "bop" (Web Audio, random pitch per click — no audio
   asset). The pulsing dot + idle wiggle affordances live in CSS.
   ============================================================ */

const statusQuips = [
  "status: shipping",
  "uptime: 100%",
  "coffee: refilled",
  "0 bugs today",
  "deploy ✓",
  "build: passing",
  "inbox: zero",
  "cache: warm",
  "all systems go",
  "mode: focus",
  "ping: 1ms",
  "vibe: optimal",
];

let lastWord = null;
function pickWord() {
  if (statusQuips.length <= 1) return statusQuips[0];
  let word;
  do {
    word = statusQuips[Math.floor(Math.random() * statusQuips.length)];
  } while (word === lastWord);
  lastWord = word;
  return word;
}

// Tiny synthesized "bop" — a soft sine blip with a quick downward pitch
// slide. Base pitch is randomized per click so repeat clicks feel toy-like.
// The AudioContext is created lazily inside the click (a user gesture), so
// autoplay policies never block it. Fails silently if audio is unavailable.
let bopCtx = null;
function playBop() {
  try {
    bopCtx = bopCtx || new (window.AudioContext || window.webkitAudioContext)();
    if (bopCtx.state === "suspended") bopCtx.resume();
    const t = bopCtx.currentTime;
    const osc = bopCtx.createOscillator();
    const gain = bopCtx.createGain();
    const base = 280 + Math.random() * 260;
    osc.type = "sine";
    osc.frequency.setValueAtTime(base * 1.6, t);
    osc.frequency.exponentialRampToValueAtTime(base, t + 0.09);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.12, t + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.14);
    osc.connect(gain);
    gain.connect(bopCtx.destination);
    osc.start(t);
    osc.stop(t + 0.16);
  } catch {
    /* no audio — no problem */
  }
}

function initAvatarWidget() {
  const widget = document.getElementById("avatar-widget");
  if (!widget) return;
  const img = document.getElementById("avatar-img");
  const wordEl = document.getElementById("avatar-word");

  let animating = false;

  function trigger() {
    if (animating) return;
    animating = true;

    playBop();
    wordEl.textContent = pickWord();
    img.src = "assets/avatar-surprised.png";
    // Force the fade-in to (re)start even if triggered back-to-back.
    wordEl.classList.remove("show");
    requestAnimationFrame(() => requestAnimationFrame(() => wordEl.classList.add("show")));

    setTimeout(() => {
      wordEl.classList.remove("show");
      img.src = "assets/avatar-neutral.png";
      setTimeout(() => {
        animating = false;
      }, 250);
    }, 1000);
  }

  widget.addEventListener("click", trigger);
  widget.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      trigger();
    }
  });
}

document.addEventListener("DOMContentLoaded", initAvatarWidget);

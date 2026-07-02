const tagalogWords = [
  "Kilig!",
  "Gigil!",
  "Tara!",
  "Salamat!",
  "Magaling!",
  "Bayanihan",
  "Kumusta?",
  "Astig!",
  "Ayos!",
  "Push mo yan!",
  "Sobrang galing",
  "Ingat!"
];

let lastWord = null;
function pickWord() {
  if (tagalogWords.length <= 1) return tagalogWords[0];
  let word;
  do {
    word = tagalogWords[Math.floor(Math.random() * tagalogWords.length)];
  } while (word === lastWord);
  lastWord = word;
  return word;
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

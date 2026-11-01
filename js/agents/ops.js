/* ============================================================
   The Ops Team page on /agents: the story of one day, the whole
   day at a glance, and the panel blocks only the team needs (quote
   document, calendar, brief, print to PDF).
   The canvas, panels and run flow stay in app.js; this file only
   adds a screen and some blocks, through the hooks app.js gives it.
   No em dashes in any visible copy here.
   ============================================================ */
const AgentOps = (function () {
  "use strict";

  let hooks = null;
  let root = null;
  let scroll = 0;
  const icon = (name, size) => agentIcon(name, size);

  /* ---------------- Team examples ---------------- */
  // Every team agent's examples are its own runs from the saved day
  // (Speed-to-Lead keeps its own list).
  function loadSamples() {
    if (typeof OPS_DAY === "undefined") return;
    for (const ev of OPS_DAY.events) {
      for (const s of ev.steps) {
        if (s.agent === "speed-to-lead" || s.noSample) continue;
        (AGENT_SAMPLES[s.agent] = AGENT_SAMPLES[s.agent] || []).push(s);
      }
    }
    if (OPS_DAY.brief) AGENT_SAMPLES["daily-brief"] = [OPS_DAY.brief];
  }

  /* ---------------- Blocks ---------------- */
  function quoteDoc(b, { esc }) {
    const r = b.result;
    const H = HARBOURLINE;
    const q = r.quote;
    const lines = r.lines
      .map((l) => `<tr><td><strong>${esc(l.item)}</strong>${l.detail && l.detail !== "Part" ? `<span>${esc(l.detail)}</span>` : ""}</td><td>${esc(l.amount)}</td></tr>`)
      .join("");
    return `<div class="ag-qdoc">
      <header class="ag-qdoc-head">
        <div><strong>${esc(H.name)}</strong><span>${esc(H.region)}</span><span>${esc(H.phone)}</span></div>
        <div class="ag-qdoc-num"><span>Quote</span><strong>${esc(q.number)}</strong></div>
      </header>
      <dl class="ag-qdoc-meta">
        <div><dt>For</dt><dd>${esc(q.customer)}</dd></div>
        <div><dt>Suburb</dt><dd>${esc(q.suburb)}</dd></div>
        ${q.mobile ? `<div><dt>Mobile</dt><dd>${esc(q.mobile)}</dd></div>` : ""}
        <div><dt>Date</dt><dd>${esc(q.date)}</dd></div>
        <div><dt>Valid until</dt><dd>${esc(q.validUntil)}</dd></div>
      </dl>
      <h4>Scope of work</h4>
      <p>${esc(r.scope)}</p>
      ${
        r.quotable
          ? `<table class="ag-qdoc-lines"><thead><tr><th>Item</th><th>Amount</th></tr></thead><tbody>${lines}</tbody>
             <tfoot><tr><td>Estimate, including GST${r.totals.partsOnSite ? ", plus parts quoted on site" : ""}</td><td>${esc(r.totals.label)}</td></tr></tfoot></table>`
          : `<p class="ag-qdoc-flag">${esc(r.notListed || "This job isn't on our services list. The team will confirm whether we can help.")}</p>`
      }
      ${r.assumptions.length ? `<h4>This quote assumes</h4><ul>${r.assumptions.map((a) => `<li>${esc(a)}</li>`).join("")}</ul>` : ""}
      <footer class="ag-qdoc-foot">
        <p>Labour is an estimate; the final amount depends on the hours on site. Parts are quoted on site unless listed. Valid for ${esc(H.quoteValidDays)} days. Invoices are due within ${esc(H.invoiceDays)} days.</p>
        <p>Demo document. ${esc(H.name)} is a made-up business.</p>
      </footer>
    </div>
    <button type="button" class="ag-btn ag-qdoc-print" data-print-quote="${esc(q.number)}">${icon("quote", 16)}<span>Print or save as PDF</span></button>`;
  }

  // The two-week calendar, a week at a time: day columns on a wide screen, a
  // list of days on a phone or in the side panel. Used by the Scheduler's
  // result and the Ops Team page.
  function calendar(b, { esc, title }) {
    const H = HARBOURLINE;
    const jobs = H.calendarWith(b.changes);
    const entry = (j) => {
      const t = H.tech(j.tech);
      const cls = [j.id === b.focus ? "is-focus" : "", j.added ? "is-new" : "", j.moved ? "is-moved" : "", j.emergency ? "is-emergency" : ""].filter(Boolean).join(" ");
      const tag = j.emergency ? "Emergency" : j.moved ? "Moved" : j.added ? "New" : "";
      return `<li class="ag-cal-job ${cls}"><span class="ag-cal-tech">${esc(t.first)}</span><strong>${esc(j.who)}</strong><span>${esc(j.job)}, ${esc(j.suburb)}</span>${tag ? `<em>${tag}</em>` : ""}</li>`;
    };
    // One technician's one day, for the before and after in the story.
    if (b.day) {
      const only = jobs.filter((j) => j.tech === b.tech);
      const slot = (w) => {
        const j = only.find((x) => x.date === b.day && x.win === w);
        return `<div class="ag-cal-win"><span class="ag-cal-winlabel">${H.windows[w].label}</span>${j ? `<ul>${entry(j)}</ul>` : "<p>Free</p>"}</div>`;
      };
      return `<section class="ag-cal-day"><h4>${esc(b.title)}</h4>${slot("am")}${slot("pm")}</section>`;
    }
    const weeks = [H.calendarDays.slice(0, 5), H.calendarDays.slice(5)];
    const shown = weeks.findIndex((w) => w.includes(b.week)) === 1 ? 1 : 0;
    const win = (date, w) => {
      const list = jobs.filter((j) => j.date === date && j.win === w).sort((x, y) => H.technicians.findIndex((t) => t.id === x.tech) - H.technicians.findIndex((t) => t.id === y.tech));
      return `<div class="ag-cal-win"><span class="ag-cal-winlabel">${H.windows[w].label}</span>${list.length ? `<ul>${list.map(entry).join("")}</ul>` : `<p>Free</p>`}</div>`;
    };
    // In the side panel, the shown week starts at the day this job landed.
    const fromDay = !b.wide && b.week ? b.week : null;
    const week = (days, i) => `<div class="ag-cal-week" data-week="${i}"${i === shown ? "" : " hidden"}>
      ${days
        .filter((d) => i !== shown || !fromDay || d >= fromDay)
        .map((d) => {
          const [name, num, month] = H.dayLabel(d).split(" ");
          return `<section class="ag-cal-day${d === H.dayOfTheDemo ? " is-today" : ""}"><h4>${name.slice(0, 3)} ${num} ${month.slice(0, 3)}</h4>${win(d, "am")}${win(d, "pm")}</section>`;
        })
        .join("")}
    </div>`;
    return `${title(b.title)}<div class="ag-cal${b.wide ? " is-wide" : ""}">
      <div class="ag-cal-tabs" role="group" aria-label="Week">
        ${["Week of 2 Nov", "Week of 9 Nov"].map((l, i) => `<button type="button" data-cal-week="${i}" aria-pressed="${i === shown}">${l}</button>`).join("")}
      </div>
      ${weeks.map(week).join("")}
    </div>`;
  }

  // The owner's day on one screen: four numbers, from the recorded totals.
  const BRIEF_COUNTS = [["Jobs placed", "Jobs booked"], ["Emergencies", "Emergencies"], ["Quotes written", "Quotes written"]];
  function brief(b, { esc }) {
    const r = b.result;
    const section = (head, items) => (items.length ? `<h4>${esc(head)}</h4><ul>${items.map((i) => `<li>${esc(i)}</li>`).join("")}</ul>` : "");
    return `<div class="ag-brief${b.wide ? " is-wide" : ""}">
      <span class="ag-brief-day">${esc(r.day)}</span>
      <p class="ag-brief-head">${esc(r.headline)}</p>
      <dl class="ag-brief-counts">
        ${BRIEF_COUNTS.map(([key, label]) => `<div><dd>${esc((r.counts.find((c) => c.label === key) || {}).n)}</dd><dt>${esc(label)}</dt></div>`).join("")}
        <div><dd>${esc(r.invoiced)}</dd><dt>Invoiced</dt></div>
      </dl>
      <div class="ag-brief-cols">
        <div class="ag-brief-needs">
          <h4>Needs ${esc(HARBOURLINE.owner.first)}</h4>
          ${r.needsYou.length ? `<ol>${r.needsYou.map((n) => `<li><strong>${esc(n.who)}</strong><span>${esc(n.what)}</span><em>${esc(n.action)}</em></li>`).join("")}</ol>` : `<p>Nothing today.</p>`}
        </div>
        <div>${section("Handled", r.done)}${section("Coming up", r.tomorrow)}</div>
      </div>
    </div>`;
  }

  // Printing copies the document into a body-level root, so the print
  // sheet shows that one page and nothing else.
  function printQuote(btn) {
    const doc = btn.parentElement.querySelector(".ag-qdoc");
    if (!doc) return;
    let sheet = document.getElementById("ag-print");
    if (!sheet) {
      sheet = document.createElement("div");
      sheet.id = "ag-print";
      document.body.appendChild(sheet);
    }
    sheet.innerHTML = doc.outerHTML;
    const title = document.title;
    document.body.classList.add("is-printing");
    document.title = `Quote ${btn.dataset.printQuote}`;
    const done = () => {
      document.body.classList.remove("is-printing");
      document.title = title;
      sheet.innerHTML = "";
      window.removeEventListener("afterprint", done);
    };
    window.addEventListener("afterprint", done);
    window.print();
  }

  /* ---------------- The day ---------------- */
  const laneAgents = () => OPS_TEAM.map((id) => hooks.byId(id)).filter(Boolean);
  const shortName = (id) => {
    const a = hooks.byId(id);
    return id === "speed-to-lead" ? "Speed-to-Lead" : a ? a.short || a.name : id;
  };
  const OWNER = () => HARBOURLINE.owner.first;
  const resultOf = (step) => (step.turns ? step.turns[step.turns.length - 1].recorded.result : step.recorded.result);
  // 7:05am everywhere, and 12pm rather than 12:00pm, as the calendar writes it.
  const timeOf = (e) => e.timeLabel.replace(":00", "");
  const dayShort = (slot) => {
    const [name, num] = slot.dayLabel.split(" ");
    return `${name.slice(0, 3)} ${num}, ${slot.window.toLowerCase()}`;
  };

  // What each step shows. Everything comes from the saved run: `say` is one
  // plain sentence, `label` and `out` are its real output, and the counts
  // feed the numbers on the page.
  const STEP = {
    "speed-to-lead": (r) => ({ chip: `${cap(r.score)}${r.emergency ? ", emergency" : ""}`, say: r.emergency ? "Read the message, saw it was an emergency and alerted the on-call plumber." : "Read the message and wrote back.", label: "Its text back", out: r.textReply, msgs: 1 }),
    "hb-front-desk": (r, s) => ({ chip: r.emergency ? "Emergency" : r.bookingReady ? "Booking request" : cap(r.intent), say: r.emergency ? "Gave a safety step and alerted the on-call plumber." : r.bookingReady ? "Answered the chat and collected the five details a booking needs." : "Answered from the fact sheet.", label: "Its last reply", out: r.reply, msgs: s.turns.length }),
    "quote-builder": (r) => ({ chip: r.totals ? r.totals.label : "Not listed", say: "Wrote a one-page quote, with the prices taken from the price list.", label: "The estimate", out: r.totals ? `${r.totals.label} including GST${r.totals.partsOnSite ? ", plus parts quoted on site" : ""}` : r.jobLabel, fact: true, msgs: 1, quote: 1 }),
    scheduler: (r) => ({ chip: r.emergency ? "Goes first" : r.slot ? dayShort(r.slot) : "With the office", say: r.bump ? `Put this job first and moved ${r.bump.who} to ${r.bump.label}.` : r.slot ? "Found a free time and pencilled the job in." : "Found no free time, so the office takes it from here.", label: "On the calendar", out: r.slot ? `${r.slot.techName}, ${r.slot.dayLabel}, ${r.slot.window.toLowerCase()}` : "With the office", fact: true, msgs: 1, placed: r.slot ? 1 : 0, emergency: r.emergency ? 1 : 0, flag: r.bump ? 1 : 0 }),
    "job-wrap-up": (r) => ({ chip: r.problem ? `${r.amount}, flagged` : r.amount, say: r.problem ? `Wrote the payment reminder and the review request, and told ${OWNER()} about the problem first.` : "Wrote the payment reminder and the review request.", label: r.problem ? `What ${OWNER()} was told` : "Payment reminder", out: r.problem ? r.ownerFlag : r.paymentMessage, fact: r.problem, msgs: 2, flag: r.problem ? 1 : 0 }),
    "hb-review-guardian": (r) => ({ chip: `${r.rating} star${r.rating === 1 ? "" : "s"}`, say: r.isNegative ? `Told ${OWNER()} and wrote a calm public reply.` : "Wrote a short thank-you to post under the review.", label: "Public reply", out: r.publicReply, msgs: 2, flag: r.isNegative ? 1 : 0 }),
    "hb-dead-lead-revival": (r) => {
      const n = r.leads.filter((l) => l.message).length;
      return { chip: `${n} messages`, say: `Checked ${r.leads.length} old quotes, wrote to ${n} customers and left ${r.summary.dontContact} alone.`, label: "One of its messages", out: (r.leads.find((l) => l.message) || {}).message || "", msgs: n };
    },
    "daily-brief": (r) => ({ chip: `${r.needsYou.length} for ${OWNER()}`, say: r.headline, label: "", out: "", msgs: 0 }),
  };
  const stepOf = (step) => STEP[step.agent](resultOf(step), step);

  // The story's headlines. The details in them come from the same saved day.
  const HEADLINES = {
    e01: "A pipe bursts in Marrickville.",
    e02: "Hannah asks the website about a blocked drain.",
    e03: "Luke asks for a hot water quote.",
    e04: "The burst pipe is fixed.",
    e05: "Grace smells gas near her cooktop.",
    e06: "A 1-star review comes in.",
    e07: "Luke says yes to the quote.",
    e08: "A tap repair finishes, and the customer isn't happy.",
    e09: "Time to look through the old quotes.",
    e10: "Dana leaves a 5-star review.",
    brief: `${HARBOURLINE.owner.first}'s day, on one screen.`,
  };
  // A sentence that needs the story around it.
  const SAYS = {
    "e07-slot": "Luke asked for a morning, so it found a free one and pencilled the job in.",
    "e09-quote": "Ben replied yes, so it wrote him a fresh one-page quote.",
  };
  const IN_THEIR_WORDS = /text|chat|form|review/i;

  // The day in the order it happens.
  const EVENTS = () => {
    if (typeof OPS_DAY === "undefined") return [];
    const list = OPS_DAY.events.slice();
    if (OPS_DAY.brief) list.push({ id: "brief", time: "17:05", timeLabel: "5:05pm", title: "Owner's Daily Brief", short: "The brief", source: "End of day", incoming: "", steps: [OPS_DAY.brief] });
    return list;
  };
  let events = [];
  let flat = [];
  const story = { at: 0, playing: false, timer: null, shown: null };
  const dayCount = () => events.filter((e) => e.id !== "brief").length;

  /* ---------------- The whole day at once ---------------- */
  function chipHtml(item) {
    const { esc } = hooks;
    return `<button type="button" class="ag-ops-chip" data-step="${item.i}" data-ev="${item.evIndex}" style="grid-column:${item.evIndex + 2};grid-row:${OPS_TEAM.indexOf(item.step.agent) + 2}" title="See what ${esc(shortName(item.step.agent))} did">${esc(stepOf(item.step).chip)}</button>`;
  }

  function gridHtml() {
    const { esc } = hooks;
    const heads = events
      .map((e, i) => `<button type="button" class="ag-ops-evhead" data-go="${i}" style="grid-column:${i + 2};grid-row:1"><strong>${esc(timeOf(e))}</strong><span>${esc(e.short)}</span></button>`)
      .join("");
    const lanes = laneAgents()
      .map((a, r) => `<a class="ag-ops-lane" href="#${a.id}" data-ops-open="${a.id}" style="grid-row:${r + 2}"><span>${icon(a.icon, 15)}</span>${esc(shortName(a.id))}</a><i class="ag-ops-rule" style="grid-row:${r + 2}"></i>`)
      .join("");
    const columns = events.map((e, i) => `<i class="ag-ops-col" data-col="${i}" style="grid-column:${i + 2}"></i>`).join("");
    return `<div class="ag-ops-grid" style="grid-template-columns:136px repeat(${events.length}, minmax(0, 1fr))">
      ${columns}${lanes}${heads}${flat.map(chipHtml).join("")}
      <svg class="ag-ops-links" aria-hidden="true"><defs><marker id="ag-ops-arrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0 8 4 0 8z" fill="context-stroke"/></marker></defs></svg>
    </div>`;
  }

  // Arrows between the steps of one event, drawn over the grid.
  function layoutLinks() {
    const svg = root.querySelector(".ag-ops-links");
    if (!svg || !svg.getBoundingClientRect().width) return;
    const box = svg.getBoundingClientRect();
    let paths = "";
    flat.forEach((item, n) => {
      const next = flat[n + 1];
      if (!next || next.ev !== item.ev) return;
      const a = root.querySelector(`.ag-ops-chip[data-step="${item.i}"]`).getBoundingClientRect();
      const b = root.querySelector(`.ag-ops-chip[data-step="${next.i}"]`).getBoundingClientRect();
      const down = b.top >= a.top;
      const x = a.left + a.width / 2 - box.left;
      const y1 = (down ? a.bottom : a.top) - box.top;
      const y2 = (down ? b.top : b.bottom) - box.top;
      paths += `<path d="M${x} ${y1} L${x} ${y2}" marker-end="url(#ag-ops-arrow)"/>`;
    });
    svg.querySelectorAll("path:not(marker path)").forEach((p) => p.remove());
    svg.insertAdjacentHTML("beforeend", paths);
  }

  /* ---------------- The story, one moment at a time ---------------- */
  function storyStep(item) {
    const { esc } = hooks;
    const s = stepOf(item.step);
    const a = hooks.byId(item.step.agent);
    return `<li><button type="button" class="ag-story-step" data-step="${item.i}">
      <span class="ag-card-icon">${icon(a.icon, 18)}</span>
      <span class="ag-story-text">
        <strong>${esc(shortName(item.step.agent))}</strong>
        <span class="ag-story-say">${esc(SAYS[item.step.id] || s.say)}</span>
        ${s.out ? `<span class="ag-story-out${s.fact ? " is-fact" : ""}"><small>${esc(s.label)}</small>${esc(s.out)}</span>` : ""}
      </span>
      <span class="ag-story-chev">${icon("right", 16)}</span>
    </button></li>`;
  }

  function storyCard(e) {
    const { esc } = hooks;
    const items = flat.filter((x) => x.ev === e);
    const head = `<h3 class="ag-story-head"><span>${esc(timeOf(e))}.</span> ${esc(HEADLINES[e.id] || e.title)}</h3>`;
    if (e.id === "brief") {
      return `${head}${hooks.renderBlock({ type: "brief", wide: true, result: resultOf(OPS_DAY.brief) })}
        <button type="button" class="ag-st-open" data-step="${items[0].i}">See how the brief was written ${icon("arrow", 14)}</button>`;
    }
    return `${head}
      ${e.incoming && IN_THEIR_WORDS.test(e.source) ? `<p class="ag-story-words"><small>In their words</small>${esc(e.incoming)}</p>` : ""}
      <ol class="ag-story-steps">${items.map(storyStep).join("")}</ol>`;
  }

  function paintStory(scrollIntoView) {
    const card = document.getElementById("ag-story-card");
    if (!card) return;
    const last = events.length - 1;
    const e = events[story.at];
    if (story.shown !== story.at) {
      story.shown = story.at;
      card.innerHTML = storyCard(e);
      card.classList.remove("is-new");
      void card.offsetWidth;
      card.classList.add("is-new");
    }
    const atBrief = e.id === "brief";
    document.getElementById("ag-story-count").textContent = atBrief ? "End of the day" : `${story.at + 1} of ${dayCount()}`;
    document.getElementById("ag-story-bar").style.width = `${((story.at + 1) / events.length) * 100}%`;
    document.getElementById("ag-story-back").disabled = story.at === 0;
    document.getElementById("ag-story-next").disabled = story.at === last;
    const play = document.getElementById("ag-story-play");
    play.innerHTML = `${icon(story.playing ? "pause" : "play", 16)}<span>${story.playing ? "Pause" : atBrief ? "Play again" : "Play"}</span>`;
    play.hidden = hooks.mqReduce.matches; // no moving on by itself under reduced motion
    root.querySelectorAll(".ag-ops-chip").forEach((c) => (c.dataset.state = Number(c.dataset.ev) === story.at ? "running" : "done"));
    root.querySelectorAll(".ag-ops-col").forEach((c) => c.classList.toggle("is-selected", Number(c.dataset.col) === story.at));
    root.querySelectorAll(".ag-ops-evhead").forEach((h) => h.classList.toggle("is-selected", Number(h.dataset.go) === story.at));
    // Keep the card's headline clear of the top bar and the sticky controls.
    const controls = root.querySelector(".ag-story-controls").getBoundingClientRect().bottom;
    if (scrollIntoView && card.getBoundingClientRect().top < controls - 1) card.scrollIntoView({ block: "start", behavior: hooks.mqReduce.matches ? "auto" : "smooth" });
  }

  function stopStory() {
    clearTimeout(story.timer);
    story.timer = null;
    story.playing = false;
  }
  // Time to read the card: longer when it has more steps.
  const dwell = (e) => 3500 + 2500 * e.steps.length;
  function queueNext() {
    clearTimeout(story.timer);
    if (!story.playing) return;
    if (story.at >= events.length - 1) {
      stopStory();
      return paintStory();
    }
    story.timer = setTimeout(() => {
      story.at += 1;
      paintStory(true);
      queueNext();
    }, dwell(events[story.at]));
  }
  function moveTo(i) {
    stopStory();
    story.at = Math.max(0, Math.min(events.length - 1, i));
    paintStory(true);
  }
  function togglePlay() {
    if (story.playing) {
      stopStory();
      return paintStory();
    }
    if (story.at >= events.length - 1) story.at = 0;
    story.playing = true;
    paintStory(true);
    queueNext();
  }
  // From a "Run the day" button anywhere: go to the story and start it.
  function runDay() {
    stopStory();
    story.at = 0;
    paintStory();
    document.getElementById("ag-story").scrollIntoView({ behavior: hooks.mqReduce.matches ? "auto" : "smooth", block: "start" });
    if (hooks.mqReduce.matches) return;
    setTimeout(togglePlay, 500);
  }

  /* ---------------- Dot-matrix numerals ---------------- */
  const GLYPHS = {
    0: "01110 10001 10001 10001 10001 10001 01110",
    1: "00100 01100 00100 00100 00100 00100 01110",
    2: "01110 10001 00001 00110 01000 10000 11111",
    3: "11110 00001 00001 01110 00001 00001 11110",
    4: "00010 00110 01010 10010 11111 00010 00010",
    5: "11111 10000 11110 00001 00001 10001 01110",
    6: "00110 01000 10000 11110 10001 10001 01110",
    7: "11111 00001 00010 00100 01000 01000 01000",
    8: "01110 10001 10001 01110 10001 10001 01110",
    9: "01110 10001 10001 01111 00001 00010 01100",
    ":": "0 1 0 0 0 1 0",
  };
  // Each pixel of the numeral is a small block of dots; a few evenly spaced
  // dots take the accent colour.
  function dotMatrix(text, accents = 10) {
    const BLOCK = 3;
    const STEP = 5;
    const dots = [];
    let x = 0;
    for (const ch of text) {
      const rows = (GLYPHS[ch] || "").split(" ");
      if (!rows[0]) continue;
      rows.forEach((row, ry) => [...row].forEach((on, rx) => {
        if (on !== "1") return;
        for (let a = 0; a < BLOCK; a++) for (let b = 0; b < BLOCK; b++) dots.push([x + (rx * BLOCK + a) * STEP, (ry * BLOCK + b) * STEP]);
      }));
      x += (rows[0].length * BLOCK + 2) * STEP;
    }
    const every = Math.max(1, Math.floor(dots.length / accents));
    const circles = dots.map(([cx, cy], i) => (i % every === Math.floor(every / 2) ? `<circle class="is-accent" cx="${cx + 2}" cy="${cy + 2}" r="2.6"/>` : `<circle cx="${cx + 2}" cy="${cy + 2}" r="1.5"/>`)).join("");
    return `<svg class="ag-st-dots" viewBox="0 0 ${x - 2 * STEP} ${7 * BLOCK * STEP}" aria-hidden="true">${circles}</svg>`;
  }

  /* ---------------- The page ---------------- */
  const stepById = (id) => (flat.find((x) => x.step.id === id) || {}).step;

  function section(n, id, label, line, dim, para, body) {
    const { esc } = hooks;
    return `<section class="ag-st-sec" id="ag-st-${id}" data-sec="${esc(label)}">
      <header class="ag-st-head ag-rv">
        <div>
          <p class="ag-st-eye"><span>${n}</span> · ${esc(label)}</p>
          <h2>${esc(line)}<em>${esc(dim)}</em></h2>
        </div>
        <p class="ag-st-para">${esc(para)}</p>
      </header>
      ${body}
    </section>`;
  }

  const openBtn = (step, label = "See what it did") => `<button type="button" class="ag-st-open" data-open-run="${hooks.esc(step.id)}">${hooks.esc(label)} ${icon("arrow", 14)}</button>`;
  const agentHead = (id) => {
    const a = hooks.byId(id);
    return `<div class="ag-st-agent"><span class="ag-card-icon">${icon(a.icon, 16)}</span><strong>${hooks.esc(shortName(id))}</strong></div>`;
  };

  function storyChain() {
    return `<div class="ag-st-stage ag-st-chain ag-rv"><i class="ag-st-rail" aria-hidden="true"><b></b></i>
      ${laneAgents().map((a) => `<a class="ag-st-link" href="#${a.id}" data-ops-open="${a.id}"><span class="ag-card-icon">${icon(a.icon, 20)}</span><strong>${hooks.esc(shortName(a.id))}</strong></a>`).join("")}
    </div>`;
  }

  function storyPassing() {
    const { esc } = hooks;
    const ev = events[0];
    const lead = stepById("e01-lead");
    const slot = stepById("e01-slot");
    const lo = stepOf(lead);
    const so = stepOf(slot);
    const arrow = `<span class="ag-st-arrow" aria-hidden="true">${icon("arrow", 20)}</span>`;
    return `<div class="ag-st-stage ag-st-flow ag-rv">
      <article class="ag-st-card"><p class="ag-st-kicker">${esc(timeOf(ev))}, ${esc(ev.source.toLowerCase())}</p><div class="ag-bubble is-in">${esc(ev.incoming)}</div></article>
      ${arrow}
      <article class="ag-st-card">${agentHead(lead.agent)}<p>${esc(lo.say)}</p><div class="ag-bubble is-out">${esc(lo.out)}</div>${openBtn(lead)}</article>
      ${arrow}
      <article class="ag-st-card">${agentHead(slot.agent)}<p>${esc(so.say)}</p><div class="ag-bubble is-out">${esc(resultOf(slot).customerMessage)}</div>${openBtn(slot)}</article>
    </div>`;
  }

  function storyCalendar() {
    const H = HARBOURLINE;
    const slot = stepById("e01-slot");
    const r = resultOf(slot);
    return `<div class="ag-st-stage ag-st-compare ag-rv">
      ${hooks.renderBlock({ type: "calendar", day: H.dayOfTheDemo, tech: r.slot.tech, changes: [], title: `${r.slot.techName}, before 7:05am` })}
      <span class="ag-st-arrow" aria-hidden="true">${icon("arrow", 20)}</span>
      ${hooks.renderBlock({ type: "calendar", day: H.dayOfTheDemo, tech: r.slot.tech, changes: r.changes, focus: r.addedId, title: `${r.slot.techName}, after` })}
      <ul class="ag-st-notes">
        <li><strong>The calendar does the sums.</strong> Free times, travel and who moves are worked out by the system, not guessed by the AI.</li>
        <li><strong>A window, never a time.</strong> Customers hear morning or afternoon, and the office confirms.</li>
        <li><strong>Nobody forgotten.</strong> ${hooks.esc(r.bump.who)} needs a call, so it goes on the owner's brief.</li>
      </ul>
    </div>`;
  }

  function storyQuote() {
    const step = stepById("e03-quote");
    return `<div class="ag-st-stage ag-st-side ag-rv">
      <ul class="ag-st-notes">
        <li><strong>The AI reads the job.</strong> It picks the job type and writes what the work covers.</li>
        <li><strong>The price list does the sums.</strong> Call-out and labour come straight from it.</li>
        <li><strong>Unknown parts stay honest.</strong> Anything not listed reads "Quoted on site".</li>
        <li><strong>A real page.</strong> It prints to one A4 sheet or saves as a PDF.</li>
        <li>${openBtn(step)}</li>
      </ul>
      <div class="ag-st-paper">${hooks.renderBlock({ type: "quoteDoc", result: resultOf(step) })}</div>
    </div>`;
  }

  function storyWrap() {
    const { esc } = hooks;
    const fine = stepById("e04-wrap");
    const rough = stepById("e08-wrap");
    const f = resultOf(fine);
    const o = resultOf(rough);
    return `<div class="ag-st-stage ag-st-three ag-rv">
      <article class="ag-st-card"><p class="ag-st-kicker">Payment reminder</p><div class="ag-bubble is-out">${esc(f.paymentMessage)}</div></article>
      <article class="ag-st-card"><p class="ag-st-kicker">Review request</p><div class="ag-bubble is-out">${esc(f.reviewMessage)}</div>${openBtn(fine)}</article>
      <article class="ag-st-card is-flag"><p class="ag-st-kicker">When a job goes badly</p><p class="ag-st-big">${esc(o.ownerFlag)}</p><p><strong>${esc(o.suggestedAction)}</strong></p><p>The review request ${esc(o.reviewTiming.toLowerCase().replace("renee", OWNER()))}.</p>${openBtn(rough)}</article>
    </div>`;
  }

  function storyReview() {
    const { esc } = hooks;
    const step = stepById("e06-review");
    const r = resultOf(step);
    return `<div class="ag-st-stage ag-st-two ag-rv">
      ${hooks.renderBlock({ type: "review", name: step.fields.name, rating: r.rating, text: step.fields.review, reply: r.publicReply })}
      <article class="ag-st-card is-flag"><p class="ag-st-kicker">Only ${esc(OWNER())} sees this</p><p class="ag-st-big">${esc(r.ownerAlert.summary)}</p><p>${esc(r.ownerAlert.jobNoteMatch)}</p><p><strong>${esc(r.ownerAlert.suggestedAction)}</strong></p>${openBtn(step)}</article>
    </div>`;
  }

  // Four numbers, all added up from the saved day.
  function dayStats() {
    const { esc } = hooks;
    const sum = (k) => flat.reduce((n, x) => n + (stepOf(x.step)[k] || 0), 0);
    const stats = [
      [dayCount(), "customer moments"],
      [sum("placed"), "jobs booked"],
      [sum("emergency"), "emergencies sent straight to a plumber"],
      [sum("msgs"), "messages written for the team"],
    ];
    return `<dl class="ag-ops-stats ag-rv">${stats.map(([v, k]) => `<div><dd>${esc(v)}</dd><dt>${esc(k)}</dt></div>`).join("")}</dl>`;
  }

  function storyDay() {
    const { esc } = hooks;
    const changes = flat.filter((x) => x.step.agent === "scheduler").flatMap((x) => resultOf(x.step).changes);
    return `${dayStats()}
      <div class="ag-story ag-rv" id="ag-story">
        <div class="ag-story-controls">
          <button type="button" class="ag-btn" id="ag-story-back">${icon("left", 16)}<span>Back</span></button>
          <span class="ag-story-count" id="ag-story-count"></span>
          <button type="button" class="ag-btn" id="ag-story-next"><span>Next</span>${icon("right", 16)}</button>
          <button type="button" class="ag-st-cta ag-story-play" id="ag-story-play"></button>
          <i class="ag-story-track" aria-hidden="true"><b id="ag-story-bar"></b></i>
        </div>
        <div class="ag-story-card" id="ag-story-card" aria-live="polite"></div>
        <p class="ag-story-hint">Tap any step to see exactly what that agent did.</p>
      </div>
      <details class="ag-ops-whole" id="ag-ops-whole">
        <summary>See the whole day at once ${icon("right", 16)}</summary>
        <div class="ag-ops-board">${gridHtml()}</div>
        <div class="ag-ops-list">
          <ol>${events
            .map(
              (e) => `<li class="ag-ops-event">
                <strong>${esc(timeOf(e))}</strong><span>${esc(e.title)}</span>
                <div class="ag-ops-event-steps">${flat.filter((x) => x.ev === e).map((x) => `<button type="button" class="ag-ops-chip" data-step="${x.i}" data-ev="${x.evIndex}">${esc(shortName(x.step.agent))}: ${esc(stepOf(x.step).chip)}</button>`).join("")}</div>
              </li>`
            )
            .join("")}</ol>
        </div>
        <div class="ag-ops-livecal">
          <h3>The calendar at the end of the day</h3>
          ${hooks.renderBlock({ type: "calendar", wide: true, changes, focus: null, week: HARBOURLINE.dayOfTheDemo })}
        </div>
      </details>`;
  }

  function render() {
    const { esc } = hooks;
    const H = HARBOURLINE;
    events = EVENTS();
    flat = [];
    events.forEach((ev, evIndex) => ev.steps.forEach((step) => flat.push({ ev, evIndex, step, i: flat.length })));
    const SECTIONS = [
      ["idea", "the idea", "Not eight chatbots.", "One team that works together.", "Each agent does its one job, then passes the work on. They all read the same price list, the same customer list and the same calendar.", storyChain],
      ["passing", "passing it on", "A burst pipe at 7:05am.", "On the calendar straight away.", "The message is read and answered. The emergency goes to the Scheduler without anyone copying details across.", storyPassing],
      ["calendar", "the calendar", "Emergencies go first.", "Nobody is promised an exact time.", "The on-call plumber's morning changes hands, and whoever was there moves to the next free window.", storyCalendar],
      ["quote", "the quote", "Job details in.", "A one-page quote out.", "A customer asks for a price and gets a written, itemised quote. A price can't be made up, because the AI never writes one.", storyQuote],
      ["followthrough", "the follow-through", "The job finishes.", "The paperwork doesn't wait.", "Every customer gets a payment reminder and an honest review request. If the note says it went badly, the owner calls first.", storyWrap],
      ["reviews", "the reviews", "A 1-star review at noon.", `${OWNER()} gets the call to make.`, "A calm public reply, never an argument. The private details stay private, and the owner gets one clear next step.", storyReview],
      ["day", "the day", "One Wednesday, start to finish.", "Press play.", "Follow the team through ten customer moments, one at a time. It ends with the brief the owner reads at the end of the day.", storyDay],
      ["team", "the team", "Meet the team.", "Try any of them yourself.", "Each one has examples that play straight away. Anything you type yourself goes to the real AI.", () => `<div class="ag-ops-roster ag-rv">
        ${laneAgents()
          .map(
            (a) => `<a class="ag-ops-member" href="#${a.id}" data-ops-open="${a.id}">
              <span class="ag-card-icon">${icon(a.icon, 20)}</span>
              <span><strong>${esc(shortName(a.id))}</strong><span>${esc(a.role || a.problem)}</span></span>
            </a>`
          )
          .join("")}
      </div>`],
    ];
    root.innerHTML = `
      <div class="ag-ops-wrap">
        <header class="ag-st-hero">
          <h1><em>Most chatbots answer one question.</em>This team runs the whole day.</h1>
          <p class="ag-st-sub">Agents are AI assistants that each handle one job. Eight of them run a plumber's day in Sydney: new customers, quotes, the calendar, invoices and reviews.</p>
          <div class="ag-st-actions">
            <button type="button" class="ag-st-cta is-lg" data-run-day>Run the day</button>
            <button type="button" class="ag-st-ghost" data-scroll="idea">See how it works</button>
          </div>
          <p class="ag-st-mono">A made-up business. Real AI answers, saved so they play straight away.</p>
          <figure class="ag-st-matrix">${dotMatrix("7:05")}<figcaption>7:05am. A pipe bursts in Marrickville.</figcaption></figure>
        </header>
        ${SECTIONS.map(([id, label, line, dim, para, body], i) => section(String(i + 1).padStart(2, "0"), id, label, line, dim, para, body())).join("")}
        <section class="ag-cta ag-rv" aria-labelledby="ag-ops-cta-title">
          <div>
            <h2 id="ag-ops-cta-title">Want a team like this for your business?</h2>
            <p>Built around your own facts, prices and hours, and connected to the tools you already use.</p>
          </div>
          <a class="ag-pill" href="mailto:${esc(hooks.email)}">Get in touch</a>
        </section>
      </div>
      <nav class="ag-st-rail-nav" aria-label="Sections">
        ${SECTIONS.map(([id, label]) => `<button type="button" data-scroll="${id}" aria-label="Go to ${esc(label)}"></button>`).join("")}
      </nav>`;
    paintStory();
    observe();
  }

  // Sections rise in once, and the side dots track where you are.
  let observer = null;
  function observe() {
    if (observer || !("IntersectionObserver" in window)) {
      root.querySelectorAll(".ag-rv").forEach((el) => el.classList.add("is-in"));
      return;
    }
    observer = new IntersectionObserver(
      (entries) => entries.forEach((en) => {
        if (!en.isIntersecting) return;
        en.target.classList.add("is-in");
        observer.unobserve(en.target);
      }),
      { rootMargin: "0px 0px -8% 0px" }
    );
    root.querySelectorAll(".ag-rv").forEach((el) => observer.observe(el));
    const dots = new IntersectionObserver(
      (entries) => entries.forEach((en) => {
        if (!en.isIntersecting) return;
        const id = en.target.id.replace("ag-st-", "");
        root.querySelectorAll(".ag-st-rail-nav button").forEach((b) => (b.dataset.on = String(b.dataset.scroll === id)));
      }),
      { rootMargin: "-45% 0px -50% 0px" }
    );
    root.querySelectorAll(".ag-st-sec").forEach((el) => dots.observe(el));
  }

  function scrollToSection(id) {
    const el = document.getElementById(`ag-st-${id}`);
    if (el) el.scrollIntoView({ behavior: hooks.mqReduce.matches ? "auto" : "smooth", block: "start" });
  }

  function onClick(e) {
    const open = e.target.closest("[data-ops-open]");
    if (open && !e.metaKey && !e.ctrlKey && !e.shiftKey) {
      e.preventDefault();
      return hooks.go(open.dataset.opsOpen);
    }
    const toRun = e.target.closest("[data-open-run]");
    if (toRun) {
      const it = flat.find((x) => x.step.id === toRun.dataset.openRun);
      if (it) hooks.openRun(it.step);
      return;
    }
    const jump = e.target.closest("[data-scroll]");
    if (jump) return scrollToSection(jump.dataset.scroll);
    if (e.target.closest("[data-run-day]")) return runDay();
    if (e.target.closest("#ag-story-play")) return togglePlay();
    if (e.target.closest("#ag-story-back")) return moveTo(story.at - 1);
    if (e.target.closest("#ag-story-next")) return moveTo(story.at + 1);
    const go = e.target.closest("[data-go]");
    if (go) {
      moveTo(Number(go.dataset.go));
      return document.getElementById("ag-story").scrollIntoView({ behavior: hooks.mqReduce.matches ? "auto" : "smooth", block: "start" });
    }
    const step = e.target.closest("[data-step]");
    if (step) {
      stopStory();
      hooks.openRun(flat[Number(step.dataset.step)].step);
    }
  }

  return {
    init(h) {
      hooks = h;
      root = document.getElementById("ag-ops");
      root.addEventListener("click", onClick);
      root.addEventListener("toggle", () => requestAnimationFrame(layoutLinks), true);
      let resizing;
      window.addEventListener("resize", () => {
        clearTimeout(resizing);
        resizing = setTimeout(() => !root.hidden && layoutLinks(), 120);
      });
      document.addEventListener("click", (e) => {
        const btn = e.target.closest("[data-print-quote]");
        if (btn) printQuote(btn);
        const tab = e.target.closest("[data-cal-week]");
        if (tab) {
          const cal = tab.closest(".ag-cal");
          cal.querySelectorAll("[data-cal-week]").forEach((t) => t.setAttribute("aria-pressed", String(t === tab)));
          cal.querySelectorAll(".ag-cal-week").forEach((w) => (w.hidden = w.dataset.week !== tab.dataset.calWeek));
        }
      });
      render();
    },
    show() {
      root.hidden = false;
      paintStory();
      window.scrollTo(0, scroll);
      requestAnimationFrame(layoutLinks);
    },
    // Leaving the page pauses the day, and it stays where it stopped.
    hide() {
      if (!root || root.hidden) return;
      scroll = window.scrollY;
      stopStory();
      paintStory();
      root.hidden = true;
    },
    runDay,
    blocks(helpers) {
      return { quoteDoc: (b) => quoteDoc(b, helpers), calendar: (b) => calendar(b, helpers), brief: (b) => brief(b, helpers) };
    },
    loadSamples,
    dotMatrix,
  };
})();

AgentOps.loadSamples();

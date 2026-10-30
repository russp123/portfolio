/* ============================================================
   Harbourline Plumbing: the Ops Team's shared business brain.
   One fictional business. Every team agent reads this, on the
   server (api/_ops-agents.js) and in the browser (the board and
   the calendar), so a lead in one agent is the same customer in
   the next.

   Works as a browser global and as a Node module, like js/data.js.

   All names are invented and every phone number is from the ranges
   ACMA reserves for fiction. Speed-to-Lead keeps its own copy of the
   first four facts in api/agent.js, word for word, so its recordings
   stay valid; everything below only adds to them.

   Prices, dates, slots and travel are worked out here, never by a
   model. No em dashes in any visible copy.
   ============================================================ */
const HARBOURLINE = {
  name: "Harbourline Plumbing",
  region: "Sydney's Inner West",
  timeZone: "Australia/Sydney",
  phone: "(02) 7010 3310",
  owner: { name: "Renee Walsh", first: "Renee" },
  sign: "Renee, Harbourline Plumbing",
  sender: "Renee from Harbourline Plumbing",

  prices: { callOut: 120, afterHours: 290, labourPerHour: 140 },
  quoteValidDays: 30,
  invoiceDays: 7,
  leadWeeks: { from: 1, to: 2 },

  jobTypes: [
    { id: "leak", label: "Leak or pipe repair", low: 1, high: 3, skills: ["pipes"] },
    { id: "burst-pipe", label: "Burst pipe repair", low: 2, high: 4, skills: ["pipes"] },
    { id: "blocked-drain", label: "Blocked drain", low: 1, high: 3, skills: ["drains"] },
    { id: "hot-water-repair", label: "Hot water repair", low: 1, high: 3, skills: ["hot-water"] },
    { id: "hot-water-replace", label: "Hot water replacement", low: 3, high: 5, skills: ["hot-water"], planned: true },
    { id: "heat-pump", label: "Heat pump hot water install", low: 4, high: 6, skills: ["hot-water"], planned: true },
    { id: "taps-toilets", label: "Taps and toilets", low: 1, high: 2, skills: ["fixtures"] },
    { id: "gas", label: "Gas fitting or gas leak", low: 2, high: 4, skills: ["gas"] },
  ],
  parts: [
    { id: "tap-kit", name: "Tap washer and seat kit", price: 35 },
    { id: "cistern-kit", name: "Toilet cistern repair kit", price: 65 },
  ],

  technicians: [
    { id: "mick", name: "Mick Tran", first: "Mick", onCall: true, skills: ["pipes", "drains"] },
    { id: "tess", name: "Tess Romano", first: "Tess", skills: ["gas", "hot-water", "pipes"] },
    { id: "sam", name: "Sam Okafor", first: "Sam", skills: ["drains", "fixtures", "pipes"] },
  ],

  suburbs: { Balmain: "north", Annandale: "north", Leichhardt: "north", Petersham: "central", Newtown: "central", Marrickville: "central", "Dulwich Hill": "west", Ashfield: "west" },

  customers: [
    { id: "dana", name: "Dana Moretti", first: "Dana", mobile: "0491 570 156", suburb: "Marrickville" },
    { id: "hannah", name: "Hannah Cole", first: "Hannah", mobile: "0491 570 157", suburb: "Petersham" },
    { id: "luke", name: "Luke Brennan", first: "Luke", mobile: "0491 570 158", suburb: "Annandale" },
    { id: "grace", name: "Grace Liu", first: "Grace", mobile: "0491 570 159", suburb: "Leichhardt" },
    { id: "omar", name: "Omar Haddad", first: "Omar", mobile: "0491 570 110", suburb: "Ashfield" },
    { id: "greg", name: "Greg Pavlou", first: "Greg", mobile: "0491 571 266", suburb: "Dulwich Hill" },
    { id: "nina", name: "Nina Petrova", first: "Nina", mobile: "0491 571 491", suburb: "Newtown" },
    { id: "ben", name: "Ben Carter", first: "Ben", mobile: "0491 572 549", suburb: "Balmain" },
  ],

  // The board's two weeks. One job per technician per window.
  windows: { am: { label: "Morning", range: "7am to 12pm", start: 420, end: 720 }, pm: { label: "Afternoon", range: "12pm to 5pm", start: 720, end: 1020 } },
  calendarDays: ["2026-11-02", "2026-11-03", "2026-11-04", "2026-11-05", "2026-11-06", "2026-11-09", "2026-11-10", "2026-11-11", "2026-11-12", "2026-11-13"],
  dayOfTheDemo: "2026-11-04",
  calendarJobs: [
    { id: "j01", tech: "mick", date: "2026-11-02", win: "am", who: "A. Ward", suburb: "Ashfield", job: "Leak under vanity" },
    { id: "j02", tech: "tess", date: "2026-11-02", win: "pm", who: "L. Dang", suburb: "Balmain", job: "Gas cooktop service" },
    { id: "j03", tech: "sam", date: "2026-11-02", win: "am", who: "T. Boyd", suburb: "Newtown", job: "Running toilet" },
    { id: "j04", tech: "mick", date: "2026-11-03", win: "pm", who: "R. Shah", suburb: "Petersham", job: "Blocked laundry drain" },
    { id: "j05", tech: "tess", date: "2026-11-03", win: "am", who: "C. Moss", suburb: "Annandale", job: "Hot water repair" },
    { id: "j06", tech: "sam", date: "2026-11-03", win: "pm", who: "E. Fitz", suburb: "Marrickville", job: "Kitchen mixer tap" },
    { id: "j07", tech: "mick", date: "2026-11-04", win: "am", who: "Jo Kim", suburb: "Petersham", job: "Leaking shower mixer" },
    { id: "j08", tech: "tess", date: "2026-11-04", win: "am", who: "Alan Yip", suburb: "Balmain", job: "Hot water repair" },
    { id: "j09", tech: "tess", date: "2026-11-04", win: "pm", who: "Mara Silva", suburb: "Newtown", job: "Gas cooktop connection" },
    { id: "j10", tech: "sam", date: "2026-11-04", win: "am", who: "P. Rossi", suburb: "Dulwich Hill", job: "Toilet repair" },
    { id: "j11", tech: "sam", date: "2026-11-04", win: "pm", who: "Omar Haddad", suburb: "Ashfield", job: "Dripping tap repair" },
    { id: "j12", tech: "mick", date: "2026-11-05", win: "am", who: "N. Ali", suburb: "Leichhardt", job: "Burst flexi hose follow-up" },
    { id: "j13", tech: "tess", date: "2026-11-05", win: "pm", who: "G. Hall", suburb: "Marrickville", job: "Hot water repair" },
    { id: "j14", tech: "mick", date: "2026-11-06", win: "pm", who: "H. Lowe", suburb: "Annandale", job: "Blocked stormwater drain" },
    { id: "j15", tech: "sam", date: "2026-11-06", win: "am", who: "V. Pope", suburb: "Newtown", job: "Toilet replacement" },
    { id: "j16", tech: "tess", date: "2026-11-09", win: "am", who: "D. Kerr", suburb: "Ashfield", job: "Hot water replacement" },
    { id: "j17", tech: "sam", date: "2026-11-10", win: "pm", who: "F. Nolan", suburb: "Petersham", job: "Outdoor tap" },
    { id: "j18", tech: "mick", date: "2026-11-11", win: "am", who: "S. Bird", suburb: "Balmain", job: "Pipe repair" },
    { id: "j19", tech: "tess", date: "2026-11-12", win: "pm", who: "I. Grant", suburb: "Leichhardt", job: "Gas fitting" },
  ],
};

/* ---------------- Fact sheet ---------------- */
// One item per id: the model cites ids, the panel shows the readable line.
HARBOURLINE.facts = [
  { id: "area", label: "Where we work", text: `A plumbing business in Sydney's Inner West, working in ${Object.keys(HARBOURLINE.suburbs).join(", ")}.` },
  { id: "hours", label: "Business hours", text: "Monday to Friday, 7am to 5pm." },
  { id: "call-out", label: "Call-out fee", text: "$120 during business hours." },
  { id: "after-hours", label: "After-hours emergency", text: "$290 call-out, plus after-hours labour quoted on site." },
  { id: "labour", label: "Labour", text: "$140 an hour during business hours." },
  { id: "services", label: "Services", text: "Leaks and burst pipes; blocked drains; hot water repair and replacement, including heat pumps; toilets and taps; gas fitting." },
  { id: "lead-time", label: "Planned work", text: "Hot water replacements and installs are currently booked 1 to 2 weeks out." },
  { id: "quotes", label: "Written quotes", text: "Written quotes are valid for 30 days, and prices include GST. Parts are quoted on site unless listed." },
  { id: "payment", label: "Paying an invoice", text: "Invoices are due within 7 days, by card or bank transfer." },
];
HARBOURLINE.factSheet = () =>
  `BUSINESS FACT SHEET (this is everything you know about the business)\n- Name: ${HARBOURLINE.name}. Owner: ${HARBOURLINE.owner.name}. Office phone: ${HARBOURLINE.phone}.\n${HARBOURLINE.facts.map((f) => `- ${f.label}: ${f.text}`).join("\n")}\n- No discounts, promotions or price matching.\n- Anything not on the services list is not confirmed. Never promise it; say the team will confirm.`;

/* ---------------- Dates ---------------- */
const HL_DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const HL_MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
HARBOURLINE.dayLabel = (iso) => {
  const [y, m, d] = iso.split("-").map(Number);
  return `${HL_DAY_NAMES[new Date(Date.UTC(y, m - 1, d)).getUTCDay()]} ${d} ${HL_MONTHS[m - 1]}`;
};
HARBOURLINE.addDays = (iso, n) => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
};

/* ---------------- Calendar ---------------- */
HARBOURLINE.jobType = (id) => HARBOURLINE.jobTypes.find((j) => j.id === id) || null;
HARBOURLINE.tech = (id) => HARBOURLINE.technicians.find((t) => t.id === id) || null;

// Travel from the suburb a technician was last in. Rough by design: it
// is shown as an allowance, never as an arrival time.
HARBOURLINE.travelMinutes = (from, to) => {
  const a = HARBOURLINE.suburbs[from];
  const b = HARBOURLINE.suburbs[to];
  if (!a || !b) return 30;
  if (a === b) return 20;
  return a === "north" && b === "west" ? 40 : a === "west" && b === "north" ? 40 : 30;
};

// The board after the changes made so far: added jobs and moved jobs,
// applied over the fixed starting calendar.
HARBOURLINE.calendarWith = (changes) => {
  const jobs = HARBOURLINE.calendarJobs.map((j) => Object.assign({}, j));
  for (const c of Array.isArray(changes) ? changes : []) {
    if (c && c.move) {
      const j = jobs.find((x) => x.id === c.move);
      if (j && HARBOURLINE.tech(c.tech) && HARBOURLINE.calendarDays.includes(c.date) && HARBOURLINE.windows[c.win]) Object.assign(j, { tech: c.tech, date: c.date, win: c.win, moved: true });
    } else if (c && c.add && HARBOURLINE.tech(c.tech) && HARBOURLINE.calendarDays.includes(c.date) && HARBOURLINE.windows[c.win]) {
      jobs.push({ id: String(c.add).slice(0, 16), tech: c.tech, date: c.date, win: c.win, who: String(c.who || "").slice(0, 40), suburb: String(c.suburb || "").slice(0, 40), job: String(c.job || "").slice(0, 60), emergency: !!c.emergency, added: true });
    }
  }
  return jobs;
};

const hlSlots = (fromDate, fromWin) => {
  const out = [];
  for (const date of HARBOURLINE.calendarDays) {
    if (date < fromDate) continue;
    for (const win of ["am", "pm"]) {
      if (date === fromDate && fromWin === "pm" && win === "am") continue;
      out.push({ date, win });
    }
  }
  return out;
};
const hlTaken = (jobs, tech, date, win) => jobs.find((j) => j.tech === tech && j.date === date && j.win === win) || null;

// The travel allowance for a slot: from the technician's other job that
// day, or from the depot area when the day is otherwise empty.
HARBOURLINE.travelFor = (jobs, tech, date, win, suburb) => {
  const other = jobs.find((j) => j.tech === tech && j.date === date && j.win !== win);
  return other ? { from: other.suburb, minutes: HARBOURLINE.travelMinutes(other.suburb, suburb) } : { from: null, minutes: 20 };
};

// Where "now" sits on the fictional two weeks. A time outside them is
// treated as the start of the demo day, so a live run always has a board.
HARBOURLINE.boardNow = (stamp) => {
  const date = String(stamp || "").slice(0, 10);
  const hh = Number(String(stamp || "").slice(11, 13));
  const mm = Number(String(stamp || "").slice(14, 16));
  if (!HARBOURLINE.calendarDays.includes(date) || !Number.isFinite(hh)) return { date: HARBOURLINE.dayOfTheDemo, win: "am", minutes: 420, clamped: true };
  const minutes = hh * 60 + (Number.isFinite(mm) ? mm : 0);
  if (minutes >= 1020) {
    const next = HARBOURLINE.calendarDays[HARBOURLINE.calendarDays.indexOf(date) + 1];
    return { date: next || date, win: "am", minutes: 420, afterHours: true };
  }
  return { date, win: minutes >= 720 ? "pm" : "am", minutes };
};

// Free slots for a normal job, soonest first: never today, and planned
// work starts a week out. The model picks from these and nothing else.
HARBOURLINE.candidates = (jobs, jobTypeId, suburb, now, limit = 6) => {
  const type = HARBOURLINE.jobType(jobTypeId);
  const skills = type ? type.skills : ["pipes"];
  const techs = HARBOURLINE.technicians.filter((t) => t.skills.some((s) => skills.includes(s)));
  const days = HARBOURLINE.calendarDays;
  const start = type && type.planned ? HARBOURLINE.addDays(now.date, 7) : days[days.indexOf(now.date) + 1] || now.date;
  const from = days.find((d) => d >= start) || days[days.length - 1];
  const out = [];
  for (const s of hlSlots(from, "am")) {
    for (const t of techs) {
      if (hlTaken(jobs, t.id, s.date, s.win)) continue;
      const travel = HARBOURLINE.travelFor(jobs, t.id, s.date, s.win, suburb);
      out.push({ slot: `${t.id}|${s.date}|${s.win}`, tech: t.id, techName: t.name, date: s.date, win: s.win, label: `${HARBOURLINE.dayLabel(s.date)}, ${HARBOURLINE.windows[s.win].label.toLowerCase()} (${HARBOURLINE.windows[s.win].range})`, travelFrom: travel.from, travelMinutes: travel.minutes });
    }
  }
  // Soonest first; within a window, the shorter drive.
  out.sort((a, b) => a.date.localeCompare(b.date) || a.win.localeCompare(b.win) || a.travelMinutes - b.travelMinutes);
  return out.slice(0, limit);
};

// An emergency takes the current window of the right technician: the
// on-call plumber unless the job needs a different skill. Whoever was in that
// window moves to the technician's next free one. Worked out here, so
// the queue is never left to a model.
HARBOURLINE.emergencySlot = (jobs, jobTypeId, suburb, now) => {
  const type = HARBOURLINE.jobType(jobTypeId);
  const skills = type ? type.skills : ["pipes"];
  const able = HARBOURLINE.technicians.filter((t) => t.skills.some((s) => skills.includes(s)));
  const tech = able.find((t) => t.onCall) || able[0] || HARBOURLINE.technicians[0];
  const occupant = hlTaken(jobs, tech.id, now.date, now.win);
  let bump = null;
  if (occupant) {
    const next = hlSlots(now.date, now.win).find((s) => !(s.date === now.date && s.win === now.win) && !hlTaken(jobs, tech.id, s.date, s.win));
    if (next) bump = { job: occupant.id, who: occupant.who, jobLabel: occupant.job, suburb: occupant.suburb, tech: tech.id, date: next.date, win: next.win, label: `${HARBOURLINE.dayLabel(next.date)}, ${HARBOURLINE.windows[next.win].label.toLowerCase()}` };
  }
  const travel = HARBOURLINE.travelFor(jobs, tech.id, now.date, now.win, suburb);
  return { slot: `${tech.id}|${now.date}|${now.win}`, tech: tech.id, techName: tech.name, date: now.date, win: now.win, label: `${HARBOURLINE.dayLabel(now.date)}, ${HARBOURLINE.windows[now.win].label.toLowerCase()}`, travelFrom: travel.from, travelMinutes: travel.minutes, bump };
};

if (typeof module !== "undefined" && module.exports) module.exports = HARBOURLINE;

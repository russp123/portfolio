/* ============================================================
   Records the Ops Team's day: runs the ten events through the real
   /api/agent handler, each agent's output feeding the next agent's
   input, and writes js/agents/ops-day.js verbatim. Visitors replay
   that file; they never trigger these calls.

     OPS_RECORD_CACHE=/path/cache.json node scripts/record-ops-day.js

   Identical Gemini requests are answered from the cache file, so a
   re-run only pays for what changed. Reads GEMINI_AGENTS_API_KEY from
   .env and never prints it. Prints the number of real calls.
   ============================================================ */
const fs = require("fs");
const os = require("os");
const path = require("path");
const crypto = require("crypto");

const ROOT = path.join(__dirname, "..");
const OUT = path.join(ROOT, "js/agents/ops-day.js");
const CACHE = process.env.OPS_RECORD_CACHE || path.join(os.tmpdir(), "ops-day-cache.json");
const H = require(path.join(ROOT, "js/agents/harbourline.js"));

for (const line of fs.readFileSync(path.join(ROOT, ".env"), "utf8").split("\n")) {
  const m = line.match(/^\s*GEMINI_AGENTS_API_KEY\s*=\s*"?([^"\s]+)"?/);
  if (m) process.env.GEMINI_AGENTS_API_KEY = m[1];
}
if (!process.env.GEMINI_AGENTS_API_KEY) throw new Error("GEMINI_AGENTS_API_KEY is not set");

/* ---------------- Gemini calls: cached and counted ---------------- */
const cache = fs.existsSync(CACHE) ? JSON.parse(fs.readFileSync(CACHE, "utf8")) : { calls: {}, spent: 0 };
let newCalls = 0;
let stepMs = 0;
const realFetch = global.fetch;
global.fetch = async (url, opts) => {
  if (!String(url).includes("generativelanguage")) return realFetch(url, opts);
  const key = crypto.createHash("sha256").update(opts.body).digest("hex");
  let hit = cache.calls[key];
  if (!hit) {
    const t0 = Date.now();
    newCalls++;
    cache.spent++;
    const res = await realFetch(url, opts);
    if (!res.ok) return { ok: false, status: res.status };
    hit = { data: await res.json(), ms: Date.now() - t0 };
    cache.calls[key] = hit;
    fs.writeFileSync(CACHE, JSON.stringify(cache));
  }
  stepMs += hit.ms;
  return { ok: true, status: 200, json: async () => hit.data };
};
const handler = require(path.join(ROOT, "api/agent.js"));

let ipSeq = 0;
function call(body) {
  return new Promise((resolve) => {
    const res = {
      code: 200,
      status(c) { this.code = c; return this; },
      json(data) { resolve({ code: this.code, data }); },
    };
    handler({ method: "POST", headers: { "x-forwarded-for": `10.9.0.${(ipSeq++ % 250) + 1}` }, body }, res);
  });
}
async function callOk(body, label) {
  for (let i = 0; i < 4; i++) {
    stepMs = 0;
    const out = await call(body);
    if (out.code === 200) return { recorded: { agent: body.agent, result: out.data.result, received: out.data.received, ms: stepMs } };
    if (out.code === 404) return null;
    if (out.code === 400) throw new Error(`${label}: rejected (${out.data.error})`);
    console.log(`  ${label}: attempt ${i + 1} failed (${out.code}), waiting`);
    await new Promise((r) => setTimeout(r, 4000 * (i + 1)));
  }
  throw new Error(`${label}: gave up`);
}

/* ---------------- The day ---------------- */
const DAY = H.dayOfTheDemo;
const stamp = (time) => `${DAY}T${time}`;
const customer = (id) => H.customers.find((c) => c.id === id);
const invoice = (hours, parts = 0) => `$${H.prices.callOut + hours * H.prices.labourPerHour + parts}`;
const firstOf = (name) => String(name || "").split(/\s+/)[0];

const dana = customer("dana");
const hannah = customer("hannah");
const luke = customer("luke");
const grace = customer("grace");
const omar = customer("omar");
const greg = customer("greg");
const nina = customer("nina");
const ben = customer("ben");

const EVENTS = [
  {
    id: "e01",
    time: "07:05",
    title: "Burst pipe text",
    short: "Burst pipe",
    source: "Text message",
    incoming: `Hi, it's ${dana.name} in ${dana.suburb}. The pipe under my kitchen sink has just burst and there's water all over the floor. Can someone come this morning? ${dana.mobile}`,
    steps: [
      { id: "e01-lead", agent: "speed-to-lead", label: `Burst pipe, ${dana.first}`, channel: "Text message", handoffTo: "scheduler", why: "An emergency, so it needs a place on the board now", input: (c, ev) => ev.incoming },
      {
        id: "e01-slot",
        agent: "scheduler",
        label: `Burst pipe jumps the queue, ${dana.first}`,
        channel: "From Speed-to-Lead",
        handoffTo: "job-wrap-up",
        why: "Picked up again when the job is finished",
        fields: (c) => ({ customer: dana.name, mobile: c["e01-lead"].result.lead.contact, suburb: c["e01-lead"].result.lead.suburb, jobType: "burst-pipe", details: c["e01-lead"].result.lead.job, preferred: c["e01-lead"].result.lead.timing || "" }),
      },
    ],
  },
  {
    id: "e02",
    time: "08:20",
    title: "Website chat, blocked drain",
    short: "Blocked drain",
    source: "Website chat",
    incoming: "Hi, our laundry drain keeps backing up. Can I book someone to look at it?",
    steps: [
      {
        id: "e02-chat",
        agent: "hb-front-desk",
        label: `Blocked drain booking, ${hannah.first}`,
        handoffTo: "scheduler",
        why: "All five booking details are in",
        turns: ["Hi, our laundry drain keeps backing up. Can I book someone to look at it?", `${hannah.name}, ${hannah.mobile}`, `${hannah.suburb}. Any morning next week would be good.`],
      },
      {
        id: "e02-slot",
        agent: "scheduler",
        label: `Blocked drain placed, ${hannah.first}`,
        channel: "From Front Desk",
        fields: (c) => {
          const b = c["e02-chat"].last.captured;
          return { customer: b.name, mobile: b.mobile, suburb: b.suburb, jobType: "blocked-drain", details: b.job, preferred: b.preferredTime };
        },
      },
    ],
  },
  {
    id: "e03",
    time: "09:30",
    title: "Hot water quote request",
    short: "Hot water quote",
    source: "Web form",
    incoming: `Hi, ${luke.name} from ${luke.suburb} here. Our electric hot water tank is about 15 years old and has started leaking at the base. I'd like a quote to replace it, ideally with a heat pump. Mobile is ${luke.mobile}.`,
    steps: [
      { id: "e03-lead", agent: "speed-to-lead", label: `Hot water enquiry, ${luke.first}`, channel: "Web form", handoffTo: "quote-builder", why: "Asked for a written quote", input: (c, ev) => ev.incoming },
      {
        id: "e03-quote",
        agent: "quote-builder",
        label: `Heat pump quote, ${luke.first}`,
        channel: "From Speed-to-Lead",
        handoffTo: "scheduler",
        why: "Goes on the board once Luke accepts",
        fields: (c, ev) => ({ name: luke.name, mobile: c["e03-lead"].result.lead.contact, suburb: c["e03-lead"].result.lead.suburb, details: ev.incoming }),
      },
    ],
  },
  {
    id: "e04",
    time: "10:40",
    title: "Burst pipe job finished",
    short: "Job finished",
    source: "Technician app",
    incoming: `${H.technicians[0].first} marked ${dana.first}'s burst pipe job as done.`,
    steps: [
      {
        id: "e04-wrap",
        agent: "job-wrap-up",
        label: `Burst pipe wrapped up, ${dana.first}`,
        channel: "Technician app",
        fields: (c) => ({ customer: dana.name, mobile: dana.mobile, suburb: dana.suburb, job: c["e01-slot"].result.jobLabel, tech: c["e01-slot"].result.slot.techName, amount: invoice(2), jobNote: "Cut out the split section of copper under the kitchen sink and replaced it. Tested, no further leaks. Dana was happy and thanked Mick." }),
      },
    ],
  },
  {
    id: "e05",
    time: "11:10",
    title: "Website chat, smell of gas",
    short: "Smell of gas",
    source: "Website chat",
    incoming: `There's a strong smell of gas near my cooktop in ${grace.suburb}. What should I do?`,
    steps: [
      {
        id: "e05-chat",
        agent: "hb-front-desk",
        label: `Smell of gas, ${grace.first}`,
        handoffTo: "speed-to-lead",
        why: "An emergency, so it goes straight to the on-call flow",
        turns: [`There's a strong smell of gas near my cooktop in ${grace.suburb}. What should I do?`, `${grace.name}, ${grace.mobile}`],
      },
      {
        id: "e05-lead",
        agent: "speed-to-lead",
        label: `Gas emergency, ${grace.first}`,
        channel: "From Front Desk",
        handoffTo: "scheduler",
        why: "An emergency, so it needs a place on the board now",
        input: (c) => {
          const t = c["e05-chat"].last;
          return `Website chat hand-off. ${t.handoffNote} Customer: ${t.captured.name}, ${t.captured.suburb}, ${t.captured.mobile}.`;
        },
      },
      {
        id: "e05-slot",
        agent: "scheduler",
        label: `Gas leak jumps the queue, ${grace.first}`,
        channel: "From Speed-to-Lead",
        fields: (c) => ({ customer: grace.name, mobile: c["e05-lead"].result.lead.contact, suburb: c["e05-lead"].result.lead.suburb, jobType: "gas", details: c["e05-lead"].result.lead.job, preferred: "" }),
      },
    ],
  },
  {
    id: "e06",
    time: "12:00",
    title: "1-star review",
    short: "1-star review",
    source: "Google review",
    incoming: "Booked a plumber for a leaking cistern and waited most of the morning with no call to say they were running late. It did get fixed, but I lost half a day off work and nobody said sorry.",
    steps: [
      {
        id: "e06-review",
        agent: "hb-review-guardian",
        label: `1 star, ${greg.first}`,
        channel: "Google review",
        fields: (c, ev) => ({ rating: 1, name: greg.first, review: ev.incoming, jobNote: "Sam on site at 10:40 on 28 October, inside the 7am to 12pm window. Earlier job overran and no call was made. Cistern kit fitted, invoice $260 paid." }),
      },
    ],
  },
  {
    id: "e07",
    time: "13:20",
    title: "Luke accepts the quote",
    short: "Quote accepted",
    source: "Text message",
    incoming: "Thanks, that all looks fine. Please go ahead with the heat pump. A morning would suit best.",
    steps: [
      {
        id: "e07-slot",
        agent: "scheduler",
        label: `Heat pump placed, ${luke.first}`,
        channel: "From Quote Builder",
        handoffTo: "job-wrap-up",
        why: "Picked up again when the job is finished",
        fields: (c) => ({ customer: luke.name, mobile: luke.mobile, suburb: luke.suburb, jobType: "heat-pump", details: `Accepted quote ${c["e03-quote"].result.quote.number}. ${c["e03-quote"].result.scope}`, preferred: "A morning" }),
      },
    ],
  },
  {
    id: "e08",
    time: "14:30",
    title: "Tap repair finished",
    short: "Job finished",
    source: "Technician app",
    incoming: `${H.technicians[2].first} marked ${omar.first}'s tap repair as done, with a note about the customer.`,
    steps: [
      {
        id: "e08-wrap",
        agent: "job-wrap-up",
        label: `Tap repair with a problem, ${omar.first}`,
        channel: "Technician app",
        fields: () => ({ customer: omar.name, mobile: omar.mobile, suburb: omar.suburb, job: "Dripping tap repair", tech: H.technicians[2].name, amount: invoice(1, 35), jobNote: "Replaced the washer and seat kit on the kitchen mixer. Tap is fixed. Omar was unhappy that water was left on the floor under the sink and he had to ask for it to be cleaned up." }),
      },
    ],
  },
  {
    id: "e09",
    time: "15:00",
    title: "Old quotes sweep",
    short: "Old quotes",
    source: "Scheduled, weekly",
    incoming: "Six old quotes from the CRM, checked for age and opt-outs.",
    steps: [
      {
        id: "e09-sweep",
        agent: "hb-dead-lead-revival",
        label: "Six old quotes",
        channel: "CRM export",
        handoffTo: "quote-builder",
        why: "Ben replied yes, so he gets a fresh quote",
        fields: () => ({
          leads: [
            { id: "q1", name: ben.name, job: "hot water replacement", quoteDate: "2026-10-14", amount: "$1,180", note: "Asked us to follow up once he's back from leave at the end of October." },
            { id: "q2", name: nina.name, job: "gas cooktop connection", quoteDate: "2026-08-20", amount: "$420", note: "Renovating the kitchen. Said to check back once the new benchtop is in." },
            { id: "q3", name: "Tom Whelan", job: "heat pump install", quoteDate: "2026-07-30", amount: "$1,040", note: "Went with another plumber." },
            { id: "q4", name: "Sofia Marin", job: "leak repair", quoteDate: "2026-10-05", amount: "$420", note: "Thought it was over budget and asked if we could do it cheaper." },
            { id: "q5", name: "Kev Doyle", job: "toilet replacement", quoteDate: "2026-09-02", amount: "$610", note: "Asked us to stop texting him." },
            { id: "q6", name: "Alice Romero", job: "hot water repair", quoteDate: "2026-10-22", amount: "$420", note: "Went quiet after the site visit." },
          ],
        }),
      },
      {
        id: "e09-quote",
        agent: "quote-builder",
        label: `Hot water replacement, ${ben.first}`,
        channel: "From Dead Lead Revival",
        fields: () => ({ name: ben.name, mobile: ben.mobile, suburb: ben.suburb, details: "Replied yes to the follow-up text: still keen to replace the 12-year-old electric hot water tank, like for like. Asked for an up-to-date written quote." }),
      },
    ],
  },
  {
    id: "e10",
    time: "16:45",
    title: "5-star review",
    short: "5-star review",
    source: "Google review",
    incoming: "Pipe burst just after 7am and Mick was here that morning. Clear about the cost, tidy and friendly. Would use Harbourline again.",
    steps: [
      {
        id: "e10-review",
        agent: "hb-review-guardian",
        label: `5 stars, ${dana.first}`,
        channel: "Google review",
        fields: (c, ev) => ({ rating: 5, name: dana.first, review: ev.incoming, jobNote: "Burst pipe under the kitchen sink repaired this morning." }),
      },
    ],
  },
];

/* ---------------- The day's log, for the Daily Brief ---------------- */
const clock12 = (t) => {
  const [hh, mm] = t.split(":").map(Number);
  return `${hh % 12 || 12}:${String(mm).padStart(2, "0")}${hh < 12 ? "am" : "pm"}`;
};
function logRow(step, ev, r) {
  const at = clock12(ev.time);
  const row = (what, kind, extra = {}) => ({ time: at, agent: step.agent, what, kind, flag: "", amount: "", ...extra });
  switch (step.agent) {
    case "speed-to-lead":
      return row(`${r.lead.name || "New lead"}, ${r.lead.suburb || "suburb not given"}: ${r.lead.job}. Scored ${r.score}${r.emergency ? ", emergency, on-call plumber alerted" : ""}. Text reply drafted.`, "lead");
    case "hb-front-desk":
      return row(`Website chat with ${r.captured.name || "a customer"}: ${r.emergency ? "emergency, on-call plumber alerted" : r.bookingReady ? "booking request sent" : r.topic}.`, "chat");
    case "quote-builder":
      return row(`Quote ${r.quote.number} for ${r.quote.customer}: ${r.jobLabel}, ${r.totals ? r.totals.label : "not on the services list"}${r.totals && r.totals.partsOnSite ? " plus parts quoted on site" : ""}.`, "quote");
    case "scheduler":
      return row(`${r.customer}, ${r.suburb}: ${r.jobLabel} placed ${r.slot ? `${r.slot.dayLabel}, ${r.slot.window.toLowerCase()}, with ${r.slot.techName}` : "with the office"}.${r.bump ? ` Moved ${r.bump.who} to ${r.bump.label}, the customer needs telling.` : ""}`, r.emergency ? "emergency" : "booking", r.bump ? { flag: "yes" } : {});
    case "job-wrap-up":
      return row(`${r.customer}: ${r.job} finished, ${r.amount} invoiced, due ${r.dueLabel}.${r.problem ? ` Problem on the job: ${r.ownerFlag} Review request waits until the owner has called.` : " Review request drafted."}`, "job", { amount: r.amount, flag: r.problem ? "yes" : "" });
    case "hb-review-guardian":
      return row(`${r.rating}-star review from ${step.fields.name}: reply drafted${r.isNegative ? `. ${r.ownerAlert.summary}` : ""}.`, "review", r.isNegative ? { flag: "yes" } : {});
    case "hb-dead-lead-revival":
      return row(`Old quotes sweep: ${r.summary.reEngage} to re-engage, ${r.summary.nurture} to nurture, ${r.summary.dontContact} not to contact. ${r.leads.filter((l) => l.message).length} messages drafted.`, "campaign");
    default:
      return null;
  }
}

/* ---------------- Run it ---------------- */
(async () => {
  const today = new Date().toISOString().slice(0, 10);
  const ctx = {};
  const changes = [];
  const log = [];
  const out = [];
  for (const ev of EVENTS) {
    const steps = [];
    const receivedAt = stamp(ev.time);
    for (const def of ev.steps) {
      const base = { id: def.id, agent: def.agent, label: def.label, channel: def.channel || ev.source, receivedAt, recordedOn: today };
      if (def.handoffTo) Object.assign(base, { handoffTo: def.handoffTo, why: def.why });
      let step;
      if (def.turns) {
        const messages = [];
        const turns = [];
        let last = null;
        let missing = false;
        for (const user of def.turns) {
          messages.push({ role: "user", text: user });
          const r = await callOk({ agent: def.agent, messages: messages.slice(), receivedAt }, def.id);
          if (!r) { missing = true; break; }
          turns.push({ user, recorded: r.recorded });
          last = r.recorded.result;
          messages.push({ role: "assistant", text: last.reply });
        }
        if (missing) { console.log(`skip ${def.id}: ${def.agent} is not built yet`); continue; }
        ctx[def.id] = { last };
        step = Object.assign(base, { turns });
      } else {
        let payload;
        try {
          payload = def.input ? { input: def.input(ctx, ev) } : { fields: def.fields(ctx, ev) };
        } catch (e) {
          console.log(`skip ${def.id}: needs an earlier step`);
          continue;
        }
        if (payload.fields && def.agent !== "hb-dead-lead-revival" && def.agent !== "hb-review-guardian") payload.fields.receivedAt = receivedAt;
        if (def.agent === "scheduler") payload.fields.bookedToday = JSON.stringify(changes);
        const r = await callOk(Object.assign({ agent: def.agent, receivedAt }, payload), def.id);
        if (!r) { console.log(`skip ${def.id}: ${def.agent} is not built yet`); continue; }
        ctx[def.id] = r.recorded;
        step = Object.assign(base, payload, { recorded: r.recorded });
        if (def.agent === "scheduler") changes.push(...r.recorded.result.changes);
      }
      const lastResult = step.turns ? step.turns[step.turns.length - 1].recorded.result : step.recorded.result;
      const row = logRow(step, ev, lastResult);
      if (row) log.push(row);
      steps.push(step);
      console.log(`ok   ${def.id}`);
    }
    if (steps.length) out.push({ id: ev.id, time: ev.time, timeLabel: clock12(ev.time), title: ev.title, short: ev.short, source: ev.source, incoming: ev.incoming, steps });
  }

  // The owner's brief, from the log the team wrote.
  const briefAt = stamp("17:05");
  const rows = log.map((r, i) => Object.assign({ id: `r${i + 1}` }, r));
  const brief = await callOk({ agent: "daily-brief", receivedAt: briefAt, fields: { rows, receivedAt: briefAt } }, "brief");
  const briefStep = brief
    ? { id: "brief", agent: "daily-brief", label: "Wednesday's brief", channel: "End of day", receivedAt: briefAt, recordedOn: today, fields: { rows, receivedAt: briefAt }, recorded: brief.recorded }
    : null;

  const data = { date: DAY, dateLabel: H.dayLabel(DAY), events: out, brief: briefStep };
  fs.writeFileSync(OUT, `/* GENERATED by scripts/record-ops-day.js. Verbatim handler responses: do not edit by hand. */\nconst OPS_DAY = ${JSON.stringify(data, null, 1)};\n`);
  console.log(`events ${out.length}, steps ${out.reduce((n, e) => n + e.steps.length, 0)}, new Gemini calls ${newCalls}, all-time ${cache.spent}`);
})().catch((e) => {
  console.error(String(e.message || e));
  process.exit(1);
});

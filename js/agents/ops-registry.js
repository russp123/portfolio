/* ============================================================
   The Ops Team on /agents: client configs for the agents only the
   team uses (Harbourline Plumbing, fictional), plus the ops-team
   entry itself. Same graph rules as js/agents/registry.js, and the
   same engine draws them. `team: "ops-team"` keeps an agent off the
   landing cards and the dock: it is reached from the ops board.

   Facts come from js/agents/harbourline.js. No em dashes in any
   visible copy here.
   ============================================================ */

Object.assign(AGENT_ICONS, {
  team: '<circle cx="9" cy="8.5" r="3"/><path d="M3.5 19c.6-3.2 2.8-5 5.5-5s4.9 1.8 5.5 5"/><path d="M15.5 5.8a3 3 0 0 1 0 5.4"/><path d="M17 14.3c1.9.6 3.1 2.2 3.5 4.7"/>',
  quote: '<path d="M6 3.5h8.5L19 8v12a.5.5 0 0 1-.5.5H6a.5.5 0 0 1-.5-.5V4a.5.5 0 0 1 .5-.5z"/><path d="M14 3.5V8.5h5"/><path d="M9 12.5h6M9 16h6"/>',
  dollar: '<path d="M12 3.5v17"/><path d="M16.5 7.5c-.6-1.6-2.3-2.5-4.5-2.5-2.6 0-4.5 1.3-4.5 3.4 0 4.6 9.3 2.4 9.3 7.2 0 2.1-2 3.4-4.8 3.4-2.4 0-4.2-1-4.8-2.8"/>',
  wrench: '<path d="M14.5 6.5a4 4 0 0 1 5-1l-2.8 2.8 1.9 1.9 2.8-2.8a4 4 0 0 1-5.3 5.3L9 19.8a2 2 0 0 1-2.8-2.8l7.1-7.1a4 4 0 0 1 1.2-3.4z"/>',
  flag: '<path d="M6 21V4"/><path d="M6 4.5h11.5l-2.5 4 2.5 4H6"/>',
  pulse: '<path d="M3.5 12h4l2.2-6 4.3 12 2.3-6h4.2"/>',
});

const OPS_BUSINESS = HARBOURLINE.name;
const opsMoney = (n) => `$${Number(n).toLocaleString("en-AU")}`;

const OPS_AGENTS = [
  {
    id: "ops-team",
    status: "live",
    view: "ops",
    flagship: true,
    name: "Ops Team",
    business: OPS_BUSINESS,
    problem: "Eight agents run a plumber's whole day, handing work to each other.",
    cta: "Open the team",
    icon: "team",
    preview: "board",
    nodes: [],
    edges: [],
  },

  /* ---------------- Front Desk (plumbing) ---------------- */
  {
    id: "hb-front-desk",
    team: "ops-team",
    status: "live",
    mode: "chat",
    name: "Front Desk",
    short: "Front Desk",
    role: "Answers website chat from the fact sheet, takes booking requests and raises emergencies.",
    business: OPS_BUSINESS,
    problem: "Answers website chat and sends emergencies straight to the on-call plumber.",
    icon: "chat",
    preview: "chat",
    chat: {
      greeting: `Hi, you've reached ${OPS_BUSINESS}. I can help with prices, hours, booking requests and emergencies. What's going on?`,
      placeholder: `Message ${OPS_BUSINESS}`,
      roles: { user: "Customer", assistant: "Front desk" },
      replyNode: "reply",
      notes: (r) =>
        r.emergency
          ? [{ node: "handoff", tone: "urgent", icon: "bell", text: "On-call plumber alerted" }]
          : r.bookingReady
          ? [{ node: "booking", tone: "handoff", icon: "calendarCheck", text: "Booking request sent" }]
          : [],
    },
    summarize(r) {
      return [cap(r.intent), r.emergency ? "Emergency" : "", r.bookingReady ? "Booking request" : ""].filter(Boolean).join(" · ");
    },
    liveStatus: () => ["Reading the message…", "Checking the fact sheet…", "Thinking about the reply…"],
    summarizeConversation(turns) {
      const rs = turns.map((t) => t.result);
      const flags = [rs.some((r) => r.emergency) ? "Emergency" : "", rs.some((r) => r.bookingReady) ? "Booking request" : ""].filter(Boolean);
      return [`${turns.length} turn${turns.length === 1 ? "" : "s"}`, ...flags].join(" · ");
    },

    nodes: [
      {
        id: "message",
        type: "trigger",
        col: 0,
        row: 0,
        label: "Customer message",
        icon: "chat",
        about: "Each message the customer sends starts one run through the flow.",
        view: (run) => [{ type: "quote", title: `Turn ${run.turn}`, body: run.input }],
      },
      {
        id: "understand",
        type: "ai",
        col: 1,
        row: 0,
        label: "Understand",
        icon: "sparkle",
        about: "Works out what the customer wants and what it's about.",
        caption: (r) => cap(r.intent),
        view: (run) => [
          { type: "badge", label: cap(run.result.intent), tone: "strong" },
          { type: "kv", rows: [["Intent", cap(run.result.intent)], ["Topic", run.result.topic]] },
        ],
      },
      {
        id: "emergency",
        type: "branch",
        col: 2,
        row: 0,
        label: "Emergency?",
        icon: "split",
        about: "Escaping water, a burst pipe, sewage or a smell of gas goes to the on-call plumber straight away.",
        decide: (r) => (r.emergency ? "yes" : "no"),
        caption: (r) => (r.emergency ? cap(r.emergencyType || "Yes") : "No"),
        view: (run) => {
          const r = run.result;
          return [
            { type: "badge", label: r.emergency ? "Emergency" : "Not an emergency", tone: r.emergency ? "accent" : "muted" },
            { type: "text", body: r.emergency ? "This can't wait for a booking, so it goes to the on-call plumber now, with one safety step for the customer." : "Nothing urgent here. The front desk answers from the fact sheet." },
          ];
        },
      },
      {
        id: "handoff",
        type: "action",
        col: 3,
        row: -1,
        label: "Hand to on-call",
        icon: "bell",
        about: "On the emergency path only: writes the note for the on-call plumber and passes the job to Speed-to-Lead.",
        caption: () => "Plumber alerted",
        view: (run) => [
          { type: "quote", title: "Note to the on-call plumber", body: run.result.handoffNote },
          { type: "note", body: "A mock hand-off. Nothing is sent." },
        ],
      },
      {
        id: "lookup",
        type: "ai",
        col: 4,
        row: 0,
        label: "Look up facts",
        icon: "book",
        about: "The fact-sheet items this reply relies on. Nothing outside the fact sheet is allowed.",
        caption: (r) => (r.factsUsed.length ? `${r.factsUsed.length} fact${r.factsUsed.length === 1 ? "" : "s"}` : "None needed"),
        view: (run) => [{ type: "list", title: "Fact sheet items used", items: run.result.factsUsed, empty: "No business facts needed for this reply." }],
      },
      {
        id: "reply",
        type: "ai",
        col: 5,
        row: 0,
        label: "Reply",
        icon: "message",
        about: "The message sent back to the customer: 1 to 4 short sentences.",
        caption: (r) => `${r.reply.length} chars`,
        view: (run) => [{ type: "sms", body: run.result.reply, limit: 500 }],
      },
      {
        id: "capture",
        type: "ai",
        col: 6,
        row: 0,
        label: "Capture details",
        icon: "clipboard",
        about: "Tracks booking details as the customer gives them, asking for one at a time.",
        caption: (r) => `${Object.values(r.captured).filter(Boolean).length} of 5`,
        view: (run) => {
          const c = run.result.captured;
          return [
            {
              type: "kv",
              title: "Collected so far",
              rows: [
                ["Name", c.name],
                ["Mobile", c.mobile],
                ["Suburb", c.suburb],
                ["Job", c.job],
                ["Preferred time", c.preferredTime],
              ],
              empty: "Not yet",
            },
            { type: "list", title: "Still needed", items: run.result.missing, empty: run.result.bookingReady ? "Nothing, ready to send." : "Only asked for once the customer wants to book." },
          ];
        },
      },
      {
        id: "booking",
        type: "output",
        col: 7,
        row: 0,
        label: "Booking request",
        icon: "calendarCheck",
        about: "Once the name, mobile, suburb, job and preferred time are in, the request goes to the Scheduler.",
        caption: () => "To the Scheduler",
        skip: (r) => !r.bookingReady,
        skippedView: (run) => [
          { type: "text", body: "No booking request on this turn. It's created once the name, mobile, suburb, job and preferred time are all in." },
          { type: "list", title: "Still needed", items: run.result.missing, empty: "The customer hasn't asked to book." },
        ],
        view: (run) => {
          const r = run.result;
          const c = r.captured;
          return [
            {
              type: "request",
              title: "Booking request",
              status: "Sent to the Scheduler",
              name: c.name,
              rows: [
                ["Mobile", c.mobile],
                ["Suburb", c.suburb],
                ["Job", c.job],
                ["Preferred", c.preferredTime],
              ],
              summary: r.booking.summary,
              summaryLabel: "For the Scheduler",
            },
            { type: "note", body: "A visual mock. Nothing is sent and no time is confirmed." },
          ];
        },
      },
    ],

    edges: [
      { id: "f1", from: "message", to: "understand" },
      { id: "f2", from: "understand", to: "emergency" },
      { id: "f3", from: "emergency", to: "handoff", when: "yes", label: "Yes" },
      { id: "f4", from: "handoff", to: "lookup" },
      { id: "f5", from: "emergency", to: "lookup", when: "no", label: "No" },
      { id: "f6", from: "lookup", to: "reply" },
      { id: "f7", from: "reply", to: "capture" },
      { id: "f8", from: "capture", to: "booking" },
    ],
  },

  /* ---------------- Quote Builder ---------------- */
  {
    id: "quote-builder",
    team: "ops-team",
    status: "live",
    name: "Quote Builder",
    short: "Quote Builder",
    role: "Turns job details into an itemised one-page quote, priced from the price list.",
    business: OPS_BUSINESS,
    problem: "Turns job details into an itemised one-page quote.",
    icon: "quote",
    preview: "table",
    trigger: {
      payload: "fields",
      fields: [
        { id: "receivedAt", type: "hidden" },
        { id: "name", type: "text", label: "Customer name", maxLength: 60, required: true, placeholder: "e.g. Luke Brennan" },
        { id: "mobile", type: "text", label: "Mobile (optional)", maxLength: 24, placeholder: "e.g. 0491 570 158" },
        { id: "suburb", type: "text", label: "Suburb", maxLength: 40, required: true, placeholder: "e.g. Annandale" },
        { id: "details", type: "textarea", label: "Job details", maxLength: 900, rows: 6, required: true, primary: true, placeholder: "What needs doing, in the customer's words." },
      ],
      hints: {
        sample: "This sample replays a recorded run, no live call. Edit any field to run it live.",
        custom: "Custom input runs the agent live.",
        empty: "Pick a sample or describe a job.",
      },
      emptyError: "Pick a sample, or add a name, a suburb and the job details.",
      caption: (v) => (v && v.name ? v.name : ""),
    },
    summarize(r) {
      return r.quotable ? `${r.jobLabel} · ${r.totals.label}` : "Not on the services list";
    },
    liveStatus: () => ["Reading the job…", "Matching it to the price list…", "Writing the quote…"],

    nodes: [
      {
        id: "job",
        type: "trigger",
        col: 0,
        row: 0,
        label: "Job details",
        icon: "inbox",
        about: "The job as the customer described it, usually handed over by Speed-to-Lead. Pick a sample or write your own, then run the agent.",
      },
      {
        id: "match",
        type: "ai",
        col: 1,
        row: 0,
        label: "Match job type",
        icon: "sparkle",
        about: "Finds the job type on the services list and writes the scope. Anything not on the list goes back to the team.",
        caption: (r) => (r.quotable ? r.jobLabel : "Not listed"),
        view: (run) => {
          const r = run.result;
          return [
            { type: "badge", label: r.jobLabel, tone: r.quotable ? "strong" : "accent" },
            { type: "quote", title: "Scope", body: r.scope },
            { type: "list", title: "Assumptions", items: r.assumptions, empty: "None needed." },
            ...(r.notListed ? [{ type: "text", body: r.notListed }] : []),
          ];
        },
      },
      {
        id: "price",
        type: "action",
        col: 2,
        row: 0,
        label: "Work out price",
        icon: "dollar",
        about: "Call-out and labour come from the price list and are worked out in code. The model never does the sums.",
        caption: (r) => (r.quotable ? r.totals.label : "Needs the team"),
        view: (run) => {
          const r = run.result;
          if (!r.quotable) return [{ type: "text", body: "This job isn't on the services list, so no price is worked out. The team will confirm." }];
          return [
            { type: "kv", title: "From the price list", rows: r.lines.filter((l) => l.detail !== "Part").map((l) => [l.item, `${l.detail}: ${l.amount}`]) },
            { type: "kv", rows: [["Estimate", r.totals.label]] },
          ];
        },
      },
      {
        id: "parts",
        type: "action",
        col: 3,
        row: 0,
        label: "Parts",
        icon: "wrench",
        about: "Only parts on the fact sheet carry a price. Everything else reads \"Quoted on site\".",
        caption: (r) => (r.parts.length ? `${r.parts.length} part${r.parts.length === 1 ? "" : "s"}` : "None"),
        view: (run) => [{ type: "kv", title: "Parts", rows: run.result.parts.map((p) => [p.name, p.label]), empty: "None" }, ...(run.result.parts.length ? [] : [{ type: "text", body: "No parts listed for this job." }])],
      },
      {
        id: "note",
        type: "ai",
        col: 4,
        row: 0,
        label: "Customer note",
        icon: "message",
        about: "The text that goes with the quote. The model writes the words, the figures are added by code.",
        caption: (r) => `${r.customerMessage.length} chars`,
        view: (run) => [{ type: "sms", body: run.result.customerMessage, limit: 320 }],
      },
      {
        id: "quote",
        type: "output",
        col: 5,
        row: 0,
        label: "Quote",
        icon: "quote",
        about: "The deliverable: a one-page quote you can print or save as a PDF.",
        caption: (r) => r.quote.number,
        view: (run) => [{ type: "quoteDoc", result: run.result }, { type: "note", body: "A visual mock for a fictional business. Nothing is sent." }],
      },
    ],

    edges: [
      { id: "q1", from: "job", to: "match" },
      { id: "q2", from: "match", to: "price" },
      { id: "q3", from: "price", to: "parts" },
      { id: "q4", from: "parts", to: "note" },
      { id: "q5", from: "note", to: "quote" },
    ],
  },

  /* ---------------- Scheduler ---------------- */
  {
    id: "scheduler",
    team: "ops-team",
    status: "live",
    name: "Scheduler",
    short: "Scheduler",
    role: "Places jobs on the technicians' calendar. Emergencies jump the queue, and nobody is promised an exact time.",
    business: OPS_BUSINESS,
    problem: "Places jobs on the week's calendar. Emergencies jump the queue.",
    icon: "calendar",
    preview: "table",
    trigger: {
      payload: "fields",
      fields: [
        { id: "receivedAt", type: "hidden" },
        { id: "bookedToday", type: "hidden" },
        { id: "customer", type: "text", label: "Customer", maxLength: 60, required: true, placeholder: "e.g. Hannah Cole" },
        { id: "mobile", type: "text", label: "Mobile (optional)", maxLength: 24, placeholder: "e.g. 0491 570 157" },
        { id: "suburb", type: "select", label: "Suburb", options: Object.keys(HARBOURLINE.suburbs).map((v) => ({ value: v, label: v })) },
        { id: "jobType", type: "select", label: "Job type", options: HARBOURLINE.jobTypes.map((j) => ({ value: j.id, label: j.label })) },
        { id: "details", type: "textarea", label: "Job details", maxLength: 600, rows: 4, required: true, primary: true, placeholder: "What needs doing, and how urgent it is." },
        { id: "preferred", type: "text", label: "Preferred time (optional)", maxLength: 80, placeholder: "e.g. Any morning next week" },
      ],
      hints: {
        sample: "This sample replays a recorded run, no live call. Edit any field to run it live on the same board.",
        custom: "Custom input runs the agent live, on the fictional board as it stood for this sample.",
        empty: "Pick a sample or describe a job.",
      },
      emptyError: "Pick a sample, or add a customer and the job details.",
      caption: (v) => (v && v.customer ? v.customer : ""),
    },
    summarize(r) {
      return [r.jobLabel, r.emergency ? "Jumped the queue" : r.slot ? r.slot.dayLabel : "With the office"].join(" · ");
    },
    liveStatus: () => ["Reading the job…", "Checking the calendar…", "Writing the text…"],

    nodes: [
      {
        id: "job",
        type: "trigger",
        col: 0,
        row: 0,
        label: "New job",
        icon: "inbox",
        about: "A job handed over by Speed-to-Lead, Front Desk or Quote Builder. Pick a sample or write your own, then run the agent.",
      },
      {
        id: "read",
        type: "ai",
        col: 1,
        row: 0,
        label: "Read job",
        icon: "sparkle",
        about: "Works out what the job is, against the job types on the fact sheet.",
        caption: (r) => r.jobLabel,
        view: (run) => {
          const r = run.result;
          return [
            { type: "badge", label: r.jobLabel, tone: "strong" },
            { type: "kv", rows: [["Customer", r.customer], ["Suburb", r.suburb], ["Reads as", r.read], ["Kind of work", r.planned ? "Planned, booked at least a week out" : "Repair"]] },
          ];
        },
      },
      {
        id: "emergency",
        type: "branch",
        col: 2,
        row: 0,
        label: "Emergency?",
        icon: "split",
        about: "Escaping water, sewage or gas can't wait for a free slot.",
        decide: (r) => (r.emergency ? "yes" : "no"),
        caption: (r) => (r.emergency ? "Yes" : "No"),
        view: (run) => [
          { type: "badge", label: run.result.emergency ? "Emergency" : "Not an emergency", tone: run.result.emergency ? "accent" : "muted" },
          { type: "text", body: run.result.emergencyReason || "This job can take the next suitable free slot." },
        ],
      },
      {
        id: "bump",
        type: "action",
        col: 3,
        row: -1,
        label: "Jump the queue",
        icon: "bolt",
        about: "Takes the current window of the right technician. Whoever was there moves to that technician's next free window. Worked out in code.",
        caption: (r) => (r.bump ? `Moved ${r.bump.who}` : "Window was free"),
        view: (run) => {
          const r = run.result;
          return [
            { type: "kv", title: "Takes", rows: [["Technician", r.slot.techName], ["Day", r.slot.dayLabel], ["Window", `${r.slot.window}, ${r.slot.range}`], ["Travel allowance", `About ${r.slot.travelMinutes} minutes`]] },
            r.bump
              ? { type: "kv", title: "Moves", rows: [["Customer", r.bump.who], ["Job", r.bump.jobLabel], ["New window", r.bump.label]] }
              : { type: "text", body: "That window was free, so nobody had to move." },
            ...(r.bump ? [{ type: "note", body: `${r.bump.who} needs a call about the new window. It's on the owner's brief.` }] : []),
          ];
        },
      },
      {
        id: "pick",
        type: "ai",
        col: 3,
        row: 0,
        label: "Pick a slot",
        icon: "calendarCheck",
        about: "Chooses from the free slots the code found, weighing the customer's preference, how soon it is, and travel.",
        caption: (r) => (r.slot ? `${r.slot.dayLabel.split(" ")[0]}, ${r.slot.window.toLowerCase()}` : "With the office"),
        view: (run) => {
          const r = run.result;
          if (!r.slot) return [{ type: "text", body: "No free slot on the two-week board, so the office takes it from here." }];
          return [
            { type: "kv", title: "Chosen", rows: [["Technician", r.slot.techName], ["Day", r.slot.dayLabel], ["Window", `${r.slot.window}, ${r.slot.range}`], ["Travel allowance", `About ${r.slot.travelMinutes} minutes${r.slot.travelFrom ? ` from ${r.slot.travelFrom}` : ""}`], ["Why", r.slotReason]] },
            { type: "list", title: "Slots it weighed", items: r.considered.map((c) => `${c.label}, ${c.tech}, about ${c.travelMinutes} minutes' travel${c.chosen ? " (chosen)" : ""}`), empty: "None" },
          ];
        },
      },
      {
        id: "text",
        type: "ai",
        col: 4,
        row: 0,
        label: "Customer text",
        icon: "message",
        about: "The text to the customer: a window, never an exact time, and never a named technician.",
        caption: (r) => `${r.customerMessage.length} chars`,
        view: (run) => [{ type: "sms", body: run.result.customerMessage, limit: 320 }],
      },
      {
        id: "calendar",
        type: "output",
        col: 5,
        row: 0,
        label: "Week calendar",
        icon: "calendar",
        about: "The deliverable: the board with this job on it. Morning and afternoon windows, one job per technician per window.",
        caption: (r) => (r.slot ? `${r.slot.techName.split(" ")[0]}, ${r.slot.dayLabel.split(" ").slice(0, 2).join(" ")}` : "With the office"),
        view: (run) => {
          const r = run.result;
          let before = [];
          try { before = JSON.parse((run.fields && run.fields.bookedToday) || "[]"); } catch (e) { before = []; }
          return [
            ...(r.slot ? [{ type: "kv", title: "This job", rows: [["Technician", r.slot.techName], ["Day", r.slot.dayLabel], ["Window", `${r.slot.window}, ${r.slot.range}`], ["Travel allowance", `About ${r.slot.travelMinutes} minutes`]] }] : []),
            { type: "calendar", title: "The board after this job", changes: before.concat(r.changes), focus: r.addedId, moved: r.bump ? r.bump.job : null, week: r.slot ? r.slot.date : HARBOURLINE.dayOfTheDemo },
            { type: "note", body: "A fictional board. Nothing is booked or sent." },
          ];
        },
      },
    ],

    edges: [
      { id: "s1", from: "job", to: "read" },
      { id: "s2", from: "read", to: "emergency" },
      { id: "s3", from: "emergency", to: "bump", when: "yes", label: "Yes" },
      { id: "s4", from: "emergency", to: "pick", when: "no", label: "No" },
      { id: "s5", from: "bump", to: "text" },
      { id: "s6", from: "pick", to: "text" },
      { id: "s7", from: "text", to: "calendar" },
    ],
  },

  /* ---------------- Job Wrap-up ---------------- */
  {
    id: "job-wrap-up",
    team: "ops-team",
    status: "live",
    name: "Job Wrap-up",
    short: "Job Wrap-up",
    role: "After each job, writes the payment reminder and the review request, and tells the owner if something went wrong.",
    business: OPS_BUSINESS,
    problem: "After a job: a payment reminder, a review request, and a flag if it went badly.",
    icon: "listCheck",
    preview: "phone",
    trigger: {
      payload: "fields",
      fields: [
        { id: "receivedAt", type: "hidden" },
        { id: "customer", type: "text", label: "Customer", maxLength: 60, required: true, placeholder: "e.g. Dana Moretti" },
        { id: "mobile", type: "text", label: "Mobile (optional)", maxLength: 24, placeholder: "e.g. 0491 570 156" },
        { id: "suburb", type: "text", label: "Suburb", maxLength: 40, required: true, placeholder: "e.g. Marrickville" },
        { id: "job", type: "text", label: "Job", maxLength: 80, required: true, placeholder: "e.g. Burst pipe repair" },
        { id: "tech", type: "text", label: "Technician (optional)", maxLength: 40, placeholder: "e.g. Mick Tran" },
        { id: "amount", type: "text", label: "Invoice amount", maxLength: 12, required: true, placeholder: "e.g. $400" },
        { id: "jobNote", type: "textarea", label: "Technician's note", maxLength: 600, rows: 4, required: true, primary: true, placeholder: "How the job went." },
      ],
      hints: {
        sample: "This sample replays a recorded run, no live call. Edit any field to run it live.",
        custom: "Custom input runs the agent live.",
        empty: "Pick a sample or describe a finished job.",
      },
      emptyError: "Pick a sample, or fill in the customer, suburb, job, invoice amount and the note.",
      caption: (v) => (v && v.customer ? v.customer : ""),
    },
    summarize(r) {
      return [r.job, r.amount, r.problem ? "Owner flagged" : ""].filter(Boolean).join(" · ");
    },
    liveStatus: () => ["Reading the technician's note…", "Writing the payment reminder…", "Writing the review request…"],

    nodes: [
      {
        id: "job",
        type: "trigger",
        col: 0,
        row: 0,
        label: "Job finished",
        icon: "wrench",
        about: "A technician marks a job as done. Pick a sample or write your own, then run the agent.",
      },
      {
        id: "read",
        type: "ai",
        col: 1,
        row: 0,
        label: "Read note",
        icon: "sparkle",
        about: "Reads the technician's note to see how the job went.",
        caption: (r) => (r.problem ? "A problem" : "Went fine"),
        view: (run) => [{ type: "kv", rows: [["Job", run.result.job], ["Technician", run.result.tech], ["Reads as", run.result.noteRead]] }],
      },
      {
        id: "payment",
        type: "ai",
        col: 2,
        row: 0,
        label: "Payment reminder",
        icon: "dollar",
        about: "A signed text with the invoice amount and the due date. The due date is worked out in code.",
        caption: (r) => r.amount,
        view: (run) => [{ type: "kv", rows: [["Invoice", run.result.amount], ["Due", run.result.dueLabel]] }, { type: "sms", body: run.result.paymentMessage, limit: 320 }],
      },
      {
        id: "problem",
        type: "branch",
        col: 3,
        row: 0,
        label: "A problem?",
        icon: "split",
        about: "If the note shows something went wrong, the owner hears about it before the customer is asked for a review.",
        decide: (r) => (r.problem ? "yes" : "no"),
        caption: (r) => (r.problem ? "Yes" : "No"),
        view: (run) => [
          { type: "badge", label: run.result.problem ? "Owner should know" : "Nothing to flag", tone: run.result.problem ? "accent" : "muted" },
          { type: "text", body: run.result.problem ? "Something went wrong, so the owner calls first. The customer still gets the review request afterwards." : "The job went fine, so the review request goes out today." },
        ],
      },
      {
        id: "flag",
        type: "action",
        col: 4,
        row: -1,
        label: "Flag the owner",
        icon: "flag",
        about: "On the problem path only: tells the owner what happened and suggests one action.",
        caption: () => `${HARBOURLINE.owner.first} flagged`,
        view: (run) => [
          { type: "quote", title: "What happened", body: run.result.ownerFlag },
          { type: "quote", title: "Suggested action", body: run.result.suggestedAction },
          { type: "note", body: "A mock alert. Nothing is sent." },
        ],
      },
      {
        id: "review",
        type: "ai",
        col: 5,
        row: 0,
        label: "Review request",
        icon: "star",
        about: "Every customer is asked for an honest review, with a sender name and an opt-out. A problem only changes when it goes.",
        caption: (r) => (r.problem ? "After the call" : "Today"),
        view: (run) => [{ type: "kv", rows: [["When", run.result.reviewTiming]] }, { type: "sms", body: run.result.reviewMessage, limit: 320 }],
      },
      {
        id: "card",
        type: "output",
        col: 6,
        row: 0,
        label: "Wrap-up card",
        icon: "card",
        about: "The deliverable: both texts and the state of the job, ready for the office.",
        caption: (r) => (r.problem ? "Owner calls first" : "Ready to send"),
        view: (run) => {
          const r = run.result;
          return [
            {
              type: "request",
              title: "Job closed",
              status: r.problem ? `${HARBOURLINE.owner.first} calls first` : "Ready to send",
              name: r.customer,
              rows: [["Mobile", r.mobile], ["Suburb", r.suburb], ["Job", r.job], ["Invoice", `${r.amount}, due ${r.dueLabel}`]],
              summary: r.ownerFlag,
              summaryLabel: `For ${HARBOURLINE.owner.first}`,
            },
            { type: "quote", title: "Payment reminder", body: r.paymentMessage },
            { type: "quote", title: `Review request (${r.reviewTiming})`, body: r.reviewMessage },
            { type: "note", body: "A visual mock. Nothing is sent." },
          ];
        },
      },
    ],

    edges: [
      { id: "w1", from: "job", to: "read" },
      { id: "w2", from: "read", to: "payment" },
      { id: "w3", from: "payment", to: "problem" },
      { id: "w4", from: "problem", to: "flag", when: "yes", label: "Yes" },
      { id: "w5", from: "flag", to: "review" },
      { id: "w6", from: "problem", to: "review", when: "no", label: "No" },
      { id: "w7", from: "review", to: "card" },
    ],
  },
];

AGENTS.push(...OPS_AGENTS);

// The eight on the board, in lane order. Speed-to-Lead is the existing
// agent, unchanged.
const OPS_TEAM = ["hb-front-desk", "speed-to-lead", "quote-builder", "scheduler", "job-wrap-up"];

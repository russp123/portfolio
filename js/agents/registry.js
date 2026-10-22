/* ============================================================
   Agent registry for /agents (client side).
   One entry per agent: identity + copy for the landing card and
   dock, the workflow graph (nodes, edges, layout grid) and what
   each node's side panel shows. The canvas engine and the shell
   read only this, so a new agent is config + a server prompt in
   api/agent.js, with no new UI code.

   Graph rules
   - node.col / node.row: grid position. Horizontal layout uses
     col for x and row for y (negative rows sit above the main line);
     under 700px the grid turns 90deg clockwise (col becomes y, a row
     above the main line moves to its right), so nodes read top to
     bottom.
   - node.type: "trigger" | "ai" | "branch" | "action" | "output".
     Exactly one trigger. A branch node has decide(result) that
     returns the `when` value of the outgoing edge it takes.
   - caption(result): short text shown under the node after a run.
   - view(run): array of panel blocks (see BLOCKS in app.js).
   - skip(result): optional. When true the node is reached but has
     nothing to produce on this run (an output with no output), so it
     shows as skipped, never done. skippedView(run) fills its panel.
   - preview: what the landing card shows, a static sketch of the
     agent's output ("phone", "chat", "review", "table").

   Modes
   - Default (single run): one input, one result, one reveal. The
     trigger node opens a form built from `trigger.fields`: each field
     is { id, type, label, ... } with type "text" | "textarea" |
     "select" (options) | "rating" (1 to 5 stars) | "time" (wall clock
     in timeZone). maxLength and required are checked on submit and
     again on the server. Samples give a value for every field.
   - mode: "chat": every visitor message is one run of the same graph.
     The trigger node opens the Chat tab; `chat` holds the greeting,
     which node reveals the reply in the thread (replyNode), and any
     system notes (notes(result), each revealed when its node finishes).
     summarizeConversation(turns) labels a whole conversation in the
     execution logs.
   No em dashes in any visible copy here.
   ============================================================ */

const AGENT_ICONS = {
  home: '<path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6h-4v6H5a1 1 0 0 1-1-1z"/>',
  bolt: '<path d="M13 3 5 13.5h6l-1 7.5 8-10.5h-6z"/>',
  chat: '<path d="M5 5h14a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H10l-4 3.5V17H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z"/><path d="M8.5 10h7M8.5 13h4.5"/>',
  star: '<path d="m12 4 2.4 5 5.4.7-4 3.8 1 5.4L12 16.3 7.2 18.9l1-5.4-4-3.8 5.4-.7z"/>',
  revive: '<path d="M4.5 12a7.5 7.5 0 0 1 13-5.1L19.5 9"/><path d="M19.5 4.5V9H15"/><path d="M19.5 12a7.5 7.5 0 0 1-13 5.1L4.5 15"/><path d="M4.5 19.5V15H9"/>',
  inbox: '<path d="M4 13.5 6.5 5h11l2.5 8.5V19a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z"/><path d="M4 13.5h4.5l1.2 2.5h4.6l1.2-2.5H20"/>',
  gauge: '<path d="M4.5 16a7.5 7.5 0 1 1 15 0"/><path d="m12 16 3.5-4.5"/><path d="M12 16h.01"/>',
  split: '<path d="M5 12h5"/><path d="M10 12c3 0 3-5 6-5h3"/><path d="M10 12c3 0 3 5 6 5h3"/><path d="m17 4.5 2.5 2.5L17 9.5"/><path d="m17 14.5 2.5 2.5-2.5 2.5"/>',
  bell: '<path d="M6.5 16V11a5.5 5.5 0 0 1 11 0v5l1.5 2h-14z"/><path d="M10 20.5a2.2 2.2 0 0 0 4 0"/>',
  message: '<path d="M4 6a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1h-8l-4 3.5V16H5a1 1 0 0 1-1-1z"/>',
  calendar: '<rect x="4" y="5.5" width="16" height="14" rx="1.5"/><path d="M4 10h16M8.5 3.5v4M15.5 3.5v4"/>',
  card: '<rect x="3.5" y="5" width="17" height="14" rx="2"/><circle cx="9" cy="11" r="2.2"/><path d="M5.8 16.5c.6-1.6 1.8-2.4 3.2-2.4s2.6.8 3.2 2.4M14.5 10h3.5M14.5 13.5h3.5"/>',
  sparkle: '<path d="M12 3.5 13.8 8.7 19 10.5 13.8 12.3 12 17.5 10.2 12.3 5 10.5 10.2 8.7z"/><path d="M18 16.5v3M16.5 18h3"/>',
  stethoscope: '<path d="M6 4v5a4 4 0 0 0 8 0V4"/><path d="M10 13v1.5a4.5 4.5 0 0 0 9 0V13"/><circle cx="19" cy="11" r="2"/>',
  book: '<path d="M5 5.5A1.5 1.5 0 0 1 6.5 4H19v14H6.5A1.5 1.5 0 0 0 5 19.5z"/><path d="M5 19.5A1.5 1.5 0 0 0 6.5 21H19"/><path d="M9 8.5h6"/>',
  clipboard: '<rect x="5" y="4.5" width="14" height="16" rx="2"/><path d="M9 4.5V3.5h6v1M9 10h6M9 14h4"/>',
  calendarCheck: '<rect x="4" y="5.5" width="16" height="14" rx="1.5"/><path d="M4 10h16M8.5 3.5v4M15.5 3.5v4"/><path d="m9.5 14.6 2 2 3.6-3.6"/>',
};

function agentIcon(name, size = 24) {
  return `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${AGENT_ICONS[name] || ""}</svg>`;
}

const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : "");

const AGENTS = [
  {
    id: "speed-to-lead",
    status: "live",
    name: "Speed-to-Lead Responder",
    business: "Harbourline Plumbing",
    problem: "Replies to new leads in seconds, not hours.",
    icon: "bolt",
    preview: "phone",
    // Trigger form: fields render in order (app.js builds the panel).
    // Field ids "input" and "receivedAt" go to the API as they always
    // have; agents with payload: "fields" send { fields: {...} } instead.
    trigger: {
      fields: [
        { id: "receivedAt", type: "time", label: "Received (Sydney time)", timeZone: "Australia/Sydney" },
        {
          id: "input",
          type: "textarea",
          label: "Lead message",
          placeholder: "Paste a web form, a text, or a missed-call voicemail transcript.",
          maxLength: 2000,
          rows: 7,
          required: true,
          primary: true,
        },
      ],
      hints: {
        sample: "This sample replays a recorded run, no live call. Edit the text or time to run it live.",
        custom: "Custom input runs the agent live.",
        empty: "Pick a sample or write your own lead.",
      },
      emptyError: "Pick a sample or type a lead message first.",
      customCaption: "Custom message",
    },
    summarize(r) {
      return `${cap(r.score)} lead${r.emergency ? " · Emergency" : ""}`;
    },

    nodes: [
      {
        id: "lead",
        type: "trigger",
        col: 0,
        row: 0,
        label: "New lead",
        icon: "inbox",
        about: "A new lead arrives by web form, text or missed-call voicemail. Pick a sample or write your own, then run the agent.",
      },
      {
        id: "qualify",
        type: "ai",
        col: 1,
        row: 0,
        label: "Qualify lead",
        icon: "gauge",
        about: "Pulls out who, where and what, then scores the lead hot, warm or cold.",
        caption: (r) => cap(r.score),
        view: (run) => {
          const r = run.result;
          return [
            { type: "badge", label: cap(r.score), tone: r.score === "hot" ? "accent" : r.score === "warm" ? "strong" : "muted" },
            { type: "text", body: r.scoreReason },
            {
              type: "kv",
              title: "From the message",
              rows: [
                ["Name", r.lead.name],
                ["Contact", r.lead.contact],
                ["Suburb", r.lead.suburb],
                ["Job", r.lead.job],
                ["Timing", r.lead.timing],
              ],
              empty: "Not given",
            },
            { type: "list", title: "Still needed", items: r.missing, empty: "Nothing, ready to book." },
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
        about: "Decides whether this needs the on-call plumber right now.",
        decide: (r) => (r.emergency ? "yes" : "no"),
        caption: (r) => (r.emergency ? "Yes" : "No"),
        view: (run) => [
          { type: "badge", label: run.result.emergency ? "Emergency" : "Not an emergency", tone: run.result.emergency ? "accent" : "muted" },
          { type: "text", body: run.result.emergencyReason },
        ],
      },
      {
        id: "alert",
        type: "action",
        col: 3,
        row: -1,
        label: "Alert on-call plumber",
        icon: "bell",
        about: "On the emergency path only: writes the internal alert for whoever is on call.",
        caption: () => "Alert drafted",
        view: (run) => [
          { type: "quote", title: "Internal alert", body: run.result.onCallAlert },
          { type: "note", body: "A mock alert. Nothing is sent." },
        ],
      },
      {
        id: "reply",
        type: "ai",
        col: 4,
        row: 0,
        label: "Draft text reply",
        icon: "message",
        about: "Writes the first text back: friendly, signed, and asking only for what's missing.",
        caption: (r) => `${r.textReply.length} chars`,
        view: (run) => [{ type: "sms", body: run.result.textReply, limit: 320 }],
      },
      {
        id: "booking",
        type: "ai",
        col: 5,
        row: 0,
        label: "Suggest booking",
        icon: "calendar",
        about: "Suggests when to book the job, inside business hours unless it's an emergency.",
        caption: (r) => r.booking.window,
        view: (run) => [
          { type: "kv", rows: [["Window", run.result.booking.window], ["Why", run.result.booking.reason]] },
          { type: "kv", title: "When it came in", rows: [["Received", run.received.label], ["Business hours", run.received.inHours ? "Open" : "Closed"]] },
        ],
      },
      {
        id: "crm",
        type: "output",
        col: 6,
        row: 0,
        label: "CRM card",
        icon: "card",
        about: "The deliverable: the text thread and a ready-to-work CRM contact card.",
        caption: (r) => r.crm.stage,
        view: (run) => {
          const r = run.result;
          return [
            { type: "thread", title: "Text thread", channel: run.channel || "New lead", incoming: run.input, outgoing: r.textReply, from: r.lead.name || "New lead", business: "Harbourline Plumbing" },
            {
              type: "crm",
              title: "CRM contact",
              name: r.lead.name,
              rows: [
                ["Contact", r.lead.contact],
                ["Suburb", r.lead.suburb],
                ["Job", r.lead.job],
              ],
              stage: r.crm.stage,
              score: cap(r.score),
              tags: r.crm.tags,
              nextAction: r.crm.nextAction,
            },
            { type: "note", body: "A visual mock. Nothing is sent or saved to a real CRM." },
          ];
        },
      },
    ],

    edges: [
      { id: "e1", from: "lead", to: "qualify" },
      { id: "e2", from: "qualify", to: "emergency" },
      { id: "e3", from: "emergency", to: "alert", when: "yes", label: "Yes" },
      { id: "e4", from: "alert", to: "reply" },
      { id: "e5", from: "emergency", to: "reply", when: "no", label: "No" },
      { id: "e6", from: "reply", to: "booking" },
      { id: "e7", from: "booking", to: "crm" },
    ],
  },


  {
    id: "front-desk",
    status: "live",
    mode: "chat",
    name: "AI Front Desk",
    business: "Brightwater Dental",
    problem: "Answers patient questions around the clock, and knows when to hand off.",
    icon: "chat",
    preview: "chat",
    chat: {
      greeting: "Hi, you've reached Brightwater Dental. I can help with prices, opening hours, health funds and booking requests. What can I help with today?",
      placeholder: "Message Brightwater Dental",
      roles: { user: "Patient", assistant: "Front desk" },
      replyNode: "reply",
      notes: (r) =>
        r.clinical ? [{ node: "handoff", tone: r.urgent ? "urgent" : "handoff", text: r.urgent ? "Handed to dentist · urgent advice given" : "Handed to dentist" }] : [],
    },
    summarize(r) {
      return [cap(r.intent), r.urgent ? "Urgent" : r.clinical ? "Handed to dentist" : "", r.bookingReady ? "Booking request" : ""].filter(Boolean).join(" · ");
    },
    summarizeConversation(turns) {
      const rs = turns.map((t) => t.result);
      const flags = [
        rs.some((r) => r.urgent) ? "Urgent" : rs.some((r) => r.clinical) ? "Handed to dentist" : "",
        rs.some((r) => r.bookingReady) ? "Booking request" : "",
      ].filter(Boolean);
      return [`${turns.length} turn${turns.length === 1 ? "" : "s"}`, ...flags].join(" · ");
    },

    nodes: [
      {
        id: "message",
        type: "trigger",
        col: 0,
        row: 0,
        label: "Patient message",
        icon: "chat",
        about: "Each message the patient sends starts one run through the flow.",
        view: (run) => [{ type: "quote", title: `Turn ${run.turn}`, body: run.input }],
      },
      {
        id: "understand",
        type: "ai",
        col: 1,
        row: 0,
        label: "Understand",
        icon: "sparkle",
        about: "Works out what the patient wants and what it's about.",
        caption: (r) => cap(r.intent),
        view: (run) => [
          { type: "badge", label: cap(run.result.intent), tone: "strong" },
          { type: "kv", rows: [["Intent", cap(run.result.intent)], ["Topic", run.result.topic]] },
        ],
      },
      {
        id: "clinical",
        type: "branch",
        col: 2,
        row: 0,
        label: "Clinical or urgent?",
        icon: "split",
        about: "Anything clinical goes to the dentist. A red flag gets emergency advice first.",
        decide: (r) => (r.clinical || r.urgent ? "yes" : "no"),
        caption: (r) => (r.urgent ? "Urgent" : r.clinical ? "Clinical" : "No"),
        view: (run) => {
          const r = run.result;
          return [
            { type: "badge", label: r.urgent ? "Urgent: red flag" : r.clinical ? "Clinical" : "Front desk can answer", tone: r.urgent ? "accent" : r.clinical ? "strong" : "muted" },
            {
              type: "text",
              body: r.urgent
                ? "A red flag came up, so the reply sends them to 000 or the nearest emergency department first."
                : r.clinical
                ? "This needs the dentist, so the front desk doesn't advise. It hands off and offers an appointment."
                : "Nothing clinical here. The front desk answers from the fact sheet.",
            },
          ];
        },
      },
      {
        id: "handoff",
        type: "action",
        col: 3,
        row: -1,
        label: "Hand off to dentist",
        icon: "stethoscope",
        about: "On the clinical path only: writes a note for the dentist instead of answering.",
        caption: (r) => (r.urgent ? "000 advice given" : "Note sent"),
        view: (run) => {
          const r = run.result;
          const blocks = [{ type: "quote", title: "Note to the dentist", body: r.handoffNote }];
          if (r.urgent) blocks.push({ type: "quote", title: "Red-flag advice given", body: "Call 000 or go to the nearest emergency department now." });
          blocks.push({ type: "note", body: "A mock hand-off. Nothing is sent." });
          return blocks;
        },
      },
      {
        id: "lookup",
        type: "ai",
        col: 4,
        row: 0,
        label: "Look up clinic info",
        icon: "book",
        about: "The fact-sheet items this reply relies on. Nothing outside the fact sheet is allowed.",
        caption: (r) => (r.factsUsed.length ? `${r.factsUsed.length} fact${r.factsUsed.length === 1 ? "" : "s"}` : "None needed"),
        view: (run) => [{ type: "list", title: "Fact sheet items used", items: run.result.factsUsed, empty: "No clinic facts needed for this reply." }],
      },
      {
        id: "reply",
        type: "ai",
        col: 5,
        row: 0,
        label: "Reply",
        icon: "message",
        about: "The message sent back to the patient: 2 to 4 short sentences.",
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
        about: "Tracks booking details as the patient gives them, asking for one at a time.",
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
                ["Patient", c.patientType ? `${cap(c.patientType)} patient` : null],
                ["Reason", c.reason],
                ["Preferred time", c.preferredTime],
              ],
              empty: "Not yet",
            },
            {
              type: "list",
              title: "Still needed",
              items: run.result.missing,
              empty: run.result.bookingReady ? "Nothing, ready to send." : "Only asked for once the patient wants to book.",
            },
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
        about: "Once the name, mobile, patient type, reason and preferred time are in, a request goes to the front desk team.",
        caption: () => "Request sent",
        // No request on this turn: the node shows as skipped, not done.
        skip: (r) => !r.bookingReady,
        skippedView: (run) => [
          { type: "text", body: "No booking request on this turn. It's created once the name, mobile, patient type, reason and preferred time are all in." },
          { type: "list", title: "Still needed", items: run.result.missing, empty: "The patient hasn't asked to book." },
        ],
        view: (run) => {
          const r = run.result;
          const c = r.captured;
          return [
            {
              type: "request",
              title: "Booking request",
              status: "Request sent to front desk",
              name: c.name,
              rows: [
                ["Mobile", c.mobile],
                ["Patient", `${cap(c.patientType)} patient`],
                ["Reason", c.reason],
                ["Preferred", c.preferredTime],
              ],
              summary: r.booking.summary,
            },
            { type: "note", body: "A visual mock. Nothing is sent and no time is confirmed." },
          ];
        },
      },
    ],

    edges: [
      { id: "m1", from: "message", to: "understand" },
      { id: "m2", from: "understand", to: "clinical" },
      { id: "m3", from: "clinical", to: "handoff", when: "yes", label: "Yes" },
      { id: "m4", from: "handoff", to: "lookup" },
      { id: "m5", from: "clinical", to: "lookup", when: "no", label: "No" },
      { id: "m6", from: "lookup", to: "reply" },
      { id: "m7", from: "reply", to: "capture" },
      { id: "m8", from: "capture", to: "booking" },
    ],
  },

  {
    id: "review-guardian",
    status: "live",
    name: "Review Guardian",
    business: "Torque & Co Auto Service",
    problem: "Replies to every review and flags the ones the owner must see.",
    icon: "star",
    preview: "review",
    trigger: {
      payload: "fields",
      fields: [
        { id: "rating", type: "rating", label: "Star rating", required: true },
        { id: "name", type: "text", label: "Reviewer first name", maxLength: 40, required: true, placeholder: "e.g. Sam" },
        { id: "review", type: "textarea", label: "Review", maxLength: 1200, rows: 6, required: true, primary: true, placeholder: "Paste or write a customer review." },
        {
          id: "jobNote",
          type: "textarea",
          label: "Internal job note (optional)",
          maxLength: 600,
          rows: 3,
          placeholder: "What the workshop records say. Used for the owner alert only, never shown publicly.",
        },
      ],
      hints: {
        sample: "This sample replays a recorded run, no live call. Edit any field to run it live.",
        custom: "Custom input runs the agent live.",
        empty: "Pick a sample or write your own review.",
      },
      emptyError: "Pick a sample, or add a star rating, a first name and the review.",
      caption: (v) => (v && Number(v.rating) ? `${v.rating} star${Number(v.rating) === 1 ? "" : "s"}` : ""),
    },
    summarize(r) {
      return [`${r.rating} star${r.rating === 1 ? "" : "s"}`, cap(r.sentiment), r.isNegative ? "Owner alerted" : ""].filter(Boolean).join(" · ");
    },

    nodes: [
      {
        id: "review",
        type: "trigger",
        col: 0,
        row: 0,
        label: "New review",
        icon: "star",
        about: "A new review lands on the shop's Google profile. Pick a sample or write your own, then run the agent.",
      },
      {
        id: "read",
        type: "ai",
        col: 1,
        row: 0,
        label: "Read review",
        icon: "sparkle",
        about: "Works out how the customer feels and what the review is about.",
        caption: (r) => cap(r.sentiment),
        view: (run) => {
          const r = run.result;
          return [
            { type: "badge", label: cap(r.sentiment), tone: r.sentiment === "negative" ? "accent" : r.sentiment === "mixed" ? "strong" : "muted" },
            { type: "kv", rows: [["Stars", `${r.rating} of 5`], ["Topics", r.topics.map(cap).join(", ")]], empty: "None" },
          ];
        },
      },
      {
        id: "stars",
        type: "branch",
        col: 2,
        row: 0,
        label: "1 to 2 stars?",
        icon: "split",
        about: "Low ratings go to the owner before anything is posted.",
        decide: (r) => (r.isNegative ? "yes" : "no"),
        caption: (r) => (r.isNegative ? "Yes" : "No"),
        view: (run) => [
          { type: "badge", label: run.result.isNegative ? "Owner needs to see this" : "No alert needed", tone: run.result.isNegative ? "accent" : "muted" },
          {
            type: "text",
            body: run.result.isNegative
              ? "A 1 or 2 star review, so Dan gets an alert with what went wrong and a suggested next step."
              : "3 stars or more, so the reply goes straight to drafting.",
          },
        ],
      },
      {
        id: "alert",
        type: "action",
        col: 3,
        row: -1,
        label: "Alert owner",
        icon: "bell",
        about: "On 1 and 2 star reviews only: tells Dan what went wrong, checks it against the job note, and suggests one action.",
        caption: () => "Dan alerted",
        view: (run) => {
          const a = run.result.ownerAlert || {};
          return [
            { type: "quote", title: "What went wrong", body: a.summary },
            { type: "quote", title: "Against the job note", body: a.jobNoteMatch },
            { type: "quote", title: "Suggested action", body: a.suggestedAction },
            { type: "note", body: "A mock alert. Nothing is sent." },
          ];
        },
      },
      {
        id: "reply",
        type: "ai",
        col: 4,
        row: 0,
        label: "Draft public reply",
        icon: "message",
        about: "The reply posted under the review: calm, specific, under 80 words, signed by Dan.",
        caption: (r) => `${r.publicReply.trim().split(/\s+/).length} words`,
        view: (run) => [{ type: "sms", body: run.result.publicReply, limit: 80, unit: "words" }],
      },
      {
        id: "followup",
        type: "ai",
        col: 5,
        row: 0,
        label: "Private follow-up",
        icon: "chat",
        about: "A short private message to the customer. Never posted.",
        caption: () => "Text to customer",
        view: (run) => [
          { type: "quote", title: "Text message to the customer", body: run.result.followUp.message },
          { type: "note", body: "Private. Never posted, and nothing is sent in this demo." },
        ],
      },
      {
        id: "card",
        type: "output",
        col: 6,
        row: 0,
        label: "Review card",
        icon: "card",
        about: "The deliverable: the review with the owner's response under it, plus the private follow-up.",
        caption: () => "Ready to post",
        view: (run) => {
          const r = run.result;
          const f = run.fields || {};
          return [
            { type: "review", title: "Google review", name: f.name, rating: r.rating, text: f.review, reply: r.publicReply },
            { type: "quote", title: "Private follow-up", body: r.followUp.message },
            { type: "note", body: "A visual mock. Nothing is posted or sent." },
          ];
        },
      },
    ],

    edges: [
      { id: "r1", from: "review", to: "read" },
      { id: "r2", from: "read", to: "stars" },
      { id: "r3", from: "stars", to: "alert", when: "yes", label: "Yes" },
      { id: "r4", from: "alert", to: "reply" },
      { id: "r5", from: "stars", to: "reply", when: "no", label: "No" },
      { id: "r6", from: "reply", to: "followup" },
      { id: "r7", from: "followup", to: "card" },
    ],
  },

  // In training: landing card only. Not routable, not in the dock.
  { id: "dead-lead-revival", status: "training", name: "Dead Lead Revival", business: "Stonebridge Bathrooms", problem: "Wins back old quotes sitting in your CRM.", icon: "revive", preview: "table" },
];

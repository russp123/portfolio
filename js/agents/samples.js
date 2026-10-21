/* ============================================================
   Sample inputs and their RECORDED outputs for /agents.
   Each `recorded` object is the verbatim /api/agent response from
   running the real agent once on that sample during the build
   (2026-10-22). Never hand-edit a recording; re-run the agent and
   paste the new response instead.

   Clicking a sample replays its recording with no network call.
   A live call only happens for edited or custom input. When the
   live call fails or the daily cap is hit, the closest sample's
   recording plays instead.
   ============================================================ */

const AGENT_SAMPLES = {
  "speed-to-lead": [
    {
      "id": "burst-pipe",
      "label": "Burst pipe, Saturday night",
      "channel": "Missed-call voicemail",
      "receivedAt": "2026-10-24T21:40",
      "input": "Hi, it's Dana from Marrickville. The pipe under my kitchen sink has just burst and there's water all over the floor. I've turned off the little tap under the sink but it's still coming out. Is there any way someone can come out tonight? My number's 0491 570 156. Thanks.",
      "recordedOn": "2026-10-22",
      "recorded": {
        "agent": "speed-to-lead",
        "result": {
          "lead": {
            "name": "Dana",
            "contact": "0491 570 156",
            "suburb": "Marrickville",
            "job": "Burst pipe under kitchen sink",
            "timing": "tonight"
          },
          "score": "hot",
          "scoreReason": "The customer has a burst pipe and wants someone tonight.",
          "emergency": true,
          "emergencyReason": "There is an active burst pipe causing water to leak onto the floor.",
          "missing": [],
          "textReply": "Hi Dana, thanks for your message. A burst pipe is an emergency. The on-call plumber will call you shortly to arrange a visit. You may want to turn off your water at the mains if you haven't already. The after-hours emergency call-out fee is $290, plus after-hours labour quoted on site. Harbourline Plumbing",
          "onCallAlert": "Emergency: Burst pipe under kitchen sink in Marrickville. Customer Dana on 0491 570 156. Water is still coming out despite turning off the tap under the sink.",
          "booking": {
            "window": "ASAP",
            "reason": "This is an emergency with a burst pipe and active water leak."
          },
          "crm": {
            "stage": "Emergency dispatch",
            "tags": [
              "burst pipe",
              "kitchen sink",
              "emergency",
              "after hours"
            ],
            "nextAction": "Dispatch on-call plumber immediately."
          }
        },
        "received": {
          "at": "2026-10-24T21:40",
          "label": "Saturday 24 October 2026, 9:40pm",
          "inHours": false,
          "nextOpen": "Monday 26 October 2026, 7am"
        },
        "ms": 2479
      }
    },
    {
      "id": "heat-pump",
      "label": "Heat pump quote",
      "channel": "Web form",
      "receivedAt": "2026-10-27T11:00",
      "input": "Name: Priya Nair\nEmail: priya.nair@example.com\nMessage: Hi there, our electric hot water system is about 15 years old and we'd like to swap it for a heat pump. No rush, sometime next month would suit us. Could you give us an idea of what's involved and send through a quote? We're in Leichhardt.",
      "recordedOn": "2026-10-22",
      "recorded": {
        "agent": "speed-to-lead",
        "result": {
          "lead": {
            "name": "Priya Nair",
            "contact": "priya.nair@example.com",
            "suburb": "Leichhardt",
            "job": "Replace electric hot water system with a heat pump",
            "timing": "sometime next month"
          },
          "score": "warm",
          "scoreReason": "The customer wants a quote for a heat pump replacement with flexible timing.",
          "emergency": false,
          "emergencyReason": "There is no active emergency like a burst pipe or gas leak.",
          "missing": [
            "photo of the hot water system",
            "photo of the installation area"
          ],
          "textReply": "Hi Priya, thanks for reaching out. We can help with heat pump hot water system replacement. To quote, please send a photo of your current hot water system and the installation area. The call-out fee during business hours is $120. Harbourline Plumbing",
          "onCallAlert": null,
          "booking": {
            "window": "Weekdays from Monday 2 November, 7am to 5pm",
            "reason": "The customer wants to schedule the replacement sometime next month."
          },
          "crm": {
            "stage": "Quote requested",
            "tags": [
              "hot water",
              "heat pump",
              "quote",
              "leichhardt"
            ],
            "nextAction": "Reply to customer with request for photos to prepare quote"
          }
        },
        "received": {
          "at": "2026-10-27T11:00",
          "label": "Tuesday 27 October 2026, 11am",
          "inHours": true,
          "nextOpen": "now, 11am on Tuesday 27 October 2026 (open until 5pm today)"
        },
        "ms": 4390
      }
    },
    {
      "id": "dripping-tap",
      "label": "Dripping tap price",
      "channel": "Text message",
      "receivedAt": "2026-10-28T14:00",
      "input": "how much to fix a dripping tap?",
      "recordedOn": "2026-10-22",
      "recorded": {
        "agent": "speed-to-lead",
        "result": {
          "lead": {
            "name": null,
            "contact": null,
            "suburb": null,
            "job": "dripping tap",
            "timing": null
          },
          "score": "cold",
          "scoreReason": "The customer is asking for a price without providing details.",
          "emergency": false,
          "emergencyReason": "This is not an emergency.",
          "missing": [
            "suburb",
            "photo of the tap"
          ],
          "textReply": "Thanks for reaching out! To help us quote fixing your dripping tap, could you please tell us your suburb and send a photo of the tap? Our call-out fee during business hours is $120. Harbourline Plumbing",
          "onCallAlert": null,
          "booking": {
            "window": "Wednesday 28 October, 2pm to 5pm",
            "reason": "The customer is asking for a quote for a dripping tap during business hours."
          },
          "crm": {
            "stage": "Awaiting details",
            "tags": [
              "dripping tap",
              "quote",
              "price enquiry"
            ],
            "nextAction": "Get more details from the customer to provide a quote."
          }
        },
        "received": {
          "at": "2026-10-28T14:00",
          "label": "Wednesday 28 October 2026, 2pm",
          "inHours": true,
          "nextOpen": "now, 2pm on Wednesday 28 October 2026 (open until 5pm today)"
        },
        "ms": 2012
      }
    }
  ]
};

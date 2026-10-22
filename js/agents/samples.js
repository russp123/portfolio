/* ============================================================
   Sample inputs and their RECORDED outputs for /agents.
   Each `recorded` object is the verbatim /api/agent response from
   running the real agent once on that sample during the build.
   Chat agents store whole conversations: `turns`, each with the
   visitor's message and that turn's recorded response. Never
   hand-edit a recording; re-run the agent and paste the new
   response instead. Speed-to-Lead's three were recorded on
   gemini-2.5-flash, the Front Desk conversations on
   gemini-3.6-flash.

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
  ],
  "front-desk": [
    {
      "id": "new-patient",
      "label": "New patient booking",
      "receivedAt": "2026-10-22T10:20",
      "recordedOn": "2026-10-22",
      "turns": [
        {
          "user": "Hi! I'm new to the area and haven't been to a dentist in a while. How much is a check-up for a new patient?",
          "recorded": {
            "agent": "front-desk",
            "result": {
              "intent": "price",
              "topic": "new patient check-up cost",
              "clinical": false,
              "urgent": false,
              "handoffNote": null,
              "factsUsed": [
                "New patient visit: New patient check-up, clean and X-rays: $229."
              ],
              "reply": "Hello and welcome to the area! Our new patient check-up, clean and X-rays is $229. Would you like me to help you book an appointment?",
              "captured": {
                "name": null,
                "mobile": null,
                "patientType": "new",
                "reason": null,
                "preferredTime": null
              },
              "missing": [],
              "bookingReady": false,
              "booking": {
                "summary": null
              }
            },
            "received": {
              "at": "2026-10-22T10:20",
              "label": "Thursday 22 October 2026, 10:20am",
              "inHours": true,
              "nextOpen": "now, 10:20am on Thursday 22 October 2026 (open until 6pm today)"
            },
            "ms": 1941
          }
        },
        {
          "user": "That sounds good. I'd like to book in as a new patient for this Saturday morning. My name's Jordan Lee.",
          "recorded": {
            "agent": "front-desk",
            "result": {
              "intent": "booking",
              "topic": "booking request for new patient check-up",
              "clinical": false,
              "urgent": false,
              "handoffNote": null,
              "factsUsed": [],
              "reply": "Thanks Jordan. What is the mobile number to reach you on?",
              "captured": {
                "name": "Jordan Lee",
                "mobile": null,
                "patientType": "new",
                "reason": "check-up",
                "preferredTime": "this Saturday morning"
              },
              "missing": [
                "mobile number"
              ],
              "bookingReady": false,
              "booking": {
                "summary": null
              }
            },
            "received": {
              "at": "2026-10-22T10:20",
              "label": "Thursday 22 October 2026, 10:20am",
              "inHours": true,
              "nextOpen": "now, 10:20am on Thursday 22 October 2026 (open until 6pm today)"
            },
            "ms": 4085
          }
        },
        {
          "user": "It's 0491 570 157, and it's just for a check-up and clean.",
          "recorded": {
            "agent": "front-desk",
            "result": {
              "intent": "booking",
              "topic": "booking request",
              "clinical": false,
              "urgent": false,
              "handoffNote": null,
              "factsUsed": [],
              "reply": "Thanks Jordan. I have your name, mobile, patient type, reason, and preferred time for Saturday morning. I've sent your booking request to the front desk team, who will confirm a time with you shortly.",
              "captured": {
                "name": "Jordan Lee",
                "mobile": "0491 570 157",
                "patientType": "new",
                "reason": "check-up and clean",
                "preferredTime": "Saturday morning"
              },
              "missing": [],
              "bookingReady": true,
              "booking": {
                "summary": "New patient, check-up and clean, for Jordan Lee, Saturday morning, mobile 0491 570 157"
              }
            },
            "received": {
              "at": "2026-10-22T10:20",
              "label": "Thursday 22 October 2026, 10:20am",
              "inHours": true,
              "nextOpen": "now, 10:20am on Thursday 22 October 2026 (open until 6pm today)"
            },
            "ms": 2422
          }
        }
      ]
    },
    {
      "id": "toothache",
      "label": "Toothache, same day",
      "receivedAt": "2026-10-27T09:10",
      "recordedOn": "2026-10-22",
      "turns": [
        {
          "user": "My tooth is killing me, can I get in today?",
          "recorded": {
            "agent": "front-desk",
            "result": {
              "intent": "emergency",
              "topic": "toothache appointment request",
              "clinical": true,
              "urgent": false,
              "handoffNote": "Patient reported severe toothache ('tooth is killing me') and requested a same-day appointment. Offered emergency booking and passed message to dentist.",
              "factsUsed": [
                "Emergency appointments: Emergency appointments are held every weekday."
              ],
              "reply": "I am sorry to hear you are in pain, and I have passed your message on to the dentist. We hold emergency appointments every weekday, so our team will try to fit you in today. Could I please get your full name to start a booking request?",
              "captured": {
                "name": null,
                "mobile": null,
                "patientType": null,
                "reason": "toothache",
                "preferredTime": "today"
              },
              "missing": [
                "name",
                "mobile number",
                "new or existing patient"
              ],
              "bookingReady": false,
              "booking": {
                "summary": null
              }
            },
            "received": {
              "at": "2026-10-27T09:10",
              "label": "Tuesday 27 October 2026, 9:10am",
              "inHours": true,
              "nextOpen": "now, 9:10am on Tuesday 27 October 2026 (open until 6pm today)"
            },
            "ms": 4417
          }
        },
        {
          "user": "It's Sam Patel. It started last night and it hurts when I bite down, but there's no swelling.",
          "recorded": {
            "agent": "front-desk",
            "result": {
              "intent": "emergency",
              "topic": "tooth pain booking",
              "clinical": true,
              "urgent": false,
              "handoffNote": "Patient Sam Patel reports tooth pain that started last night, hurts when biting down, with no swelling. Offered emergency booking.",
              "factsUsed": [],
              "reply": "Thanks Sam. I have updated the note for the dentist about your tooth pain. We can help request an emergency appointment for you today. What is a good mobile number for us to reach you on?",
              "captured": {
                "name": "Sam Patel",
                "mobile": null,
                "patientType": null,
                "reason": "tooth pain when biting down",
                "preferredTime": "today"
              },
              "missing": [
                "mobile number",
                "new or existing patient"
              ],
              "bookingReady": false,
              "booking": {
                "summary": null
              }
            },
            "received": {
              "at": "2026-10-27T09:10",
              "label": "Tuesday 27 October 2026, 9:10am",
              "inHours": true,
              "nextOpen": "now, 9:10am on Tuesday 27 October 2026 (open until 6pm today)"
            },
            "ms": 4146
          }
        }
      ]
    },
    {
      "id": "child-cover",
      "label": "Child's cleaning cover",
      "receivedAt": "2026-10-28T15:30",
      "recordedOn": "2026-10-22",
      "turns": [
        {
          "user": "Hi, is my son's cleaning covered? He's 7.",
          "recorded": {
            "agent": "front-desk",
            "result": {
              "intent": "health funds",
              "topic": "child dental benefits schedule coverage",
              "clinical": false,
              "urgent": false,
              "handoffNote": null,
              "factsUsed": [
                "Child Dental Benefits Schedule: Accepted for eligible children."
              ],
              "reply": "Hello. We accept the Child Dental Benefits Schedule for eligible children. I cannot confirm what your private health fund or scheme covers in this chat, but our front desk team can help you check. Would you like to request a check-up and clean appointment for your son?",
              "captured": {
                "name": null,
                "mobile": null,
                "patientType": null,
                "reason": null,
                "preferredTime": null
              },
              "missing": [],
              "bookingReady": false,
              "booking": {
                "summary": null
              }
            },
            "received": {
              "at": "2026-10-28T15:30",
              "label": "Wednesday 28 October 2026, 3:30pm",
              "inHours": true,
              "nextOpen": "now, 3:30pm on Wednesday 28 October 2026 (open until 6pm today)"
            },
            "ms": 2115
          }
        },
        {
          "user": "How do I find out if he's eligible?",
          "recorded": {
            "agent": "front-desk",
            "result": {
              "intent": "health funds",
              "topic": "Child Dental Benefits Schedule eligibility",
              "clinical": false,
              "urgent": false,
              "handoffNote": null,
              "factsUsed": [
                "Child Dental Benefits Schedule: Accepted for eligible children."
              ],
              "reply": "Our front desk team can help you check if your son is eligible. If you would like to book an appointment for him, I can collect your details now and pass them on to our team.",
              "captured": {
                "name": null,
                "mobile": null,
                "patientType": null,
                "reason": null,
                "preferredTime": null
              },
              "missing": [],
              "bookingReady": false,
              "booking": {
                "summary": null
              }
            },
            "received": {
              "at": "2026-10-28T15:30",
              "label": "Wednesday 28 October 2026, 3:30pm",
              "inHours": true,
              "nextOpen": "now, 3:30pm on Wednesday 28 October 2026 (open until 6pm today)"
            },
            "ms": 1841
          }
        }
      ]
    },
    {
      "id": "antibiotics",
      "label": "Antibiotics question",
      "receivedAt": "2026-10-26T19:45",
      "recordedOn": "2026-10-22",
      "turns": [
        {
          "user": "Should I take antibiotics for my swollen gum?",
          "recorded": {
            "agent": "front-desk",
            "result": {
              "intent": "clinical",
              "topic": "swollen gum medication advice",
              "clinical": true,
              "urgent": false,
              "handoffNote": "Patient reported a swollen gum and asked if they should take antibiotics. Offered an appointment to see the dentist.",
              "factsUsed": [],
              "reply": "Hello. I am not able to advise on medication or treatments in this chat. I have passed your message to the dentist, and we would be happy to help you book an appointment so they can take a look. Would you like to request a visit?",
              "captured": {
                "name": null,
                "mobile": null,
                "patientType": null,
                "reason": null,
                "preferredTime": null
              },
              "missing": [],
              "bookingReady": false,
              "booking": {
                "summary": null
              }
            },
            "received": {
              "at": "2026-10-26T19:45",
              "label": "Monday 26 October 2026, 7:45pm",
              "inHours": false,
              "nextOpen": "Tuesday 27 October 2026, 8am"
            },
            "ms": 2130
          }
        },
        {
          "user": "It's getting worse. The swelling has spread up into my cheek now.",
          "recorded": {
            "agent": "front-desk",
            "result": {
              "intent": "emergency",
              "topic": "spreading facial swelling",
              "clinical": true,
              "urgent": true,
              "handoffNote": "Patient reported swelling spreading into their cheek. Directed to emergency services, offered follow-up visit.",
              "factsUsed": [],
              "reply": "Please call 000 or go to the nearest emergency department right now. Once you have been looked after, please let us know if you would like us to help you book a follow-up visit with the dentist.",
              "captured": {
                "name": null,
                "mobile": null,
                "patientType": null,
                "reason": null,
                "preferredTime": null
              },
              "missing": [],
              "bookingReady": false,
              "booking": {
                "summary": null
              }
            },
            "received": {
              "at": "2026-10-26T19:45",
              "label": "Monday 26 October 2026, 7:45pm",
              "inHours": false,
              "nextOpen": "Tuesday 27 October 2026, 8am"
            },
            "ms": 3783
          }
        }
      ]
    }
  ]
};

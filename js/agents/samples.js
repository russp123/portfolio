/* ============================================================
   Sample inputs and their RECORDED outputs for /agents.
   Each `recorded` object is the verbatim /api/agent response from
   running the real agent once on that sample during the build.
   Form agents keep every trigger field in `fields`. Chat agents
   store whole conversations: `turns`, each with the visitor's
   message and that turn's recorded response. Never
   hand-edit a recording; re-run the agent and paste the new
   response instead. All recordings were made on
   gemini-3.6-flash, the model live visitors get.

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
            "job": "burst pipe under kitchen sink flooding floor",
            "timing": "tonight"
          },
          "score": "hot",
          "scoreReason": "Active burst pipe causing flooding and needs immediate assistance tonight.",
          "emergency": true,
          "emergencyReason": "Active water escaping from a burst pipe flooding the kitchen floor.",
          "missing": [],
          "textReply": "Hi Dana, turn off your main water meter to stop the flow completely. Our on-call plumber will call you shortly. Our after-hours emergency call-out fee is $290 plus labour quoted on site. Harbourline Plumbing",
          "onCallAlert": "EMERGENCY: Burst pipe under kitchen sink flooding floor in Marrickville. Contact Dana on 0491 570 156. Customer tried isolating tap under sink but water still leaking.",
          "booking": {
            "window": "ASAP",
            "reason": "Active burst pipe requiring immediate after-hours emergency response."
          },
          "crm": {
            "stage": "Emergency dispatch",
            "tags": [
              "burst pipe",
              "emergency",
              "after hours",
              "marrickville"
            ],
            "nextAction": "On-call plumber to phone Dana immediately to dispatch for after-hours repair."
          }
        },
        "received": {
          "at": "2026-10-24T21:40",
          "label": "Saturday 24 October 2026, 9:40pm",
          "inHours": false,
          "nextOpen": "Monday 26 October 2026, 7am"
        },
        "ms": 2998
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
            "job": "swap 15-year-old electric hot water system for a heat pump",
            "timing": "sometime next month"
          },
          "score": "warm",
          "scoreReason": "Customer has requested a quote for a heat pump replacement next month with no immediate urgency.",
          "emergency": false,
          "emergencyReason": "This is a planned hot water replacement with no active leak or emergency reported.",
          "missing": [
            "photo of existing hot water system and installation area"
          ],
          "textReply": "Hi Priya, thanks for reaching out. We can certainly help with replacing your hot water system with a heat pump. Could you send through a photo of your existing system and installation area? Our call-out fee is $120 during business hours. Harbourline Plumbing",
          "onCallAlert": null,
          "booking": {
            "window": "Weekdays from Monday 2 November 2026, 7am to 5pm",
            "reason": "Matches customer preference for next month during standard business hours."
          },
          "crm": {
            "stage": "Quote requested",
            "tags": [
              "hot water",
              "heat pump",
              "leichhardt",
              "quote"
            ],
            "nextAction": "Review photo of existing setup once provided and send quote options for heat pump replacement."
          }
        },
        "received": {
          "at": "2026-10-27T11:00",
          "label": "Tuesday 27 October 2026, 11am",
          "inHours": true,
          "nextOpen": "now, 11am on Tuesday 27 October 2026 (open until 5pm today)"
        },
        "ms": 2872
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
            "job": "fix a dripping tap",
            "timing": null
          },
          "score": "cold",
          "scoreReason": "Bare price question with no name, suburb, or specific job details provided.",
          "emergency": false,
          "emergencyReason": "A dripping tap is not an active flood, burst pipe, or gas emergency.",
          "missing": [
            "suburb",
            "photo of the tap"
          ],
          "textReply": "Hi, our call-out fee during business hours is $120. To help us quote, could you let us know your suburb and send a photo of the tap? Harbourline Plumbing",
          "onCallAlert": null,
          "booking": {
            "window": "Wednesday 28 October, 2pm to 5pm",
            "reason": "Lead arrived during business hours, so the next available window is offered."
          },
          "crm": {
            "stage": "Awaiting details",
            "tags": [
              "dripping tap",
              "price query",
              "cold lead"
            ],
            "nextAction": "Follow up with the customer once they provide their suburb and tap details."
          }
        },
        "received": {
          "at": "2026-10-28T14:00",
          "label": "Wednesday 28 October 2026, 2pm",
          "inHours": true,
          "nextOpen": "now, 2pm on Wednesday 28 October 2026 (open until 5pm today)"
        },
        "ms": 2607
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
  ],
  "review-guardian": [
    {
      "id": "1-star-bill",
      "label": "1 star, bill above the quote",
      "channel": "Google review",
      "receivedAt": "2026-10-21T18:05",
      "fields": {
        "rating": 1,
        "name": "Grace",
        "review": "Quoted about $380 on the phone for a brake service, then got billed $690 when I picked the car up. Nobody called me to explain the extra charges. Really not happy.",
        "jobNote": "Extra brake pads approved by phone at 11:40 per the workshop log."
      },
      "recordedOn": "2026-10-22",
      "recorded": {
        "agent": "review-guardian",
        "result": {
          "sentiment": "negative",
          "rating": 1,
          "topics": [
            "price",
            "communication"
          ],
          "isNegative": true,
          "ownerAlert": {
            "summary": "Grace was charged $690 after expecting a $380 brake service, and states she received no phone call explaining the extra charges.",
            "jobNoteMatch": "The review states nobody called about extra charges, whereas the job note indicates extra brake pads were approved by phone at 11:40.",
            "suggestedAction": "Call Grace directly to discuss the invoice and clarify the communication regarding the extra work."
          },
          "publicReply": "Hi Grace, sorry to hear about your experience. You should always expect a phone call from us before any extra work is done, so I am sorry we fell short here. I would like to look into this for you. Please call me on (03) 7010 4422 so we can discuss what happened.\nDan, Torque & Co",
          "followUp": {
            "channel": "sms",
            "message": "Hi Grace, sorry to hear about the issue with your bill and communication. I would like to make things right. Please give me a call on (03) 7010 4422 when you have a moment. Dan"
          }
        },
        "received": {
          "at": "2026-10-21T18:05",
          "label": "Wednesday 21 October 2026, 6:05pm",
          "inHours": false,
          "nextOpen": "Thursday 22 October 2026, 7:30am"
        },
        "ms": 3237
      }
    },
    {
      "id": "3-star-late",
      "label": "3 stars, ready a day late",
      "channel": "Google review",
      "receivedAt": "2026-10-20T09:30",
      "fields": {
        "rating": 3,
        "name": "Liam",
        "review": "Good work on the car and it drives well now, but it was ready a day later than promised and nobody gave me an update. I had to chase it up myself.",
        "jobNote": ""
      },
      "recordedOn": "2026-10-22",
      "recorded": {
        "agent": "review-guardian",
        "result": {
          "sentiment": "mixed",
          "rating": 3,
          "topics": [
            "timing",
            "communication",
            "quality"
          ],
          "isNegative": false,
          "ownerAlert": null,
          "publicReply": "Hi Liam, thanks for the feedback. Glad to hear the car is driving well, but I am sorry for the delay and the lack of updates on our end. You shouldn't have had to chase us up, so I appreciate you letting us know.\nDan, Torque & Co",
          "followUp": {
            "channel": "sms",
            "message": "Hi Liam, thanks for bringing your car to Torque & Co. Glad to hear it is driving well, but I am sorry about the delay and poor communication regarding the timing. Thanks for your feedback. Dan"
          }
        },
        "received": {
          "at": "2026-10-20T09:30",
          "label": "Tuesday 20 October 2026, 9:30am",
          "inHours": true,
          "nextOpen": "now, 9:30am on Tuesday 20 October 2026 (open until 5:30pm today)"
        },
        "ms": 2310
      }
    },
    {
      "id": "5-star-marco",
      "label": "5 stars, thanks Marco",
      "channel": "Google review",
      "receivedAt": "2026-10-19T14:10",
      "fields": {
        "rating": 5,
        "name": "Aisha",
        "review": "Marco explained everything clearly and didn't push any extras I didn't need. The car's running great after the log-book service. Will be back.",
        "jobNote": ""
      },
      "recordedOn": "2026-10-22",
      "recorded": {
        "agent": "review-guardian",
        "result": {
          "sentiment": "positive",
          "rating": 5,
          "topics": [
            "communication",
            "quality",
            "honesty",
            "staff"
          ],
          "isNegative": false,
          "ownerAlert": null,
          "publicReply": "Hi Aisha, thank you for taking the time to leave a review. We are glad to hear your car is running great after its log-book service and that Marco looked after you so well. We look forward to seeing you again next time.\nDan, Torque & Co",
          "followUp": {
            "channel": "sms",
            "message": "Hi Aisha, thanks for the great review! Glad to hear the car is running well after its service. Dan"
          }
        },
        "received": {
          "at": "2026-10-19T14:10",
          "label": "Monday 19 October 2026, 2:10pm",
          "inHours": true,
          "nextOpen": "now, 2:10pm on Monday 19 October 2026 (open until 5:30pm today)"
        },
        "ms": 2031
      }
    }
  ],
  "dead-lead-revival": [
    {
      "id": "mixed-six",
      "label": "Mixed list, 6 quotes",
      "channel": "CRM export",
      "receivedAt": "2026-10-23T09:00",
      "fields": {
        "leads": [
          {
            "id": "s1a",
            "name": "Sarah Nguyen",
            "job": "main bathroom",
            "quoteDate": "2026-10-02",
            "amount": "$18,400",
            "note": "Keen to go ahead, waiting on her Christmas bonus."
          },
          {
            "id": "s1b",
            "name": "Tom Becker",
            "job": "ensuite",
            "quoteDate": "2026-09-18",
            "amount": "$14,950",
            "note": "Went quiet after the site visit."
          },
          {
            "id": "s1c",
            "name": "Priya Raman",
            "job": "main bathroom",
            "quoteDate": "2026-06-23",
            "amount": "$22,700",
            "note": "Said maybe next year."
          },
          {
            "id": "s1d",
            "name": "Dale Morrison",
            "job": "main bathroom",
            "quoteDate": "2026-08-25",
            "amount": "$19,800",
            "note": "Liked the design but thought it was over budget."
          },
          {
            "id": "s1e",
            "name": "Jess Cooper",
            "job": "ensuite",
            "quoteDate": "2026-09-05",
            "amount": "$16,300",
            "note": "Went with another company."
          },
          {
            "id": "s1f",
            "name": "Mark Ellis",
            "job": "main bathroom",
            "quoteDate": "2026-08-12",
            "amount": "$21,000",
            "note": "Asked us to stop messaging him."
          }
        ]
      },
      "recordedOn": "2026-10-23",
      "recorded": {
        "agent": "dead-lead-revival",
        "result": {
          "leads": [
            {
              "rowId": "s1a",
              "group": "re-engage",
              "reason": "Waiting on a Christmas bonus and quote is still valid.",
              "daysSinceQuote": 21,
              "quoteExpired": false,
              "optedOut": false,
              "message": "Hi Sarah, it's Mia from Stonebridge Bathrooms. Just checking in on your main bathroom project. As we get closer to the end of the year, we are currently booking new jobs 6 to 8 weeks out. Let me know if you would like to discuss timing. Reply STOP to opt out.",
              "nextAction": "Follow up with a phone call if no reply within 4 days."
            },
            {
              "rowId": "s1b",
              "group": "re-engage",
              "reason": "Went quiet after site visit, quote is still valid.",
              "daysSinceQuote": 35,
              "quoteExpired": false,
              "optedOut": false,
              "message": "Hi Tom, it's Mia from Stonebridge Bathrooms. I wanted to follow up on your ensuite quote after our site visit. We are currently booking new jobs 6 to 8 weeks out and would love to help bring your project to life. Let me know if you have any questions. Reply STOP to opt out.",
              "nextAction": "Call on day 3 if no SMS response."
            },
            {
              "rowId": "s1c",
              "group": "nurture",
              "reason": "Indicated maybe next year and quote has expired.",
              "daysSinceQuote": 122,
              "quoteExpired": true,
              "optedOut": false,
              "message": "Hi Priya, it's Mia from Stonebridge Bathrooms. Reaching out regarding your main bathroom renovation for next year. As your quote has expired, pricing may need a quick refresh when you are ready. We are currently booking jobs 6 to 8 weeks out. Reply STOP to opt out.",
              "nextAction": "Set CRM reminder to contact early next year."
            },
            {
              "rowId": "s1d",
              "group": "nurture",
              "reason": "Liked design but mentioned it was over budget, quote still valid.",
              "daysSinceQuote": 59,
              "quoteExpired": false,
              "optedOut": false,
              "message": "Hi Dale, it's Mia from Stonebridge Bathrooms. Following up on your main bathroom design. If you still want to move forward, we would be happy to talk through the scope options to see what works for you. We are currently booking jobs 6 to 8 weeks out. Reply STOP to opt out.",
              "nextAction": "Check in via phone next week to discuss scope."
            },
            {
              "rowId": "s1e",
              "group": "dont-contact",
              "reason": "Went with another company.",
              "daysSinceQuote": 48,
              "quoteExpired": false,
              "optedOut": true,
              "message": null,
              "nextAction": "Archive lead record in CRM."
            },
            {
              "rowId": "s1f",
              "group": "dont-contact",
              "reason": "Opted out and asked to stop receiving messages.",
              "daysSinceQuote": 72,
              "quoteExpired": true,
              "optedOut": true,
              "message": null,
              "nextAction": "Flag as do not contact in CRM."
            }
          ],
          "summary": {
            "reEngage": 2,
            "nurture": 2,
            "dontContact": 2
          }
        },
        "received": {
          "at": "2026-10-23T09:00",
          "label": "Friday 23 October 2026, 9am",
          "inHours": true,
          "nextOpen": "now, 9am on Friday 23 October 2026 (open until 5pm today)"
        },
        "ms": 4381
      }
    },
    {
      "id": "warm-five",
      "label": "Mostly warm, 5 quotes",
      "channel": "CRM export",
      "receivedAt": "2026-10-23T09:00",
      "fields": {
        "leads": [
          {
            "id": "s2a",
            "name": "Hannah Lee",
            "job": "ensuite",
            "quoteDate": "2026-10-09",
            "amount": "$12,900",
            "note": "Wants to start after the school holidays."
          },
          {
            "id": "s2b",
            "name": "Ben Okafor",
            "job": "main bathroom",
            "quoteDate": "2026-09-28",
            "amount": "$24,500",
            "note": "Asked if we could finish before Christmas."
          },
          {
            "id": "s2c",
            "name": "Chloe Martin",
            "job": "ensuite",
            "quoteDate": "2026-09-14",
            "amount": "$15,600",
            "note": "Comparing two quotes, liked our tile options."
          },
          {
            "id": "s2d",
            "name": "Sam Rossi",
            "job": "main bathroom",
            "quoteDate": "2026-10-01",
            "amount": "$19,200",
            "note": "Partner wants to see the 3D render again."
          },
          {
            "id": "s2e",
            "name": "Aaron Walsh",
            "job": "main bathroom",
            "quoteDate": "2026-07-10",
            "amount": "$17,800",
            "note": "On hold until their house extension is finished."
          }
        ]
      },
      "recordedOn": "2026-10-23",
      "recorded": {
        "agent": "dead-lead-revival",
        "result": {
          "leads": [
            {
              "rowId": "s2a",
              "group": "re-engage",
              "reason": "Timing depends on school holidays ending soon, worth checking in.",
              "daysSinceQuote": 14,
              "quoteExpired": false,
              "optedOut": false,
              "message": "Hi Hannah, it's Mia from Stonebridge Bathrooms. Hope you are well! Just checking in to see if you would like to discuss the timing for your ensuite renovation after the school holidays. We are currently booking jobs 6 to 8 weeks out. Reply STOP to opt out.",
              "nextAction": "Call on day 3 if no reply."
            },
            {
              "rowId": "s2b",
              "group": "re-engage",
              "reason": "Asked about a pre-Christmas deadline, needs lead time confirmation.",
              "daysSinceQuote": 25,
              "quoteExpired": false,
              "optedOut": false,
              "message": "Hi Ben, it's Mia from Stonebridge Bathrooms. Reaching out regarding your main bathroom quote. We are currently booking new jobs 6 to 8 weeks out, so let us know if you would like to discuss timeline options for your project. Reply STOP to opt out.",
              "nextAction": "Follow up with a call in 2 days if no response."
            },
            {
              "rowId": "s2c",
              "group": "nurture",
              "reason": "Still deciding between options and comparing quotes.",
              "daysSinceQuote": 39,
              "quoteExpired": false,
              "optedOut": false,
              "message": "Hi Chloe, it's Mia from Stonebridge Bathrooms. Just checking in on your ensuite renovation plans. Please let me know if you have any questions about the quote or need more details on our tile options. Reply STOP to opt out.",
              "nextAction": "Check in via text or email in 2 weeks."
            },
            {
              "rowId": "s2d",
              "group": "re-engage",
              "reason": "Wants to review the 3D render again to make a decision.",
              "daysSinceQuote": 22,
              "quoteExpired": false,
              "optedOut": false,
              "message": "Hi Sam, it's Mia from Stonebridge Bathrooms. Just checking in to see if you and your partner would like me to resend or review the 3D render for your main bathroom renovation. Happy to assist whenever you are ready. Reply STOP to opt out.",
              "nextAction": "Send copy of 3D render if requested, otherwise follow up on day 3."
            },
            {
              "rowId": "s2e",
              "group": "nurture",
              "reason": "Project on hold due to extension, plus quote is expired over 60 days.",
              "daysSinceQuote": 105,
              "quoteExpired": true,
              "optedOut": false,
              "message": "Hi Aaron, it's Mia from Stonebridge Bathrooms. Reaching out to see how your house extension is going. When you are ready to look at your main bathroom again, let us know as the pricing may need a quick refresh. Reply STOP to opt out.",
              "nextAction": "Schedule follow-up in CRM for 1 month."
            }
          ],
          "summary": {
            "reEngage": 3,
            "nurture": 2,
            "dontContact": 0
          }
        },
        "received": {
          "at": "2026-10-23T09:00",
          "label": "Friday 23 October 2026, 9am",
          "inHours": true,
          "nextOpen": "now, 9am on Friday 23 October 2026 (open until 5pm today)"
        },
        "ms": 3837
      }
    }
  ]
};

const express = require("express");
const https = require("https");
const axios = require("axios");
const wiki = require("wikipedia");
const Event = require("../models/Event");


const router = express.Router();

/* ───────────────── SPELL CORRECTION ───────────────── */

const spellMap = {
  evnt: "event",
  evnets: "events",
  worshop: "workshop",
  hackaton: "hackathon",
  competiton: "competition",
  registraton: "registration",
  campas: "campus",
  codeing: "coding",
  wht: "what",
  hw: "how",
  helo: "hello",
  thnks: "thanks",
};

function correctSpelling(text) {
  return text
    .toLowerCase()
    .split(/\s+/)
    .map((w) => spellMap[w] || w)
    .join(" ");
}

/* ───────────────── INTENT DETECTION ───────────────── */

function detectIntent(text, history = []) {
  const t = text.toLowerCase();
  
  // High-priority broad event queries
  if (["any events", "new events", "upcoming events", "what events", "show events", "list events", "what's happening"].some((g) => t.includes(g))) 
    return "event_broad";

  // Contextual follow-ups (if history exists)
  if (history.length > 0) {
    if (["tell me more", "details", "info", "more about it", "what is it", "where is it", "when is it"].some(g => t.includes(g)))
      return "context_followup";
  }

  if (["hello", "hi", "hey", "greetings"].some((g) => t.includes(g))) return "greeting";
  if (["bye", "goodbye", "see you"].some((g) => t.includes(g))) return "farewell";
  if (["thank", "thanks", "appreciate"].some((g) => t.includes(g))) return "thanks";
  if (["help", "support", "what can you do"].some((g) => t.includes(g))) return "help";

  if (["event", "workshop", "hackathon", "competition", "seminar", "contest"].some((g) => t.includes(g)))
    return "event";

  if (["what is", "who is", "explain", "define", "tell me about"].some((g) => t.includes(g)))
    return "knowledge";

  return "general";
}

/* ───────────────── KEYWORD EXTRACTION ───────────────── */

function extractKeywords(text) {
  const stop = [
    "what",
    "is",
    "are",
    "the",
    "a",
    "an",
    "tell",
    "me",
    "about",
    "show",
    "find",
  ];

  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !stop.includes(w));
}

/* ───────────────── WIKIPEDIA SEARCH ───────────────── */

async function fetchWikipediaSummary(query) {
  try {
    const page = await wiki.page(query);
    const summary = await page.summary();
    if (summary && summary.extract) {
      const sentences = summary.extract.split(". ");
      return sentences.slice(0, 3).join(". ") + ".";
    }
    return null;
  } catch (error) {
    console.log("Wikipedia Error:", error.message);
    return null;
  }
}

/* ───────────────── GOOGLE SEARCH (SERPER) ───────────────── */

async function fetchGoogleResults(query) {
  const apiKey = process.env.SERPER_API_KEY;

  if (!apiKey) return null;

  try {
    const response = await axios.post(
      "https://google.serper.dev/search",
      { q: query, num: 3 },
      {
        headers: {
          "X-API-KEY": apiKey,
          "Content-Type": "application/json",
        },
      }
    );

    const results = response.data.organic;

    if (!results || results.length === 0) return null;

    const formatted = results
      .slice(0, 3)
      .map((r) => `• ${r.title}\n${r.snippet}`)
      .join("\n\n");

    return `🌐 **Google Search Results**:\n\n${formatted}\n\n(Source: Google)`;

  } catch (error) {
    console.log("Google Search Error:", error.message);
    return null;
  }
}

/* ───────────────── EVENT SEARCH ───────────────── */

async function searchEvents(keywords, department = null, isBroad = false) {
  try {
    const events = await Event.find({ status: "Approved" }).populate('club');

    const today = new Date().toISOString().split("T")[0];
    const upcoming = events.filter((e) => e.date >= today);

    // If it's a broad search and no keywords, return all upcoming
    if (isBroad && keywords.length === 0) {
      return upcoming
        .map(e => ({
          id: e._id,
          title: e.title,
          domain: e.domain,
          date: e.date,
          time: e.time,
          location: e.location,
          regFee: e.regFee,
          clubName: e.club?.name || "Unknown Club",
          score: (department && e.domain?.toLowerCase().includes(department.toLowerCase())) ? 10 : 0
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 8);
    }

    if (keywords.length === 0 && !department) return upcoming.slice(0, 5);

    const scored = upcoming
      .map((event) => {
        const text = `${event.title} ${event.domain || ""} ${event.description || ""
          } `.toLowerCase();

        let score = 0;

        // Keyword matching
        keywords.forEach((k) => {
          if (text.includes(k)) score += 5;
        });

        // Department context boost
        if (department && event.domain?.toLowerCase().includes(department.toLowerCase())) {
          score += 10;
        }

        return {
          id: event._id,
          title: event.title,
          domain: event.domain,
          date: event.date,
          time: event.time,
          location: event.location,
          regFee: event.regFee,
          clubName: event.club?.name || "Unknown Club",
          score
        };
      })
      .filter((e) => isBroad ? true : e.score > 0) // In broad search, we don't filter out low scores
      .sort((a, b) => b.score - a.score);

    return scored.slice(0, 8);
  } catch (error) {
    console.error("SearchEvents error:", error);
    return [];
  }
}


/* ───────────────── RESPONSE ENGINE ───────────────── */

async function generateResponse(message, department = null, history = []) {
  const corrected = correctSpelling(message);
  const intent = detectIntent(corrected, history);
  const keywords = extractKeywords(corrected);

  switch (intent) {
    case "context_followup": {
      const lastBotMsg = [...history].reverse().find(m => m.role === 'bot');
      
      if (lastBotMsg?.type === 'events' && lastBotMsg.events?.length > 0) {
        const lastEvent = lastBotMsg.events[0];
        const date = new Date(lastEvent.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
        
        const responseStyles = [
          `🔍 **${lastEvent.title}** is being hosted by **${lastEvent.clubName}** on **${date}** at **${lastEvent.location || 'the main venue'}**. It starts around **${lastEvent.time || 'TBD'}**.`,
          `Absolutely! **${lastEvent.title}** is one of our top upcoming events. It's happening at **${lastEvent.location}** on **${date}**. The registration fee is **${lastEvent.regFee > 0 ? `₹${lastEvent.regFee}` : 'completely free'}**.`,
          `Sure thing. Here are the specifics for **${lastEvent.title}**:\n\n📍 Venue: ${lastEvent.location}\n📅 Date: ${date}\n🕒 Time: ${lastEvent.time}\n🎫 Fee: ${lastEvent.regFee > 0 ? `₹${lastEvent.regFee}` : 'Free'}`
        ];

        return {
          type: "text",
          message: responseStyles[Math.floor(Math.random() * responseStyles.length)] + "\n\nWould you like me to find similar events for you?",
        };
      }
      
      if (lastBotMsg?.content?.includes('OD requests')) {
        return {
          type: "text",
          message: "The OD (On-Duty) workflow is simple: Go to your dashboard, click 'OD Request', fill in the event details & attach your invitation. Your HOD will then view and approve it digitally. 🚀"
        };
      }

      return {
        type: "text",
        message: "I'm following along! Could you tell me exactly which part you'd like more info on? (e.g., event venue, registration fee, or OD steps)",
      };
    }

    case "greeting":
      const greetings = [
        "👋 Hello! I'm **CampusBot**. I'm here to help you navigate campus life, find events, and answer your questions!",
        "Hi there! Ready to explore what's happening on campus today? Ask me about upcoming events or OD info.",
        "Hey! I'm your Smart Campus assistant. Need help finding a workshop or understanding the digital OD portal?"
      ];
      return {
        type: "text",
        message: greetings[Math.floor(Math.random() * greetings.length)],
      };

    case "farewell":
      return {
        type: "text",
        message: "👋 Goodbye! Feel free to come back anytime.",
      };

    case "thanks":
      return {
        type: "text",
        message: "😊 You're welcome! Happy to help.",
      };

    case "help":
      return {
        type: "text",
        message:
          "🤖 I can help you with:\n\n• Finding events\n• Event recommendations\n• Campus information\n• General knowledge questions",
      };

    case "event_broad":
    case "event":
      const isBroad = intent === "event_broad";
      const events = await searchEvents(keywords, department, isBroad);

      if (!events.length)
        return {
          type: "text",
          message: "Currently, there are no approved upcoming events in the system. Check back soon for new workshops and competitions! 📅",
        };

      const msgHeaders = isBroad 
        ? [
            "🔭 **Campus Pulse**: Here's everything happening on campus right now.",
            "📅 **Live Hub Feed**: Found these upcoming events for you.",
            "🌟 **Don't Miss Out**: Check out these approved events!"
          ]
        : [
            "✨ I found some events that match your interests:",
            "🚀 Based on your request, here are the best matches:",
            "✅ These events look like what you're looking for:"
          ];

      return {
        type: "events",
        message: msgHeaders[Math.floor(Math.random() * msgHeaders.length)],
        events,
      };

    case "knowledge":
      const topic = corrected
        .replace(/what is|who is|tell me about|define|explain/gi, "")
        .trim();

      const wiki = await fetchWikipediaSummary(topic);

      if (wiki)
        return {
          type: "text",
          message: `📖 ${topic} \n\n${wiki} \n\n(Source: Wikipedia)`,
        };

      const google = await fetchGoogleResults(topic);

      if (google)
        return {
          type: "text",
          message: google,
          intent: "google_search",
        };

      return {
        type: "text",
        message: "❌ I couldn't find information about that.",
        intent: "unknown",
      };

    default: {
      const googleResult = await fetchGoogleResults(corrected);

      if (googleResult) {
        return {
          type: "text",
          message: googleResult,
          intent: "google_search",
        };
      }

      return {
        type: "text",
        message:
          "🤖 I couldn't find information about that. Try asking about events, campus info, or general topics.",
        intent: "unknown",
      };
    }
  }
}

/* ───────────────── CHAT API ───────────────── */

router.post("/message", async (req, res) => {
  try {
    const { message, department, history } = req.body;

    if (!message)
      return res.status(400).json({
        error: "Message is required",
      });

    const response = await generateResponse(message, department, history || []);

    res.json(response);
  } catch (error) {
    console.error("Chatbot error:", error);

    res.status(500).json({
      type: "text",
      message: "⚠️ Chatbot encountered an error.",
    });
  }
});

router.generateResponse = generateResponse;
module.exports = router;

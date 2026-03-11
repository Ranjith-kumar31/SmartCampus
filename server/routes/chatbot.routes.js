const express = require("express");
const https = require("https");
const axios = require("axios");
const supabase = require("../utils/supabase");

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

function detectIntent(text) {
  const t = text.toLowerCase();

  if (["hello", "hi", "hey"].some((g) => t.includes(g))) return "greeting";

  if (["bye", "goodbye"].some((g) => t.includes(g))) return "farewell";

  if (["thank", "thanks"].some((g) => t.includes(g))) return "thanks";

  if (["help", "support"].some((g) => t.includes(g))) return "help";

  if (
    ["event", "workshop", "hackathon", "competition", "seminar"].some((g) =>
      t.includes(g)
    )
  )
    return "event";

  if (
    ["what is", "who is", "explain", "define", "tell me about"].some((g) =>
      t.includes(g)
    )
  )
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

function fetchWikipediaSummary(query) {
  return new Promise((resolve) => {
    const encoded = encodeURIComponent(query);

    const options = {
      hostname: "en.wikipedia.org",
      path: `/api/rest_v1/page/summary/${encoded}`,
      method: "GET",
      headers: {
        "User-Agent": "SmartCampusBot/1.0",
      },
    };

    const req = https.request(options, (res) => {
      let data = "";

      res.on("data", (chunk) => (data += chunk));

      res.on("end", () => {
        try {
          const json = JSON.parse(data);

          if (json.extract) {
            const sentences = json.extract.split(". ");
            resolve(sentences.slice(0, 3).join(". "));
          } else resolve(null);
        } catch {
          resolve(null);
        }
      });
    });

    req.on("error", () => resolve(null));
    req.end();
  });
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

async function searchEvents(keywords) {
  try {
    const { data, error } = await supabase
      .from("events")
      .select("*, clubs(name)")
      .eq("status", "Approved");

    if (error || !data) return [];

    const today = new Date().toISOString().split("T")[0];

    const upcoming = data.filter((e) => e.date >= today);

    if (keywords.length === 0) return upcoming.slice(0, 5);

    const scored = upcoming
      .map((event) => {
        const text = `${ event.title } ${ event.domain || "" } ${
  event.description || ""
} `.toLowerCase();

        let score = 0;

        keywords.forEach((k) => {
          if (text.includes(k)) score += 5;
        });

        return {
          id: event.id,
          title: event.title,
          domain: event.domain,
          date: event.date,
          time: event.time,
          location: event.location,
          regFee: event.reg_fee,
          clubName: event.clubs?.name || "Unknown Club",
          score
        };
      })
      .filter((e) => e.score > 0)
      .sort((a, b) => b.score - a.score);

    return scored.slice(0, 5);
  } catch {
    return [];
  }
}

/* ───────────────── RESPONSE ENGINE ───────────────── */

async function generateResponse(message) {
  const corrected = correctSpelling(message);
  const intent = detectIntent(corrected);
  const keywords = extractKeywords(corrected);

  switch (intent) {
    case "greeting":
      return {
        type: "text",
        message:
          "👋 Hello! I'm CampusBot. I can help you find events, answer questions, and assist with campus info!",
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

    case "event":
      const events = await searchEvents(keywords);

      if (!events.length)
        return {
          type: "text",
          message: "❌ No matching events found right now.",
        };

      return {
        type: "events",
        message: "🎉 Here are some events you might like:",
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
          message: `📖 ${ topic } \n\n${ wiki } \n\n(Source: Wikipedia)`,
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
    const { message } = req.body;

    if (!message)
      return res.status(400).json({
        error: "Message is required",
      });

    const response = await generateResponse(message);

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

const express = require("express");
const OpenAI = require("openai");
const path = require("path");

const app = express();
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.post("/api/chat", async (req, res) => {
  try {
    const message = String(req.body?.message || "").trim();
    if (!message) return res.status(400).json({ error: "Message is required." });

    const response = await client.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-6-luna",
      instructions: "You are AZAM AI, a helpful concise assistant. Answer in the user's language when possible.",
      input: message
    });

    res.json({ reply: response.output_text || "No response generated." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "AI request failed. Check the server configuration." });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`AZAM AI running on http://localhost:${port}`));

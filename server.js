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
    const image = req.body?.image || null;

    if (!message && !image) {
      return res.status(400).json({ error: "Message or image is required." });
    }

    let input;

    if (image) {
      input = [{
        role: "user",
        content: [
          {
            type: "input_text",
            text: message || "Is image ko dekho aur batao is mein kya hai."
          },
          {
            type: "input_image",
            image_url: image
          }
        ]
      }];
    } else {
      input = message;
    }

    const response = await client.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-6-luna",
      instructions: "You are AZAM AI, created by Azam Khan. If anyone asks who created or made you, always say: 'I was made by Azam Khan.' Never say that OpenAI created you. OpenAI only provides the AI technology/API that powers you. Answer in the user's language.",
      input: input
    });

    res.json({
      reply: response.output_text || "No response generated."
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "AI request failed. Check the server configuration."
    });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`AZAM AI running on http://localhost:${port}`));

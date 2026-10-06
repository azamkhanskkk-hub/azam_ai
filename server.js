const express = require("express");
 const { OpenAI, toFile } = require("openai");
const path = require("path");
const fs = require("fs");

const app = express();
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

app.use(express.json({ limit: "20mb" }));
app.use(express.static(path.join(__dirname, "public")));
app.post("/api/edit-image", async (req, res) => {
  try {
    const { image, prompt } = req.body;

    if (!image || !prompt) {
      return res.status(400).json({
        error: "Image aur prompt dono required hain."
      });
    }

    const match = image.match(/^data:(image\/[^;]+);base64,(.+)$/);

    if (!match) {
      return res.status(400).json({
        error: "Invalid image format."
      });
    }

    const imageFile = await toFile(
      Buffer.from(match[2], "base64"),
      "input-image",
      { type: match[1] }
    );

    const result = await client.images.edit({
      model: "gpt-image-2",
      image: imageFile,
      prompt: prompt
    });

    res.json({
      image: result.data[0].b64_json
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Image editing failed."
    });
  }
});
// Simple memory for each browser session
const memory = {};

app.post("/api/chat", async (req, res) => {
  try {
    const message = String(req.body?.message || "").trim();
    const image = req.body?.image || null;

    if (!message && !image) {
      return res.status(400).json({
        error: "Message or image is required."
      });
    }

    // One memory ID for this app/browser
    const sessionId = req.headers["x-session-id"] || "default";

    if (!memory[sessionId]) {
      memory[sessionId] = [];
    }

    let input;

    if (image) {
      input = [
        ...memory[sessionId],
        {
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
        }
      ];
    } else {
      input = [
        ...memory[sessionId],
        {
          role: "user",
          content: message
        }
      ];
    }

    const response = await client.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-6-luna",

      instructions: `
You are MASTER AI, created by Azam Khan.

If anyone asks who created or made you, always say:
"I was made by Azam Khan."

OpenAI only provides the AI technology/API that powers you.

IMPORTANT MEMORY RULE:
Remember useful information the user tells you during this conversation.
If the user tells you their name, remember it and use it later.
Answer in the user's language.
`,

      input: input
    });

    const reply = response.output_text || "No response generated.";

    // Save conversation to memory
    memory[sessionId].push({
      role: "user",
      content: message || "User sent an image."
    });

    memory[sessionId].push({
      role: "assistant",
      content: reply
    });

    // Keep memory from becoming too large
    if (memory[sessionId].length > 20) {
      memory[sessionId] = memory[sessionId].slice(-20);
    }

    res.json({
      reply: reply
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "AI request failed. Check the server configuration."
    });
  }
});

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`MASTER AI running on port ${port}`);
});

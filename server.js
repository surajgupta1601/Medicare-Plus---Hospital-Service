// const express = require('express');
// const cors = require('cors');
// require('dotenv').config();
const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch"); // ✅ add this
const path = require("path");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

// Serve static files (HTML, CSS, JS, images)
app.use(express.static(path.join(__dirname)));

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

app.post("/api/symptom-check", async (req, res) => {
  const { symptoms } = req.body;

  const prompt = `User symptoms: "${symptoms}". Provide a possible diagnosis and treatment advice in simple terms.`;

  // Debug: Check if API key is loaded
  console.log(
    "API Key loaded:",
    GEMINI_API_KEY ? `${GEMINI_API_KEY.substring(0, 10)}...` : "NOT FOUND"
  );
  console.log("Symptoms received:", symptoms);

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
        }),
      }
    );

    console.log("Gemini API Status:", response.status);

    const data = await response.json();
    console.log("Gemini response:", JSON.stringify(data, null, 2));

    // Check for API errors
    if (data.error) {
      console.error("Gemini API Error:", data.error);
      return res
        .status(500)
        .json({ diagnosis: `API Error: ${data.error.message}` });
    }

    const reply =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "No response received. Try again.";
    res.json({ diagnosis: reply });
  } catch (error) {
    console.error("Error from Gemini:", error);
    res.status(500).json({ error: "Gemini API failed" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`✅ Server running on http://localhost:${PORT}`)
);

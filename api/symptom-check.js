// Vercel Serverless Function for AI Symptom Checker
export default async function handler(req, res) {
  // Enable CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Handle preflight request
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { symptoms } = req.body;

  if (!symptoms) {
    return res.status(400).json({ error: "Symptoms are required" });
  }

  // Use environment variable for API key (set in Vercel dashboard)
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

  if (!GEMINI_API_KEY) {
    return res.status(500).json({ error: "API key not configured" });
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `You are a helpful medical assistant. The patient describes the following symptoms: "${symptoms}". Provide a possible diagnosis, recommend when to see a doctor, and suggest basic home care tips. Include a disclaimer that this is not professional medical advice.`,
                },
              ],
            },
          ],
        }),
      }
    );

    const data = await response.json();

    if (data.error) {
      return res.status(500).json({
        diagnosis: `API Error: ${data.error.message}`,
      });
    }

    const diagnosis =
      data.candidates?.[0]?.content?.parts?.[0]?.text ||
      "No response received from AI.";

    return res.status(200).json({ diagnosis });
  } catch (error) {
    console.error("Gemini API Error:", error);
    return res.status(500).json({
      diagnosis: "Failed to connect to AI service. Please try again.",
    });
  }
}

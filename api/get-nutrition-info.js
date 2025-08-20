const fetch = require('node-fetch');

module.exports = async (req, res) => {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  try {
    const { prompt, isJson } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable not set.");
    }
    
    if (!prompt) {
      return res.status(400).send('Prompt is required.');
    }

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;

    let payload = {
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    };

    if (isJson) {
      payload.generationConfig = {
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            recipeName: { type: "STRING" },
            description: { type: "STRING" },
            ingredients: { type: "ARRAY", items: { type: "STRING" } },
            instructions: { type: "ARRAY", items: { type: "STRING" } },
            nutrition: {
              type: "OBJECT",
              properties: {
                calories: { type: "STRING" },
                protein: { type: "STRING" },
                carbs: { type: "STRING" },
                fat: { type: "STRING" }
              }
            }
          },
          required: ["recipeName", "description", "ingredients", "instructions", "nutrition"]
        }
      };
    }

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('Gemini API Error:', errorBody);
      return res.status(response.status).send(`Gemini API error: ${errorBody}`);
    }

    const result = await response.json();

    if (result.candidates && result.candidates.length > 0 &&
        result.candidates[0].content && result.candidates[0].content.parts &&
        result.candidates[0].content.parts.length > 0) {
      
      const text = result.candidates[0].content.parts[0].text;
      return res.status(200).json({ text });

    } else {
      console.error('Invalid response structure from Gemini API:', result);
      return res.status(500).send('Invalid response structure from API.');
    }

  } catch (error) {
    console.error('Error in Vercel function:', error);
    return res.status(500).json({ error: error.message });
  }
};

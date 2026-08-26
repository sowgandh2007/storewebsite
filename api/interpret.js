module.exports = async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { text } = req.body;
    if (!text) {
        return res.status(400).json({ error: 'No text provided' });
    }

    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    if (!GEMINI_API_KEY) {
        return res.status(500).json({ error: 'GEMINI_API_KEY not configured on server' });
    }

    // Prepare prompt
    const systemInstruction = `
You are an inventory data extraction assistant for an Indian retail store.
The user will speak a sentence in Telugu, English, or a mix of both (code-switching).
Your job is to extract the product details into a strict JSON format.

Existing fields that can be populated:
- name (string) : The name/brand of the product. Keep original English terms if used (e.g. "Nike shoes", "Black shirt").
- quantity (number) : Extract numeric quantity.
- sell_price (number) : Extract price if mentioned.
- category (string) : Guess a short 1-2 word category based on the product.

Rules:
1. ONLY return valid JSON. Do not include markdown blocks like \`\`\`json.
2. If a field is not mentioned, do NOT include it in the JSON.
3. Translate Telugu context (e.g. "పది" -> 10, "ఐదు వందలు" -> 500) into English data.
4. "add చేయండి", "పెట్టు", etc. just means to add.

Output JSON format:
{
  "name": "Product Name",
  "quantity": 10,
  "sell_price": 500,
  "category": "Apparel"
}
`;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                system_instruction: {
                    parts: { text: systemInstruction }
                },
                contents: [{
                    parts: [{ text: text }]
                }],
                generationConfig: {
                    temperature: 0.1,
                    response_mime_type: "application/json"
                }
            })
        });

        if (!response.ok) {
            const errBody = await response.text();
            console.error("Gemini API Error:", errBody);
            let errMsg = 'Failed to communicate with LLM API';
            try {
                const parsed = JSON.parse(errBody);
                if (parsed.error && parsed.error.message) {
                    errMsg = "Gemini Error: " + parsed.error.message;
                }
            } catch(e) {}
            return res.status(502).json({ error: errMsg });
        }

        const data = await response.json();
        let responseText = data.candidates[0].content.parts[0].text;
        
        // Strip markdown code blocks if present
        responseText = responseText.replace(/^```json\n?/g, '').replace(/^```\n?/g, '').replace(/```$/g, '').trim();

        let parsedData;
        try {
            parsedData = JSON.parse(responseText);
        } catch (e) {
            return res.status(500).json({ error: 'Failed to parse LLM response', raw: responseText });
        }

        return res.status(200).json(parsedData);

    } catch (error) {
        console.error("Server Error:", error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

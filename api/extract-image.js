module.exports = async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { imageBase64, mimeType } = req.body;
    if (!imageBase64) {
        return res.status(400).json({ error: 'No image provided' });
    }

    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    if (!GEMINI_API_KEY) {
        return res.status(500).json({ error: 'GEMINI_API_KEY not configured on server' });
    }

    const systemInstruction = `
You are an advanced inventory data extraction assistant.
The user provides an image (photo of a handwritten list, printed invoice, or table) containing inventory items.
Extract the inventory records from the image and return a JSON array.

Map the extracted data to these fields:
- name (string) : Product name (Required)
- sku (string) : SKU, Product Code, or Barcode if present
- category (string) : Infer a short category if not explicitly listed
- quantity (number) : Quantity/Stock count
- buy_price (number) : Purchase price / Cost
- sell_price (number) : Selling price
- supplier (string) : Brand or supplier name
- confidence (string) : "high", "medium", or "low". 
  - Use "high" if clearly readable.
  - Use "medium" if some characters are blurry but decipherable.
  - Use "low" if handwriting is very messy, ambiguous, or if a number could be either price or quantity.

Rules:
1. ONLY return a valid JSON array. Do not include markdown blocks like \`\`\`json.
2. If a field is not present in the image for a specific row, omit it or set it to null.
3. Translate prices and quantities to raw numbers.
4. If there are no items, return an empty array [].

Output JSON format:
[
  {
    "name": "Product Name",
    "sku": "ABC-123",
    "category": "Category",
    "quantity": 10,
    "buy_price": 500,
    "sell_price": 600,
    "supplier": "Brand Name",
    "confidence": "high"
  }
]
`;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                system_instruction: {
                    parts: { text: systemInstruction }
                },
                contents: [{
                    parts: [
                        { text: "Extract inventory items from this image." },
                        {
                            inline_data: {
                                mime_type: mimeType || "image/jpeg",
                                data: imageBase64.replace(/^data:image\/\w+;base64,/, "")
                            }
                        }
                    ]
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

        if (!Array.isArray(parsedData)) {
            parsedData = [parsedData];
        }

        return res.status(200).json(parsedData);

    } catch (error) {
        console.error("Server Error:", error);
        return res.status(500).json({ error: 'Internal server error: ' + error.message });
    }
}

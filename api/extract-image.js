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

    try {
        // STEP 1: Specialized Image-to-Text OCR (OCR.space Free API)
        const ocrFormData = new URLSearchParams();
        ocrFormData.append("base64Image", imageBase64);
        ocrFormData.append("language", "eng");
        ocrFormData.append("isOverlayRequired", "false");

        const ocrResponse = await fetch("https://api.ocr.space/parse/image", {
            method: "POST",
            headers: {
                "apikey": "helloworld", // Free OCR.space API key
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: ocrFormData.toString()
        });

        if (!ocrResponse.ok) {
            return res.status(502).json({ error: "Specialized OCR API failed to respond." });
        }

        const ocrData = await ocrResponse.json();
        if (ocrData.IsErroredOnProcessing) {
            return res.status(500).json({ error: "OCR API Error: " + ocrData.ErrorMessage[0] });
        }

        let extractedText = "";
        if (ocrData.ParsedResults && ocrData.ParsedResults.length > 0) {
            extractedText = ocrData.ParsedResults[0].ParsedText;
        }

        if (!extractedText || extractedText.trim() === "") {
            return res.status(200).json([]); // No text found
        }

        // STEP 2: Structure the raw text using Gemini
        const systemInstruction = `
You are an advanced inventory data extraction assistant.
You are given raw OCR text extracted from an inventory list, invoice, or table.
Convert the text into a structured JSON array.

Map the extracted data to these fields:
- name (string) : Product name (Required)
- sku (string) : SKU, Product Code, or Barcode if present
- category (string) : Infer a short category if not explicitly listed
- quantity (number) : Quantity/Stock count
- buy_price (number) : Purchase price / Cost
- sell_price (number) : Selling price
- supplier (string) : Brand or supplier name
- confidence (string) : "high", "medium", or "low". 

Rules:
1. ONLY return a valid JSON array. Do not include markdown blocks like \`\`\`json.
2. If a field is not present in the text for a specific row, omit it or set it to null.
3. Translate prices and quantities to raw numbers.
4. If there are no recognizable items, return an empty array [].

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

        const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{
                    parts: [
                        { text: systemInstruction + "\n\nExtract inventory items from this raw OCR text:\n\n" + extractedText }
                    ]
                }],
                generationConfig: {
                    temperature: 0.1
                }
            })
        });

        if (!geminiResponse.ok) {
            const errBody = await geminiResponse.text();
            console.error("Gemini API Error:", errBody);
            let errMsg = 'Failed to structure OCR text with LLM';
            try {
                const parsed = JSON.parse(errBody);
                if (parsed.error && parsed.error.message) {
                    errMsg = "Gemini Error: " + parsed.error.message;
                }
            } catch(e) {}
            return res.status(502).json({ error: errMsg });
        }

        const data = await geminiResponse.json();
        let responseText = data.candidates[0].content.parts[0].text;
        
        responseText = responseText.replace(/^```json\n?/g, '').replace(/^```\n?/g, '').replace(/```$/g, '').trim();

        let parsedData;
        try {
            parsedData = JSON.parse(responseText);
        } catch (e) {
            return res.status(500).json({ error: 'Failed to parse structured JSON', raw: responseText });
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

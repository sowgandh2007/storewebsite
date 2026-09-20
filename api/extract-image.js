module.exports = async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { imageBase64, mimeType } = req.body;
    if (!imageBase64) {
        return res.status(400).json({ error: 'No image provided' });
    }

    try {
        // Strip data prefix and convert to buffer
        const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
        const buffer = Buffer.from(base64Data, 'base64');
        const blob = new Blob([buffer], { type: mimeType || 'image/jpeg' });
        
        const formData = new FormData();
        formData.append('image', blob, 'upload.jpg');

        const response = await fetch('https://api.api-ninjas.com/v1/imagetotext', {
            method: 'POST',
            headers: {
                'X-Api-Key': 'Icts7NwEYr0bjAmR6Oe1LFbjP7UrnFYjKxRCCjHp'
            },
            body: formData
        });

        if (!response.ok) {
            const errText = await response.text();
            console.error("API Ninjas Error:", errText);
            return res.status(502).json({ error: "API Ninjas Error: " + response.statusText });
        }

        const data = await response.json();
        
        // API Ninjas returns an array of objects like: [ { text: "word", ... } ]
        if (!Array.isArray(data) || data.length === 0) {
            return res.status(200).json([]);
        }

        // Basic heuristic parser for raw text since LLM is removed
        let extractedItems = [];
        let currentItem = null;

        // Group text into potential lines or process word by word
        let combinedText = data.map(item => item.text).join(' ');
        
        // Very rough fallback parsing logic:
        // Try to split by numbers to guess quantities/prices
        const tokens = combinedText.split(/\s+/);
        
        for (let i = 0; i < tokens.length; i++) {
            const token = tokens[i];
            const isNumber = !isNaN(parseFloat(token));
            
            if (!isNumber) {
                if (!currentItem) {
                    currentItem = { name: token, quantity: 1, buy_price: 0, sell_price: 0, category: "General", confidence: "low" };
                } else if (currentItem.buy_price === 0) {
                    // Still building name
                    currentItem.name += " " + token;
                } else {
                    // New item started after numbers
                    extractedItems.push(currentItem);
                    currentItem = { name: token, quantity: 1, buy_price: 0, sell_price: 0, category: "General", confidence: "low" };
                }
            } else {
                if (currentItem) {
                    const num = parseFloat(token);
                    // Guess what the number is based on typical ranges
                    if (num < 100 && currentItem.quantity === 1) {
                        currentItem.quantity = num; // small numbers are usually quantity
                    } else if (currentItem.buy_price === 0) {
                        currentItem.buy_price = num;
                        currentItem.sell_price = num * 1.2; // Guess selling price
                    } else if (currentItem.sell_price === currentItem.buy_price * 1.2) {
                        currentItem.sell_price = num;
                    }
                }
            }
        }
        
        if (currentItem && currentItem.name.trim() !== "") {
            extractedItems.push(currentItem);
        }

        // If parser failed completely, just return the raw text as one item so the user can manually edit
        if (extractedItems.length === 0 && combinedText.trim() !== "") {
            extractedItems.push({
                name: combinedText.substring(0, 50) + "...",
                quantity: 1, buy_price: 0, sell_price: 0, category: "Raw Text", confidence: "low"
            });
        }

        return res.status(200).json(extractedItems);

    } catch (error) {
        console.error("Server Error:", error);
        return res.status(500).json({ error: 'Internal server error: ' + error.message });
    }
}

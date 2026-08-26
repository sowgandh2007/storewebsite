const handler = require('./api/interpret.js');

const req = {
    method: 'POST',
    body: {
        text: 'పది బ్లాక్ షర్ట్స్ యాడ్ చేయండి, ఒక్కొక్కటి ఐదు వందల తొంభై తొమ్మిది రూపాయలు'
    }
};

const res = {
    status: function(code) {
        this.statusCode = code;
        return this;
    },
    json: function(data) {
        console.log(`Status: ${this.statusCode}`);
        console.log("Data:", data);
    }
};

// Assuming GEMINI_API_KEY is not in env, we can't fully test it without a key.
// But we can test if it fails gracefully.
handler(req, res);

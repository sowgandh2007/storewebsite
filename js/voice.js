let recognition = null;
let isRecording = false;

// Initialize SpeechRecognition
if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    recognition.continuous = false;
    // We set lang to te-IN to handle Telugu and English code-switching best on mobile/Chrome
    recognition.lang = 'te-IN'; 
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
}

window.startVoiceInventory = function() {
    if (!recognition) {
        alert("Your browser does not support voice recognition. Please use Google Chrome.");
        return;
    }

    const modal = document.getElementById("voice-modal");
    const statusTitle = document.getElementById("voice-status-title");
    const statusText = document.getElementById("voice-status-text");
    const errorText = document.getElementById("voice-error-text");
    const pulse = document.getElementById("voice-pulse");
    const micIcon = document.getElementById("voice-mic-icon");

    // Reset UI
    errorText.classList.add("hidden");
    statusTitle.textContent = "Listening...";
    statusText.textContent = "Speak product details in Telugu or English...";
    pulse.classList.remove("opacity-0");
    pulse.classList.add("opacity-100", "animate-pulse");
    micIcon.classList.add("animate-bounce");
    
    modal.classList.remove("hidden");
    
    isRecording = true;
    try {
        recognition.start();
    } catch(e) {
        // Already started
    }

    recognition.onresult = function(event) {
        const transcript = event.results[0][0].transcript;
        statusTitle.textContent = "Processing...";
        statusText.textContent = `"${transcript}"`;
        pulse.classList.remove("animate-pulse");
        micIcon.classList.remove("animate-bounce");
        
        processVoiceInput(transcript);
    };

    recognition.onerror = function(event) {
        isRecording = false;
        pulse.classList.remove("animate-pulse");
        micIcon.classList.remove("animate-bounce");
        statusTitle.textContent = "Error";
        
        if (event.error === 'not-allowed') {
            errorText.textContent = "Microphone permission was denied.";
        } else {
            errorText.textContent = "Failed to recognize speech. Please try again.";
        }
        errorText.classList.remove("hidden");
    };

    recognition.onend = function() {
        if (isRecording) {
            // It ended unexpectedly
            pulse.classList.remove("animate-pulse");
            micIcon.classList.remove("animate-bounce");
            isRecording = false;
        }
    };
};

window.closeVoiceModal = function() {
    const modal = document.getElementById("voice-modal");
    modal.classList.add("hidden");
    if (isRecording && recognition) {
        recognition.stop();
        isRecording = false;
    }
};

async function processVoiceInput(transcript) {
    try {
        const response = await fetch('/api/interpret', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ text: transcript })
        });

        if (!response.ok) {
            let errorMsg = 'API processing failed';
            try {
                const errData = await response.json();
                if (errData.error) errorMsg = errData.error;
                if (errData.raw) console.error("Raw response:", errData.raw);
            } catch(e) {}
            throw new Error(errorMsg);
        }

        const data = await response.json();
        
        // Expected data format: { name, quantity, sell_price, category }
        if (!data.name) {
            throw new Error('Could not identify a product name from your speech.');
        }

        closeVoiceModal();
        handleInterpretedData(data);

    } catch(err) {
        console.error(err);
        const errorText = document.getElementById("voice-error-text");
        const statusTitle = document.getElementById("voice-status-title");
        statusTitle.textContent = "Interpretation Failed";
        errorText.textContent = err.message || "Failed to process the inventory data. Please try again.";
        errorText.classList.remove("hidden");
    }
}

function handleInterpretedData(data) {
    // Look for existing product in the global 'products' array (from app.js)
    let matchedProduct = null;
    if (window.products && window.products.length > 0) {
        // Simple case-insensitive search
        matchedProduct = window.products.find(p => p.name.toLowerCase() === data.name.toLowerCase());
    }

    if (matchedProduct) {
        // Open edit modal
        window.openProductModal('edit', matchedProduct.id);
        
        // Automatically add to existing quantity if a quantity was spoken
        if (data.quantity) {
            const existingQty = parseInt(matchedProduct.quantity) || 0;
            document.getElementById("product-quantity").value = existingQty + parseInt(data.quantity);
        }
        
        // If price is specified, maybe update it? Let's update it for confirmation
        if (data.sell_price) {
            document.getElementById("product-sell").value = data.sell_price;
        }
        
        if(window.showToast) {
            window.showToast(`Found existing product. Pre-filled with +${data.quantity || 0} qty. Please confirm.`);
        }
    } else {
        // Open add modal
        window.openProductModal('add');
        
        document.getElementById("product-name").value = data.name || "";
        document.getElementById("product-quantity").value = data.quantity || 1;
        document.getElementById("product-sell").value = data.sell_price || "";
        document.getElementById("product-category").value = data.category || "General";
        
        if(window.showToast) {
            window.showToast("New product interpreted. Please review and Save.");
        }
    }
}

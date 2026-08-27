let extractedItems = [];

async function handleImageImport(event) {
    const file = event.target.files[0];
    if (!file) return;

    // Reset UI
    document.getElementById("image-upload-input").value = "";
    document.getElementById("image-import-content").classList.add("hidden");
    document.getElementById("image-import-loading").classList.remove("hidden");
    document.getElementById("image-import-modal").classList.remove("hidden");

    try {
        const base64Image = await compressAndConvertToBase64(file);
        
        const response = await fetch('/api/extract-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                imageBase64: base64Image,
                mimeType: file.type || 'image/jpeg'
            })
        });

        if (!response.ok) {
            let errorMsg = 'API processing failed';
            try {
                const errData = await response.json();
                if (errData.error) errorMsg = errData.error;
            } catch(e) {}
            throw new Error(errorMsg);
        }

        let data = await response.json();
        if (!Array.isArray(data)) data = [];

        extractedItems = data.map((item, index) => {
            // Find existing product match
            const match = findExistingProduct(item);
            return {
                _id: 'item_' + index,
                _existingMatch: match,
                _action: match ? 'add' : 'new', // 'add', 'replace', 'skip', 'new'
                _deleted: false,
                name: item.name || "",
                category: item.category || "General",
                buy_price: parseFloat(item.buy_price) || 0,
                sell_price: parseFloat(item.sell_price) || 0,
                quantity: parseInt(item.quantity) || 0,
                sku: item.sku || "",
                supplier: item.supplier || "",
                confidence: item.confidence || "low"
            };
        });

        renderImportTable();
        
        document.getElementById("image-import-loading").classList.add("hidden");
        document.getElementById("image-import-content").classList.remove("hidden");
        document.getElementById("image-import-content").classList.add("flex");

    } catch (err) {
        console.error(err);
        alert("Failed to process image:\n" + err.message);
        closeImageImportModal();
    }
}

function findExistingProduct(item) {
    if (!window.products) return null;
    return window.products.find(p => {
        if (item.sku && p.id && p.id.toLowerCase() === item.sku.toLowerCase()) return true;
        if (item.name && p.name && p.name.toLowerCase() === item.name.toLowerCase()) return true;
        return false;
    });
}

function compressAndConvertToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 1200;
                const MAX_HEIGHT = 1200;
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > MAX_WIDTH) {
                        height *= MAX_WIDTH / width;
                        width = MAX_WIDTH;
                    }
                } else {
                    if (height > MAX_HEIGHT) {
                        width *= MAX_HEIGHT / height;
                        height = MAX_HEIGHT;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
                resolve(dataUrl);
            };
            img.onerror = reject;
            img.src = e.target.result;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

function renderImportTable() {
    const tbody = document.getElementById("image-import-table-body");
    tbody.innerHTML = "";

    let activeCount = 0;
    let newCount = 0;
    let existingCount = 0;
    let reviewCount = 0;
    let rejectedCount = extractedItems.filter(i => i._deleted).length;
    let skippedCount = 0;

    extractedItems.forEach(item => {
        if (item._deleted) return;
        activeCount++;

        if (item._action === 'skip') skippedCount++;
        else if (item._action === 'new') newCount++;
        else existingCount++;
        
        if ((item.confidence === 'low' || item.confidence === 'medium') && item._action !== 'skip') reviewCount++;

        const isLowConf = item.confidence === "low" || item.confidence === "medium";
        const statusIcon = isLowConf 
            ? `<i data-lucide="alert-triangle" class="w-5 h-5 text-amber-400" title="Needs Review"></i>`
            : `<i data-lucide="check-circle" class="w-5 h-5 text-emerald-400" title="High Confidence"></i>`;
        
        const matchHtml = item._existingMatch 
            ? `<div class="flex flex-col gap-1">
                 <span class="text-[10px] text-brand-400 font-bold uppercase">Exists (Stock: ${item._existingMatch.quantity})</span>
                 <select onchange="updateImportItem('${item._id}', '_action', this.value)" class="bg-dark-700 border border-slate-700 rounded px-1 py-1 text-xs text-white">
                    <option value="add" ${item._action === 'add' ? 'selected' : ''}>Add to Stock</option>
                    <option value="replace" ${item._action === 'replace' ? 'selected' : ''}>Replace Stock</option>
                    <option value="skip" ${item._action === 'skip' ? 'selected' : ''}>Skip Item</option>
                 </select>
               </div>`
            : `<span class="text-[10px] text-emerald-400 font-bold uppercase bg-emerald-400/10 px-2 py-1 rounded">New</span>`;

        const tr = document.createElement("tr");
        tr.className = "hover:bg-dark-800 transition-colors";
        if (item._action === 'skip') tr.classList.add("opacity-50");

        tr.innerHTML = `
            <td class="p-3 text-center">${statusIcon}</td>
            <td class="p-3">
                <input type="text" value="${escapeHtml(item.name)}" onchange="updateImportItem('${item._id}', 'name', this.value)" class="w-full bg-transparent border-b border-slate-700 focus:border-brand-500 focus:outline-none text-white text-xs py-1">
                ${item.sku ? `<div class="text-[10px] text-slate-500 mt-1">SKU: ${escapeHtml(item.sku)}</div>` : ''}
            </td>
            <td class="p-3">
                <input type="text" value="${escapeHtml(item.category)}" onchange="updateImportItem('${item._id}', 'category', this.value)" class="w-full bg-transparent border-b border-slate-700 focus:border-brand-500 focus:outline-none text-white text-xs py-1">
            </td>
            <td class="p-3">
                <input type="number" step="0.01" value="${item.buy_price}" onchange="updateImportItem('${item._id}', 'buy_price', this.value)" class="w-full bg-transparent border-b ${isLowConf?'border-amber-500/50':'border-slate-700'} focus:border-brand-500 focus:outline-none text-white text-xs py-1 text-right">
            </td>
            <td class="p-3">
                <input type="number" step="0.01" value="${item.sell_price}" onchange="updateImportItem('${item._id}', 'sell_price', this.value)" class="w-full bg-transparent border-b ${isLowConf?'border-amber-500/50':'border-slate-700'} focus:border-brand-500 focus:outline-none text-white text-xs py-1 text-right">
            </td>
            <td class="p-3">
                <input type="number" value="${item.quantity}" onchange="updateImportItem('${item._id}', 'quantity', this.value)" class="w-full bg-transparent border-b ${isLowConf?'border-amber-500/50':'border-slate-700'} focus:border-brand-500 focus:outline-none text-white text-xs font-bold py-1 text-right">
            </td>
            <td class="p-3">${matchHtml}</td>
            <td class="p-3 text-center">
                <button onclick="removeImportItem('${item._id}')" class="text-slate-500 hover:text-rose-400 transition-colors p-1"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    if (activeCount === 0) {
        tbody.innerHTML = `<tr><td colspan="8" class="p-8 text-center text-slate-500">No items detected or all items removed.</td></tr>`;
    }

    document.getElementById("image-import-summary").innerHTML = `
        <span class="text-emerald-400 font-bold ml-2">New:</span> ${newCount} 
        <span class="text-brand-400 font-bold ml-2">Existing:</span> ${existingCount} 
        <span class="text-amber-400 font-bold ml-2">Review:</span> ${reviewCount} 
        <span class="text-rose-400 font-bold ml-2">Ignored:</span> ${rejectedCount + skippedCount}
    `;
    
    if (window.lucide) {
        lucide.createIcons();
    }
}

function updateImportItem(id, field, value) {
    const item = extractedItems.find(i => i._id === id);
    if (item) {
        item[field] = value;
        if (field === '_action') {
            renderImportTable(); // Re-render to update opacity if skipped
        }
    }
}

function removeImportItem(id) {
    const item = extractedItems.find(i => i._id === id);
    if (item) {
        item._deleted = true;
        renderImportTable();
    }
}

function closeImageImportModal() {
    document.getElementById("image-import-modal").classList.add("hidden");
    extractedItems = [];
}

function addManualImportRow() {
    extractedItems.push({
        _id: 'manual_' + Date.now(),
        _existingMatch: null,
        _action: 'new',
        _deleted: false,
        name: "",
        category: "General",
        buy_price: 0,
        sell_price: 0,
        quantity: 1,
        sku: "",
        supplier: "",
        confidence: "high"
    });
    renderImportTable();
}

async function confirmImageImport() {
    const itemsToProcess = extractedItems.filter(i => !i._deleted && i._action !== 'skip');
    
    if (itemsToProcess.length === 0) {
        alert("No items selected for import.");
        return;
    }

    const confirmMsg = `Ready to import ${itemsToProcess.length} items.\nAre you sure you want to proceed?`;
    if (!confirm(confirmMsg)) return;

    // Show loading
    document.getElementById("image-import-content").classList.add("hidden");
    document.getElementById("image-import-content").classList.remove("flex");
    const loadingEl = document.getElementById("image-import-loading");
    loadingEl.innerHTML = `<i data-lucide="loader-2" class="w-10 h-10 text-brand-400 animate-spin mb-4"></i><h3 class="text-lg font-bold text-white">Saving to database...</h3>`;
    loadingEl.classList.remove("hidden");
    if (window.lucide) lucide.createIcons();

    let successCount = 0;
    let failCount = 0;

    for (const item of itemsToProcess) {
        try {
            const payload = {
                name: item.name || "Unnamed Product",
                category: item.category || "General",
                buy_price: parseFloat(item.buy_price) || 0,
                sell_price: parseFloat(item.sell_price) || 0,
                quantity: parseInt(item.quantity) || 0,
                supplier: item.supplier || "",
                branch: "Ashok Nagar (Kurnool)", // Default or could be mapped
            };

            if (item._action === 'add' || item._action === 'replace') {
                // Update existing
                const existing = item._existingMatch;
                let newQty = payload.quantity;
                if (item._action === 'add') {
                    newQty += parseInt(existing.quantity) || 0;
                }
                payload.quantity = newQty;

                const { error } = await supabaseClient
                    .from('products')
                    .update(payload)
                    .eq('id', existing.id);
                
                if (error) throw error;
                successCount++;
            } else {
                // Insert new
                const newId = "prod-" + Math.floor(100000 + Math.random() * 900000);
                const { error } = await supabaseClient
                    .from('products')
                    .insert([{ id: newId, ...payload }]);
                
                if (error) throw error;
                successCount++;
            }
        } catch (err) {
            console.error("Failed to import item:", item.name, err);
            failCount++;
        }
    }

    closeImageImportModal();
    
    // Refresh inventory from app.js
    if (window.loadData) {
        window.loadData(false);
    }
    
    if (window.showToast) {
        window.showToast(`Import complete: ${successCount} successful, ${failCount} failed.`);
    } else {
        alert(`Import complete: ${successCount} successful, ${failCount} failed.`);
    }
}

function escapeHtml(unsafe) {
    if (!unsafe) return "";
    return unsafe
         .toString()
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
}

// app.js - Private Stockly Admin Dashboard Controller

const SUPABASE_URL = "https://wdijjlsuehjivlodmfxp.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndkaWpqbHN1ZWhqaXZsb2RtZnhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMzMjI4MzksImV4cCI6MjA5ODg5ODgzOX0.RbU-zmK9qIeOada43sKSs4kHSEnrkVGoKcVesmaoCHI";

// Initialize Supabase Client (renamed from 'supabase' to avoid global conflict with the script CDN library)
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Application State
let products = [];
let sales = [];
let activities = [];
let branches = [];
let activeView = "dashboard-view";
let currentFilter = "all";
let searchQuery = "";

// Initialize Application
document.addEventListener("DOMContentLoaded", () => {
    switchView("dashboard-view");
    loadData();
    setupSearch();
    subscribeToLiveChanges();
});

// --- REALTIME REALTIME SYNC ---
function subscribeToLiveChanges() {
    // Listen to live database changes from Supabase to keep admin UI synced if reservations occur
    supabaseClient.channel('admin-db-sync')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'reservations' }, payload => {
            showToast("New Reservation Request received!");
            addActivity("Reservation", `New request received for ${payload.new.product_name}`);
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, payload => {
            loadData(false); // Reload data quietly without clearing screen
        })
        .subscribe();
}

// --- FETCH DATA FROM DATABASE ---
async function loadData(showLoading = true) {
    try {
        if (showLoading) {
            document.getElementById("stat-inventory-val").textContent = "Loading...";
            document.getElementById("stat-revenue-val").textContent = "Loading...";
            document.getElementById("stat-profit-val").textContent = "Loading...";
            document.getElementById("stat-margin-val").textContent = "Loading...";
        }

        // Fetch products
        const { data: dbProducts, error: prodError } = await supabaseClient
            .from('products')
            .select('*')
            .order('name', { ascending: true });

        if (prodError) throw prodError;
        
        initBranches();
        products = (dbProducts || []).map(p => ({
            ...p,
            branch: p.branch || "Ashok Nagar (Kurnool)"
        }));

        // Fetch sales
        const { data: dbSales, error: salesError } = await supabaseClient
            .from('sales')
            .select('*')
            .order('date_sold', { ascending: false });

        if (salesError) throw salesError;
        sales = dbSales || [];

        // Re-render UI
        updateSummaryStats();
        renderDashboard();
        renderInventory();
        renderSalesLog();
        renderBranchesView();
        populateCategoryFilter();
        populateBranchSelectors();
    } catch (e) {
        console.error("Error loading Supabase data:", e);
        showToast("Database fetch failed", true);
    }
}

// --- UPDATE SUMMARY STATISTICS ---
function updateSummaryStats() {
    // 1. Total Stock Value (Sum of buy_price * quantity)
    const inventoryVal = products.reduce((acc, p) => acc + (parseFloat(p.buy_price) * parseInt(p.quantity)), 0);
    document.getElementById("stat-inventory-val").textContent = `₹${inventoryVal.toFixed(2)}`;

    // 2. Total Revenue (Sum of sold_price * quantity)
    const revenueVal = sales.reduce((acc, s) => acc + (parseFloat(s.sold_price) * parseInt(s.quantity)), 0);
    document.getElementById("stat-revenue-val").textContent = `₹${revenueVal.toFixed(2)}`;
    document.getElementById("sales-cost-val").textContent = `₹${sales.reduce((acc, s) => acc + (parseFloat(s.buy_price) * parseInt(s.quantity)), 0).toFixed(2)}`;

    // 3. Estimated Inventory Profit (sum of (sell_price - buy_price) × quantity for all in-stock items)
    const profitVal = products.reduce((acc, p) => {
        const qty = parseInt(p.quantity) || 0;
        const sell = parseFloat(p.sell_price) || 0;
        const buy = parseFloat(p.buy_price) || 0;
        return acc + ((sell - buy) * qty);
    }, 0);
    document.getElementById("stat-profit-val").textContent = `₹${profitVal.toFixed(2)}`;

    // Also update sales-realized profit separately (from actual sales history)
    const realizedProfit = sales.reduce((acc, s) => acc + parseFloat(s.profit || 0), 0);
    document.getElementById("sales-profit-val").textContent = `₹${realizedProfit.toFixed(2)}`;
    document.getElementById("sales-cost-val").textContent = `₹${sales.reduce((acc, s) => acc + (parseFloat(s.buy_price) * parseInt(s.quantity)), 0).toFixed(2)}`;
    document.getElementById("sales-count-val").textContent = sales.reduce((acc, s) => acc + parseInt(s.quantity), 0);

    // 4. Average Profit Margin (% across inventory)
    const totalBuyCost = products.reduce((acc, p) => acc + (parseFloat(p.buy_price) * parseInt(p.quantity || 0)), 0);
    const avgMargin = totalBuyCost > 0 ? (profitVal / totalBuyCost) * 100 : 0;
    document.getElementById("stat-margin-val").textContent = `${Math.round(avgMargin)}%`;
}

// --- SWITCH APPLICATION VIEWS ---
window.switchView = function(viewId) {
    activeView = viewId;
    
    // Toggle active link CSS class
    document.querySelectorAll(".nav-item").forEach(item => {
        if (item.getAttribute("data-target") === viewId) {
            item.classList.add("active");
        } else {
            item.classList.remove("active");
        }
    });

    // Toggle view section visibility
    document.querySelectorAll(".view-section").forEach(view => {
        if (view.id === viewId) {
            view.classList.remove("hidden");
        } else {
            view.classList.add("hidden");
        }
    });
};

// --- SETUP SEARCH ---
function setupSearch() {
    const input = document.getElementById("inventory-search");
    if (input) {
        input.addEventListener("input", (e) => {
            searchQuery = e.target.value;
            renderInventory();
        });
    }
}

// --- RENDER DASHBOARD VISUALS ---
function renderDashboard() {
    // 1. High Margin Chart
    const chartContainer = document.getElementById("margin-chart-container");
    chartContainer.innerHTML = "";

    // Filter products in stock and sort by percentage profit margin
    const sortedMargin = products
        .filter(p => p.quantity > 0 && parseFloat(p.buy_price) > 0)
        .map(p => {
            const profit = parseFloat(p.sell_price) - parseFloat(p.buy_price);
            const margin = (profit / parseFloat(p.buy_price)) * 100;
            return { name: p.name, margin };
        })
        .sort((a, b) => b.margin - a.margin)
        .slice(0, 4);

    if (sortedMargin.length === 0) {
        chartContainer.innerHTML = `
            <div class="flex flex-col items-center justify-center h-full text-slate-500 gap-2">
                <i data-lucide="bar-chart-2" class="w-8 h-8"></i>
                <span>Add products in stock to display chart</span>
            </div>
        `;
    } else {
        sortedMargin.forEach(item => {
            const row = document.createElement("div");
            row.className = "flex flex-col gap-1.5";
            row.innerHTML = `
                <div class="flex justify-between text-xs font-semibold">
                    <span class="text-slate-300 truncate max-w-[70%]">${item.name}</span>
                    <span class="text-brand-500 font-bold">${Math.round(item.margin)}% margin</span>
                </div>
                <div class="w-full bg-dark-600 rounded-full h-2.5 overflow-hidden border border-slate-800/40">
                    <div class="bg-brand-500 h-full rounded-full" style="width: ${Math.min(item.margin, 100)}%"></div>
                </div>
            `;
            chartContainer.appendChild(row);
        });
    }

    // 2. Recent Activities
    const activityList = document.getElementById("activity-log-list");
    activityList.innerHTML = "";

    if (activities.length === 0) {
        activityList.innerHTML = `
            <div class="flex flex-col items-center justify-center py-10 text-slate-500 gap-1.5">
                <i data-lucide="history" class="w-5 h-5"></i>
                <span>No activities recorded yet</span>
            </div>
        `;
    } else {
        activities.slice(0, 5).forEach(act => {
            const item = document.createElement("div");
            item.className = "flex items-start gap-3 border-b border-slate-850 pb-2.5 last:border-0";
            
            const badgeColor = act.type === "Add" ? "bg-indigo-500/10 text-indigo-400" :
                              act.type === "Edit" ? "bg-amber-500/10 text-amber-400" :
                              act.type === "Delete" ? "bg-rose-500/10 text-rose-400" :
                              "bg-emerald-500/10 text-emerald-400";
                              
            item.innerHTML = `
                <div class="w-6 h-6 rounded-md ${badgeColor} flex items-center justify-center shrink-0 font-bold text-[9px] uppercase">${act.type[0]}</div>
                <div class="flex-grow">
                    <p class="text-slate-200 leading-tight font-medium">${act.details}</p>
                    <span class="text-[9px] text-slate-500 font-bold block mt-0.5">${act.time}</span>
                </div>
            `;
            activityList.appendChild(item);
        });
    }

    lucide.createIcons();
}

// --- RENDER PRODUCTS INVENTORY TABLE ---
function renderInventory() {
    const tbody = document.getElementById("inventory-table-body");
    if (!tbody) return;
    tbody.innerHTML = "";

    // Filters
    const catSelect = document.getElementById("category-filter");
    const activeCategory = catSelect ? catSelect.value : "all";
    const branchSelect = document.getElementById("branch-filter");
    const activeBranch = branchSelect ? branchSelect.value : "all";
    const sortVal = document.getElementById("inventory-sort").value;

    let filtered = products.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                             p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
                             (p.branch && p.branch.toLowerCase().includes(searchQuery.toLowerCase()));
        
        let matchesStatus = true;
        if (currentFilter === "instock") matchesStatus = parseInt(p.quantity) > 0;
        if (currentFilter === "outstock") matchesStatus = parseInt(p.quantity) === 0;

        const matchesCategory = activeCategory === "all" || p.category === activeCategory;
        const matchesBranch = activeBranch === "all" || p.branch === activeBranch;

        return matchesSearch && matchesStatus && matchesCategory && matchesBranch;
    });

    // Sorting
    filtered.sort((a, b) => {
        if (sortVal === "name-asc") return a.name.localeCompare(b.name);
        if (sortVal === "name-desc") return b.name.localeCompare(a.name);
        if (sortVal === "buy-desc") return parseFloat(b.buy_price) - parseFloat(a.buy_price);
        if (sortVal === "date-asc") return new Date(a.date_added) - new Date(b.date_added);
        if (sortVal === "date-desc") return new Date(b.date_added) - new Date(a.date_added);
        if (sortVal === "profit-desc") {
            const marginA = parseFloat(a.buy_price) > 0 ? (parseFloat(a.sell_price) - parseFloat(a.buy_price)) / parseFloat(a.buy_price) : 0;
            const marginB = parseFloat(b.buy_price) > 0 ? (parseFloat(b.sell_price) - parseFloat(b.buy_price)) / parseFloat(b.buy_price) : 0;
            return marginB - marginA;
        }
        return 0;
    });

    if (filtered.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="p-8 text-center text-slate-500 font-medium">No inventory products match criteria.</td>
            </tr>
        `;
        return;
    }

    filtered.forEach(p => {
        const tr = document.createElement("tr");
        tr.className = "hover:bg-slate-800/10 transition-colors";
        
        const markup = parseFloat(p.buy_price) > 0 
            ? ((parseFloat(p.sell_price) - parseFloat(p.buy_price)) / parseFloat(p.buy_price) * 100) 
            : 0;

        const isLow = parseInt(p.quantity) > 0 && parseInt(p.quantity) <= 3;
        const stockBadge = parseInt(p.quantity) === 0 
            ? `<span class="px-2 py-1 text-[10px] font-black text-rose-400 bg-rose-500/10 rounded-md border border-rose-500/10">Out of Stock</span>`
            : isLow
            ? `<span class="px-2 py-1 text-[10px] font-black text-amber-400 bg-amber-500/10 rounded-md border border-amber-500/10">Low Stock (${p.quantity})</span>`
            : `<span class="px-2 py-1 text-[10px] font-black text-emerald-400 bg-emerald-500/10 rounded-md border border-emerald-500/10">${p.quantity} Units</span>`;

        const branchName = p.branch || "Ashok Nagar (Kurnool)";
        const branchBadge = `<span class="px-2 py-1 text-[10px] font-bold bg-indigo-500/10 text-indigo-400 rounded-md border border-indigo-500/20 truncate max-w-[140px] flex items-center gap-1"><i data-lucide="map-pin" class="w-3 h-3 text-indigo-400 shrink-0"></i> ${branchName}</span>`;

        tr.innerHTML = `
            <td class="p-4">
                <div class="font-bold text-slate-100 text-sm leading-tight">${p.name}</div>
                <div class="text-[10px] text-slate-500 mt-1 font-semibold">${p.supplier ? `Supplier: ${p.supplier}` : 'No supplier linked'}</div>
            </td>
            <td class="p-4 text-right font-semibold text-slate-300">₹${parseFloat(p.buy_price).toFixed(2)}</td>
            <td class="p-4 text-right font-semibold text-slate-300">₹${parseFloat(p.sell_price).toFixed(2)}</td>
            <td class="p-4 text-right font-bold text-brand-500">₹${(parseFloat(p.sell_price) - parseFloat(p.buy_price)).toFixed(2)} (${Math.round(markup)}%)</td>
            <td class="p-4">
                <div class="flex items-center gap-2 flex-wrap">
                    ${branchBadge}
                    ${stockBadge}
                    <span class="px-2 py-1 text-[10px] font-bold bg-dark-600 rounded-md text-slate-400 border border-slate-700">${p.category}</span>
                </div>
            </td>
            <td class="p-4 text-right">
                <div class="flex items-center justify-end gap-2">
                    ${parseInt(p.quantity) > 0 ? `
                    <button onclick="openCheckoutModal('${p.id}')" title="Record Sale" class="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white transition-all flex items-center justify-center border border-emerald-500/10">
                        <i data-lucide="shopping-cart" class="w-4 h-4"></i>
                    </button>
                    ` : ""}
                    <button onclick="openProductModal('edit', '${p.id}')" title="Edit Item" class="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 hover:bg-amber-50 hover:text-white transition-all flex items-center justify-center border border-amber-500/10">
                        <i data-lucide="pencil" class="w-4 h-4"></i>
                    </button>
                    <button onclick="handleDeleteProduct('${p.id}')" title="Delete Item" class="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-50 hover:text-white transition-all flex items-center justify-center border border-rose-500/10">
                        <i data-lucide="trash-2" class="w-4 h-4"></i>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });

    lucide.createIcons();
}

// --- RENDER SALES LOG HISTORY TABLE ---
function renderSalesLog() {
    const tbody = document.getElementById("sales-table-body");
    tbody.innerHTML = "";

    if (sales.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="p-8 text-center text-slate-500 font-medium">No transactions recorded in sales log.</td>
            </tr>
        `;
        return;
    }

    sales.forEach(s => {
        const tr = document.createElement("tr");
        tr.className = "hover:bg-slate-800/10 transition-colors";
        
        const dateStr = new Date(s.date_sold).toLocaleDateString("en-IN", {
            day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit"
        });

        tr.innerHTML = `
            <td class="p-4">
                <div class="font-bold text-slate-100 text-sm">${s.product_name}</div>
                <div class="text-[9px] font-black text-slate-500 mt-0.5 uppercase">Quantity: ${s.quantity} units</div>
            </td>
            <td class="p-4 text-slate-400 font-semibold">${dateStr}</td>
            <td class="p-4 text-right font-semibold text-slate-400">₹${parseFloat(s.buy_price).toFixed(2)}</td>
            <td class="p-4 text-right font-semibold text-slate-200">₹${parseFloat(s.sold_price).toFixed(2)}</td>
            <td class="p-4 text-right font-bold text-brand-500">₹${parseFloat(s.profit).toFixed(2)}</td>
            <td class="p-4 text-right">
                <button onclick="handleDeleteSale('${s.id}')" title="Delete Sale Log" class="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-50 hover:text-white transition-all flex items-center justify-center border border-rose-500/10 ml-auto">
                    <i data-lucide="trash" class="w-4 h-4"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    lucide.createIcons();
}

// --- POPULATE CATEGORIES IN FILTER ---
function populateCategoryFilter() {
    const select = document.getElementById("category-filter");
    if (!select) return;

    const currentVal = select.value;
    
    // Extract unique categories
    const categories = ["all"];
    products.forEach(p => {
        if (p.category && !categories.includes(p.category)) {
            categories.push(p.category);
        }
    });

    select.innerHTML = "";
    categories.forEach(cat => {
        const opt = document.createElement("option");
        opt.value = cat;
        opt.textContent = cat === "all" ? "All Categories" : cat;
        select.appendChild(opt);
    });

    // Reapply previously selected value if it still exists
    if (categories.includes(currentVal)) {
        select.value = currentVal;
    }
}

// --- INVENTORY VIEW FILTER ACTIONS ---
window.setFilter = function(filterId) {
    currentFilter = filterId;
    document.querySelectorAll("[id^=filter-]").forEach(btn => {
        if (btn.id === `filter-${filterId}`) {
            btn.className = "px-3.5 py-2 text-xs font-bold rounded-lg border border-slate-800 bg-dark-700 text-white";
        } else {
            btn.className = "px-3.5 py-2 text-xs font-semibold rounded-lg border border-slate-800 bg-dark-800 text-slate-400 hover:text-white";
        }
    });
    renderInventory();
};

window.applyFilters = function() {
    renderInventory();
};

let pendingImageUploadPromise = null;

// --- ADD / EDIT PRODUCT SUBMIT HANDLER ---
window.handleProductSubmit = async function(e) {
    e.preventDefault();
    
    // If an image upload is in progress, wait for it to complete
    if (pendingImageUploadPromise) {
        const statusEl = document.getElementById("img-upload-status");
        if (statusEl) {
            statusEl.textContent = "⏳ Waiting for photo upload to finish...";
            statusEl.className = "text-[10px] text-amber-400 mt-1.5 font-bold";
        }
        try {
            await pendingImageUploadPromise;
        } catch (err) {
            console.warn("Image upload failed before save:", err);
        }
    }

    const id = document.getElementById("product-id").value;
    const name = document.getElementById("product-name").value.trim();
    const buy_price = parseFloat(document.getElementById("product-buy").value) || 0;
    const sell_price = parseFloat(document.getElementById("product-sell").value) || 0;
    const mrp = parseFloat(document.getElementById("product-mrp").value) || 0;
    const quantity = parseInt(document.getElementById("product-quantity").value) || 0;
    const category = document.getElementById("product-category").value.trim() || "General";
    const branch = (document.getElementById("product-branch") ? document.getElementById("product-branch").value : "") || "Ashok Nagar (Kurnool)";
    const supplier = document.getElementById("product-supplier").value.trim() || "";
    const description = document.getElementById("product-desc").value.trim() || "";

    const image_url = document.getElementById("product-image-url").value.trim();

    const payload = {
        name,
        buy_price,
        sell_price,
        mrp,
        quantity,
        category,
        branch,
        supplier,
        description,
        image_url
    };

    try {
        if (id) {
            // Edit Product in Supabase
            const { error } = await supabaseClient
                .from('products')
                .update(payload)
                .eq('id', id);

            if (error) throw error;
            showToast("Product updated successfully");
            addActivity("Edit", `Updated details for ${name}`);
        } else {
            // Add Product in Supabase
            const newId = "prod-" + Math.floor(100000 + Math.random() * 900000);
            const { error } = await supabaseClient
                .from('products')
                .insert([{ id: newId, ...payload }]);

            if (error) throw error;
            showToast("Product created successfully");
            addActivity("Add", `Added ${name} to inventory`);
        }

        closeProductModal();
        loadData(false);
    } catch (err) {
        console.error(err);
        showToast("Product save failed", true);
    }
};

// --- RECORD PRODUCT SALE SUBMIT HANDLER ---
window.handleCheckoutSubmit = async function(e) {
    e.preventDefault();

    const productId = document.getElementById("checkout-product-id").value;
    const qtyToSell = parseInt(document.getElementById("checkout-qty").value) || 1;
    const soldPrice = parseFloat(document.getElementById("checkout-price").value) || 0;

    const product = products.find(p => p.id === productId);
    if (!product) return;

    if (qtyToSell > parseInt(product.quantity)) {
        alert("Cannot record sale. Selling quantity exceeds available stock count.");
        return;
    }

    const profitVal = (soldPrice - parseFloat(product.buy_price)) * qtyToSell;
    const saleId = "SALE-" + Math.floor(100000 + Math.random() * 900000);

    const salePayload = {
        id: saleId,
        product_id: productId,
        product_name: product.name,
        buy_price: product.buy_price,
        sold_price: soldPrice,
        quantity: qtyToSell,
        profit: profitVal
    };

    try {
        // 1. Subtract stock count in products table
        const newQty = parseInt(product.quantity) - qtyToSell;
        const { error: updateError } = await supabaseClient
            .from('products')
            .update({ quantity: newQty })
            .eq('id', productId);

        if (updateError) throw updateError;

        // 2. Insert new transaction record into sales log
        const { error: insertError } = await supabaseClient
            .from('sales')
            .insert([salePayload]);

        if (insertError) throw insertError;

        showToast("Sale transaction logged");
        addActivity("Sale", `Sold ${qtyToSell}x ${product.name}`);
        closeCheckoutModal();
        loadData(false);
    } catch (err) {
        console.error(err);
        showToast("Record sale failed", true);
    }
};

// --- DELETE HANDLERS ---
window.handleDeleteProduct = async function(id) {
    const product = products.find(p => p.id === id);
    if (!product) return;

    if (!confirm(`Are you sure you want to delete "${product.name}" from your catalog?`)) return;

    try {
        const { error } = await supabaseClient
            .from('products')
            .delete()
            .eq('id', id);

        if (error) throw error;
        showToast("Product deleted");
        addActivity("Delete", `Removed ${product.name} from catalog`);
        loadData(false);
    } catch (err) {
        console.error(err);
        showToast("Delete product failed", true);
    }
};

window.handleDeleteSale = async function(saleId) {
    const sale = sales.find(s => s.id === saleId);
    if (!sale) return;

    if (!confirm(`Delete sales transaction record for "${sale.product_name}"?`)) return;

    try {
        const { error } = await supabaseClient
            .from('sales')
            .delete()
            .eq('id', saleId);

        if (error) throw error;
        showToast("Transaction record deleted");
        addActivity("Delete", `Deleted sale record for ${sale.product_name}`);
        loadData(false);
    } catch (err) {
        console.error(err);
        showToast("Delete log failed", true);
    }
};

// --- MODAL MODALS OPEN/CLOSE CONTROLLERS ---
window.openProductModal = function(mode, productId = null) {
    const modal = document.getElementById("product-modal");
    const title = document.getElementById("product-modal-title");
    
    document.getElementById("product-form").reset();
    document.getElementById("product-id").value = "";
    // Always clear image state first
    clearProductImage(true);

    populateBranchSelectors();
    
    if (mode === "edit" && productId) {
        title.textContent = "Edit Product Details";
        const p = products.find(prod => prod.id === productId);
        if (p) {
            document.getElementById("product-id").value = p.id;
            document.getElementById("product-name").value = p.name;
            document.getElementById("product-buy").value = p.buy_price;
            document.getElementById("product-sell").value = p.sell_price;
            document.getElementById("product-mrp").value = p.mrp || 0.00;
            document.getElementById("product-quantity").value = p.quantity;
            document.getElementById("product-category").value = p.category;
            const branchEl = document.getElementById("product-branch");
            if (branchEl) branchEl.value = p.branch || "Ashok Nagar (Kurnool)";
            document.getElementById("product-supplier").value = p.supplier;
            document.getElementById("product-desc").value = p.description;
            // Populate existing image if any
            if (p.image_url) {
                document.getElementById("product-image-url").value = p.image_url;
                document.getElementById("img-preview").src = p.image_url;
                document.getElementById("img-preview-wrap").classList.remove("hidden");
            }
        }
    } else {
        title.textContent = "Add New Product";
    }

    modal.classList.remove("hidden");
    lucide.createIcons();
};

window.closeProductModal = function() {
    document.getElementById("product-modal").classList.add("hidden");
};

window.openCheckoutModal = function(productId) {
    const modal = document.getElementById("checkout-modal");
    const product = products.find(p => p.id === productId);
    if (!product) return;

    document.getElementById("checkout-product-id").value = product.id;
    document.getElementById("checkout-product-name").textContent = product.name;
    document.getElementById("checkout-buy-display").textContent = `₹${parseFloat(product.buy_price).toFixed(2)}`;
    document.getElementById("checkout-sell-display").textContent = `₹${parseFloat(product.sell_price).toFixed(2)}`;
    
    document.getElementById("checkout-qty").value = "1";
    document.getElementById("checkout-qty").max = product.quantity;
    document.getElementById("checkout-qty-available").textContent = `Available: ${product.quantity}`;
    document.getElementById("checkout-price").value = product.sell_price;

    modal.classList.remove("hidden");
    updateProfitPreview();
    lucide.createIcons();
};

window.closeCheckoutModal = function() {
    document.getElementById("checkout-modal").classList.add("hidden");
};

window.updateProfitPreview = function() {
    const productId = document.getElementById("checkout-product-id").value;
    const qty = parseInt(document.getElementById("checkout-qty").value) || 1;
    const price = parseFloat(document.getElementById("checkout-price").value) || 0;

    const product = products.find(p => p.id === productId);
    if (!product) return;

    const buyPrice = parseFloat(product.buy_price);
    const profit = (price - buyPrice) * qty;

    const display = document.getElementById("checkout-profit-preview");
    display.textContent = `₹${profit.toFixed(2)}`;
    if (profit < 0) {
        display.className = "text-base font-black text-rose-500";
    } else {
        display.className = "text-base font-black text-brand-500";
    }
};

// --- RECENT ACTIVITIES MEMORY LOGGER ---
function addActivity(type, details) {
    const timeStr = new Date().toLocaleTimeString("en-IN", {
        hour: "2-digit", minute: "2-digit", second: "2-digit"
    });
    
    activities.unshift({
        type,
        details,
        time: timeStr
    });
    
    // Cap at 15 items in history
    if (activities.length > 15) activities.pop();
    
    // Save to local storage cache so it persists between reloads
    localStorage.setItem("stockly_activities", JSON.stringify(activities));
    
    renderDashboard();
}

// Load cached activities on load
if (localStorage.getItem("stockly_activities")) {
    activities = JSON.parse(localStorage.getItem("stockly_activities"));
}

// --- TOAST NOTIFICATIONS HELPER ---
function showToast(message, isError = false) {
    const container = document.getElementById("toast-container");
    if (!container) return;

    const toast = document.createElement("div");
    toast.className = `p-4 rounded-xl border shadow-lg flex items-center gap-2.5 transition-all duration-300 transform translate-y-2 opacity-0 pointer-events-auto max-w-sm ${
        isError 
        ? "bg-rose-500/10 text-rose-400 border-rose-500/20" 
        : "bg-brand-500/10 text-brand-500 border-brand-500/20"
    }`;
    
    const icon = isError ? "alert-circle" : "check-circle";
    toast.innerHTML = `
        <i data-lucide="${icon}" class="w-4.5 h-4.5"></i>
        <span class="text-xs font-bold">${message}</span>
    `;

    container.appendChild(toast);
    lucide.createIcons();

    // Trigger entrance transition
    setTimeout(() => {
        toast.classList.remove("translate-y-2", "opacity-0");
    }, 10);

    // Transition out and destroy
    setTimeout(() => {
        toast.classList.add("translate-y-2", "opacity-0");
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}

// --- CSV PARSING AND BULK IMPORT LOGIC ---
function parseCSV(text) {
    const lines = [];
    let row = [""];
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        const nextChar = text[i + 1];

        if (char === '"') {
            if (inQuotes && nextChar === '"') {
                row[row.length - 1] += '"';
                i++; // skip next quote
            } else {
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            row.push("");
        } else if ((char === '\r' || char === '\n') && !inQuotes) {
            if (char === '\r' && nextChar === '\n') {
                i++; // skip \n
            }
            lines.push(row.map(cell => cell.trim()));
            row = [""];
        } else {
            row[row.length - 1] += char;
        }
    }
    if (row.length > 1 || row[0] !== "") {
        lines.push(row.map(cell => cell.trim()));
    }
    return lines;
}

window.triggerCsvUpload = function() {
    const input = document.getElementById("csv-file-input");
    if (input) {
        input.click();
    }
};

window.handleCsvFile = async function(event) {
    const file = event.target.files[0];
    if (!file) return;

    // Reset value so same file can be uploaded again
    event.target.value = "";

    const reader = new FileReader();
    reader.onload = async (e) => {
        const text = e.target.result;
        try {
            // Parse and filter out empty rows
            const parsed = parseCSV(text).filter(r => r.some(cell => cell !== ""));
            if (parsed.length < 2) {
                showToast("CSV file is empty or missing data rows.", true);
                return;
            }

            // Map headers case-insensitively, removing spaces/underscores
            const headers = parsed[0].map(h => h.toLowerCase().replace(/[\s_]+/g, ''));
            
            const nameIndex = headers.indexOf("productname") !== -1 ? headers.indexOf("productname") : headers.indexOf("name");
            
            if (nameIndex === -1) {
                showToast("Required column 'Product Name' or 'Name' is missing in the CSV header.", true);
                return;
            }

            const idIndex = headers.indexOf("id") !== -1 ? headers.indexOf("id") : headers.indexOf("productid");
            const categoryIndex = headers.indexOf("category");
            const buyPriceIndex = headers.findIndex(h => h === "buyprice" || h === "purchaseprice" || h === "buy" || h === "costprice" || h === "cost" || h === "buyingprice");
            const sellPriceIndex = headers.findIndex(h => h === "sellprice" || h === "sellingprice" || h === "sell" || h === "price" || h === "storeprice");
            const mrpIndex = headers.findIndex(h => h === "mrp" || h === "marketprice");
            const quantityIndex = headers.findIndex(h => h === "quantity" || h === "stock" || h === "qty" || h === "count");
            const supplierIndex = headers.findIndex(h => h === "supplier" || h === "vendor" || h === "brand");
            const descriptionIndex = headers.findIndex(h => h === "description" || h === "desc" || h === "details" || h === "notes");
            const imageUrlIndex = headers.findIndex(h => h === "imageurl" || h === "image" || h === "photo");
            const sourceAppIndex = headers.indexOf("sourceapp");

            const productsToInsert = [];
            const validationErrors = [];

            // Data cleaning helper functions
            const cleanNumber = (val) => {
                if (val === undefined || val === null || val.trim() === "") return 0;
                const cleaned = val.replace(/[^\d.-]/g, '');
                const num = parseFloat(cleaned);
                return isNaN(num) ? 0 : num;
            };

            const cleanInteger = (val) => {
                if (val === undefined || val === null || val.trim() === "") return 0;
                const cleaned = val.replace(/[^\d-]/g, '');
                const num = parseInt(cleaned, 10);
                return isNaN(num) ? 0 : num;
            };

            const isInvalidNum = (rawStr) => {
                if (!rawStr) return false;
                const cleaned = rawStr.replace(/[^\d.-]/g, '');
                return cleaned === "" || isNaN(parseFloat(cleaned));
            };

            const isInvalidInt = (rawStr) => {
                if (!rawStr) return false;
                const cleaned = rawStr.replace(/[^\d-]/g, '');
                return cleaned === "" || isNaN(parseInt(cleaned, 10));
            };

            for (let i = 1; i < parsed.length; i++) {
                const row = parsed[i];
                const rowNum = i + 1; // Row 1 is header, data rows start at 2

                // Skip completely empty lines
                if (row.length === 0 || (row.length === 1 && row[0].trim() === "")) continue;

                const name = row[nameIndex] ? row[nameIndex].trim() : "";
                if (!name) {
                    validationErrors.push(`Row ${rowNum}: Required field "Name" is missing.`);
                    continue;
                }

                const rawBuyPrice = buyPriceIndex !== -1 && row[buyPriceIndex] ? row[buyPriceIndex].trim() : "";
                const rawSellPrice = sellPriceIndex !== -1 && row[sellPriceIndex] ? row[sellPriceIndex].trim() : "";
                const rawMrp = mrpIndex !== -1 && row[mrpIndex] ? row[mrpIndex].trim() : "";
                const rawQty = quantityIndex !== -1 && row[quantityIndex] ? row[quantityIndex].trim() : "";
                
                // Validate fields for warnings/failures
                if (rawBuyPrice && isInvalidNum(rawBuyPrice)) {
                    validationErrors.push(`Row ${rowNum}: Buying Price "${rawBuyPrice}" is not a valid number.`);
                    continue;
                }
                if (rawSellPrice && isInvalidNum(rawSellPrice)) {
                    validationErrors.push(`Row ${rowNum}: Selling Price "${rawSellPrice}" is not a valid number.`);
                    continue;
                }
                if (rawMrp && isInvalidNum(rawMrp)) {
                    validationErrors.push(`Row ${rowNum}: MRP "${rawMrp}" is not a valid number.`);
                    continue;
                }
                if (rawQty && isInvalidInt(rawQty)) {
                    validationErrors.push(`Row ${rowNum}: Quantity "${rawQty}" is not a valid integer.`);
                    continue;
                }

                const id = idIndex !== -1 && row[idIndex] && row[idIndex].trim() ? row[idIndex].trim() : "prod-" + Math.floor(100000 + Math.random() * 900000);
                const category = categoryIndex !== -1 && row[categoryIndex] ? row[categoryIndex].trim() : "General";
                const buy_price = cleanNumber(rawBuyPrice);
                const sell_price = cleanNumber(rawSellPrice);
                const mrp = rawMrp ? cleanNumber(rawMrp) : sell_price;
                const quantity = cleanInteger(rawQty);
                const supplier = supplierIndex !== -1 && row[supplierIndex] ? row[supplierIndex].trim() : "";
                let description = descriptionIndex !== -1 && row[descriptionIndex] ? row[descriptionIndex].trim() : "";
                const image_url = imageUrlIndex !== -1 && row[imageUrlIndex] ? row[imageUrlIndex].trim() : "";



                productsToInsert.push({
                    id,
                    name,
                    category,
                    buy_price,
                    sell_price,
                    mrp,
                    quantity,
                    supplier,
                    description,
                    image_url
                });
            }

            if (productsToInsert.length === 0) {
                if (validationErrors.length > 0) {
                    alert(`Import failed. The following rows had validation errors:\n\n${validationErrors.join("\n")}`);
                } else {
                    showToast("No valid products found in CSV file.", true);
                }
                return;
            }

            // Delete all existing products first to perform a clean overwrite
            const { error: deleteError } = await supabaseClient
                .from("products")
                .delete()
                .neq("id", "");

            if (deleteError) {
                console.error("Failed to delete existing products:", deleteError);
                showToast(`Clean overwrite failed: ${deleteError.message}`, true);
                return;
            }

            // Batch insert to Supabase
            const { data, error } = await supabaseClient
                .from("products")
                .insert(productsToInsert)
                .select();

            if (error) {
                console.error("Supabase import error:", error);
                showToast(`Import failed: ${error.message}`, true);
            } else {
                let msg = `Successfully imported ${data.length} products!`;
                if (validationErrors.length > 0) {
                    msg += ` (${validationErrors.length} failed)`;
                    alert(`Import finished with some warnings:\n\nSuccessfully imported ${data.length} products.\n\nFailed rows:\n${validationErrors.join("\n")}`);
                }
                showToast(msg);
                addActivity("CSV Import", `Batch imported ${data.length} products from CSV`);
                loadData(false); // Quiet reload
            }
        } catch (err) {
            console.error("CSV parse error:", err);
            showToast("Failed to parse CSV file. Check formatting.", true);
        }
    };
    reader.readAsText(file);
};

// ============================================================
// PRODUCT IMAGE UPLOAD HELPERS
// ============================================================

// Called when user picks a file or takes a camera shot
window.previewProductImage = async function(input) {
    const file = input.files[0];
    if (!file) return;

    // Show instant local preview
    const reader = new FileReader();
    reader.onload = e => {
        document.getElementById("img-preview").src = e.target.result;
        document.getElementById("img-preview-wrap").classList.remove("hidden");
    };
    reader.readAsDataURL(file);

    // Upload to Supabase Storage in background
    const statusEl = document.getElementById("img-upload-status");
    statusEl.textContent = "Uploading image to cloud...";
    statusEl.className = "text-[10px] text-amber-400 mt-1.5 font-bold";
    statusEl.classList.remove("hidden");

    pendingImageUploadPromise = (async () => {
        try {
            const url = await uploadProductImageToSupabase(file);
            document.getElementById("product-image-url").value = url;
            statusEl.textContent = "✓ Image uploaded successfully";
            statusEl.className = "text-[10px] text-emerald-400 mt-1.5 font-bold";
            return url;
        } catch (err) {
            console.error("Image upload failed:", err);
            statusEl.textContent = "⚠ Upload failed — " + (err.message || "check network/Supabase");
            statusEl.className = "text-[10px] text-rose-400 mt-1.5 font-bold";
            throw err;
        } finally {
            pendingImageUploadPromise = null;
        }
    })();
};

// Upload a File object to Supabase Storage, return public URL
async function uploadProductImageToSupabase(file) {
    const ext = file.name.split(".").pop() || "jpg";
    const fileName = `product_${Date.now()}_${Math.random().toString(36).slice(2,8)}.${ext}`;

    const { data, error } = await supabaseClient
        .storage
        .from("product-images")
        .upload(fileName, file, { cacheControl: "3600", upsert: false });

    if (error) throw error;

    const { data: urlData } = supabaseClient
        .storage
        .from("product-images")
        .getPublicUrl(fileName);

    return urlData.publicUrl;
}

// Clear image preview + hidden URL field
window.clearProductImage = function(silent = false) {
    document.getElementById("product-image-url").value = "";
    document.getElementById("img-preview").src = "";
    document.getElementById("img-preview-wrap").classList.add("hidden");
    const statusEl = document.getElementById("img-upload-status");
    if (!silent) {
        statusEl.textContent = "Image removed";
        statusEl.className = "text-[10px] text-slate-400 mt-1.5";
        statusEl.classList.remove("hidden");
    } else {
        statusEl.classList.add("hidden");
    }
    // Reset both file inputs
    const fi = document.getElementById("product-image-file");
    const ci = document.getElementById("product-image-camera");
    if (fi) fi.value = "";
    if (ci) ci.value = "";
};

// ============================================================
// STORE BRANCHES & BULK PRODUCT ASSIGNMENT CONTROLLERS
// ============================================================

function initBranches() {
    const saved = localStorage.getItem("store_branches");
    if (saved) {
        try { branches = JSON.parse(saved); } catch(e) { branches = []; }
    }
    if (!branches || !Array.isArray(branches) || branches.length === 0) {
        branches = ["Ashok Nagar (Kurnool)", "Main Bazar (Visakhapatnam)"];
        localStorage.setItem("store_branches", JSON.stringify(branches));
    }
}

function populateBranchSelectors() {
    initBranches();
    const productBranchSelect = document.getElementById("product-branch");
    const branchFilterSelect = document.getElementById("branch-filter");
    const bulkTargetBranchSelect = document.getElementById("bulk-target-branch");

    const branchOptionsHtml = branches.map(b => `<option value="${b}">${b}</option>`).join('');

    if (productBranchSelect) {
        const cur = productBranchSelect.value;
        productBranchSelect.innerHTML = branchOptionsHtml;
        if (cur && branches.includes(cur)) productBranchSelect.value = cur;
    }
    if (bulkTargetBranchSelect) {
        const cur = bulkTargetBranchSelect.value;
        bulkTargetBranchSelect.innerHTML = branchOptionsHtml;
        if (cur && branches.includes(cur)) bulkTargetBranchSelect.value = cur;
    }
    if (branchFilterSelect) {
        const currentVal = branchFilterSelect.value;
        branchFilterSelect.innerHTML = `<option value="all">All Branches (${branches.length})</option>` + branchOptionsHtml;
        if (currentVal) branchFilterSelect.value = currentVal;
    }
}

function renderBranchesView() {
    const container = document.getElementById("branches-cards-container");
    const tbody = document.getElementById("branch-products-tbody");
    const summaryCountEl = document.getElementById("branch-products-summary-count");

    if (!container || !tbody) return;

    initBranches();
    container.innerHTML = "";
    tbody.innerHTML = "";

    branches.forEach(b => {
        const branchProds = products.filter(p => (p.branch || "Ashok Nagar (Kurnool)") === b);
        const totalStock = branchProds.reduce((sum, p) => sum + (parseInt(p.quantity) || 0), 0);

        const card = document.createElement("div");
        card.className = "glass-card rounded-2xl p-5 border border-slate-800 flex flex-col justify-between gap-4";
        card.innerHTML = `
            <div class="flex items-start justify-between">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold">
                        <i data-lucide="map-pin" class="w-5 h-5"></i>
                    </div>
                    <div>
                        <h3 class="text-sm font-extrabold text-white leading-tight">${b}</h3>
                        <span class="text-[10px] text-slate-400 font-semibold block mt-0.5">${branchProds.length} Products Assigned</span>
                    </div>
                </div>
                ${branches.length > 1 ? `
                <button onclick="handleDeleteBranch('${b.replace(/'/g, "\\'")}')" title="Delete Branch" class="w-7 h-7 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white transition-all flex items-center justify-center border border-rose-500/10">
                    <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                </button>
                ` : ''}
            </div>

            <div class="grid grid-cols-2 gap-3 bg-dark-800/60 p-3 rounded-xl border border-slate-800/50 text-xs">
                <div>
                    <span class="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Assigned Items</span>
                    <span class="text-sm font-black text-white">${branchProds.length}</span>
                </div>
                <div>
                    <span class="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Total Stock Units</span>
                    <span class="text-sm font-black text-emerald-400">${totalStock}</span>
                </div>
            </div>

            <div class="flex items-center justify-between pt-1">
                <button onclick="openBulkBranchModal('${b.replace(/'/g, "\\'")}')" class="w-full bg-brand-500/15 hover:bg-brand-500 text-brand-400 hover:text-white font-bold text-xs py-2 px-3 rounded-xl transition-all border border-brand-500/20 flex items-center justify-center gap-1.5">
                    <i data-lucide="layers" class="w-3.5 h-3.5"></i> Bulk Assign Products to Branch
                </button>
            </div>
        `;
        container.appendChild(card);
    });

    if (summaryCountEl) {
        summaryCountEl.textContent = `${products.length} Products Across ${branches.length} Branches`;
    }

    if (products.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="p-6 text-center text-slate-500 font-medium">No products available.</td>
            </tr>
        `;
        return;
    }

    products.forEach(p => {
        const tr = document.createElement("tr");
        tr.className = "hover:bg-slate-800/10 transition-colors";
        const branchName = p.branch || "Ashok Nagar (Kurnool)";
        
        tr.innerHTML = `
            <td class="p-3 font-bold text-slate-200">${p.name}</td>
            <td class="p-3 text-slate-400"><span class="px-2 py-0.5 text-[10px] font-bold bg-dark-600 rounded text-slate-400 border border-slate-700">${p.category}</span></td>
            <td class="p-3 font-semibold text-indigo-400"><i data-lucide="map-pin" class="w-3 h-3 inline mr-1"></i>${branchName}</td>
            <td class="p-3 text-right font-semibold text-slate-300">₹${parseFloat(p.sell_price).toFixed(2)}</td>
            <td class="p-3 text-right font-bold text-white">${p.quantity} Units</td>
        `;
        tbody.appendChild(tr);
    });

    lucide.createIcons();
}

window.openAddBranchModal = function() {
    document.getElementById("new-branch-name").value = "";
    document.getElementById("add-branch-modal").classList.remove("hidden");
};

window.closeAddBranchModal = function() {
    document.getElementById("add-branch-modal").classList.add("hidden");
};

window.handleAddBranchSubmit = function(e) {
    e.preventDefault();
    const newBranch = document.getElementById("new-branch-name").value.trim();
    if (!newBranch) return;

    initBranches();
    if (branches.includes(newBranch)) {
        showToast("Branch already exists!", true);
        return;
    }

    branches.push(newBranch);
    localStorage.setItem("store_branches", JSON.stringify(branches));
    showToast(`Added new branch: ${newBranch}`);
    addActivity("Branch", `Created new branch: ${newBranch}`);

    populateBranchSelectors();
    renderBranchesView();
    renderInventory();
    closeAddBranchModal();
};

window.handleDeleteBranch = function(branchName) {
    if (branches.length <= 1) {
        alert("You must keep at least one store branch.");
        return;
    }

    if (!confirm(`Are you sure you want to remove branch "${branchName}"? Products in this branch will be moved to default branch.`)) return;

    const defaultBranch = branches.find(b => b !== branchName) || "Ashok Nagar (Kurnool)";
    branches = branches.filter(b => b !== branchName);
    localStorage.setItem("store_branches", JSON.stringify(branches));

    // Reassign local products in deleted branch
    products.forEach(p => {
        if (p.branch === branchName) p.branch = defaultBranch;
    });

    showToast(`Removed branch "${branchName}"`);
    addActivity("Branch", `Removed branch ${branchName}`);
    populateBranchSelectors();
    renderBranchesView();
    renderInventory();
};

// --- BULK PRODUCT BRANCH ASSIGNMENT MODAL ---
window.openBulkBranchModal = function(targetBranch = null) {
    const modal = document.getElementById("bulk-branch-modal");
    populateBranchSelectors();

    if (targetBranch) {
        document.getElementById("bulk-target-branch").value = targetBranch;
    }

    document.getElementById("bulk-product-search").value = "";
    renderBulkProductList();
    modal.classList.remove("hidden");
    lucide.createIcons();
};

window.closeBulkBranchModal = function() {
    document.getElementById("bulk-branch-modal").classList.add("hidden");
};

window.renderBulkProductList = function() {
    const container = document.getElementById("bulk-products-list");
    if (!container) return;

    const query = (document.getElementById("bulk-product-search").value || "").toLowerCase();
    const filtered = products.filter(p => p.name.toLowerCase().includes(query) || p.category.toLowerCase().includes(query));

    if (filtered.length === 0) {
        container.innerHTML = `<div class="p-6 text-center text-slate-500 font-medium text-xs">No products found matching criteria.</div>`;
        updateBulkSelectedCount();
        return;
    }

    container.innerHTML = filtered.map(p => {
        const imageThumb = p.image_url 
            ? `<img src="${p.image_url}" class="w-8 h-8 object-cover rounded-lg border border-slate-700 shrink-0">`
            : `<div class="w-8 h-8 rounded-lg bg-dark-700 border border-slate-700 flex items-center justify-center text-slate-500 shrink-0"><i data-lucide="package" class="w-4 h-4"></i></div>`;

        const curBranch = p.branch || "Ashok Nagar (Kurnool)";

        return `
            <label class="flex items-center justify-between p-3 hover:bg-slate-800/40 transition-colors cursor-pointer select-none">
                <div class="flex items-center gap-3">
                    <input type="checkbox" class="bulk-prod-checkbox w-4 h-4 rounded border-slate-700 text-brand-500 focus:ring-brand-500 bg-dark-800" value="${p.id}" onchange="updateBulkSelectedCount()">
                    ${imageThumb}
                    <div>
                        <div class="font-bold text-slate-200 text-xs">${p.name}</div>
                        <div class="text-[10px] text-slate-400 font-semibold">${p.category} &bull; <span class="text-indigo-400">${curBranch}</span></div>
                    </div>
                </div>
                <div class="text-right">
                    <div class="font-bold text-slate-200 text-xs">₹${parseFloat(p.sell_price).toFixed(2)}</div>
                    <div class="text-[10px] text-slate-500 font-bold">${p.quantity} in stock</div>
                </div>
            </label>
        `;
    }).join('');

    updateBulkSelectedCount();
    lucide.createIcons();
};

window.toggleSelectAllBulkProducts = function(shouldSelect) {
    document.querySelectorAll(".bulk-prod-checkbox").forEach(cb => {
        cb.checked = shouldSelect;
    });
    updateBulkSelectedCount();
};

window.updateBulkSelectedCount = function() {
    const checked = document.querySelectorAll(".bulk-prod-checkbox:checked");
    const badge = document.getElementById("bulk-selected-count-badge");
    if (badge) {
        badge.textContent = `${checked.length} Products Selected`;
    }
};

window.handleBulkBranchAssignSubmit = async function() {
    const checkedEls = document.querySelectorAll(".bulk-prod-checkbox:checked");
    const selectedIds = Array.from(checkedEls).map(cb => cb.value);
    const targetBranch = document.getElementById("bulk-target-branch").value;

    if (selectedIds.length === 0) {
        alert("Please select at least one product using the checkboxes.");
        return;
    }

    try {
        // 1. Batch update in Supabase database
        const { error } = await supabaseClient
            .from('products')
            .update({ branch: targetBranch })
            .in('id', selectedIds);

        if (error) {
            console.warn("Supabase batch branch update error:", error);
        }

        // 2. Update local state
        products.forEach(p => {
            if (selectedIds.includes(p.id)) {
                p.branch = targetBranch;
            }
        });

        showToast(`Assigned ${selectedIds.length} products to ${targetBranch}`);
        addActivity("Branch", `Assigned ${selectedIds.length} products to ${targetBranch}`);
        
        renderInventory();
        renderBranchesView();
        closeBulkBranchModal();
    } catch (err) {
        console.error(err);
        showToast("Bulk branch assignment failed", true);
    }
};

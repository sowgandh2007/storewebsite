// Catalog, Cart and UI Interaction Script
document.addEventListener("DOMContentLoaded", async () => {
    let products = [];
    let cart = {}; // maps productId -> quantity
    let activeCategory = "All";
    let searchQuery = "";
    let revealObserver = null;

    // --- DOM REFERENCES ---
    const heroTitle = document.getElementById("hero-title");
    const heroDesc = document.getElementById("hero-desc");
    const footerPhone = document.getElementById("footer-phone");
    const headerPhoneText = document.getElementById("header-phone-text");
    const topPhoneLink = document.getElementById("top-phone");

    const loadingState = document.getElementById("loading-state");
    const productsGrid = document.getElementById("products-grid");
    const emptyState = document.getElementById("empty-state");

    const searchInput = document.getElementById("search-input");
    const categoriesContainer = document.getElementById("categories-container");
    const categoryMenuBtn = document.getElementById("category-menu-btn");
    const activeCategoryLabel = document.getElementById("active-category-label");
    const categoryDropdown = document.getElementById("category-dropdown");

    const cartDrawerContainer = document.getElementById("cart-drawer-container");
    const cartItemsContainer = document.getElementById("cart-items-container");
    const cartBadgeCount = document.getElementById("cart-badge-count");
    const cartTotalQty = document.getElementById("cart-total-qty");
    const cartTotalMrp = document.getElementById("cart-total-mrp");
    const cartTotalWholesale = document.getElementById("cart-total-wholesale");
    const cartTotalSavings = document.getElementById("cart-total-savings");
    const cartCheckoutForm = document.getElementById("cart-checkout-form");

    // --- SETUP STORE FRONT DETAILS ---
    function setupStoreDetails() {
        const settings = window.db.getSettings();
        document.title = `${settings.storeName} | Premium Wholesale Mart`;
        if (heroTitle) heroTitle.textContent = settings.storeName;
        if (heroDesc) heroDesc.textContent = settings.storeDesc;
        if (footerPhone) footerPhone.textContent = settings.storePhone;
        if (headerPhoneText) headerPhoneText.textContent = settings.storePhone;
        if (topPhoneLink) topPhoneLink.href = `tel:${settings.storePhone}`;
    }

    // --- RENDER PRODUCTS CATALOG ---
    async function loadCatalog() {
        if (loadingState) loadingState.classList.remove("hidden");
        if (productsGrid) productsGrid.classList.add("hidden");
        if (emptyState) emptyState.classList.add("hidden");

        // Load data from database layer
        products = await window.db.getProducts();

        if (loadingState) loadingState.classList.add("hidden");
        if (productsGrid) productsGrid.classList.remove("hidden");

        renderCategories();
        renderProducts();
        updateCartDisplay();
    }

    function renderCategories() {
        if (!categoriesContainer) return;
        
        const categories = ["All", ...new Set(products.map(p => p.category))];
        
        // 1. Render Desktop Category Buttons
        categoriesContainer.innerHTML = categories.map(cat => `
            <button class="cat-btn px-4 py-2 text-xs font-extrabold uppercase tracking-wider rounded-xl transition-all border border-slate-800 ${cat === activeCategory ? 'bg-brand-600 text-white border-brand-500' : 'bg-dark-950 text-slate-400 hover:text-white'}" data-category="${cat}">
                ${cat}
            </button>
        `).join("");

        // Add listeners to buttons
        categoriesContainer.querySelectorAll(".cat-btn").forEach(btn => {
            btn.addEventListener("click", () => {
                activeCategory = btn.getAttribute("data-category");
                if (activeCategoryLabel) activeCategoryLabel.textContent = activeCategory === "All" ? "All Products" : activeCategory;
                renderCategories();
                renderProducts();
            });
        });

        // 2. Render Mobile Category Dropdown List
        if (categoryDropdown) {
            categoryDropdown.innerHTML = categories.map(cat => `
                <button class="dropdown-cat-btn w-full text-left py-3 px-4 text-xs font-bold text-slate-300 border-b border-slate-850 hover:bg-dark-950 transition-colors last:border-b-0 ${cat === activeCategory ? 'text-brand-400 font-extrabold' : ''}" data-category="${cat}">
                    ${cat}
                </button>
            `).join("");

            categoryDropdown.querySelectorAll(".dropdown-cat-btn").forEach(btn => {
                btn.addEventListener("click", () => {
                    activeCategory = btn.getAttribute("data-category");
                    if (activeCategoryLabel) activeCategoryLabel.textContent = activeCategory === "All" ? "All Products" : activeCategory;
                    categoryDropdown.classList.add("hidden");
                    renderCategories();
                    renderProducts();
                });
            });
        }
    }

    function renderProducts() {
        if (!productsGrid) return;

        // Apply Search and Category Filters
        const filtered = products.filter(p => {
            const matchesCat = activeCategory === "All" || p.category === activeCategory;
            const matchesSearch = !searchQuery || 
                p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));
            return matchesCat && matchesSearch;
        });

        // Toggle Empty State layout
        if (filtered.length === 0) {
            productsGrid.classList.add("hidden");
            if (emptyState) emptyState.classList.remove("hidden");
            return;
        }
        
        productsGrid.classList.remove("hidden");
        if (emptyState) emptyState.classList.add("hidden");

        const currency = "₹";
        productsGrid.innerHTML = "";

        filtered.forEach(p => {
            const card = document.createElement("div");
            card.className = "star-border-container hover-lift card-hidden card-reveal-transition group";
            
            const hasMrp = p.market_price && p.market_price > p.selling_price;
            const savingsPercent = hasMrp ? Math.round(((p.market_price - p.selling_price) / p.market_price) * 100) : 0;
            const badgeHTML = (hasMrp && savingsPercent > 0)
                ? `<span class="bg-rose-500 text-white text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-md shadow-sm">Save ${savingsPercent}%</span>`
                : "";

            const stockBadge = p.available 
                ? `<span class="inline-flex items-center gap-1.5 text-[10px] font-bold text-emerald-400 bg-brand-500/10 px-2 py-1 rounded-md border border-brand-500/20">
                     <span class="w-1.5 h-1.5 rounded-full bg-brand-500"></span> Available
                   </span>`
                : `<span class="inline-flex items-center gap-1.5 text-[10px] font-bold text-rose-450 bg-rose-500/10 px-2 py-1 rounded-md border border-rose-500/25">
                     <span class="w-1.5 h-1.5 rounded-full bg-rose-500"></span> Out of Stock
                   </span>`;

            const qtyInCart = cart[p.id] || 0;
            let actionButtonHTML = "";

            if (p.available) {
                if (qtyInCart > 0) {
                    actionButtonHTML = `
                        <div class="flex items-center justify-between bg-dark-950 border border-slate-850 rounded-xl p-1" onclick="event.stopPropagation()">
                            <button class="qty-adjuster-btn btn-minus" data-id="${p.id}">
                                <i data-lucide="minus" class="w-3.5 h-3.5"></i>
                            </button>
                            <span class="text-xs font-black text-slate-100 px-2 select-none">${qtyInCart} in Cart</span>
                            <button class="qty-adjuster-btn btn-plus" data-id="${p.id}">
                                <i data-lucide="plus" class="w-3.5 h-3.5"></i>
                            </button>
                        </div>
                    `;
                } else {
                    actionButtonHTML = `
                        <button class="btn-add w-full bg-brand-600 hover:bg-brand-700 active:bg-brand-850 text-white font-bold text-xs py-2.5 px-4 rounded-xl transition-all duration-100 shadow-md flex items-center justify-center gap-1.5 will-change-transform" data-id="${p.id}">
                            <i data-lucide="shopping-cart" class="w-4 h-4"></i> Add to Cart
                        </button>
                    `;
                }
            } else {
                actionButtonHTML = `
                    <button disabled class="w-full bg-dark-850 text-slate-500 font-bold text-xs py-2.5 px-4 rounded-xl cursor-not-allowed flex items-center justify-center gap-1.5 border border-slate-850/60">
                        <i data-lucide="slash" class="w-4 h-4"></i> Out of Stock
                    </button>
                `;
            }

            card.innerHTML = `
                <div class="border-gradient-bottom" style="background: radial-gradient(circle, #10b981, transparent 10%);"></div>
                <div class="border-gradient-top" style="background: radial-gradient(circle, #10b981, transparent 10%);"></div>
                <div class="inner-content p-5">
                    <div>
                        <div class="flex items-center justify-between gap-2 mb-2.5">
                            <span class="text-[10px] font-bold text-slate-500 uppercase tracking-widest">${p.category}</span>
                            ${stockBadge}
                        </div>
                        <div class="flex items-center gap-2 mb-2">
                            <h3 class="font-bold text-slate-100 text-base group-hover:text-brand-500 transition-colors leading-snug">${p.name}</h3>
                            ${badgeHTML}
                        </div>
                        <p class="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-4">${p.description}</p>
                    </div>
                    
                    <div class="mt-auto">
                        <div class="flex items-baseline gap-2 mb-4 bg-dark-950 rounded-xl p-2.5 border border-slate-850">
                            <div>
                                <span class="block text-[9px] text-slate-550 font-extrabold uppercase leading-none">Our Price</span>
                                <span class="text-xl font-black text-white price-value" data-price="${p.selling_price}">${currency}${p.selling_price.toLocaleString()}</span>
                            </div>
                            ${hasMrp ? `
                            <div class="border-l border-slate-800 pl-2.5 ml-1">
                                <span class="block text-[9px] text-slate-550 font-extrabold uppercase leading-none">MRP</span>
                                <span class="text-xs text-slate-500 line-through font-semibold mrp-value" data-mrp="${p.market_price}">${currency}${p.market_price.toLocaleString()}</span>
                            </div>
                            ` : ""}
                        </div>
                        ${actionButtonHTML}
                    </div>
                </div>
            `;
            productsGrid.appendChild(card);
        });

        lucide.createIcons();
        attachCardButtonListeners();
        setupRevealObserver();
    }

    function attachCardButtonListeners() {
        if (!productsGrid) return;
        productsGrid.querySelectorAll(".btn-add").forEach(btn => {
            btn.addEventListener("click", (e) => {
                const id = btn.getAttribute("data-id");
                addToCart(e, id);
            });
        });
        productsGrid.querySelectorAll(".btn-minus").forEach(btn => {
            btn.addEventListener("click", () => {
                const id = btn.getAttribute("data-id");
                changeCartQty(id, -1);
            });
        });
        productsGrid.querySelectorAll(".btn-plus").forEach(btn => {
            btn.addEventListener("click", () => {
                const id = btn.getAttribute("data-id");
                changeCartQty(id, 1);
            });
        });
    }

    // --- CART LOGIC ---
    function addToCart(e, id) {
        // Trigger simple scale bounce effect
        const target = e.currentTarget;
        target.classList.add("scale-[0.93]");
        setTimeout(() => target.classList.remove("scale-[0.93]"), 80);

        cart[id] = 1;
        updateCartDisplay();
        renderProducts();
    }

    function changeCartQty(id, delta) {
        const cur = cart[id] || 0;
        const next = cur + delta;
        if (next <= 0) {
            delete cart[id];
        } else {
            cart[id] = next;
        }
        updateCartDisplay();
        renderProducts();
    }

    function updateCartDisplay() {
        if (!cartItemsContainer) return;
        
        const items = Object.entries(cart).map(([id, qty]) => {
            const p = products.find(prod => prod.id === id);
            return { product: p, qty };
        }).filter(item => item.product !== undefined);

        const totalQty = items.reduce((acc, curr) => acc + curr.qty, 0);
        
        if (cartBadgeCount) cartBadgeCount.textContent = totalQty;
        if (cartTotalQty) cartTotalQty.textContent = totalQty;

        if (totalQty === 0) {
            cartItemsContainer.innerHTML = `
                <div class="py-16 text-center text-slate-500">
                    <i data-lucide="shopping-bag" class="w-10 h-10 mx-auto mb-3 opacity-30"></i>
                    <p class="text-xs font-semibold uppercase tracking-wider">Your cart is empty</p>
                </div>
            `;
            if (cartTotalWholesale) cartTotalWholesale.textContent = "₹0";
            if (cartTotalMrp) cartTotalMrp.textContent = "₹0";
            if (cartTotalSavings) cartTotalSavings.textContent = "₹0";
            lucide.createIcons();
            return;
        }

        let totalWholesale = 0;
        let totalMrpVal = 0;

        cartItemsContainer.innerHTML = items.map(item => {
            const p = item.product;
            const subtotal = p.selling_price * item.qty;
            const mrpVal = p.market_price || p.selling_price;
            
            totalWholesale += subtotal;
            totalMrpVal += mrpVal * item.qty;

            return `
                <div class="flex items-center gap-3 p-3 bg-dark-950 border border-slate-850 rounded-2xl">
                    <div class="flex-grow">
                        <h4 class="text-xs font-bold text-slate-100 line-clamp-1">${p.name}</h4>
                        <span class="text-[10px] text-slate-500 font-extrabold uppercase mt-1 block">${p.category}</span>
                        <div class="flex items-baseline gap-1.5 mt-1">
                            <span class="text-xs font-extrabold text-white">₹${p.selling_price.toLocaleString()}</span>
                            ${p.market_price ? `<span class="text-[10px] text-slate-500 line-through">₹${p.market_price.toLocaleString()}</span>` : ""}
                        </div>
                    </div>
                    <div class="flex items-center gap-2">
                        <button class="drawer-qty-btn bg-dark-900 w-7 h-7 rounded-lg flex items-center justify-center border border-slate-800 text-slate-400 hover:text-white" onclick="window.adjustDrawerQty('${p.id}', -1)">
                            <i data-lucide="minus" class="w-3 h-3"></i>
                        </button>
                        <span class="text-xs font-bold text-white min-w-4 text-center select-none">${item.qty}</span>
                        <button class="drawer-qty-btn bg-dark-900 w-7 h-7 rounded-lg flex items-center justify-center border border-slate-800 text-slate-400 hover:text-white" onclick="window.adjustDrawerQty('${p.id}', 1)">
                            <i data-lucide="plus" class="w-3 h-3"></i>
                        </button>
                    </div>
                </div>
            `;
        }).join("");

        const savings = totalMrpVal - totalWholesale;

        if (cartTotalWholesale) cartTotalWholesale.textContent = `₹${totalWholesale.toLocaleString()}`;
        if (cartTotalMrp) cartTotalMrp.textContent = `₹${totalMrpVal.toLocaleString()}`;
        if (cartTotalSavings) cartTotalSavings.textContent = `₹${savings.toLocaleString()}`;
        
        lucide.createIcons();
    }

    // Expose adjustment helper globally for the drawer buttons
    window.adjustDrawerQty = (id, delta) => {
        changeCartQty(id, delta);
    };

    // --- INTERSECTION OBSERVER FOR STAGGER REVEALS ---
    function setupRevealObserver() {
        if (revealObserver) {
            revealObserver.disconnect();
        }

        const isReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        revealObserver = new IntersectionObserver((entries) => {
            const intersecting = entries.filter(e => e.isIntersecting);
            if (intersecting.length === 0) return;

            intersecting.forEach(entry => {
                const card = entry.target;
                revealObserver.unobserve(card);

                const parent = card.parentNode;
                if (!parent) {
                    card.classList.remove("card-hidden");
                    return;
                }
                const cardsArray = Array.from(parent.children);
                const index = cardsArray.indexOf(card);

                let delay = 0;
                if (!isReduced) {
                    delay = index < 8 ? index * 80 : 800;
                }

                if (isReduced) {
                    card.classList.remove("card-hidden");
                } else {
                    setTimeout(() => {
                        card.classList.remove("card-hidden");
                    }, delay);
                }
            });
        }, {
            threshold: 0.05,
            rootMargin: "0px 0px -20px 0px"
        });

        const hiddenCards = productsGrid.querySelectorAll(".card-hidden");
        hiddenCards.forEach(card => revealObserver.observe(card));
    }

    // --- EVENT LISTENERS ---
    if (searchInput) {
        searchInput.addEventListener("input", (e) => {
            searchQuery = e.target.value;
            renderProducts();
        });
    }

    if (categoryMenuBtn && categoryDropdown) {
        categoryMenuBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            categoryDropdown.classList.toggle("hidden");
        });
        window.addEventListener("click", () => {
            categoryDropdown.classList.add("hidden");
        });
    }

    // Open/Close Cart Drawer
    window.toggleCartDrawer = () => {
        if (cartDrawerContainer) {
            const isOpen = cartDrawerContainer.classList.contains("open");
            if (isOpen) {
                cartDrawerContainer.classList.remove("open");
                document.body.classList.remove("cart-open");
            } else {
                cartDrawerContainer.classList.add("open");
                document.body.classList.add("cart-open");
            }
        }
    };

    // --- WHATSAPP SUBMISSION ---
    if (cartCheckoutForm) {
        cartCheckoutForm.addEventListener("submit", (e) => {
            e.preventDefault();
            
            const customerName = document.getElementById("checkout-name")?.value.trim() || "";
            const customerAddress = document.getElementById("checkout-address")?.value.trim() || "";
            
            if (Object.keys(cart).length === 0) return;

            const itemsText = Object.entries(cart).map(([id, qty]) => {
                const p = products.find(prod => prod.id === id);
                return `• *${p.name}* x ${qty} (₹${(p.selling_price * qty).toLocaleString()})`;
            }).join("%0A");

            const totalSum = Object.entries(cart).reduce((acc, [id, qty]) => {
                const p = products.find(prod => prod.id === id);
                return acc + (p.selling_price * qty);
            }, 0);

            const storeDetails = window.db.getSettings();
            
            const whatsappText = `*NEW BOOKING ORDER* - ${storeDetails.storeName}%0A` +
                                 `Name: ${customerName}%0A` +
                                 `Address: ${customerAddress}%0A%0A` +
                                 `*Selected Products:*%0A${itemsText}%0A%0A` +
                                 `*Total Wholesale Subtotal:* ₹${totalSum.toLocaleString()}%0A%0A` +
                                 `Please confirm stock booking reservation and availability timings. Thanks!`;

            const phone = storeDetails.storePhone.replace(/\D/g, "");
            window.open(`https://api.whatsapp.com/send?phone=91${phone}&text=${whatsappText}`, "_blank");
        });
    }

    // Start App
    setupStoreDetails();
    await loadCatalog();
});

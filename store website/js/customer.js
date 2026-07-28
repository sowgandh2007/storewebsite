// customer.js - Storefront Catalog & Shopping Cart Controller (Interactive Animation Version)

document.addEventListener("DOMContentLoaded", () => {
    // App State
    let products = [];
    let searchQuery = "";
    let activeCategory = "all";
    let cart = {}; // Cart schema: { productId: quantity }
    let revealObserver = null;

    // Load cart from LocalStorage cache
    if (localStorage.getItem("store_cart")) {
        try {
            cart = JSON.parse(localStorage.getItem("store_cart"));
        } catch (e) {
            cart = {};
        }
    }
    
    // DOM Elements
    const productsGrid = document.getElementById("products-grid");
    const searchInput = document.getElementById("search-input");
    const categoriesContainer = document.getElementById("categories-container");
    const categoryMenuBtn = document.getElementById("category-menu-btn");
    const categoryDropdown = document.getElementById("category-dropdown");
    const activeCategoryLabel = document.getElementById("active-category-label");
    const loadingState = document.getElementById("loading-state");
    const emptyState = document.getElementById("empty-state");
    
    // Store Info Elements
    const heroTitle = document.getElementById("hero-title");
    const heroDesc = document.getElementById("hero-desc");
    const footerPhone = document.getElementById("footer-phone");
    const headerPhoneText = document.getElementById("header-phone-text");
    const topPhoneLink = document.getElementById("top-phone");

    // Shopping Cart Drawer Elements
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

        // Load asynchronously from Supabase
        products = await window.db.getProducts();

        if (loadingState) loadingState.classList.add("hidden");
        if (productsGrid) productsGrid.classList.remove("hidden");

        renderCategories();
        renderProducts();
        updateCartDisplay();
    }

    function renderCategories() {
        if (!categoriesContainer) return;
        
        // Extract unique categories
        const categories = ["all"];
        products.forEach(p => {
            if (p.category && !categories.includes(p.category)) {
                categories.push(p.category);
            }
        });

        // Rebuild desktop tag links (Active pill gets solid #10b981 background with dark text)
        categoriesContainer.innerHTML = "";
        categories.forEach(cat => {
            const btn = document.createElement("button");
            btn.className = `px-4 py-2 text-xs font-bold rounded-xl transition-all ${
                activeCategory === cat 
                ? "bg-brand-500 text-slate-950 border border-brand-500 shadow-md shadow-brand-500/20" 
                : "bg-transparent text-slate-400 hover:text-white border border-slate-800"
            }`;
            btn.textContent = cat === "all" ? "All Products" : cat;
            btn.addEventListener("click", () => {
                selectCategory(cat);
            });
            categoriesContainer.appendChild(btn);
        });

        // Rebuild mobile dropdown options
        if (categoryDropdown) {
            categoryDropdown.innerHTML = "";
            categories.forEach(cat => {
                const btn = document.createElement("button");
                btn.className = `w-full text-left px-4 py-2.5 text-xs font-semibold hover:bg-dark-800 transition-colors ${
                    activeCategory === cat ? "text-brand-500 font-bold bg-dark-800" : "text-slate-450 bg-transparent"
                }`;
                btn.textContent = cat === "all" ? "All Products" : cat;
                btn.addEventListener("click", () => {
                    selectCategory(cat);
                    if (categoryDropdown) categoryDropdown.classList.add("hidden");
                });
                categoryDropdown.appendChild(btn);
            });
        }
    }

    function selectCategory(cat) {
        activeCategory = cat;
        if (activeCategoryLabel) {
            activeCategoryLabel.textContent = cat === "all" ? "All Products" : cat;
        }
        renderCategories();

        const isReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (isReduced) {
            renderProducts();
            return;
        }

        // Smooth category fade transition before swap
        const cards = productsGrid.querySelectorAll(".group");
        if (cards.length > 0) {
            cards.forEach(card => card.classList.add("catalog-fade-out"));
            setTimeout(() => {
                renderProducts();
            }, 160);
        } else {
            renderProducts();
        }
    }

    function renderProducts() {
        if (!productsGrid) return;
        
        const settings = window.db.getSettings();
        const currency = settings.currencySymbol;

        // Apply filters
        const filtered = products.filter(p => {
            const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                 p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                 (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));
            const matchesCategory = activeCategory === "all" || p.category === activeCategory;
            return matchesSearch && matchesCategory;
        });

        productsGrid.innerHTML = "";

        if (filtered.length === 0) {
            if (emptyState) emptyState.classList.remove("hidden");
            return;
        }
        if (emptyState) emptyState.classList.add("hidden");

        filtered.forEach(p => {
            const card = document.createElement("div");
            
            // Set animation classes (initially hidden, transitions on entry)
            card.className = "bg-dark-900 rounded-2xl overflow-hidden border border-slate-850 shadow-md hover-lift card-hidden card-reveal-transition flex flex-col group";
            
            // Spelling correction for name
            const correctedName = p.name ? p.name.replace(/\bcattle\b/gi, 'kettle') : 'Unnamed Item';
            
            // Clean description (hide Source app details)
            const cleanDescription = p.description ? p.description.replace(/(\s*\|\s*)?Source:\s*.*$/i, '') : '';

            // Savings calculation
            const hasMrp = p.market_price && p.market_price > p.selling_price;
            const savings = hasMrp ? p.market_price - p.selling_price : 0;
            const savingsPercent = hasMrp ? Math.round((savings / p.market_price) * 100) : 0;
            const badgeHTML = (hasMrp && savings > 0)
                ? `<span class="bg-rose-500 text-white text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-md shadow-sm">Save ${savingsPercent}%</span>`
                : "";

            // Stock level availability indicator
            const stockBadge = p.available 
                ? `<span class="inline-flex items-center gap-1.5 text-[10px] font-bold text-emerald-400 bg-brand-500/10 px-2 py-1 rounded-md border border-brand-500/20">
                     <span class="w-1.5 h-1.5 rounded-full bg-brand-500"></span> Available
                   </span>`
                : `<span class="inline-flex items-center gap-1.5 text-[10px] font-bold text-rose-450 bg-rose-500/10 px-2 py-1 rounded-md border border-rose-500/25">
                     <span class="w-1.5 h-1.5 rounded-full bg-rose-500"></span> Out of Stock
                   </span>`;

            // Cart Quantity controls
            const qtyInCart = cart[p.id] || 0;
            let actionButtonHTML = "";

            if (p.available) {
                if (qtyInCart > 0) {
                    actionButtonHTML = `
                        <div class="flex items-center justify-between bg-dark-950 border border-slate-850 rounded-xl p-1" onclick="event.stopPropagation()">
                            <button onclick="changeCartQty('${p.id}', -1)" class="qty-adjuster-btn">
                                <i data-lucide="minus" class="w-3.5 h-3.5"></i>
                            </button>
                            <span class="text-xs font-black text-slate-100 px-2 select-none">${qtyInCart} in Cart</span>
                            <button onclick="changeCartQty('${p.id}', 1)" class="qty-adjuster-btn">
                                <i data-lucide="plus" class="w-3.5 h-3.5"></i>
                            </button>
                        </div>
                    `;
                } else {
                    actionButtonHTML = `
                        <button onclick="addToCartWithBounce(event, '${p.id}')" class="w-full bg-brand-600 hover:bg-brand-700 active:bg-brand-850 text-white font-bold text-xs py-2.5 px-4 rounded-xl transition-all duration-100 shadow-md flex items-center justify-center gap-1.5 will-change-transform">
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
                <div class="p-5 flex-grow flex flex-col justify-between">
                    <div>
                        <div class="flex items-center justify-between gap-2 mb-2.5">
                            <span class="text-[10px] font-bold text-slate-500 uppercase tracking-widest">${p.category}</span>
                            ${stockBadge}
                        </div>
                        <div class="flex items-center gap-2 mb-2">
                            <h3 class="font-bold text-slate-100 text-base group-hover:text-brand-500 transition-colors leading-snug">${correctedName}</h3>
                            ${badgeHTML}
                        </div>
                        <p class="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-4">${cleanDescription}</p>
                    </div>
                    
                    <div>
                        <div class="flex items-baseline gap-2 mb-4 bg-dark-950 rounded-xl p-2.5 border border-slate-850">
                            <div>
                                <span class="block text-[9px] text-slate-550 font-extrabold uppercase leading-none">Our Price</span>
                                <span class="text-xl font-black text-white price-value" data-price="${p.selling_price}">${currency}0</span>
                            </div>
                            ${hasMrp ? `
                            <div class="border-l border-slate-800 pl-2.5 ml-1">
                                <span class="block text-[9px] text-slate-550 font-extrabold uppercase leading-none">MRP</span>
                                <span class="text-xs text-slate-500 line-through font-semibold mrp-value" data-mrp="${p.market_price}">${currency}0</span>
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
        setupRevealObserver();
    }

    // --- INTERSECTION OBSERVER FOR STAGGER REVEALS ---
    function setupRevealObserver() {
        if (revealObserver) {
            revealObserver.disconnect();
        }

        const isReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        revealObserver = new IntersectionObserver((entries) => {
            // Filter targets intersecting viewport
            const intersecting = entries.filter(e => e.isIntersecting);
            if (intersecting.length === 0) return;

            intersecting.forEach(entry => {
                const card = entry.target;
                revealObserver.unobserve(card);

                // Find index to calculate stagger delay
                const parent = card.parentNode;
                if (!parent) {
                    card.classList.remove("card-hidden");
                    animateCardPrices(card);
                    return;
                }
                const cardsArray = Array.from(parent.children);
                const index = cardsArray.indexOf(card);

                // Delay math: 80ms stagger, max 800ms total, skip delays for card > 8th index
                let delay = 0;
                if (!isReduced) {
                    if (index < 8) {
                        delay = index * 80;
                    } else {
                        delay = 800;
                    }
                }

                if (isReduced) {
                    card.classList.remove("card-hidden");
                    showCardPricesImmediately(card);
                } else {
                    setTimeout(() => {
                        card.classList.remove("card-hidden");
                        animateCardPrices(card);
                    }, delay);
                }
            });
        }, {
            threshold: 0.05,
            rootMargin: "0px 0px -20px 0px"
        });

        // Attach elements
        const hiddenCards = productsGrid.querySelectorAll(".card-hidden");
        hiddenCards.forEach(card => revealObserver.observe(card));
    }

    // --- PRICE ANIMATIONS (requestAnimationFrame) ---
    function animateCardPrices(card) {
        const currency = "₹";
        
        const priceEl = card.querySelector(".price-value");
        if (priceEl && !priceEl.classList.contains("animated")) {
            priceEl.classList.add("animated");
            const targetVal = parseFloat(priceEl.getAttribute("data-price")) || 0;
            animateValue(priceEl, 0, targetVal, 450, currency);
        }

        const mrpEl = card.querySelector(".mrp-value");
        if (mrpEl && !mrpEl.classList.contains("animated")) {
            mrpEl.classList.add("animated");
            const targetVal = parseFloat(mrpEl.getAttribute("data-mrp")) || 0;
            animateValue(mrpEl, 0, targetVal, 450, currency);
        }
    }

    function showCardPricesImmediately(card) {
        const currency = "₹";
        
        const priceEl = card.querySelector(".price-value");
        if (priceEl) {
            const targetVal = parseFloat(priceEl.getAttribute("data-price")) || 0;
            priceEl.textContent = `${currency}${targetVal.toLocaleString('en-IN')}`;
        }

        const mrpEl = card.querySelector(".mrp-value");
        if (mrpEl) {
            const targetVal = parseFloat(mrpEl.getAttribute("data-mrp")) || 0;
            mrpEl.textContent = `${currency}${targetVal.toLocaleString('en-IN')}`;
        }
    }

    function animateValue(element, start, end, duration, prefix = "") {
        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            const current = Math.floor(progress * (end - start) + start);
            element.textContent = `${prefix}${current.toLocaleString('en-IN')}`;
            if (progress < 1) {
                window.requestAnimationFrame(step);
            } else {
                element.textContent = `${prefix}${end.toLocaleString('en-IN')}`;
            }
        };
        window.requestAnimationFrame(step);
    }

    // --- ADD-TO-CART MICRO-BOUNCE ---
    window.addToCartWithBounce = function(e, productId) {
        e.stopPropagation(); // Prevents click bubbling to parent card hover
        const btn = e.currentTarget;

        const isReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (!isReduced) {
            btn.style.transform = "scale(0.9)";
            setTimeout(() => {
                btn.style.transform = "scale(1)";
            }, 120);
        }

        window.changeCartQty(productId, 1);
    };

    // --- CART DRAWER CONTROLLER FUNCTIONS ---
    window.toggleCartDrawer = function(open) {
        if (!cartDrawerContainer) return;
        
        if (open) {
            cartDrawerContainer.classList.add("open");
            document.body.classList.add("cart-open");
            updateCartDisplay();
        } else {
            cartDrawerContainer.classList.remove("open");
            document.body.classList.remove("cart-open");
        }
    };

    window.changeCartQty = function(productId, delta) {
        const product = products.find(p => p.id === productId);
        if (!product) return;

        const currentQty = cart[productId] || 0;
        const newQty = currentQty + delta;

        if (newQty <= 0) {
            delete cart[productId];
        } else {
            cart[productId] = newQty;
        }

        // Cache cart state
        localStorage.setItem("store_cart", JSON.stringify(cart));
        
        // Re-render
        renderProducts();
        updateCartDisplay();
    };

    function updateCartDisplay() {
        if (!cartItemsContainer) return;
        
        const settings = window.db.getSettings();
        const currency = settings.currencySymbol;

        cartItemsContainer.innerHTML = "";
        
        let totalItems = 0;
        let totalWholesaleSum = 0;
        let totalMrpSum = 0;
        let totalSavingsSum = 0;

        const cartKeys = Object.keys(cart);

        if (cartKeys.length === 0) {
            cartItemsContainer.innerHTML = `
                <div class="flex flex-col items-center justify-center py-20 text-slate-500 gap-2 select-none text-center">
                    <i data-lucide="shopping-cart" class="w-10 h-10 text-slate-600"></i>
                    <h4 class="text-xs font-bold text-slate-350">Your cart is empty</h4>
                    <p class="text-[10px] text-slate-550 max-w-[200px]">Add products from our wholesale catalog to make a reservation request.</p>
                </div>
            `;
            
            if (cartBadgeCount) cartBadgeCount.textContent = "0";
            if (cartTotalQty) cartTotalQty.textContent = "0";
            if (cartTotalMrp) cartTotalMrp.textContent = `${currency}0.00`;
            if (cartTotalWholesale) cartTotalWholesale.textContent = `${currency}0.00`;
            if (cartTotalSavings) cartTotalSavings.textContent = `${currency}0.00`;
            
            // Disable checkout inputs
            if (cartCheckoutForm) {
                cartCheckoutForm.querySelectorAll("input, textarea, button").forEach(el => el.disabled = true);
            }
            lucide.createIcons();
            return;
        }

        // Enable checkout inputs
        if (cartCheckoutForm) {
            cartCheckoutForm.querySelectorAll("input, textarea, button").forEach(el => el.disabled = false);
        }

        cartKeys.forEach(productId => {
            const product = products.find(p => p.id === productId);
            if (!product) return;

            const qty = cart[productId];
            const itemWholesale = product.selling_price * qty;
            const itemMrp = (product.market_price || product.selling_price) * qty;
            const itemSavings = itemMrp - itemWholesale;

            totalItems += qty;
            totalWholesaleSum += itemWholesale;
            totalMrpSum += itemMrp;
            totalSavingsSum += itemSavings;

            const correctedName = product.name ? product.name.replace(/\bcattle\b/gi, 'kettle') : 'Unnamed Item';
            const hasMrp = product.market_price && product.market_price > product.selling_price;

            const cartRow = document.createElement("div");
            cartRow.className = "flex items-center gap-3 border-b border-slate-850 pb-3 last:border-0";
            
            cartRow.innerHTML = `
                <div class="flex-grow">
                    <h4 class="text-xs font-bold text-slate-200 leading-snug">${correctedName}</h4>
                    <span class="text-[10px] text-slate-550 font-bold block mt-0.5">Category: ${product.category}</span>
                    <div class="flex items-baseline gap-2 mt-1">
                        <span class="text-xs font-extrabold text-brand-500">${currency}${product.selling_price}</span>
                        ${hasMrp ? `
                        <span class="text-[10px] text-slate-550 line-through font-semibold">${currency}${product.market_price}</span>
                        ` : ""}
                    </div>
                </div>
                
                <div class="flex items-center gap-2 shrink-0 select-none">
                    <button onclick="changeCartQty('${product.id}', -1)" class="w-6.5 h-6.5 rounded-md bg-dark-800 hover:bg-dark-750 text-slate-300 border border-slate-700 flex items-center justify-center transition-colors">
                        <i data-lucide="minus" class="w-3.5 h-3.5"></i>
                    </button>
                    <span class="text-xs font-black text-white w-4 text-center">${qty}</span>
                    <button onclick="changeCartQty('${product.id}', 1)" class="w-6.5 h-6.5 rounded-md bg-dark-800 hover:bg-dark-750 text-slate-300 border border-slate-700 flex items-center justify-center transition-colors">
                        <i data-lucide="plus" class="w-3.5 h-3.5"></i>
                    </button>
                </div>
            `;
            cartItemsContainer.appendChild(cartRow);
        });

        // Update Totals Card
        if (cartBadgeCount) cartBadgeCount.textContent = totalItems;
        if (cartTotalQty) cartTotalQty.textContent = totalItems;
        if (cartTotalMrp) cartTotalMrp.textContent = `${currency}${totalMrpSum.toFixed(2)}`;
        if (cartTotalWholesale) cartTotalWholesale.textContent = `${currency}${totalWholesaleSum.toFixed(2)}`;
        if (cartTotalSavings) cartTotalSavings.textContent = `${currency}${totalSavingsSum.toFixed(2)}`;

        lucide.createIcons();
    }

    // --- CHECKOUT SUBMISSION LOGIC ---
    window.handleCartCheckout = async function(e) {
        e.preventDefault();
        
        const customerName = document.getElementById("cart-customer-name").value.trim();
        const customerPhone = document.getElementById("cart-customer-phone").value.trim();
        const customerNotes = document.getElementById("cart-customer-notes").value.trim();

        if (!customerName || !customerPhone) {
            alert("Please enter your name and WhatsApp contact number.");
            return;
        }

        const cartKeys = Object.keys(cart);
        if (cartKeys.length === 0) return;

        const customerInfo = {
            name: customerName,
            phone: customerPhone,
            notes: customerNotes
        };

        const cartItems = cartKeys.map(productId => ({
            product_id: productId,
            quantity: cart[productId]
        }));

        try {
            // Write batch reservation record
            const reservations = await window.db.createBatchReservations(customerInfo, cartItems);

            if (reservations && reservations.length > 0) {
                // Clear cart state
                cart = {};
                localStorage.removeItem("store_cart");
                
                // Close Drawer and refresh
                toggleCartDrawer(false);
                renderProducts();
                
                // Reset Form
                document.getElementById("cart-checkout-form").reset();
                
                // Open WhatsApp checkout link
                triggerWhatsAppMessage(reservations);
            } else {
                alert("Failed to submit reservation logs. Please check your network connection.");
            }
        } catch (err) {
            console.error("Batch checkout exception:", err);
            alert("Reservation check failed. Please try again.");
        }
    };

    function triggerWhatsAppMessage(reservations) {
        const settings = window.db.getSettings();
        const phone = settings.storeWhatsApp;
        
        let message = `Hello Avadhanula Stores,\n\nI would like to place a product reservation:\n`;
        let totalSum = 0;
        let totalSavings = 0;

        reservations.forEach((res, index) => {
            const itemTotal = res.selling_price * res.quantity;
            const savings = (res.market_price_at_reserve - res.selling_price) * res.quantity;
            totalSum += itemTotal;
            totalSavings += savings;

            const resName = res.product_name ? res.product_name.replace(/\bcattle\b/gi, 'kettle') : 'Unnamed Item';
            message += `${index + 1}. *${resName}* (Qty: ${res.quantity}) - ₹${res.selling_price}/unit\n`;
        });

        message += `\n*Wholesale Total*: ₹${totalSum.toFixed(2)}\n`;
        if (totalSavings > 0) {
            message += `*Total Savings*: ₹${totalSavings.toFixed(2)}\n`;
        }
        
        message += `\n*Name*: ${reservations[0].customer_name}\n`;
        message += `*Contact*: ${reservations[0].phone}\n`;
        if (reservations[0].notes) {
            message += `*Notes*: ${reservations[0].notes}\n`;
        }
        
        message += `\nPlease confirm my order. Thank you!`;
        
        const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, "_blank");
    }

    // --- SETUP FILTERS & DROPDOWN EVENTS ---
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

        document.addEventListener("click", () => {
            categoryDropdown.classList.add("hidden");
        });
    }

    // Initialize Store Front App
    setupStoreDetails();
    loadCatalog();

    // Subscribe to live postgres changes to re-sync
    window.db.subscribeToChanges(() => {
        loadCatalog();
    });
});

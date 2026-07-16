// database.js - Core storage and database service using Supabase (Avadhanula Stores Live Version)

// TODO: Replace these placeholders with your live Supabase project credentials
const SUPABASE_URL = "https://wdijjlsuehjivlodmfxp.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndkaWpqbHN1ZWhqaXZsb2RtZnhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMzMjI4MzksImV4cCI6MjA5ODg5ODgzOX0.RbU-zmK9qIeOada43sKSs4kHSEnrkVGoKcVesmaoCHI";

// Initialize Supabase Client
let supabaseClient = null;
if (typeof supabase !== 'undefined' && SUPABASE_URL && SUPABASE_URL !== "YOUR_SUPABASE_URL") {
    try {
        supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log("Supabase Client connected successfully!");
    } catch (e) {
        console.error("Failed to initialize Supabase client:", e);
    }
}

// Fallback products list (seeded from the store's inventory database)
const DEFAULT_PRODUCTS = [
    {
        id: "prod-1",
        name: "SANTOOR new soap 100 gm pack of 4 pc",
        category: "Bath Soap",
        market_price: 199,
        selling_price: 180,
        available: true,
        image_url: "",
        description: "Santoor sandalwood and turmeric bathing soap. Pack of 4 bars of 100g each. Rejuvenates skin for a natural, healthy glow."
    },
    {
        id: "prod-2",
        name: "SANTOOR WHITE",
        category: "Bath Soap",
        market_price: 165,
        selling_price: 150,
        available: true,
        image_url: "",
        description: "Santoor White Soap bar. Enriched with natural oils and skin hydration agents for soft skin texture."
    },
    {
        id: "prod-3",
        name: "PREETHI 750 WT MIXIE",
        category: "Electronics",
        market_price: 9999,
        selling_price: 8500,
        available: true,
        image_url: "",
        description: "Preethi 750 Watt high-performance Mixer Grinder. Perfect for wet and dry grinding, featuring rust-free stainless steel jars."
    },
    {
        id: "prod-4",
        name: "PRESTIGE 750 WT MIXIE",
        category: "Electronics",
        market_price: 3799,
        selling_price: 3200,
        available: true,
        image_url: "",
        description: "Prestige 750W durable mixer grinder. Features sleek styling, speed controls, overload protection, and high-efficiency blades."
    },
    {
        id: "prod-5",
        name: "HAVELLS CEILING FAN",
        category: "Electronics",
        market_price: 2499,
        selling_price: 2200,
        available: true,
        image_url: "",
        description: "Havells high-speed air ceiling fan. Energy efficient, double ball-bearing design, and rust-free body coating."
    },
    {
        id: "prod-6",
        name: "ORIENT KETTLE",
        category: "Electronics",
        market_price: 599,
        selling_price: 450,
        available: true,
        image_url: "",
        description: "Orient Electric Kettle. 1.5 Litres capacity, automatic shut-off safety sensor, and stainless steel heating plate."
    },
    {
        id: "prod-7",
        name: "PIGEON KETTLE",
        category: "Electronics",
        market_price: 599,
        selling_price: 450,
        available: true,
        image_url: "",
        description: "Pigeon Multipurpose Electric Kettle. Fast-boiling operation, comfortable grip, cordless swivel base, and dry boil protection."
    },
    {
        id: "prod-8",
        name: "PRESTIGE KETTLE",
        category: "Electronics",
        market_price: 599,
        selling_price: 450,
        available: true,
        image_url: "",
        description: "Prestige Electric Kettle. Durable construction with single-touch lock lid, automatic cutout, and power indicator light."
    },
    {
        id: "prod-9",
        name: "VIVEL SOAP SET OF 4",
        category: "Bath Soap",
        market_price: 145,
        selling_price: 120,
        available: true,
        image_url: "",
        description: "Vivel Aloe Vera and Vitamin E beauty soap pack. Includes 4 bars. Moisturizes skin deeply and protects from dryness."
    },
    {
        id: "prod-10",
        name: "CYCLE AGARBATTI",
        category: "Grocery",
        market_price: 35,
        selling_price: 30,
        available: true,
        image_url: "",
        description: "Cycle Brand premium fragrance agarbatti. Aromatic incense sticks for creating a serene environment during daily prayers."
    },
    {
        id: "prod-11",
        name: "AMBIKA AGARBATTI",
        category: "Grocery",
        market_price: 30,
        selling_price: 25,
        available: true,
        image_url: "",
        description: "Ambika traditional incense sticks. Smooth burning with a refreshing herbal fragrance to calm your senses."
    },
    {
        id: "prod-12",
        name: "MANGALDEEP AGARBATTI",
        category: "Grocery",
        market_price: 75,
        selling_price: 62,
        available: true,
        image_url: "",
        description: "ITC Mangaldeep Sandalwood incense sticks. Specially crafted pack for a rich, relaxing, and long-lasting prayer environment."
    },
    {
        id: "prod-13",
        name: "SAFFOLA HONEY",
        category: "Grocery",
        market_price: 349,
        selling_price: 300,
        available: true,
        image_url: "",
        description: "Saffola 100% Pure Active Honey. Sourced from natural hives, NMR tested for purity, contains zero added sugar."
    },
    {
        id: "prod-14",
        name: "DABUR HONEY",
        category: "Grocery",
        market_price: 349,
        selling_price: 300,
        available: true,
        image_url: "",
        description: "Dabur Honey, clinically tested to boost immunity. Rich in natural antioxidants, standard of quality and purity."
    },
    {
        id: "prod-15",
        name: "ZANDU HONEY",
        category: "Grocery",
        market_price: 349,
        selling_price: 300,
        available: true,
        image_url: "",
        description: "Zandu Pure Honey. 100% organic with no sugar adulteration. Perfect sweetener for healthy breakfasts and tea."
    },
    {
        id: "prod-16",
        name: "PATHANJALI HONEY",
        category: "Grocery",
        market_price: 180,
        selling_price: 150,
        available: true,
        image_url: "",
        description: "Patanjali Pure Natural Honey. Rich in vitamins and minerals, serves as an excellent natural therapeutic sweetener."
    },
    {
        id: "prod-17",
        name: "LION HONEY",
        category: "Grocery",
        market_price: 249,
        selling_price: 220,
        available: true,
        image_url: "",
        description: "Lion Kashmir Honey. 100% pure premium honey collected from flowers in Kashmir valley. Great source of vitamins."
    },
    {
        id: "prod-18",
        name: "TIDE DISH WASH",
        category: "Grocery",
        market_price: 12,
        selling_price: 10,
        available: true,
        image_url: "",
        description: "Tide active dish wash soap. Formulated for grease-cutting speed, making cleaning utensils effortless."
    },
    {
        id: "prod-19",
        name: "RUBY DETERGENT SOAP",
        category: "Grocery",
        market_price: 25,
        selling_price: 20,
        available: true,
        image_url: "",
        description: "Ruby active laundry wash bar. Removes tough stains and dirt particles from clothes while preserving colors."
    },
    {
        id: "prod-20",
        name: "PEARS SOAP SET OF 3",
        category: "Bath Soap",
        market_price: 149,
        selling_price: 125,
        available: true,
        image_url: "",
        description: "Pears Pure and Gentle soap set. Includes 3 bars. Formulated with 98% pure glycerin to keep skin hydrated and soft."
    },
    {
        id: "prod-21",
        name: "HARPIC APPOLO",
        category: "Sanitary",
        market_price: 75,
        selling_price: 60,
        available: true,
        image_url: "",
        description: "Harpic Apollo toilet disinfection cleaner. Kills 99.9% of germs, removes scale and tough stains, leaving a clean shine."
    },
    {
        id: "prod-22",
        name: "NO. 1 SOAP SET OF 4",
        category: "Bath Soap",
        market_price: 185,
        selling_price: 160,
        available: true,
        image_url: "",
        description: "Godrej No.1 Sandal and Turmeric Soap pack. Set of 4 bars. Traditional components protect and naturally brighten skin."
    },
    {
        id: "prod-23",
        name: "VIM DISHWASH SOAP",
        category: "Grocery",
        market_price: 12,
        selling_price: 10,
        available: true,
        image_url: "",
        description: "Vim Lemon Dishwash Bar. Cuts through stubborn oily layers with the power of 100 lemons. Leaves fresh fragrance."
    },
    {
        id: "prod-24",
        name: "EXO DISHWASH SOAP",
        category: "Grocery",
        market_price: 10,
        selling_price: 9,
        available: true,
        image_url: "",
        description: "Exo round dishwash bar with Cyclozan. Offers antibacterial shield, preventing germ buildup on your kitchen vessels."
    },
    {
        id: "prod-25",
        name: "KERALA SANDAL SET OF 3",
        category: "Bath Soap",
        market_price: 299,
        selling_price: 275,
        available: true,
        image_url: "",
        description: "Kerala Sandalwood soap premium set. Made with pure sandalwood oil extracts. Refreshing skin-healing aromatherapy."
    },
    {
        id: "prod-26",
        name: "KERALA SANDAL SOAP",
        category: "Bath Soap",
        market_price: 45,
        selling_price: 40,
        available: true,
        image_url: "",
        description: "Kerala Sandal single bar. Rich lathering sandalwood soap bar, famous for deep skin protection and traditional perfume."
    },
    {
        id: "prod-27",
        name: "MYSORE SANDAL SET OF 3",
        category: "Bath Soap",
        market_price: 210,
        selling_price: 190,
        available: true,
        image_url: "",
        description: "Mysore Sandalwood Soap pack of 3. Formulated with natural oils and pure sandalwood extracts directly from Mysore forests."
    },
    {
        id: "prod-28",
        name: "MYSORE SANDAL SOAP",
        category: "Bath Soap",
        market_price: 45,
        selling_price: 40,
        available: true,
        image_url: "",
        description: "Mysore Sandal single bar. Classic heritage toilet soap crafted with pure sandalwood oil. Soothes skin irritation."
    },
    {
        id: "prod-29",
        name: "KARTHIKA SHAMPOO",
        category: "Cosmetics",
        market_price: 2,
        selling_price: 1,
        available: true,
        image_url: "",
        description: "Karthika herbal hairwash shampoo. Fortified with natural ingredients like Shikakai and Amla for thick, strong hair."
    },
    {
        id: "prod-30",
        name: "CHICK SHAMPOO",
        category: "Cosmetics",
        market_price: 2,
        selling_price: 1,
        available: true,
        image_url: "",
        description: "Chik soft and shiny shampoo. Formulated with natural jasmine extracts or egg protein to revitalize dry hair."
    },
    {
        id: "prod-31",
        name: "SUNSILK SHAMPOO",
        category: "Cosmetics",
        market_price: 2,
        selling_price: 1,
        available: true,
        image_url: "",
        description: "Sunsilk Black Shine Shampoo. Co-created with hair professionals. Enriched with Amla-Pearl complex for long glossy hair."
    },
    {
        id: "prod-32",
        name: "CLINIC PLUS SHAMPOO",
        category: "Cosmetics",
        market_price: 2,
        selling_price: 1,
        available: true,
        image_url: "",
        description: "Clinic Plus Strong and Long Health Shampoo. Rich in milk proteins that penetrate and strengthen hair roots."
    },
    {
        id: "prod-33",
        name: "DOVE SHAMPOO",
        category: "Cosmetics",
        market_price: 2,
        selling_price: 1,
        available: true,
        image_url: "",
        description: "Dove Intense Damage Repair Shampoo. Uses Nutri-Keratin active formulas to repair hair fibers from deep within."
    },
    {
        id: "prod-34",
        name: "SARIGAMA SOAP",
        category: "Bath Soap",
        market_price: 12,
        selling_price: 10,
        available: true,
        image_url: "",
        description: "Sarigama traditional herbal cleansing soap. Deep cleaning action leaving a fresh natural aroma after bathing."
    },
    {
        id: "prod-35",
        name: "DOVE SOAP SET OF 3 WHITE",
        category: "Bath Soap",
        market_price: 330,
        selling_price: 290,
        available: true,
        image_url: "",
        description: "Dove White beauty bathing bar set of 3. Features 1/4 moisturizing cream formula, gentler than standard soap bars."
    },
    {
        id: "prod-36",
        name: "DOVE SET OF 3 SOAP COLOUR",
        category: "Bath Soap",
        market_price: 420,
        selling_price: 375,
        available: true,
        image_url: "",
        description: "Dove Pink beauty bathing bar set of 3. Combines mild cleansers with skin-matching moisturizers to keep skin hydrated."
    },
    {
        id: "prod-37",
        name: "RIN DETERGENT",
        category: "Grocery",
        market_price: 12,
        selling_price: 10,
        available: true,
        image_url: "",
        description: "Rin washing detergent bar. Delivers absolute whites and bright colored garments with minimal water scrubbing."
    },
    {
        id: "prod-38",
        name: "SURF EXCEL SOAP",
        category: "Grocery",
        market_price: 12,
        selling_price: 10,
        available: true,
        image_url: "",
        description: "Surf Excel stain remover laundry bar. Works directly on collar and cuff stains, removing embedded dirt instantly."
    },
    {
        id: "prod-39",
        name: "SURF DETERGENT SOAP",
        category: "Grocery",
        market_price: 35,
        selling_price: 30,
        available: true,
        image_url: "",
        description: "Surf Excel Easy Wash washing detergent powder. Dissolves easily in water and lifts hard oil or mud spots."
    },
    {
        id: "prod-40",
        name: "Wooden Skipping rope",
        category: "Sports",
        market_price: 80,
        selling_price: 60,
        available: true,
        image_url: "",
        description: "Durable wooden handle fitness skipping rope. Ideal for domestic exercises, cardio training, and sports warming up."
    },
    {
        id: "prod-41",
        name: "Apsara absolute pencil",
        category: "Stationery",
        market_price: 8,
        selling_price: 6,
        available: true,
        image_url: "",
        description: "Apsara Absolute Extra Dark drawing and writing pencils. Strong lead that resists breaking and provides dark lines."
    },
    {
        id: "prod-42",
        name: "DOMS everyday blue pen",
        category: "Stationery",
        market_price: 5,
        selling_price: 3,
        available: true,
        image_url: "",
        description: "DOMS Everyday blue ballpoint pen. Retractable design with low-viscosity ink for incredibly smooth long writing."
    }
];

class StoreDatabase {
    getSettings() {
        return {
            storeName: "Avadhanula Stores",
            storeDesc: "Your trusted neighborhood mart. View our wholesale vs MRP prices, browse high quality groceries, cosmetics, soaps, and home items, and reserve them online.",
            storePhone: "8008668066",
            storeWhatsApp: "918008668066",
            currencySymbol: "₹",
        };
    }

    // Retrieve live products from Supabase
    async getProducts() {
        if (!supabaseClient) {
            console.warn("Supabase client not initialized. Loading offline catalog seeds.");
            return DEFAULT_PRODUCTS;
        }

        try {
            // Lovable apps usually store inventory in a table named 'products'
            // We select id, name, sellPrice (or price), buyPrice (optional), quantity (or stock), category, image_url (or imageUrl), description (or desc)
            const { data, error } = await supabaseClient
                .from('products')
                .select('*');

            if (error) throw error;

            if (!data || data.length === 0) {
                console.log("No data returned from Supabase, loading fallback products.");
                return DEFAULT_PRODUCTS;
            }

            // Map database fields to the storefront catalog model dynamically
            return data.map(item => {
                // Handle various potential naming conventions in databases
                const name = item.name || item.product_name || "Unnamed Item";
                const category = item.category || "General";
                
                // Pricing
                const rawSell = item.sellPrice || item.sell_price || item.price || item.selling_price || 0;
                const sellingPrice = parseFloat(rawSell);
                const marketPrice = (item.mrp !== undefined && item.mrp !== null) ? parseFloat(item.mrp) : (item.market_price ? parseFloat(item.market_price) : Math.ceil(sellingPrice * 1.15));
                
                // Stock levels
                const rawStock = item.quantity !== undefined ? item.quantity : (item.stock !== undefined ? item.stock : 1);
                const quantity = parseInt(rawStock);
                const available = item.available !== undefined ? (
                    typeof item.available === 'boolean' ? item.available : 
                    (item.available.toString().toLowerCase() === 'yes' || item.available === 1)
                ) : (quantity > 0);

                const imageUrl = item.image_url || item.imageUrl || item.image || "";
                const description = item.description || item.desc || `${name} in category ${category}.`;

                return {
                    id: item.id ? item.id.toString() : `db-${Math.random()}`,
                    name,
                    category,
                    market_price: marketPrice,
                    selling_price: sellingPrice,
                    available,
                    image_url: imageUrl,
                    description
                };
            });
        } catch (e) {
            console.error("Failed to query live products table from Supabase. Falling back to default list.", e);
            return DEFAULT_PRODUCTS;
        }
    }

    getProductById(id, productsList) {
        return productsList.find(p => p.id === id) || null;
    }

    // Reservation creation
    async createReservation(reservationData) {
        const products = await this.getProducts();
        const product = this.getProductById(reservationData.product_id, products);
        if (!product) return null;

        const newReservation = {
            id: "RES-" + Math.floor(100000 + Math.random() * 900000),
            customer_name: reservationData.customer_name.trim(),
            phone: reservationData.phone.trim(),
            product_id: reservationData.product_id,
            product_name: product.name,
            selling_price_at_reserve: product.selling_price,
            market_price_at_reserve: product.market_price,
            quantity: parseInt(reservationData.quantity) || 1,
            notes: reservationData.notes ? reservationData.notes.trim() : "",
            status: "Pending Confirmation",
            created_at: new Date().toISOString()
        };

        // If connected to Supabase, we attempt to save the reservation in a table 'reservations'
        // so the administrator can view it directly in their Lovable app database!
        if (supabaseClient) {
            try {
                const { error } = await supabaseClient
                    .from('reservations')
                    .insert([{
                        id: newReservation.id,
                        customer_name: newReservation.customer_name,
                        phone: newReservation.phone,
                        product_id: newReservation.product_id,
                        product_name: newReservation.product_name,
                        selling_price: newReservation.selling_price_at_reserve,
                        quantity: newReservation.quantity,
                        notes: newReservation.notes,
                        status: newReservation.status,
                        created_at: newReservation.created_at
                    }]);
                
                if (error) {
                    console.warn("Could not insert reservation log to Supabase. This is expected if the 'reservations' table is not created yet.", error);
                } else {
                    console.log("Reservation synced to Supabase successfully.");
                }
            } catch (e) {
                console.error("Supabase reservation insert error:", e);
            }
        }

        // Store copy in local storage for customer reference
        const localList = JSON.parse(localStorage.getItem("store_reservations") || "[]");
        localList.unshift(newReservation);
        localStorage.setItem("store_reservations", JSON.stringify(localList));

        return newReservation;
    }

    // Batch reservation creation
    async createBatchReservations(customerInfo, cartItems) {
        const products = await this.getProducts();
        const reservationsToInsert = [];
        const localReservations = [];

        const batchId = "BATCH-" + Math.floor(100000 + Math.random() * 900000);

        for (const item of cartItems) {
            const product = this.getProductById(item.product_id, products);
            if (!product) continue;

            const resId = "RES-" + Math.floor(100000 + Math.random() * 900000);
            const newRes = {
                id: resId,
                customer_name: customerInfo.name.trim(),
                phone: customerInfo.phone.trim(),
                product_id: item.product_id,
                product_name: product.name,
                selling_price: product.selling_price,
                quantity: parseInt(item.quantity) || 1,
                notes: `Batch: ${batchId}. ${customerInfo.notes ? customerInfo.notes.trim() : ""}`,
                status: "Pending Confirmation",
                created_at: new Date().toISOString()
            };
            reservationsToInsert.push(newRes);

            // local storage model support
            localReservations.push({
                ...newRes,
                selling_price_at_reserve: product.selling_price,
                market_price_at_reserve: product.market_price
            });
        }

        if (reservationsToInsert.length === 0) return null;

        // Save batch to Supabase reservations table
        if (supabaseClient) {
            try {
                const { error } = await supabaseClient
                    .from('reservations')
                    .insert(reservationsToInsert);

                if (error) {
                    console.error("Batch reservation insert error:", error);
                } else {
                    console.log("Batch reservations synced to Supabase successfully.");
                }
            } catch (e) {
                console.error("Supabase batch insert exception:", e);
            }
        }

        // Store copy in local storage
        const localList = JSON.parse(localStorage.getItem("store_reservations") || "[]");
        localList.unshift(...localReservations);
        localStorage.setItem("store_reservations", JSON.stringify(localList));

        return localReservations;
    }

    // Subscribe to real-time updates from Supabase
    subscribeToChanges(callback) {
        if (supabaseClient) {
            try {
                supabaseClient.channel('realtime-products')
                    .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, (payload) => {
                        console.log("Real-time database update received:", payload);
                        callback();
                    })
                    .subscribe();
            } catch (e) {
                console.error("Failed to subscribe to Supabase real-time changes:", e);
            }
        }
    }
}

// Make globally available
window.db = new StoreDatabase();

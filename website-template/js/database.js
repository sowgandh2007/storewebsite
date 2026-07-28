// Database Layer Template
(function() {
    // 1. SUPABASE CREDENTIALS (Replace with your actual keys)
    const SUPABASE_URL = "https://your-supabase-project.supabase.co";
    const SUPABASE_KEY = "your-anon-public-key";
    
    let supabaseClient = null;
    try {
        if (SUPABASE_URL.indexOf("your-supabase-project") === -1 && typeof supabase !== 'undefined') {
            supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
        }
    } catch (e) {
        console.warn("Supabase connection skipped, loading fallback catalog data.", e);
    }

    // 2. SEED DEFAULT PRODUCTS (SEO / offline fallback catalog)
    const DEFAULT_PRODUCTS = [
        {
            id: "prod-1",
            name: "Premium Soap Bar 100g",
            category: "Bath Soap",
            selling_price: 150,
            market_price: 175,
            available: true,
            description: "Organic ingredients with essential oils and hydrating extracts."
        },
        {
            id: "prod-2",
            name: "High-Speed Ceiling Fan",
            category: "Electronics",
            selling_price: 2200,
            market_price: 2500,
            available: true,
            description: "Energy-efficient motor, double ball bearing, and high air flow."
        },
        {
            id: "prod-3",
            name: "Multi-Functional Electric Kettle 1.5L",
            category: "Electronics",
            selling_price: 450,
            market_price: 599,
            available: true,
            description: "Stainless steel body with automatic cut-off and dry-boil safety sensors."
        }
    ];

    const DEFAULT_SETTINGS = {
        storeName: "{{BRAND_NAME}}",
        storeDesc: "Your premium wholesale catalog showcase. Reservable online via WhatsApp.",
        storePhone: "{{PHONE_NUMBER}}"
    };

    window.db = {
        getSettings: function() {
            // Can be extended to fetch dynamically from Supabase
            return DEFAULT_SETTINGS;
        },
        
        getProducts: async function() {
            if (!supabaseClient) {
                return DEFAULT_PRODUCTS;
            }
            try {
                const { data, error } = await supabaseClient
                    .from('products')
                    .select('*')
                    .order('name', { ascending: true });
                    
                if (error) throw error;
                
                // Map DB schema to catalog structure (stripping source notes, formatting values)
                return (data || []).map(p => {
                    const cleanDesc = p.description ? p.description.replace(/(\s*\|\s*)?\bsource\b[\s:]\s*.*$/gi, '').trim() : '';
                    const correctedName = p.name ? p.name.replace(/\bcattle\b/gi, 'kettle') : 'Unnamed';
                    const mrp = parseFloat(p.mrp) || 0;
                    const selling = parseFloat(p.price) || 0;
                    
                    return {
                        id: p.id,
                        name: correctedName,
                        category: p.category || 'General',
                        selling_price: selling,
                        market_price: (mrp > 0 && mrp > selling) ? mrp : null,
                        available: p.status === 'instock' || p.available === true,
                        description: cleanDesc
                    };
                });
            } catch (err) {
                console.error("Failed to load live Supabase data, using default offline catalog:", err);
                return DEFAULT_PRODUCTS;
            }
        }
    };
})();

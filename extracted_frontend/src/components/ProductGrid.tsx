import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import ProductCard from "./ProductCard";

type Product = {
  id: number;
  name: string;
  price: string;
  category: string;
  image: string;
  label?: string;
};

export default function ProductGrid() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProducts() {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*');

        if (error) throw error;

        if (data) {
          const formattedProducts = data.map((item: any) => ({
            id: item.id,
            name: item.name,
            price: `₹${item.sell_price}`,
            category: item.category || 'General',
            image: item.image_url || '',
            label: item.quantity < 10 ? 'LOW STOCK' : (item.quantity > 50 ? 'HOT' : ''),
          }));
          setProducts(formattedProducts);
        }
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, []);

  return (
    <section className="py-24 px-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-end mb-12">
        <h2 className="text-4xl md:text-6xl font-display uppercase tracking-widest">Trending</h2>
        <a href="#" className="hidden md:inline-block border-b border-y2k-black pb-1 hover:text-y2k-pink hover:border-y2k-pink transition-colors text-sm uppercase tracking-widest font-bold">
          View All Products
        </a>
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-y2k-pink"></div>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 lg:gap-8">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
      
      <div className="mt-12 text-center md:hidden">
        <button className="bg-y2k-black text-y2k-white w-full py-4 uppercase font-bold tracking-widest hover:bg-y2k-pink transition-colors">
          View All Products
        </button>
      </div>
    </section>
  );
}

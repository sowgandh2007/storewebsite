import { motion } from "framer-motion";
import { Heart } from "lucide-react";

type Product = {
  id: number;
  name: string;
  price: string;
  category: string;
  image: string;
  label?: string;
};

export default function ProductCard({ product }: { product: Product }) {
  return (
    <motion.div 
      whileHover={{ y: -10 }}
      className="group flex flex-col relative bg-y2k-white border border-y2k-chrome shadow-sm hover:shadow-xl transition-all duration-300 h-full"
    >
      {/* Image / Fallback container */}
      <div className="relative aspect-[3/4] overflow-hidden bg-y2k-cream border-b border-y2k-chrome flex flex-col items-center justify-center p-6 text-center">
        {product.image ? (
          <img 
            src={product.image} 
            alt={product.name} 
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="flex-grow flex items-center justify-center relative z-0">
            <h3 className="font-display text-4xl uppercase tracking-tighter text-y2k-black/10 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-[-15deg] whitespace-nowrap">
              AVADHANULA
            </h3>
            <h4 className="font-serif italic text-3xl md:text-4xl text-y2k-black relative z-10 break-words leading-tight">
              {product.name}
            </h4>
          </div>
        )}
        
        {/* Labels */}
        {product.label && (
          <div className="absolute top-4 left-4 bg-y2k-black text-y2k-white text-[10px] font-bold px-3 py-1 uppercase tracking-widest z-10">
            {product.label}
          </div>
        )}

        {/* Wishlist */}
        <button className="absolute top-4 right-4 bg-y2k-white/80 p-2 rounded-full backdrop-blur-sm hover:bg-y2k-pink hover:text-y2k-white transition-colors z-10">
          <Heart className="w-4 h-4" />
        </button>

        {/* Add to cart overlay */}
        <div className="absolute inset-x-0 bottom-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300 z-10 bg-gradient-to-t from-black/50 to-transparent">
          <button className="w-full bg-y2k-white text-y2k-black font-bold uppercase tracking-widest py-3 text-sm hover:bg-y2k-pink hover:text-y2k-white transition-colors shadow-lg">
            Order on WhatsApp
          </button>
        </div>
      </div>

      {/* Product Info */}
      <div className="p-4 flex flex-col items-center text-center flex-grow justify-end">
        <p className="text-xs text-y2k-black/50 uppercase tracking-widest mb-1">{product.category}</p>
        <h3 className="font-serif text-lg leading-tight mb-2 group-hover:text-y2k-pink transition-colors">{product.name}</h3>
        <p className="font-display text-xl">{product.price}</p>
      </div>
    </motion.div>
  );
}

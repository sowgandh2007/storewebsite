import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

export default function FeaturedProduct() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], [50, -50]);

  return (
    <section ref={ref} className="py-24 px-6 bg-y2k-cream overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="flex flex-col md:flex-row items-center gap-12 bg-y2k-white p-6 md:p-12 border border-y2k-chrome shadow-[0_20px_50px_rgba(0,0,0,0.05)] relative"
        >
          
          {/* Decorative Star */}
          <motion.div style={{ rotate: scrollYProgress, scale: 1.1 }} className="absolute -top-6 -left-6 w-16 h-16 bg-y2k-pink rounded-full flex items-center justify-center text-y2k-white font-display text-xs rotate-12 shadow-lg z-20 border-2 border-y2k-white origin-center">
            HOT
          </motion.div>

          {/* Left Visual Box (No Image fallback) */}
          <div className="w-full md:w-1/2 relative aspect-square overflow-hidden bg-y2k-cream group flex flex-col items-center justify-center text-center p-8 border border-y2k-chrome">
            <motion.h3 style={{ y }} className="font-display text-6xl md:text-8xl text-y2k-black/5 absolute -rotate-12 whitespace-nowrap">FEATURED</motion.h3>
            <h2 className="font-serif italic text-4xl md:text-5xl text-y2k-black relative z-10">Preethi <br/> 750W</h2>
          </div>
          
          <div className="w-full md:w-1/2 flex flex-col items-start text-left space-y-6">
            <div className="flex items-center space-x-4">
              <span className="bg-y2k-black text-y2k-white text-[10px] px-3 py-1 uppercase tracking-widest font-bold">Limited</span>
              <span className="text-sm text-y2k-black/50 font-serif italic">Save 15% on MRP</span>
            </div>
            
            <h2 className="text-5xl md:text-7xl font-display uppercase leading-none">
              Preethi <br /> <span className="text-y2k-pink">750W</span>
            </h2>
            
            <p className="text-2xl font-serif text-y2k-black/80">Our Price: ₹8,500 <span className="text-sm line-through text-y2k-silver ml-2">₹9,999</span></p>
            
            <p className="text-y2k-black/60 max-w-md">
              The high-performance essential for your kitchen. Featuring a powerful 750W motor, rust-free stainless steel jars, and an iconic glossy finish.
            </p>
            
            <button className="w-full md:w-auto px-12 py-4 bg-y2k-black text-y2k-white font-bold uppercase tracking-widest hover:bg-y2k-pink transition-colors shadow-lg">
              Order on WhatsApp
            </button>
          </div>
          
        </motion.div>
      </div>
    </section>
  );
}

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

export default function CollectionSection() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const y1 = useTransform(scrollYProgress, [0, 1], [0, 100]);
  const y2 = useTransform(scrollYProgress, [0, 1], [0, -100]);
  
  return (
    <section ref={ref} className="py-24 bg-y2k-white border-y border-y2k-chrome overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          
          <div className="md:col-span-4 flex flex-col space-y-6 order-2 md:order-1">
            <h2 className="text-6xl md:text-8xl font-serif italic text-y2k-black leading-none relative z-10">
              The <br /> <span className="font-display not-italic tracking-tighter text-y2k-pink">Essentials</span>
            </h2>
            <p className="text-y2k-black/60 max-w-sm">
              Explore our curated selection of high-quality electronics and daily necessities. Premium brands at wholesale prices.
            </p>
            <div>
              <button className="border-b-2 border-y2k-black pb-2 text-sm uppercase tracking-widest font-bold hover:text-y2k-pink hover:border-y2k-pink transition-all">
                Shop Wholesale &rarr;
              </button>
            </div>
            
            <motion.div style={{ y: y1 }} className="w-full aspect-[4/5] mt-8 bg-y2k-cream border border-y2k-chrome flex flex-col justify-center items-center text-center p-6 shadow-lg relative -rotate-3 hidden md:flex">
               <h3 className="font-display text-4xl text-y2k-black/10 absolute rotate-[-90deg] left-2 top-1/2 -translate-y-1/2">DAILY</h3>
               <h4 className="font-serif italic text-3xl text-y2k-black relative z-10 leading-tight">PRESTIGE <br/> MIXIE</h4>
            </motion.div>
          </div>
          
          <div className="md:col-span-8 order-1 md:order-2 relative">
            <motion.div style={{ y: y2 }} className="relative w-full aspect-[4/3] md:aspect-[16/10] bg-y2k-cream border border-y2k-chrome overflow-hidden flex items-center justify-center p-8">
              <h3 className="font-display text-[8vw] md:text-8xl text-y2k-black/5 absolute whitespace-nowrap -rotate-12">HOME GOODS</h3>
              <div className="relative z-10 flex flex-col items-center">
                 <h2 className="font-serif text-5xl md:text-7xl italic text-y2k-black">Appliance</h2>
                 <span className="bg-y2k-black text-y2k-white font-bold uppercase tracking-widest px-4 py-2 mt-4 text-xs">Collection</span>
              </div>
              
              {/* Decorative Labels */}
              <motion.div 
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-10 right-10 bg-y2k-white px-4 py-2 uppercase text-xs font-bold tracking-widest shadow-xl border border-y2k-black"
              >
                Vol. 1
              </motion.div>
            </motion.div>
          </div>
          
        </div>
      </div>
    </section>
  );
}

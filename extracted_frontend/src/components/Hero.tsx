import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

export default function Hero() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  const y1 = useTransform(scrollYProgress, [0, 1], [0, 200]);
  const y2 = useTransform(scrollYProgress, [0, 1], [0, -100]);
  const rotate = useTransform(scrollYProgress, [0, 1], [0, 45]);

  return (
    <section ref={ref} className="relative w-full h-[90vh] min-h-[600px] flex items-center justify-center overflow-hidden bg-y2k-cream">
      {/* Subtle Floating Shapes for scroll effects */}
      <motion.div style={{ y: y1, rotate }} className="absolute -left-10 top-20 w-64 h-64 border border-y2k-pink/30 rounded-full opacity-50 blur-sm z-0" />
      <motion.div style={{ y: y2 }} className="absolute right-10 bottom-20 w-32 h-32 bg-y2k-blue/10 rounded-lg rotate-12 z-0" />

      <div className="max-w-7xl mx-auto w-full px-6 grid grid-cols-1 md:grid-cols-2 gap-12 relative z-10 h-full items-center">
        {/* Left Content */}
        <motion.div 
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="flex flex-col items-start space-y-6"
        >
          <div className="inline-block bg-y2k-pink text-y2k-white font-bold px-4 py-1 rounded-full text-xs tracking-widest uppercase border border-y2k-pink shadow-[0_0_10px_rgba(255,182,193,0.5)]">
            Premium Wholesale Mart
          </div>
          <h2 className="text-5xl md:text-7xl font-serif leading-tight">
            The <br/> <span className="font-display text-y2k-pink italic">New</span> Standard.
          </h2>
          <p className="max-w-md text-y2k-black/70 text-lg">
            High-fidelity wholesale. Compare our rates directly against market MRP and order your daily essentials instantly.
          </p>
          <button className="mt-8 bg-y2k-black text-y2k-cream px-8 py-4 uppercase tracking-widest font-bold hover:bg-y2k-pink hover:text-y2k-white transition-all duration-300 shadow-lg">
            Shop Appliances
          </button>
        </motion.div>

        {/* Right Imagery - Asymmetric / Typographic Fallback */}
        <div className="relative h-full hidden md:flex items-center justify-center">
          <motion.div 
            style={{ y: y2 }}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="relative w-3/4 aspect-[3/4] z-10 shadow-2xl border-4 border-y2k-white bg-y2k-white flex flex-col items-center justify-center p-8 text-center"
          >
             <h3 className="font-display text-5xl text-y2k-black/10 absolute rotate-[-90deg] left-4 top-1/2 -translate-y-1/2 origin-center">WHOLESALE</h3>
             <h2 className="font-serif text-5xl italic text-y2k-black relative z-10 leading-tight">PREETHI <br/> 750W <br/> <span className="text-y2k-pink text-3xl not-italic font-display">MIXIE</span></h2>
          </motion.div>
          <motion.div 
            style={{ y: y1 }}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, delay: 0.4 }}
            className="absolute -right-8 bottom-20 w-1/2 aspect-square z-20 shadow-xl border-4 border-y2k-white bg-y2k-cream p-6 flex flex-col justify-center items-center text-center"
          >
            <div className="flex justify-between items-start w-full absolute top-4 left-0 px-4">
              <span className="font-display text-xs">SANTOOR</span>
              <span className="bg-y2k-black text-y2k-white text-[10px] px-2 py-1 uppercase">Save 10%</span>
            </div>
            
            <h4 className="font-serif italic text-2xl text-y2k-black leading-tight mt-4">
              SOAP <br/> PACK
            </h4>

            {/* Decorative sticker */}
            <div className="absolute -top-6 -right-6 bg-y2k-blue text-y2k-black font-display rounded-full w-20 h-20 flex items-center justify-center rotate-12 shadow-lg border border-y2k-black text-center leading-none p-2">
              Our<br/>Price!
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

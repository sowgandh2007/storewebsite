import { motion } from "framer-motion";

export default function Marquee() {
  return (
    <div className="w-full bg-y2k-pink py-4 border-y border-y2k-black overflow-hidden flex whitespace-nowrap">
      <motion.div 
        animate={{ x: [0, -1035] }}
        transition={{ repeat: Infinity, ease: "linear", duration: 15 }}
        className="flex text-y2k-black font-display text-2xl tracking-widest uppercase"
      >
        <span className="mx-8">✦ PREMIUM WHOLESALE ✦</span>
        <span className="mx-8">DAILY ESSENTIALS</span>
        <span className="mx-8">✦ UNBEATABLE PRICES ✦</span>
        <span className="mx-8">ORDER ON WHATSAPP</span>
        
        {/* Duplicate for seamless looping */}
        <span className="mx-8">✦ PREMIUM WHOLESALE ✦</span>
        <span className="mx-8">DAILY ESSENTIALS</span>
        <span className="mx-8">✦ UNBEATABLE PRICES ✦</span>
        <span className="mx-8">ORDER ON WHATSAPP</span>
      </motion.div>
    </div>
  );
}

export default function Footer() {
  return (
    <footer className="bg-y2k-black text-y2k-cream pt-20 pb-10 px-6 mt-20 border-t border-y2k-chrome">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
        <div className="col-span-1 md:col-span-2">
          <h2 className="text-4xl md:text-6xl font-display uppercase tracking-widest mb-6">AVADHANULA STORES</h2>
          <p className="font-serif italic text-y2k-silver text-xl max-w-sm">
            Curating the finest daily appliances and wholesale essentials with an iconic aesthetic.
          </p>
        </div>
        
        <div className="flex flex-col space-y-4">
          <h3 className="font-bold uppercase tracking-widest text-y2k-pink">Shop</h3>
          <a href="#" className="text-y2k-silver hover:text-y2k-white transition-colors">All Products</a>
          <a href="#" className="text-y2k-silver hover:text-y2k-white transition-colors">New Arrivals</a>
          <a href="#" className="text-y2k-silver hover:text-y2k-white transition-colors">Collections</a>
          <a href="#" className="text-y2k-silver hover:text-y2k-white transition-colors">Sale</a>
        </div>

        <div className="flex flex-col space-y-4">
          <h3 className="font-bold uppercase tracking-widest text-y2k-pink">Support</h3>
          <a href="#" className="text-y2k-silver hover:text-y2k-white transition-colors">FAQ</a>
          <a href="#" className="text-y2k-silver hover:text-y2k-white transition-colors">Shipping & Returns</a>
          <a href="#" className="text-y2k-silver hover:text-y2k-white transition-colors">Contact Us</a>
          <a href="#" className="text-y2k-silver hover:text-y2k-white transition-colors">Privacy Policy</a>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto mt-20 pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center text-sm text-y2k-silver">
        <p>&copy; 2026 AVADHANULA STORES. ALL RIGHTS RESERVED.</p>
        <div className="flex space-x-6 mt-4 md:mt-0">
          <a href="#" className="hover:text-y2k-pink transition-colors">INSTAGRAM</a>
          <a href="#" className="hover:text-y2k-pink transition-colors">TIKTOK</a>
          <a href="#" className="hover:text-y2k-pink transition-colors">PINTEREST</a>
        </div>
      </div>
    </footer>
  );
}

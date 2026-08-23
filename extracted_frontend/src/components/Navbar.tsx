import { ShoppingBag, Search, Menu } from "lucide-react";
import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <nav className="fixed w-full top-0 z-50 bg-y2k-white/80 backdrop-blur-md border-b border-y2k-chrome transition-all">
      <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
        {/* Mobile Menu */}
        <div className="md:hidden flex items-center">
          <Menu className="w-6 h-6 text-y2k-black" />
        </div>

        {/* Logo */}
        <Link to="/" className="text-xl md:text-2xl font-display uppercase tracking-widest text-y2k-black hover:text-y2k-pink transition-colors">
          AVADHANULA STORES
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex space-x-8 items-center text-sm font-sans uppercase tracking-wider">
          <Link to="#" className="hover:text-y2k-pink transition-colors">Shop</Link>
          <Link to="#" className="hover:text-y2k-pink transition-colors">Collections</Link>
          <Link to="#" className="hover:text-y2k-pink transition-colors">New Arrivals</Link>
          <Link to="#" className="hover:text-y2k-pink transition-colors">About</Link>
        </div>

        {/* Icons */}
        <div className="flex items-center space-x-6">
          <button className="hover:text-y2k-pink transition-colors">
            <Search className="w-5 h-5" />
          </button>
          <button className="hover:text-y2k-pink transition-colors relative">
            <ShoppingBag className="w-5 h-5" />
            <span className="absolute -top-2 -right-2 bg-y2k-pink text-y2k-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">2</span>
          </button>
        </div>
      </div>
    </nav>
  );
}

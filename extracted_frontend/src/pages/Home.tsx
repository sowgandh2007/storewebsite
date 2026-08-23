import Hero from "../components/Hero";
import Marquee from "../components/Marquee";
import ProductGrid from "../components/ProductGrid";
import CollectionSection from "../components/CollectionSection";
import FeaturedProduct from "../components/FeaturedProduct";

export default function Home() {
  return (
    <div className="w-full">
      <Hero />
      <Marquee />
      <ProductGrid />
      <CollectionSection />
      <FeaturedProduct />
    </div>
  );
}

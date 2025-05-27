import SearchBar from "@/components/SearchBar";
import TrustedStores from "@/components/TrustedStores";
import HowItWorks from "@/components/HowItWorks";
import Features from "@/components/Features";
import Testimonials from "@/components/Testimonials";
import CallToAction from "@/components/CallToAction";
import { useSearch } from "@/hooks/useSearch";
import { useLocation } from "wouter";

interface HomeProps {
  setIsLoading: (isLoading: boolean) => void;
}

const Home = ({ setIsLoading }: HomeProps) => {
  const { handleSearch } = useSearch({ setIsLoading });
  const [, setLocation] = useLocation();

  const onSearch = async (query: string) => {
    try {
      const searchResults = await handleSearch(query);
      if (searchResults) {
        console.log("Search results:", searchResults);
        setLocation(`/compare?q=${encodeURIComponent(query)}`);
      }
    } catch (error) {
      console.error("Error during search:", error);
    }
  };

  return (
    <main className="flex-grow">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-blue-600 to-blue-500 text-white py-16 md:py-24">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10 pointer-events-none overflow-hidden">
          <div className="absolute -right-10 top-0 h-64 w-64 rounded-full bg-white"></div>
          <div className="absolute left-0 bottom-0 h-96 w-96 rounded-full bg-white"></div>
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">
              Find the Best Deals in a Byte!
            </h2>
            <p className="text-lg md:text-xl mb-10 text-blue-100">
              Compare prices, discover offers, and save money on products from
              Amazon, Flipkart, and more.
            </p>

            <SearchBar onSearch={onSearch} />
          </div>
        </div>
      </section>

      <TrustedStores />
      <HowItWorks />
      <Features />
      <Testimonials />
      <CallToAction />
    </main>
  );
};

export default Home;

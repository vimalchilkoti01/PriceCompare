import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import ProductCard from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";
import { ProductWithPrices } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";

interface CompareResultsProps {
  setIsLoading: (isLoading: boolean) => void;
}

const CompareResults = ({ setIsLoading }: CompareResultsProps) => {
  const [location, setLocation] = useLocation();
  const [sortOption, setSortOption] = useState("best-match");
  
  // Extract query parameter from URL
  const getQueryParam = () => {
    try {
      // Try using window.location.search for more reliable query param extraction
      const urlParams = new URLSearchParams(window.location.search);
      const queryParam = urlParams.get('q');
      return queryParam || "";
    } catch (error) {
      console.error("Error parsing search params:", error);
      return "";
    }
  };
  
  const query = getQueryParam();

  const { data, error, isLoading } = useQuery<{
    query: string;
    count: number;
    products: ProductWithPrices[];
  }>({
    queryKey: [`/api/search?q=${encodeURIComponent(query)}`],
    enabled: !!query,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    staleTime: 60000, // 1 minute
  });

  useEffect(() => {
    // Update the parent loading state (with a short delay to ensure data is processed)
    if (isLoading) {
      setIsLoading(true);
    } else {
      // Small delay to ensure the data is processed
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isLoading, setIsLoading]);
  
  // Log search results for debugging
  useEffect(() => {
    if (data) {
      console.log("Search results:", data);
    }
  }, [data]);

  // Redirect to home if no query
  useEffect(() => {
    if (!query) {
      setLocation('/');
    }
  }, [query, setLocation]);

  if (!query) {
    return null;
  }

  // Sort products based on selected option
  const sortedProducts = data?.products
    ? [...data.products].sort((a, b) => {
        if (!a.prices.length || !b.prices.length) return 0;
        
        // Find the lowest price for each product
        const aMinPrice = Math.min(...a.prices.map(p => p.price));
        const bMinPrice = Math.min(...b.prices.map(p => p.price));
        
        switch (sortOption) {
          case 'price-low-high':
            return aMinPrice - bMinPrice;
          case 'price-high-low':
            return bMinPrice - aMinPrice;
          case 'rating-high-low':
            // Find the highest rating for each product
            const aMaxRating = Math.max(...a.prices.map(p => p.rating || 0));
            const bMaxRating = Math.max(...b.prices.map(p => p.rating || 0));
            return bMaxRating - aMaxRating;
          case 'most-reviews':
            // Sum all review counts for each product
            const aReviews = a.prices.reduce((sum, p) => sum + (p.reviewCount || 0), 0);
            const bReviews = b.prices.reduce((sum, p) => sum + (p.reviewCount || 0), 0);
            return bReviews - aReviews;
          default: // best-match
            return 0;
        }
      })
    : [];

  return (
    <section className="py-10 px-4" id="search-results">
      <div className="container mx-auto">
        {/* Search Results Header */}
        <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center">
          <div>
            <h2 className="text-2xl font-bold mb-1">{query}</h2>
            {!isLoading && data && (
              <p className="text-gray-500">
                Found {data.count} results across multiple platforms
              </p>
            )}
            {isLoading && (
              <Skeleton className="h-5 w-64" />
            )}
          </div>

          {/* Filter Controls */}
          <div className="mt-4 md:mt-0 flex flex-wrap gap-2">
            <Select onValueChange={setSortOption} value={sortOption}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sort by: Best Match" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="best-match">Best Match</SelectItem>
                <SelectItem value="price-low-high">Price: Low to High</SelectItem>
                <SelectItem value="price-high-low">Price: High to Low</SelectItem>
                <SelectItem value="rating-high-low">Rating: High to Low</SelectItem>
                <SelectItem value="most-reviews">Most Reviews</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" size="default" className="flex items-center space-x-2">
              <Search className="h-4 w-4" />
              <span>Filters</span>
            </Button>
          </div>
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((item) => (
              <div key={item} className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200 p-6">
                <div className="flex items-start gap-4">
                  <Skeleton className="w-24 h-24 rounded-lg" />
                  <div className="flex-grow">
                    <Skeleton className="h-6 w-full mb-2" />
                    <Skeleton className="h-4 w-32 mb-2" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </div>
                <div className="flex justify-between items-end mt-4">
                  <div>
                    <Skeleton className="h-5 w-16 mb-2" />
                    <Skeleton className="h-7 w-24 mb-2" />
                    <Skeleton className="h-4 w-12" />
                  </div>
                  <Skeleton className="h-10 w-24" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="text-center py-10">
            <h3 className="text-xl font-semibold text-red-500 mb-2">Error Loading Results</h3>
            <p className="text-gray-600">We encountered a problem while searching. Please try again.</p>
            <Button 
              onClick={() => setLocation('/')}
              className="mt-4"
            >
              Return to Home
            </Button>
          </div>
        )}

        {/* Results grid */}
        {!isLoading && !error && data?.products && (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {sortedProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            {/* Empty state */}
            {sortedProducts.length === 0 && (
              <div className="text-center py-10">
                <h3 className="text-xl font-semibold mb-2">No Results Found</h3>
                <p className="text-gray-600 mb-4">We couldn't find any products matching your search.</p>
                <Button 
                  onClick={() => setLocation('/')}
                >
                  Try a Different Search
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
};

export default CompareResults;

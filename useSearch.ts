import { useState } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ProductWithPrices } from "@shared/schema";

interface SearchResult {
  query: string;
  count: number;
  products: ProductWithPrices[];
}

interface UseSearchProps {
  setIsLoading: (isLoading: boolean) => void;
}

export const useSearch = ({ setIsLoading }: UseSearchProps) => {
  const [searchResults, setSearchResults] = useState<SearchResult | null>(null);
  const { toast } = useToast();

  const handleSearch = async (query: string): Promise<SearchResult | null> => {
    if (!query.trim()) {
      toast({
        title: "Search Error",
        description: "Please enter a search term",
        variant: "destructive",
      });
      return null;
    }

    try {
      setIsLoading(true);
      const response = await apiRequest(
        "GET",
        `/api/search?q=${encodeURIComponent(query.trim())}`,
      );
      
      const data = await response.json();
      setSearchResults(data);
      return data;
    } catch (error) {
      console.error("Search error:", error);
      toast({
        title: "Search Failed",
        description: "We couldn't complete your search. Please try again.",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    searchResults,
    handleSearch,
  };
};

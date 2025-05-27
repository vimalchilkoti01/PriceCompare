// This file contains additional types for the client-side
import { ProductWithPrices } from "@shared/schema";

// Sort option types
export type SortOption = 
  | "best-match" 
  | "price-low-high" 
  | "price-high-low" 
  | "rating-high-low" 
  | "most-reviews";

// Search result type
export interface SearchResponse {
  query: string;
  count: number;
  products: ProductWithPrices[];
}

// Offer type
export interface Offer {
  description: string;
  expiryDate?: string;
}

import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertSearchHistorySchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Get all stores
  app.get("/api/stores", async (req: Request, res: Response) => {
    try {
      const stores = await storage.getAllStores();
      return res.json(stores);
    } catch (error) {
      console.error("Error fetching stores:", error);
      return res.status(500).json({ message: "Failed to fetch stores" });
    }
  });

  // Search products
  app.get("/api/search", async (req: Request, res: Response) => {
    try {
      const query = req.query.q as string;
      
      if (!query || query.trim() === "") {
        return res.status(400).json({ message: "Search query is required" });
      }
      
      // Add to search history
      await storage.addSearchHistory({
        userId: null, // Anonymous user
        query: query,
      });
      
      // Perform search
      const products = await storage.searchProducts(query);
      
      return res.json({
        query,
        count: products.length,
        products
      });
    } catch (error) {
      console.error("Error during search:", error);
      return res.status(500).json({ message: "Search failed" });
    }
  });

  // Get recent searches
  app.get("/api/recent-searches", async (req: Request, res: Response) => {
    try {
      const userId = req.query.userId ? parseInt(req.query.userId as string) : undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;
      
      const searches = await storage.getRecentSearches(userId, limit);
      
      return res.json(searches);
    } catch (error) {
      console.error("Error fetching recent searches:", error);
      return res.status(500).json({ message: "Failed to fetch recent searches" });
    }
  });
  
  // Route to get product by ID with prices
  app.get("/api/products/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid product ID" });
      }
      
      const product = await storage.getProduct(id);
      
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      const prices = await storage.getProductPricesByProductId(id);
      
      return res.json({
        ...product,
        prices
      });
    } catch (error) {
      console.error("Error fetching product:", error);
      return res.status(500).json({ message: "Failed to fetch product" });
    }
  });

  const httpServer = createServer(app);
  
  return httpServer;
}

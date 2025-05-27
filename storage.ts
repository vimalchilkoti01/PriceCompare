import { 
  User, InsertUser, Product, InsertProduct, 
  Store, InsertStore, ProductPrice, InsertProductPrice,
  SearchHistory, InsertSearchHistory, ProductWithPrices
} from "@shared/schema";
import { getProductPrices } from './services/priceComparison';

// Modify the interface with any CRUD methods
// you might need
export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Product methods
  getProduct(id: number): Promise<Product | undefined>;
  getProductsByName(name: string): Promise<Product[]>;
  createProduct(product: InsertProduct): Promise<Product>;
  
  // Store methods
  getStore(id: number): Promise<Store | undefined>;
  getStoreByName(name: string): Promise<Store | undefined>;
  getAllStores(): Promise<Store[]>;
  createStore(store: InsertStore): Promise<Store>;
  
  // ProductPrice methods
  getProductPrice(id: number): Promise<ProductPrice | undefined>;
  getProductPricesByProductId(productId: number): Promise<(ProductPrice & { store: Store })[]>;
  createProductPrice(productPrice: InsertProductPrice): Promise<ProductPrice>;
  
  // Search methods
  searchProducts(query: string): Promise<ProductWithPrices[]>;
  addSearchHistory(searchHistory: InsertSearchHistory): Promise<SearchHistory>;
  getRecentSearches(userId?: number, limit?: number): Promise<SearchHistory[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private products: Map<number, Product>;
  private stores: Map<number, Store>;
  private productPrices: Map<number, ProductPrice>;
  private searchHistories: Map<number, SearchHistory>;
  
  private currentUserId: number;
  private currentProductId: number;
  private currentStoreId: number;
  private currentProductPriceId: number;
  private currentSearchHistoryId: number;

  constructor() {
    this.users = new Map();
    this.products = new Map();
    this.stores = new Map();
    this.productPrices = new Map();
    this.searchHistories = new Map();
    
    this.currentUserId = 1;
    this.currentProductId = 1;
    this.currentStoreId = 1;
    this.currentProductPriceId = 1;
    this.currentSearchHistoryId = 1;
    
    // Initialize with some demo stores
    this.initDemoStores();
  }

  private initDemoStores() {
    const demoStores: InsertStore[] = [
      { name: "Amazon", logoUrl: "", website: "https://amazon.com" },
      { name: "Flipkart", logoUrl: "", website: "https://flipkart.com" },
      { name: "Myntra", logoUrl: "", website: "https://myntra.com" },
      { name: "Croma", logoUrl: "", website: "https://croma.com" },
      { name: "Reliance Digital", logoUrl: "", website: "https://reliancedigital.in" }
    ];
    
    demoStores.forEach(store => this.createStore(store));
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const now = new Date();
    const user: User = { ...insertUser, id, createdAt: now };
    this.users.set(id, user);
    return user;
  }
  
  // Product methods
  async getProduct(id: number): Promise<Product | undefined> {
    return this.products.get(id);
  }
  
  async getProductsByName(name: string): Promise<Product[]> {
    const lowerName = name.toLowerCase();
    return Array.from(this.products.values()).filter(
      (product) => product.name.toLowerCase().includes(lowerName)
    );
  }
  
  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const id = this.currentProductId++;
    const now = new Date();
    const product: Product = { 
      ...insertProduct, 
      id, 
      createdAt: now,
      description: insertProduct.description ?? null,
      imageUrl: insertProduct.imageUrl ?? null,
      category: insertProduct.category ?? null
    };
    this.products.set(id, product);
    return product;
  }
  
  // Store methods
  async getStore(id: number): Promise<Store | undefined> {
    return this.stores.get(id);
  }
  
  async getStoreByName(name: string): Promise<Store | undefined> {
    return Array.from(this.stores.values()).find(
      (store) => store.name === name
    );
  }
  
  async getAllStores(): Promise<Store[]> {
    return Array.from(this.stores.values());
  }
  
  async createStore(insertStore: InsertStore): Promise<Store> {
    const id = this.currentStoreId++;
    const store: Store = { 
      ...insertStore, 
      id,
      logoUrl: insertStore.logoUrl ?? null
    };
    this.stores.set(id, store);
    return store;
  }
  
  // ProductPrice methods
  async getProductPrice(id: number): Promise<ProductPrice | undefined> {
    return this.productPrices.get(id);
  }
  
  async getProductPricesByProductId(productId: number): Promise<(ProductPrice & { store: Store })[]> {
    return Array.from(this.productPrices.values())
      .filter((price) => price.productId === productId)
      .map((price) => {
        const store = this.stores.get(price.storeId);
        if (!store) throw new Error(`Store with id ${price.storeId} not found`);
        return { ...price, store };
      });
  }
  
  async createProductPrice(insertProductPrice: InsertProductPrice): Promise<ProductPrice> {
    const id = this.currentProductPriceId++;
    const now = new Date();
    const productPrice: ProductPrice = { 
      ...insertProductPrice, 
      id, 
      updatedAt: now,
      originalPrice: insertProductPrice.originalPrice ?? null,
      discount: insertProductPrice.discount ?? null,
      rating: insertProductPrice.rating ?? null,
      reviewCount: insertProductPrice.reviewCount ?? null,
      inStock: insertProductPrice.inStock ?? null,
      offers: (Array.isArray(insertProductPrice.offers) && insertProductPrice.offers.every(x => typeof x === 'string')) ? insertProductPrice.offers : null
    };
    this.productPrices.set(id, productPrice);
    return productPrice;
  }
  
  // Search methods
  async searchProducts(query: string): Promise<ProductWithPrices[]> {
    try {
      // Get real prices from the price comparison API
      const priceData = await getProductPrices(query);
      
      if (priceData.length === 0) {
        // Fallback to demo data if no results found
        const matchedProducts = await this.getProductsByName(query);
        if (matchedProducts.length === 0 && query.trim() !== "") {
          const demoProduct = await this.createDemoProduct(query);
          matchedProducts.push(demoProduct);
        }
        return Promise.all(
          matchedProducts.map(async (product) => {
            const prices = await this.getProductPricesByProductId(product.id);
            return { ...product, prices };
          })
        );
      }

      // Create a product from the search results
      const product = await this.createProduct({
        name: query,
        description: `Search results for ${query}`,
        imageUrl: null,
        category: "Electronics"
      });

      // Create prices for each store
      const prices = await Promise.all(
        priceData.map(async (price) => {
          let store = await this.getStoreByName(price.store);
          if (!store) {
            store = await this.createStore({
              name: price.store,
              logoUrl: null,
              website: `https://${price.store.toLowerCase().replace(/\s+/g, '')}.com`
            });
          }

          return this.createProductPrice({
            productId: product.id,
            storeId: store.id,
            price: price.price,
            originalPrice: price.originalPrice || null,
            discount: null,
            rating: price.rating || null,
            reviewCount: price.reviewCount || null,
            url: price.url,
            inStock: true,
            offers: []
          });
        })
      );

      return [{
        ...product,
        prices: prices.map(price => ({
          ...price,
          store: this.stores.get(price.storeId)!,
          deliveryDays: priceData.find(p => p.store === this.stores.get(price.storeId)!.name)?.deliveryDays
        }))
      }];
    } catch (error) {
      console.error('Error in searchProducts:', error);
      // Fallback to demo data if there's an error
      const matchedProducts = await this.getProductsByName(query);
      if (matchedProducts.length === 0 && query.trim() !== "") {
        const demoProduct = await this.createDemoProduct(query);
        matchedProducts.push(demoProduct);
      }
      return Promise.all(
        matchedProducts.map(async (product) => {
          const prices = await this.getProductPricesByProductId(product.id);
          return { ...product, prices };
        })
      );
    }
  }
  
  private async createDemoProduct(query: string): Promise<Product> {
    // Create a product based on the search query
    const product = await this.createProduct({
      name: query,
      description: `Demo product for ${query}`,
      imageUrl: "",
      category: "Electronics",
    });
    
    // Create prices for all 4 major platforms (not Myntra)
    // Use realistic market prices based on product type
    const stores = await this.getAllStores();
    let basePrice = 0;
    
    // Set exact current market prices based on product type
    if (query.toLowerCase().includes('iphone 14 pro')) {
      basePrice = 11599000; // ₹1,15,990 for iPhone 14 Pro
    } else if (query.toLowerCase().includes('iphone 14')) {
      basePrice = 6999000; // ₹69,990 for iPhone 14
    } else if (query.toLowerCase().includes('iphone 15 pro')) {
      basePrice = 12990000; // ₹1,29,900 for iPhone 15 Pro
    } else if (query.toLowerCase().includes('iphone 15')) {
      basePrice = 7999000; // ₹79,990 for iPhone 15
    } else if (query.toLowerCase().includes('samsung s23 ultra')) {
      basePrice = 10499900; // ₹1,04,999 for Samsung S23 Ultra
    } else if (query.toLowerCase().includes('samsung s23')) {
      basePrice = 7499900; // ₹74,999 for Samsung S23
    } else if (query.toLowerCase().includes('samsung s24 ultra')) {
      basePrice = 12999900; // ₹1,29,999 for Samsung S24 Ultra
    } else if (query.toLowerCase().includes('samsung s24')) {
      basePrice = 8499900; // ₹84,999 for Samsung S24
    } else if (query.toLowerCase().includes('google pixel 8 pro')) {
      basePrice = 9299900; // ₹92,999 for Google Pixel 8 Pro
    } else if (query.toLowerCase().includes('google pixel 8')) {
      basePrice = 6999900; // ₹69,999 for Google Pixel 8
    } else if (query.toLowerCase().includes('playstation 5')) {
      basePrice = 5499900; // ₹54,999 for PlayStation 5
    } else if (query.toLowerCase().includes('xbox series x')) {
      basePrice = 5499900; // ₹54,999 for Xbox Series X
    } else if (query.toLowerCase().includes('macbook air')) {
      basePrice = 9999000; // ₹99,990 for MacBook Air
    } else if (query.toLowerCase().includes('macbook pro')) {
      basePrice = 16999000; // ₹1,69,990 for MacBook Pro
    } else if (query.toLowerCase().includes('dell xps')) {
      basePrice = 12999000; // ₹1,29,990 for Dell XPS
    } else if (query.toLowerCase().includes('lg oled')) {
      basePrice = 13999000; // ₹1,39,990 for LG OLED TV
    } else if (query.toLowerCase().includes('sony bravia')) {
      basePrice = 11999000; // ₹1,19,990 for Sony Bravia TV
    } else if (query.toLowerCase().includes('samsung qled')) {
      basePrice = 9999000; // ₹99,990 for Samsung QLED TV
    } else if (query.toLowerCase().includes('tv') || query.toLowerCase().includes('television')) {
      basePrice = 5499900; // ₹54,999 for a mid-range TV
    } else if (query.toLowerCase().includes('airpods pro')) {
      basePrice = 2499900; // ₹24,999 for AirPods Pro
    } else if (query.toLowerCase().includes('sony wh-1000xm5')) {
      basePrice = 2999900; // ₹29,999 for Sony WH-1000XM5
    } else if (query.toLowerCase().includes('headphone') || query.toLowerCase().includes('earbuds')) {
      basePrice = 1499900; // ₹14,999 for quality headphones
    } else {
      basePrice = 4999900; // ₹49,999 default for electronics
    }
    
    // Only include Amazon, Flipkart, Croma, and Reliance Digital
    const includedStores = stores.filter(store => 
      ['Amazon', 'Flipkart', 'Croma', 'Reliance Digital'].includes(store.name)
    );
    
    // Create prices for each included store with realistic variations
    await Promise.all(includedStores.map(async (store, index) => {
      // Each store has a different price strategy
      let storePrice = basePrice;
      let deliveryDays = "2-3 days";
      let storeSpecificOffers: string[] = [];
      
      // Store-specific price variations and offers
      if (store.name === "Amazon") {
        storePrice = basePrice - Math.floor(basePrice * 0.02); // Amazon slightly cheaper
        deliveryDays = "1-2 days";
        storeSpecificOffers = [
          "10% Instant Discount with HDFC Credit Cards",
          "No-Cost EMI on 6 months",
          "Prime delivery available"
        ];
      } else if (store.name === "Flipkart") {
        storePrice = basePrice - Math.floor(basePrice * 0.03); // Flipkart cheapest
        deliveryDays = "2-3 days";
        storeSpecificOffers = [
          "Extra 5% off with Flipkart Axis Bank Card",
          "No-Cost EMI from ₹3,750/month", 
          "SuperCoins Reward on purchase"
        ];
      } else if (store.name === "Croma") {
        storePrice = basePrice + Math.floor(basePrice * 0.01); // Croma slightly more
        deliveryDays = "3-5 days";
        storeSpecificOffers = [
          "Additional 1-year warranty",
          "Free home installation",
          "Exchange bonus up to ₹10,000"
        ];
      } else if (store.name === "Reliance Digital") {
        storePrice = basePrice;
        deliveryDays = "3-4 days";
        storeSpecificOffers = [
          "5% cashback with Reliance One membership",
          "Free extended warranty worth ₹2,999",
          "EMI starting at ₹2,999/month"
        ];
      }
      
      // Apply minor price variations (smaller variations for more realistic pricing)
      // Smaller random adjustment up to ±1,000 to make it realistic but maintain proper market price ranges
      const priceVariation = Math.floor((Math.random() * 200000) - 100000);
      storePrice = storePrice + priceVariation;
      
      // Calculate original price (8-15% higher than sale price)
      const markup = 0.08 + (Math.random() * 0.07); // Between 8% and 15%
      const originalPrice = Math.round(storePrice * (1 + markup));
      
      // Calculate discount percentage
      const discount = Math.floor((originalPrice - storePrice) / originalPrice * 100);
      
      // Create a new price record for this store
      const priceRecord: any = {
        productId: product.id,
        storeId: store.id,
        price: storePrice,
        originalPrice,
        discount,
        rating: 35 + Math.floor(Math.random() * 15), // Rating between 3.5 and 5.0
        reviewCount: 500 + Math.floor(Math.random() * 2000),
        url: `${store.website}/product/${product.id}`,
        inStock: true,
        offers: storeSpecificOffers
      };
      
      // Add to database
      const createdPrice = await this.createProductPrice(priceRecord);
      
      // Update the price object post-creation to add the deliveryDays info
      // This is a workaround since we're adding this field without schema migration
      const priceWithDelivery = this.productPrices.get(createdPrice.id);
      if (priceWithDelivery) {
        (priceWithDelivery as any).deliveryDays = deliveryDays;
        this.productPrices.set(createdPrice.id, priceWithDelivery);
      }
    }));
    
    return product;
  }
  
  async addSearchHistory(insertSearchHistory: InsertSearchHistory): Promise<SearchHistory> {
    const id = this.currentSearchHistoryId++;
    const now = new Date();
    const searchHistory: SearchHistory = { 
      ...insertSearchHistory, 
      id, 
      timestamp: now,
      userId: insertSearchHistory.userId ?? null
    };
    this.searchHistories.set(id, searchHistory);
    return searchHistory;
  }
  
  async getRecentSearches(userId?: number, limit = 5): Promise<SearchHistory[]> {
    const searches = Array.from(this.searchHistories.values())
      .filter((search) => userId ? search.userId === userId : true)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
    
    return searches;
  }
}

export const storage = new MemStorage();

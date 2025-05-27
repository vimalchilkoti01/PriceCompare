import axios from 'axios';

interface PriceData {
  store: string;
  price: number;
  originalPrice?: number;
  url: string;
  rating?: number;
  reviewCount?: number;
  deliveryDays?: string;
}

export async function getProductPrices(query: string): Promise<PriceData[]> {
  const amazonPrices = await getAmazonProductPrices(query);
  const flipkartPrices = await getFlipkartProductPrices(query);
  const reliancePrices = await getRelianceDigitalPrices(query);

  // Combine and return results from all sources
  return [...amazonPrices, ...flipkartPrices, ...reliancePrices];
}

// --- New function for fetching Flipkart prices ---
async function getFlipkartProductPrices(query: string): Promise<PriceData[]> {
  try {
    const FLIPKART_RAPIDAPI_KEY = process.env.FLIPKART_RAPIDAPI_KEY;
    if (!FLIPKART_RAPIDAPI_KEY) {
      console.error('FLIPKART_RAPIDAPI_KEY is not configured');
      return []; // Return empty array if key is missing
    }

    // Based on the RapidAPI image, using the Product Search endpoint
    const options = {
      method: 'GET',
      url: 'https://real-time-flipkart-api.p.rapidapi.com/product-search', // Assuming this is the search endpoint
      params: {
        q: query, // Assuming 'q' is the query parameter name based on common API practices
        count: '10', // Example: fetch up to 10 results
        sort: 'relevance' // Example: sort by relevance
      },
      headers: {
        'X-RapidAPI-Key': FLIPKART_RAPIDAPI_KEY,
        'X-RapidAPI-Host': 'real-time-flipkart-api.p.rapidapi.com'
      }
    };

    const response = await axios.request(options);
    const products = response.data?.products; // Assuming the response has a 'products' array

    if (!products || !Array.isArray(products)) {
      console.error('Invalid response from Flipkart API');
      return []; // Return empty array on invalid response
    }

    // TODO: Map Flipkart response fields to PriceData interface.
    // This mapping is based on assumptions about the Flipkart API response structure.
    // You may need to adjust field names like item.price, item.url, etc.,
    // based on the actual API documentation or response examples.
    return products.map(item => ({
      store: 'Flipkart',
      // Corrected mapping based on the provided JSON response structure
      price: item.price || 0,
      originalPrice: item.mrp || undefined, // Use undefined if mrp is null/not present
      url: item.url || '',
      rating: item.rating?.average || undefined, // Use optional chaining and undefined for rating
      reviewCount: item.rating?.reviewCount || undefined, // Use optional chaining and undefined for review count
      deliveryDays: undefined // Not available in this response structure
    })).filter(item => item.price > 0);

  } catch (error) {
    console.error('Error fetching Flipkart prices:', error);
    return []; // Return empty array on error
  }
}

async function getAmazonProductPrices(query: string): Promise<PriceData[]> {
  try {
    const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
    if (!RAPIDAPI_KEY) {
      throw new Error('RAPIDAPI_KEY is not configured');
    }

    // Using Amazon Price API from RapidAPI
    const options = {
      method: 'GET',
      url: 'https://amazon-price1.p.rapidapi.com/search',
      params: {
        keywords: query,
        marketplace: 'IN' // India marketplace
      },
      headers: {
        'X-RapidAPI-Key': RAPIDAPI_KEY,
        'X-RapidAPI-Host': 'amazon-price1.p.rapidapi.com'
      }
    };

    const response = await axios.request(options);
    const products = response.data;

    if (!products || !Array.isArray(products)) {
      throw new Error('Invalid response from Amazon API');
    }

    // Transform the API response to match our PriceData interface
    return products.map(item => ({
      store: 'Amazon',
      price: item.price?.current_price || 0,
      originalPrice: item.price?.original_price,
      url: item.url || '',
      rating: item.rating?.average_rating,
      reviewCount: item.rating?.total_reviews,
      deliveryDays: item.delivery?.delivery_time || '2-3 days'
    })).filter(item => item.price > 0); // Only include items with valid prices

  } catch (error) {
    console.error('Error in getProductPrices:', error);
    throw new Error('Failed to fetch product prices');
  }
}

async function getRelianceDigitalPrices(query: string): Promise<PriceData[]> {
  try {
    const RELIANCE_RAPIDAPI_KEY = process.env.RELIANCE_RAPIDAPI_KEY;
    if (!RELIANCE_RAPIDAPI_KEY) {
      console.error('RELIANCE_RAPIDAPI_KEY is not configured');
      return []; // Return empty array if key is missing
    }

    const options = {
      method: 'GET',
      url: 'https://reliance-digital-api.p.rapidapi.com/search',
      params: {
        query: query,
        limit: '10'
      },
      headers: {
        'X-RapidAPI-Key': RELIANCE_RAPIDAPI_KEY,
        'X-RapidAPI-Host': 'reliance-digital-api.p.rapidapi.com'
      }
    };

    const response = await axios.request(options);
    const products = response.data?.products;

    if (!products || !Array.isArray(products)) {
      console.error('Invalid response from Reliance Digital API');
      return [];
    }

    return products.map(item => ({
      store: 'Reliance Digital',
      price: item.currentPrice || 0,
      originalPrice: item.mrp || undefined,
      url: item.productUrl || '',
      rating: item.rating?.average || undefined,
      reviewCount: item.rating?.count || undefined,
      deliveryDays: item.deliveryTime || '2-3 days'
    })).filter(item => item.price > 0);

  } catch (error) {
    console.error('Error fetching Reliance Digital prices:', error);
    return []; // Return empty array on error
  }
} 
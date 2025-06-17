import axios, { AxiosResponse } from 'axios';
import { Restaurant, YelpSearchResponse, yelpBusinessToRestaurant } from '../types/Restaurant';

const YELP_API_KEY = 'h3x9SRiBhdAEYRLhBISqxbE0vNmTLfmPcsF57gczs3_m6c0125FXex5R7FsvXJbdbBMN8E8R8VyB7Sm86GKc3zctc2PTVmmy7K1fuBzKasuxHw7L9CHm-zfwByE-aHYx';
const YELP_BASE_URL = 'https://api.yelp.com/v3';

export interface YelpSearchParams {
  latitude: number;
  longitude: number;
  radius?: number;
  categories?: string;
  price?: string;
  limit?: number;
  openNow?: boolean;
  sortBy?: 'best_match' | 'rating' | 'review_count' | 'distance';
}

class YelpService {
  private static instance: YelpService;
  
  private constructor() {
    // Configure axios defaults
    axios.defaults.headers.common['Authorization'] = `Bearer ${YELP_API_KEY}`;
    axios.defaults.timeout = 10000; // 10 second timeout
  }
  
  public static getInstance(): YelpService {
    if (!YelpService.instance) {
      YelpService.instance = new YelpService();
    }
    return YelpService.instance;
  }
  
  /**
   * Search for restaurants using Yelp API
   */
  async searchRestaurants(params: YelpSearchParams): Promise<Restaurant[]> {
    try {
      if (!YELP_API_KEY || YELP_API_KEY === 'YOUR_YELP_API_KEY') {
        throw new Error('Yelp API key is not configured');
      }
      
      const searchParams = {
        latitude: params.latitude,
        longitude: params.longitude,
        radius: params.radius || 10000, // 10km default
        categories: params.categories || 'restaurants',
        price: params.price || '1,2,3,4',
        limit: params.limit || 50,
        open_now: params.openNow ?? true,
        sort_by: params.sortBy || 'distance'
      };
      
      console.log('🔍 Searching restaurants with params:', searchParams);
      
      const response: AxiosResponse<YelpSearchResponse> = await axios.get(
        `${YELP_BASE_URL}/businesses/search`,
        { params: searchParams }
      );
      
      if (!response.data.businesses) {
        throw new Error('No businesses found in response');
      }
      
      const restaurants = response.data.businesses.map(yelpBusinessToRestaurant);
      
      console.log(`✅ Found ${restaurants.length} restaurants`);
      return restaurants;
      
    } catch (error) {
      console.error('❌ Error searching restaurants:', error);
      
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          throw new Error('Invalid Yelp API key');
        } else if (error.response?.status === 403) {
          throw new Error('Yelp API access forbidden');
        } else if (error.response?.status === 429) {
          throw new Error('Yelp API rate limit exceeded');
        } else if (error.response?.status >= 500) {
          throw new Error('Yelp API server error');
        }
      }
      
      throw new Error(`Failed to search restaurants: ${error.message}`);
    }
  }
  
  /**
   * Get detailed information about a specific restaurant
   */
  async getRestaurantDetails(restaurantId: string): Promise<Restaurant> {
    try {
      if (!YELP_API_KEY || YELP_API_KEY === 'YOUR_YELP_API_KEY') {
        throw new Error('Yelp API key is not configured');
      }
      
      console.log(`🔍 Getting details for restaurant: ${restaurantId}`);
      
      const response = await axios.get(`${YELP_BASE_URL}/businesses/${restaurantId}`);
      
      const restaurant = yelpBusinessToRestaurant(response.data);
      
      console.log(`✅ Got restaurant details: ${restaurant.name}`);
      return restaurant;
      
    } catch (error) {
      console.error('❌ Error getting restaurant details:', error);
      
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          throw new Error('Restaurant not found');
        } else if (error.response?.status === 401) {
          throw new Error('Invalid Yelp API key');
        }
      }
      
      throw new Error(`Failed to get restaurant details: ${error.message}`);
    }
  }
  
  /**
   * Search restaurants near a specific location with user preferences
   */
  async searchNearby(
    latitude: number,
    longitude: number,
    userPreferences?: {
      radius?: number;
      priceRange?: string[];
      cuisines?: string[];
      openNow?: boolean;
    }
  ): Promise<Restaurant[]> {
    const params: YelpSearchParams = {
      latitude,
      longitude,
      radius: userPreferences?.radius || 5000, // 5km default
      openNow: userPreferences?.openNow ?? true,
      limit: 50
    };
    
    // Add price range filter - convert $ symbols to numbers
    if (userPreferences?.priceRange && userPreferences.priceRange.length > 0) {
      const priceNumbers = userPreferences.priceRange.map(price => {
        switch (price) {
          case '$': return '1';
          case '$$': return '2';
          case '$$$': return '3';
          case '$$$$': return '4';
          default: return price;
        }
      });
      params.price = priceNumbers.join(',');
    }
    
    // Add cuisine preferences (map to Yelp categories)
    if (userPreferences?.cuisines && userPreferences.cuisines.length > 0) {
      // Filter out 'restaurants' as it's too broad, use specific cuisines only
      const specificCuisines = userPreferences.cuisines.filter(c => c !== 'restaurants');
      if (specificCuisines.length > 0) {
        params.categories = specificCuisines.join(',');
      } else {
        params.categories = 'restaurants';
      }
    }
    
    return this.searchRestaurants(params);
  }
}

export default YelpService.getInstance(); 
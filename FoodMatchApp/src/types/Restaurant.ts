export interface Restaurant {
  id: string;
  name: string;
  imageUrl: string;
  rating: number;
  reviewCount: number;
  categories: string[];
  price: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  latitude: number;
  longitude: number;
  distance: number;
  isOpen: boolean;
  url: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  preferredRadius: number;
  priceRange: string[];
  cuisinePreferences: string[];
  groupIds: string[];
  location?: {
    latitude: number;
    longitude: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface Swipe {
  id: string;
  userId: string;
  restaurantId: string;
  direction: 'like' | 'pass';
  timestamp: Date;
  sessionId: string;
}

export interface Match {
  id: string;
  restaurant: Restaurant;
  users: User[];
  timestamp: Date;
  groupId?: string;
}

export interface SwipeSession {
  id: string;
  userId: string;
  location: {
    latitude: number;
    longitude: number;
  };
  restaurants: Restaurant[];
  currentIndex: number;
  swipes: Swipe[];
  createdAt: Date;
}

// Yelp API Response Types
export interface YelpSearchResponse {
  businesses: YelpBusiness[];
  total: number;
  region: {
    center: {
      latitude: number;
      longitude: number;
    };
  };
}

export interface YelpBusiness {
  id: string;
  alias: string;
  name: string;
  image_url: string;
  is_closed: boolean;
  url: string;
  review_count: number;
  categories: Array<{
    alias: string;
    title: string;
  }>;
  rating: number;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  transactions: string[];
  price?: string;
  location: {
    address1: string;
    address2?: string;
    address3?: string;
    city: string;
    zip_code: string;
    country: string;
    state: string;
    display_address: string[];
  };
  phone: string;
  display_phone: string;
  distance: number;
}

// Helper function to convert Yelp data to Restaurant
export const yelpBusinessToRestaurant = (business: YelpBusiness): Restaurant => {
  return {
    id: business.id,
    name: business.name,
    imageUrl: business.image_url || 'https://via.placeholder.com/300x200?text=No+Image',
    rating: business.rating,
    reviewCount: business.review_count,
    categories: business.categories.map(cat => cat.title),
    price: business.price || '$',
    phone: business.display_phone || business.phone,
    address: business.location.address1 || '',
    city: business.location.city,
    state: business.location.state,
    zipCode: business.location.zip_code,
    latitude: business.coordinates.latitude,
    longitude: business.coordinates.longitude,
    distance: Math.round(business.distance),
    isOpen: !business.is_closed,
    url: business.url
  };
}; 
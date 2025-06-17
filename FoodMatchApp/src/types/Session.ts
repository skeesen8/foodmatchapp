export interface SwipeSession {
  id: string;
  roomCode: string;
  hostUserId: string;
  participants: SessionParticipant[];
  filters: SessionFilters;
  restaurants: string[]; // Restaurant IDs
  matches: SessionMatch[];
  status: 'waiting' | 'active' | 'completed';
  createdAt: Date;
  location: {
    latitude: number;
    longitude: number;
    address?: string;
  };
}

export interface SessionParticipant {
  userId: string;
  username: string;
  isHost: boolean;
  joinedAt: Date;
  swipes: { [restaurantId: string]: 'like' | 'pass' };
  isReady: boolean;
}

export interface SessionFilters {
  radius: number; // in meters
  priceRange: string[]; // ['$', '$$', '$$$', '$$$$']
  categories: string[]; // cuisine types
  openNow: boolean;
  minRating: number;
  maxResults: number;
}

export interface SessionMatch {
  restaurantId: string;
  participantIds: string[];
  timestamp: Date;
  isChosen: boolean; // if this is the final choice
}

export interface UserProfile {
  id: string;
  username: string;
  email?: string;
  preferences: SessionFilters;
  createdAt: Date;
}

// Default filter settings
export const DEFAULT_FILTERS: SessionFilters = {
  radius: 5000, // 5km
  priceRange: ['$', '$$', '$$$'],
  categories: ['restaurants'],
  openNow: true,
  minRating: 3.0,
  maxResults: 50
};

// Utility functions
export const generateRoomCode = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

export const generateUserId = (): string => {
  return Math.random().toString(36).substr(2, 9).toUpperCase();
}; 
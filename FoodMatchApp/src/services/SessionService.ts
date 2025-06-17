import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  SwipeSession,
  SessionParticipant,
  SessionFilters,
  SessionMatch,
  UserProfile,
  DEFAULT_FILTERS,
  generateRoomCode,
  generateUserId
} from '../types/Session';
import { Restaurant } from '../types/Restaurant';

const SESSIONS_KEY = '@nomnom_sessions';
const USER_PROFILE_KEY = '@nomnom_user';
const CURRENT_SESSION_KEY = '@nomnom_current_session';

class SessionService {
  private static instance: SessionService;
  private sessions: { [sessionId: string]: SwipeSession } = {};
  private currentUser: UserProfile | null = null;

  private constructor() {
    this.loadFromStorage();
  }

  public static getInstance(): SessionService {
    if (!SessionService.instance) {
      SessionService.instance = new SessionService();
    }
    return SessionService.instance;
  }

  // Load data from AsyncStorage
  private async loadFromStorage() {
    try {
      const [sessionsData, userData] = await Promise.all([
        AsyncStorage.getItem(SESSIONS_KEY),
        AsyncStorage.getItem(USER_PROFILE_KEY)
      ]);

      if (sessionsData) {
        this.sessions = JSON.parse(sessionsData);
      }

      if (userData) {
        this.currentUser = JSON.parse(userData);
      }
    } catch (error) {
      console.error('Error loading from storage:', error);
    }
  }

  // Save sessions to AsyncStorage
  private async saveSessionsToStorage() {
    try {
      await AsyncStorage.setItem(SESSIONS_KEY, JSON.stringify(this.sessions));
    } catch (error) {
      console.error('Error saving sessions:', error);
    }
  }

  // Save user profile to AsyncStorage
  private async saveUserToStorage() {
    try {
      if (this.currentUser) {
        await AsyncStorage.setItem(USER_PROFILE_KEY, JSON.stringify(this.currentUser));
      }
    } catch (error) {
      console.error('Error saving user:', error);
    }
  }

  // Get or create user profile
  async getCurrentUser(): Promise<UserProfile> {
    if (!this.currentUser) {
      // Generate a random username
      const adjectives = ['Hungry', 'Foodie', 'Chef', 'Tasty', 'Spicy', 'Sweet', 'Crispy', 'Fresh'];
      const nouns = ['Panda', 'Tiger', 'Eagle', 'Shark', 'Dragon', 'Phoenix', 'Wolf', 'Bear'];
      const username = `${adjectives[Math.floor(Math.random() * adjectives.length)]}${nouns[Math.floor(Math.random() * nouns.length)]}${Math.floor(Math.random() * 1000)}`;

      this.currentUser = {
        id: generateUserId(),
        username,
        preferences: { ...DEFAULT_FILTERS },
        createdAt: new Date()
      };
      await this.saveUserToStorage();
    }
    return this.currentUser;
  }

  // Update user profile
  async updateUser(updates: Partial<UserProfile>): Promise<UserProfile> {
    if (!this.currentUser) {
      await this.getCurrentUser();
    }
    
    this.currentUser = { ...this.currentUser!, ...updates };
    await this.saveUserToStorage();
    return this.currentUser;
  }

  // Create a new session
  async createSession(
    location: { latitude: number; longitude: number; address?: string },
    filters: SessionFilters = DEFAULT_FILTERS
  ): Promise<SwipeSession> {
    const user = await this.getCurrentUser();
    const roomCode = generateRoomCode();
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const session: SwipeSession = {
      id: sessionId,
      roomCode,
      hostUserId: user.id,
      participants: [{
        userId: user.id,
        username: user.username,
        isHost: true,
        joinedAt: new Date(),
        swipes: {},
        isReady: false
      }],
      filters,
      restaurants: [],
      matches: [],
      status: 'waiting',
      createdAt: new Date(),
      location
    };

    this.sessions[sessionId] = session;
    await this.saveSessionsToStorage();
    await AsyncStorage.setItem(CURRENT_SESSION_KEY, sessionId);

    console.log(`📱 Created session with room code: ${roomCode}`);
    return session;
  }

  // Join an existing session
  async joinSession(roomCode: string): Promise<SwipeSession | null> {
    const user = await this.getCurrentUser();
    
    // Find session by room code
    const session = Object.values(this.sessions).find(s => 
      s.roomCode === roomCode.toUpperCase() && s.status !== 'completed'
    );

    if (!session) {
      throw new Error('Session not found or has ended');
    }

    // Check if user is already in session
    const existingParticipant = session.participants.find(p => p.userId === user.id);
    if (existingParticipant) {
      await AsyncStorage.setItem(CURRENT_SESSION_KEY, session.id);
      return session;
    }

    // Add user to session
    session.participants.push({
      userId: user.id,
      username: user.username,
      isHost: false,
      joinedAt: new Date(),
      swipes: {},
      isReady: false
    });

    this.sessions[session.id] = session;
    await this.saveSessionsToStorage();
    await AsyncStorage.setItem(CURRENT_SESSION_KEY, session.id);

    console.log(`👋 Joined session: ${roomCode}`);
    return session;
  }

  // Get current session
  async getCurrentSession(): Promise<SwipeSession | null> {
    try {
      const sessionId = await AsyncStorage.getItem(CURRENT_SESSION_KEY);
      if (sessionId && this.sessions[sessionId]) {
        return this.sessions[sessionId];
      }
    } catch (error) {
      console.error('Error getting current session:', error);
    }
    return null;
  }

  // Update session restaurants
  async updateSessionRestaurants(sessionId: string, restaurants: Restaurant[]): Promise<void> {
    if (this.sessions[sessionId]) {
      this.sessions[sessionId].restaurants = restaurants.map(r => r.id);
      this.sessions[sessionId].status = 'active';
      await this.saveSessionsToStorage();
    }
  }

  // Record a swipe
  async recordSwipe(sessionId: string, restaurantId: string, direction: 'like' | 'pass'): Promise<SessionMatch[]> {
    const user = await this.getCurrentUser();
    const session = this.sessions[sessionId];
    
    if (!session) {
      throw new Error('Session not found');
    }

    // Find participant and record swipe
    const participant = session.participants.find(p => p.userId === user.id);
    if (!participant) {
      throw new Error('User not in session');
    }

    participant.swipes[restaurantId] = direction;

    // Check for matches (all participants liked this restaurant)
    if (direction === 'like') {
      const likedBy = session.participants.filter(p => 
        p.swipes[restaurantId] === 'like'
      );

      // If all participants have swiped and liked this restaurant
      if (likedBy.length === session.participants.length) {
        const existingMatch = session.matches.find(m => m.restaurantId === restaurantId);
        if (!existingMatch) {
          session.matches.push({
            restaurantId,
            participantIds: likedBy.map(p => p.userId),
            timestamp: new Date(),
            isChosen: false
          });
          console.log(`🎉 New match found for restaurant: ${restaurantId}`);
        }
      }
    }

    await this.saveSessionsToStorage();
    return session.matches;
  }

  // Mark a match as the chosen restaurant
  async chooseRestaurant(sessionId: string, restaurantId: string): Promise<void> {
    const session = this.sessions[sessionId];
    if (!session) return;

    // Mark this match as chosen and others as not chosen
    session.matches.forEach(match => {
      match.isChosen = match.restaurantId === restaurantId;
    });

    session.status = 'completed';
    await this.saveSessionsToStorage();
  }

  // Leave current session
  async leaveSession(): Promise<void> {
    await AsyncStorage.removeItem(CURRENT_SESSION_KEY);
  }

  // Get session by ID
  getSession(sessionId: string): SwipeSession | null {
    return this.sessions[sessionId] || null;
  }

  // Update session filters
  async updateSessionFilters(sessionId: string, filters: SessionFilters): Promise<void> {
    if (this.sessions[sessionId]) {
      this.sessions[sessionId].filters = filters;
      await this.saveSessionsToStorage();
    }
  }
}

export default SessionService.getInstance(); 
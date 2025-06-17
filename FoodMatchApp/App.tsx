import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  StatusBar,
  Alert,
  Text,
  SafeAreaView
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import HomeScreen from './src/screens/HomeScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import SwipeView from './src/components/SwipeView';
import { Restaurant } from './src/types/Restaurant';
import { SwipeSession } from './src/types/Session';
import SessionService from './src/services/SessionService';
import YelpService from './src/services/YelpService';

const Tab = createBottomTabNavigator();

type AppState = 'home' | 'swiping' | 'matches';

export default function App() {
  const [appState, setAppState] = useState<AppState>('home');
  const [currentSession, setCurrentSession] = useState<SwipeSession | null>(null);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [matches, setMatches] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkExistingSession();
  }, []);

  const checkExistingSession = async () => {
    try {
      const session = await SessionService.getCurrentSession();
      if (session && session.status !== 'completed') {
        setCurrentSession(session);
        if (session.status === 'active') {
          // Load restaurants for existing session
          await loadSessionRestaurants(session);
        }
      }
    } catch (error) {
      console.error('Error checking existing session:', error);
    }
  };

  const loadSessionRestaurants = async (session: SwipeSession) => {
    try {
      setLoading(true);
      
      // Get restaurants based on session location and filters
      const restaurantList = await YelpService.searchNearby(
        session.location.latitude,
        session.location.longitude,
        {
          radius: session.filters.radius,
          priceRange: session.filters.priceRange,
          cuisines: session.filters.categories,
          openNow: session.filters.openNow,
        }
      );

      // Filter by minimum rating
      const filteredRestaurants = restaurantList.filter(
        r => r.rating >= session.filters.minRating
      ).slice(0, session.filters.maxResults);

      setRestaurants(filteredRestaurants);
      
      // Update session with restaurant IDs
      await SessionService.updateSessionRestaurants(session.id, filteredRestaurants);
      
    } catch (error) {
      console.error('Error loading restaurants:', error);
      Alert.alert('Error', 'Failed to load restaurants. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSessionStart = async (session: SwipeSession) => {
    setCurrentSession(session);
    await loadSessionRestaurants(session);
    setAppState('swiping');
  };

  const handleSwipe = async (restaurant: Restaurant, direction: 'like' | 'pass') => {
    if (!currentSession) return;

    try {
      // Record swipe in session
      const sessionMatches = await SessionService.recordSwipe(
        currentSession.id,
        restaurant.id,
        direction
      );

      // Check for new matches
      const newMatches = sessionMatches.filter(match => 
        !matches.find(m => m.id === match.restaurantId)
      );

      if (newMatches.length > 0) {
        // Find the restaurant objects for new matches
        const matchedRestaurants = newMatches.map(match => 
          restaurants.find(r => r.id === match.restaurantId)
        ).filter(Boolean) as Restaurant[];

        setMatches(prev => [...prev, ...matchedRestaurants]);

        // Show match notification
        if (matchedRestaurants.length === 1) {
          const restaurant = matchedRestaurants[0];
          Alert.alert(
            '🎉 It\'s a Match!',
            `Everyone liked ${restaurant.name}!\n\nThis could be your next dining destination!`,
            [
              {
                text: 'Keep Swiping',
                style: 'cancel',
              },
              {
                text: 'View Restaurant',
                onPress: () => {
                  // Handle viewing restaurant details
                  console.log('View restaurant:', restaurant.name);
                },
              },
            ]
          );
        }
      }

    } catch (error) {
      console.error('Error recording swipe:', error);
    }
  };

  const handleBackToHome = () => {
    setAppState('home');
    setCurrentSession(null);
    setRestaurants([]);
    setMatches([]);
  };

  // Navigation component for home and settings
  const MainNavigation = () => (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconText = '';
          if (route.name === 'Home') {
            iconText = focused ? '🏠' : '🏠';
          } else if (route.name === 'Settings') {
            iconText = focused ? '⚙️' : '⚙️';
          }
          return <Text style={{ fontSize: size }}>{iconText}</Text>;
        },
        tabBarActiveTintColor: '#4ECDC4',
        tabBarInactiveTintColor: '#999',
        headerShown: false,
        tabBarStyle: {
          backgroundColor: 'white',
          borderTopWidth: 1,
          borderTopColor: '#eee',
          paddingTop: 5,
          paddingBottom: 5,
          height: 60,
        },
      })}
    >
      <Tab.Screen name="Home">
        {() => <HomeScreen onSessionStart={handleSessionStart} />}
      </Tab.Screen>
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );

  // Swipe interface
  const SwipeInterface = () => (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#f8f9fa"
        translucent={false}
      />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.backButton} onPress={handleBackToHome}>
          ← Back
        </Text>
        <View style={styles.sessionInfo}>
          <Text style={styles.sessionCode}>
            Room: {currentSession?.roomCode}
          </Text>
          <Text style={styles.participantCount}>
            👥 {currentSession?.participants.length} participants
          </Text>
        </View>
        {matches.length > 0 && (
          <View style={styles.matchBadge}>
            <Text style={styles.matchText}>
              🎉 {matches.length} match{matches.length !== 1 ? 'es' : ''}
            </Text>
          </View>
        )}
      </View>

      {/* Main Swipe Interface */}
      <View style={styles.swipeContainer}>
        {loading ? (
          <View style={styles.centerContainer}>
            <Text style={styles.loadingText}>Loading restaurants...</Text>
          </View>
        ) : (
          <SwipeView
            restaurants={restaurants}
            onSwipe={handleSwipe}
            sessionId={currentSession?.id}
          />
        )}
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.instructions}>
          👆 Swipe right to like • 👈 Swipe left to pass
        </Text>
        {currentSession && currentSession.participants.length > 1 && (
          <Text style={styles.instructions}>
            💚 Get matches when all participants like the same restaurant
          </Text>
        )}
      </View>
    </SafeAreaView>
  );

  return (
    <GestureHandlerRootView style={styles.container}>
      <NavigationContainer>
        {appState === 'swiping' ? <SwipeInterface /> : <MainNavigation />}
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  backButton: {
    fontSize: 16,
    color: '#4ECDC4',
    fontWeight: '600',
  },
  sessionInfo: {
    flex: 1,
    alignItems: 'center',
  },
  sessionCode: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  participantCount: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  matchBadge: {
    backgroundColor: '#4ECDC4',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  matchText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  swipeContainer: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: 'white',
    alignItems: 'center',
  },
  instructions: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginBottom: 5,
  },
});

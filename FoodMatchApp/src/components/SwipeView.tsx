import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  Text,
  Alert,
} from 'react-native';
import { PanGestureHandler } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedGestureHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';

import RestaurantCard from './RestaurantCard';
import SwipeButtons from './SwipeButtons';
import { Restaurant } from '../types/Restaurant';

const { width: screenWidth } = Dimensions.get('window');

interface SwipeViewProps {
  restaurants: Restaurant[];
  onSwipe: (restaurant: Restaurant, direction: 'like' | 'pass') => void;
  sessionId?: string;
}

const SwipeView: React.FC<SwipeViewProps> = ({ restaurants, onSwipe, sessionId }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const translateX = useSharedValue(0);
  const scale = useSharedValue(1);

  const currentRestaurant = restaurants[currentIndex];
  const isLastCard = currentIndex >= restaurants.length - 1;

  const handleSwipe = (direction: 'like' | 'pass') => {
    if (!currentRestaurant) return;

    // Call the parent handler
    onSwipe(currentRestaurant, direction);
    
    // Move to next card
    if (currentIndex < restaurants.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // All cards completed
      Alert.alert(
        '🎉 Session Complete!',
        'You\'ve swiped through all the restaurants. Check your matches!',
        [
          {
            text: 'View Matches',
            onPress: () => {
              console.log('View matches');
            }
          }
        ]
      );
    }

    // Reset card position
    translateX.value = withSpring(0);
    scale.value = withSpring(1);
  };

  const gestureHandler = useAnimatedGestureHandler({
    onStart: () => {
      scale.value = withSpring(0.95);
    },
    onActive: (event) => {
      translateX.value = event.translationX;
    },
    onEnd: (event) => {
      const threshold = screenWidth * 0.3;
      
      if (event.translationX > threshold) {
        // Swipe right (like)
        translateX.value = withSpring(screenWidth);
        runOnJS(handleSwipe)('like');
      } else if (event.translationX < -threshold) {
        // Swipe left (pass)
        translateX.value = withSpring(-screenWidth);
        runOnJS(handleSwipe)('pass');
      } else {
        // Snap back
        translateX.value = withSpring(0);
        scale.value = withSpring(1);
      }
    },
  });

  const cardStyle = useAnimatedStyle(() => {
    const rotate = `${translateX.value * 0.1}deg`;
    const opacity = 1 - Math.abs(translateX.value) / screenWidth * 0.5;
    
    return {
      transform: [
        { translateX: translateX.value },
        { scale: scale.value },
        { rotate },
      ],
      opacity,
    };
  });

  const overlayStyle = useAnimatedStyle(() => {
    const isLike = translateX.value > 0;
    const intensity = Math.abs(translateX.value) / (screenWidth * 0.3);
    
    return {
      opacity: Math.min(intensity, 1) * 0.9,
      backgroundColor: isLike ? '#4ECDC4' : '#FF6B6B',
    };
  });

  if (!restaurants || restaurants.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>🤷‍♀️ No Restaurants Found</Text>
        <Text style={styles.emptyMessage}>
          Try adjusting your filters or location settings to find more restaurants.
        </Text>
      </View>
    );
  }

  if (isLastCard && !currentRestaurant) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>🎉 All Done!</Text>
        <Text style={styles.emptyMessage}>
          You've swiped through all available restaurants. Check your matches!
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Progress indicator */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { width: `${((currentIndex + 1) / restaurants.length) * 100}%` }
            ]} 
          />
        </View>
        <Text style={styles.progressText}>
          {currentIndex + 1} of {restaurants.length}
        </Text>
      </View>

      {/* Card Stack */}
      <View style={styles.cardContainer}>
        {/* Next card (underneath) */}
        {currentIndex + 1 < restaurants.length && (
          <View style={[styles.card, styles.nextCard]}>
            <RestaurantCard 
              restaurant={restaurants[currentIndex + 1]}
              style={styles.nextCardContent}
            />
          </View>
        )}

        {/* Current card */}
        {currentRestaurant && (
          <PanGestureHandler onGestureEvent={gestureHandler}>
            <Animated.View style={[styles.card, cardStyle]}>
              {/* Swipe overlay */}
              <Animated.View style={[styles.swipeOverlay, overlayStyle]}>
                <Text style={styles.swipeText}>
                  {translateX.value > 0 ? '💚 LIKE' : '💔 PASS'}
                </Text>
              </Animated.View>
              
              <RestaurantCard restaurant={currentRestaurant} />
            </Animated.View>
          </PanGestureHandler>
        )}
      </View>

      {/* Action Buttons */}
      <View style={styles.buttonsContainer}>
        <SwipeButtons
          onPass={() => handleSwipe('pass')}
          onLike={() => handleSwipe('like')}
        />
      </View>

      {/* Session Info */}
      {sessionId && (
        <View style={styles.sessionFooter}>
          <Text style={styles.sessionHint}>
            💫 Swiping with friends • Get matches when everyone likes the same place
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    textAlign: 'center',
  },
  emptyMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  progressContainer: {
    alignItems: 'center',
    marginVertical: 15,
  },
  progressBar: {
    width: '100%',
    height: 4,
    backgroundColor: '#eee',
    borderRadius: 2,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4ECDC4',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: '#999',
    fontWeight: '500',
  },
  cardContainer: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 30,
    paddingBottom: 20,
  },
  card: {
    width: screenWidth * 0.9,
    height: '92%',
    position: 'absolute',
    borderRadius: 20,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  nextCard: {
    transform: [{ scale: 0.95 }],
    opacity: 0.8,
    zIndex: 0,
  },
  nextCardContent: {
    opacity: 0.7,
  },
  swipeOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  swipeText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  buttonsContainer: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  sessionFooter: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  sessionHint: {
    fontSize: 12,
    color: '#4ECDC4',
    textAlign: 'center',
    fontWeight: '500',
  },
});

export default SwipeView; 
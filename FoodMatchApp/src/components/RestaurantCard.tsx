import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Dimensions
} from 'react-native';
import { Restaurant } from '../types/Restaurant';

const { width: screenWidth } = Dimensions.get('window');

interface RestaurantCardProps {
  restaurant: Restaurant;
}

const RestaurantCard: React.FC<RestaurantCardProps> = ({ restaurant }) => {
  const handlePhonePress = () => {
    if (restaurant.phone) {
      Linking.openURL(`tel:${restaurant.phone}`);
    }
  };

  const handleDirectionsPress = () => {
    const url = `https://maps.google.com/maps?daddr=${restaurant.latitude},${restaurant.longitude}`;
    Linking.openURL(url);
  };

  const handleWebsitePress = () => {
    if (restaurant.url) {
      Linking.openURL(restaurant.url);
    }
  };

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push('⭐');
    }
    if (hasHalfStar) {
      stars.push('⭐');
    }
    while (stars.length < 5) {
      stars.push('☆');
    }

    return stars.join('');
  };

  const formatDistance = (distance: number) => {
    if (distance < 1000) {
      return `${Math.round(distance)}m`;
    } else {
      return `${(distance / 1000).toFixed(1)}km`;
    }
  };

  const formatPrice = (price: string) => {
    const priceMap: { [key: string]: string } = {
      '$': 'Budget-friendly',
      '$$': 'Moderate',
      '$$$': 'Expensive',
      '$$$$': 'Very Expensive'
    };
    return priceMap[price] || price;
  };

  return (
    <View style={styles.container}>
      {/* Restaurant Image */}
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: restaurant.imageUrl }}
          style={styles.image}
          resizeMode="cover"
        />
        
        {/* Status Badge */}
        <View style={[styles.statusBadge, { backgroundColor: restaurant.isOpen ? '#4ECDC4' : '#FF6B6B' }]}>
          <Text style={styles.statusText}>
            {restaurant.isOpen ? 'OPEN' : 'CLOSED'}
          </Text>
        </View>

        {/* Distance Badge */}
        <View style={styles.distanceBadge}>
          <Text style={styles.distanceText}>
            📍 {formatDistance(restaurant.distance)}
          </Text>
        </View>
      </View>

      {/* Restaurant Info */}
      <View style={styles.infoContainer}>
        {/* Name and Rating */}
        <View style={styles.headerRow}>
          <Text style={styles.name} numberOfLines={2}>
            {restaurant.name}
          </Text>
          <View style={styles.ratingContainer}>
            <Text style={styles.stars}>
              {renderStars(restaurant.rating)}
            </Text>
            <Text style={styles.rating}>
              {restaurant.rating} ({restaurant.reviewCount})
            </Text>
          </View>
        </View>

        {/* Categories */}
        <View style={styles.categoriesContainer}>
          {restaurant.categories.slice(0, 3).map((category, index) => (
            <View key={index} style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{category}</Text>
            </View>
          ))}
        </View>

        {/* Price and Address */}
        <View style={styles.detailsRow}>
          <View style={styles.priceContainer}>
            <Text style={styles.priceLabel}>Price:</Text>
            <Text style={styles.price}>{restaurant.price}</Text>
            <Text style={styles.priceDescription}>
              {formatPrice(restaurant.price)}
            </Text>
          </View>
        </View>

        <View style={styles.addressContainer}>
          <Text style={styles.address} numberOfLines={2}>
            📍 {restaurant.address}, {restaurant.city}, {restaurant.state}
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          {restaurant.phone && (
            <TouchableOpacity
              style={[styles.actionButton, styles.phoneButton]}
              onPress={handlePhonePress}
            >
              <Text style={styles.actionButtonText}>📞 Call</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity
            style={[styles.actionButton, styles.directionsButton]}
            onPress={handleDirectionsPress}
          >
            <Text style={styles.actionButtonText}>🧭 Directions</Text>
          </TouchableOpacity>
          
          {restaurant.url && (
            <TouchableOpacity
              style={[styles.actionButton, styles.websiteButton]}
              onPress={handleWebsitePress}
            >
              <Text style={styles.actionButtonText}>🌐 Website</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 20,
    overflow: 'hidden',
  },
  imageContainer: {
    height: '50%',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  statusBadge: {
    position: 'absolute',
    top: 15,
    left: 15,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  distanceBadge: {
    position: 'absolute',
    top: 15,
    right: 15,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  distanceText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  infoContainer: {
    flex: 1,
    padding: 18,
    justifyContent: 'space-between',
  },
  headerRow: {
    marginBottom: 12,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stars: {
    fontSize: 16,
    marginRight: 8,
  },
  rating: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  categoryBadge: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 6,
  },
  categoryText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  detailsRow: {
    marginBottom: 12,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priceLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 8,
  },
  price: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4ECDC4',
    marginRight: 8,
  },
  priceDescription: {
    fontSize: 12,
    color: '#999',
  },
  addressContainer: {
    marginBottom: 16,
  },
  address: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'stretch',
    marginTop: 'auto',
  },
  actionButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: 12,
    marginHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  phoneButton: {
    backgroundColor: '#4ECDC4',
  },
  directionsButton: {
    backgroundColor: '#FFD93D',
  },
  websiteButton: {
    backgroundColor: '#FF6B6B',
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: 'white',
    textAlign: 'center',
  },
});

export default RestaurantCard; 
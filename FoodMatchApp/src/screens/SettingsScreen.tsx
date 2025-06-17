import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert
} from 'react-native';
import Slider from '@react-native-community/slider';
import SessionService from '../services/SessionService';
import { SessionFilters, UserProfile, DEFAULT_FILTERS } from '../types/Session';

const SettingsScreen: React.FC = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [filters, setFilters] = useState<SessionFilters>(DEFAULT_FILTERS);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadUserSettings();
  }, []);

  const loadUserSettings = async () => {
    try {
      const userProfile = await SessionService.getCurrentUser();
      setUser(userProfile);
      setFilters(userProfile.preferences);
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const saveSettings = async () => {
    try {
      setLoading(true);
      if (user) {
        await SessionService.updateUser({
          preferences: filters
        });
        Alert.alert('✅ Settings Saved', 'Your preferences have been updated!');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      Alert.alert('Error', 'Failed to save settings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetToDefaults = () => {
    Alert.alert(
      'Reset to Defaults',
      'Are you sure you want to reset all settings to default values?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => setFilters(DEFAULT_FILTERS)
        }
      ]
    );
  };

  const togglePriceRange = (price: string) => {
    setFilters(prev => ({
      ...prev,
      priceRange: prev.priceRange.includes(price)
        ? prev.priceRange.filter(p => p !== price)
        : [...prev.priceRange, price].sort()
    }));
  };

  const toggleCategory = (category: string) => {
    setFilters(prev => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter(c => c !== category)
        : [...prev.categories, category]
    }));
  };

  const formatDistance = (meters: number) => {
    if (meters < 1000) {
      return `${Math.round(meters)}m`;
    } else {
      return `${(meters / 1000).toFixed(1)}km`;
    }
  };

  const priceOptions = [
    { value: '$', label: '$ - Budget', description: 'Under $15 per person' },
    { value: '$$', label: '$$ - Moderate', description: '$15-30 per person' },
    { value: '$$$', label: '$$$ - Expensive', description: '$30-60 per person' },
    { value: '$$$$', label: '$$$$ - Very Expensive', description: '$60+ per person' }
  ];

  const categoryOptions = [
    { value: 'restaurants', label: '🍽️ All Restaurants' },
    { value: 'italian', label: '🍝 Italian' },
    { value: 'chinese', label: '🥢 Chinese' },
    { value: 'mexican', label: '🌮 Mexican' },
    { value: 'american', label: '🍔 American' },
    { value: 'japanese', label: '🍣 Japanese' },
    { value: 'indian', label: '🍛 Indian' },
    { value: 'thai', label: '🍜 Thai' },
    { value: 'mediterranean', label: '🥙 Mediterranean' },
    { value: 'korean', label: '🍲 Korean' },
    { value: 'french', label: '🥐 French' },
    { value: 'pizza', label: '🍕 Pizza' },
    { value: 'burgers', label: '🍔 Burgers' },
    { value: 'seafood', label: '🦞 Seafood' },
    { value: 'vegetarian', label: '🥗 Vegetarian' },
    { value: 'breakfast_brunch', label: '🥞 Breakfast & Brunch' }
  ];

  if (!user) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.loadingText}>Loading settings...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>⚙️ Settings</Text>
        <Text style={styles.subtitle}>Customize your restaurant preferences</Text>
      </View>

      {/* User Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>👤 Profile</Text>
        <View style={styles.card}>
          <Text style={styles.username}>Username: {user.username}</Text>
          <Text style={styles.userId}>User ID: {user.id}</Text>
        </View>
      </View>

      {/* Distance Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📍 Search Radius</Text>
        <View style={styles.card}>
          <Text style={styles.settingLabel}>
            Maximum distance: {formatDistance(filters.radius)}
          </Text>
          <Slider
            style={styles.slider}
            minimumValue={500}
            maximumValue={25000}
            value={filters.radius}
            onValueChange={(value) => setFilters(prev => ({ ...prev, radius: Math.round(value) }))}
            minimumTrackTintColor="#4ECDC4"
            maximumTrackTintColor="#ddd"
            thumbStyle={styles.sliderThumb}
          />
          <View style={styles.sliderLabels}>
            <Text style={styles.sliderLabel}>500m</Text>
            <Text style={styles.sliderLabel}>25km</Text>
          </View>
        </View>
      </View>

      {/* Price Range */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>💰 Price Range</Text>
        <View style={styles.card}>
          {priceOptions.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.optionRow,
                filters.priceRange.includes(option.value) && styles.selectedOption
              ]}
              onPress={() => togglePriceRange(option.value)}
            >
              <View style={styles.optionContent}>
                <Text style={[
                  styles.optionLabel,
                  filters.priceRange.includes(option.value) && styles.selectedOptionText
                ]}>
                  {option.label}
                </Text>
                <Text style={[
                  styles.optionDescription,
                  filters.priceRange.includes(option.value) && styles.selectedOptionText
                ]}>
                  {option.description}
                </Text>
              </View>
              <View style={[
                styles.checkbox,
                filters.priceRange.includes(option.value) && styles.checkedBox
              ]}>
                {filters.priceRange.includes(option.value) && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Rating Filter */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>⭐ Minimum Rating</Text>
        <View style={styles.card}>
          <Text style={styles.settingLabel}>
            Minimum rating: {filters.minRating.toFixed(1)} stars
          </Text>
          <Slider
            style={styles.slider}
            minimumValue={1.0}
            maximumValue={5.0}
            value={filters.minRating}
            onValueChange={(value) => setFilters(prev => ({ ...prev, minRating: Math.round(value * 10) / 10 }))}
            minimumTrackTintColor="#4ECDC4"
            maximumTrackTintColor="#ddd"
          />
          <View style={styles.sliderLabels}>
            <Text style={styles.sliderLabel}>1.0 ⭐</Text>
            <Text style={styles.sliderLabel}>5.0 ⭐</Text>
          </View>
        </View>
      </View>

      {/* Cuisine Types */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🍽️ Cuisine Types</Text>
        <View style={styles.card}>
          <Text style={styles.settingDescription}>
            Select the types of cuisine you're interested in
          </Text>
          {categoryOptions.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.optionRow,
                filters.categories.includes(option.value) && styles.selectedOption
              ]}
              onPress={() => toggleCategory(option.value)}
            >
              <Text style={[
                styles.optionLabel,
                filters.categories.includes(option.value) && styles.selectedOptionText
              ]}>
                {option.label}
              </Text>
              <View style={[
                styles.checkbox,
                filters.categories.includes(option.value) && styles.checkedBox
              ]}>
                {filters.categories.includes(option.value) && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Other Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🔧 Other Settings</Text>
        <View style={styles.card}>
          <View style={styles.switchRow}>
            <View style={styles.switchContent}>
              <Text style={styles.switchLabel}>Open Now Only</Text>
              <Text style={styles.switchDescription}>
                Only show restaurants that are currently open
              </Text>
            </View>
            <Switch
              value={filters.openNow}
              onValueChange={(value) => setFilters(prev => ({ ...prev, openNow: value }))}
              trackColor={{ false: '#ddd', true: '#4ECDC4' }}
              thumbColor="#fff"
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>
              Maximum results: {filters.maxResults}
            </Text>
            <Slider
              style={styles.slider}
              minimumValue={10}
              maximumValue={50}
              value={filters.maxResults}
              onValueChange={(value) => setFilters(prev => ({ ...prev, maxResults: Math.round(value) }))}
              minimumTrackTintColor="#4ECDC4"
              maximumTrackTintColor="#ddd"
              step={5}
            />
            <View style={styles.sliderLabels}>
              <Text style={styles.sliderLabel}>10</Text>
              <Text style={styles.sliderLabel}>50</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.button, styles.primaryButton]}
          onPress={saveSettings}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Saving...' : 'Save Settings'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={resetToDefaults}
        >
          <Text style={styles.secondaryButtonText}>Reset to Defaults</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  card: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  userId: {
    fontSize: 14,
    color: '#666',
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 10,
  },
  settingDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderThumb: {
    backgroundColor: '#4ECDC4',
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 5,
  },
  sliderLabel: {
    fontSize: 12,
    color: '#999',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#eee',
  },
  selectedOption: {
    backgroundColor: '#4ECDC4',
    borderColor: '#4ECDC4',
  },
  optionContent: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  optionDescription: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  selectedOptionText: {
    color: 'white',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#ddd',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkedBox: {
    backgroundColor: 'white',
    borderColor: 'white',
  },
  checkmark: {
    color: '#4ECDC4',
    fontSize: 16,
    fontWeight: 'bold',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  switchContent: {
    flex: 1,
    marginRight: 15,
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  switchDescription: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 15,
  },
  settingRow: {
    marginTop: 10,
  },
  actions: {
    gap: 15,
    marginTop: 20,
  },
  button: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#4ECDC4',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#FF6B6B',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButtonText: {
    color: '#FF6B6B',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
});

export default SettingsScreen; 
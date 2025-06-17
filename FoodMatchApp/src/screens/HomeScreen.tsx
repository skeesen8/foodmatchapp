import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
  ActivityIndicator
} from 'react-native';
import * as Location from 'expo-location';
import SessionService from '../services/SessionService';
import { SwipeSession, UserProfile, DEFAULT_FILTERS } from '../types/Session';

interface HomeScreenProps {
  onSessionStart: (session: SwipeSession) => void;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ onSessionStart }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [roomCode, setRoomCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentSession, setCurrentSession] = useState<SwipeSession | null>(null);

  useEffect(() => {
    loadUserAndSession();
  }, []);

  const loadUserAndSession = async () => {
    try {
      const [userProfile, session] = await Promise.all([
        SessionService.getCurrentUser(),
        SessionService.getCurrentSession()
      ]);
      
      setUser(userProfile);
      setCurrentSession(session);
    } catch (error) {
      console.error('Error loading user and session:', error);
    }
  };

  const handleCreateSession = async () => {
    try {
      setLoading(true);

      // Request location permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Location permission is needed to find restaurants near you.');
        return;
      }

      // Get current location
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      // Create session
      const session = await SessionService.createSession(
        {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        },
        DEFAULT_FILTERS
      );

      Alert.alert(
        '🎉 Session Created!',
        `Your room code is: ${session.roomCode}\n\nShare this code with friends so they can join your session!`,
        [
          {
            text: 'Copy Code',
            onPress: () => {
              // In a real app, you'd copy to clipboard
              console.log('Room code:', session.roomCode);
            }
          },
          {
            text: 'Start Swiping',
            onPress: () => onSessionStart(session)
          }
        ]
      );

    } catch (error) {
      console.error('Error creating session:', error);
      Alert.alert('Error', 'Failed to create session. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinSession = async () => {
    if (!roomCode.trim()) {
      Alert.alert('Error', 'Please enter a room code');
      return;
    }

    try {
      setLoading(true);
      const session = await SessionService.joinSession(roomCode.trim());
      
      if (session) {
        Alert.alert(
          '👋 Joined Session!',
          `You joined ${session.participants.find(p => p.isHost)?.username}'s session.\n\nParticipants: ${session.participants.map(p => p.username).join(', ')}`,
          [
            {
              text: 'Start Swiping',
              onPress: () => onSessionStart(session)
            }
          ]
        );
      }
    } catch (error) {
      console.error('Error joining session:', error);
      Alert.alert('Error', error.message || 'Failed to join session. Please check the room code and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleContinueSession = () => {
    if (currentSession) {
      onSessionStart(currentSession);
    }
  };

  const handleLeaveSession = async () => {
    Alert.alert(
      'Leave Session',
      'Are you sure you want to leave the current session?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: async () => {
            await SessionService.leaveSession();
            setCurrentSession(null);
          }
        }
      ]
    );
  };

  if (!user) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#4ECDC4" />
        <Text style={styles.loadingText}>Setting up your profile...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>🍽️ NomNom</Text>
        <Text style={styles.subtitle}>Find restaurants you and your friends will love</Text>
        <View style={styles.userBadge}>
          <Text style={styles.userText}>👋 Welcome, {user.username}!</Text>
        </View>
      </View>

      {/* Current Session */}
      {currentSession && (
        <View style={styles.currentSessionContainer}>
          <Text style={styles.sectionTitle}>📱 Current Session</Text>
          <View style={styles.sessionCard}>
            <Text style={styles.sessionCode}>Room Code: {currentSession.roomCode}</Text>
            <Text style={styles.sessionInfo}>
              Participants: {currentSession.participants.map(p => p.username).join(', ')}
            </Text>
            <Text style={styles.sessionStatus}>
              Status: {currentSession.status === 'waiting' ? '⏳ Waiting' : 
                      currentSession.status === 'active' ? '🔥 Active' : '✅ Completed'}
            </Text>
            
            <View style={styles.sessionActions}>
              <TouchableOpacity
                style={[styles.button, styles.primaryButton]}
                onPress={handleContinueSession}
              >
                <Text style={styles.buttonText}>Continue Session</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.button, styles.secondaryButton]}
                onPress={handleLeaveSession}
              >
                <Text style={styles.secondaryButtonText}>Leave Session</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Create New Session */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🆕 Start New Session</Text>
        <Text style={styles.sectionDescription}>
          Create a room and get a code to share with friends
        </Text>
        
        <TouchableOpacity
          style={[styles.button, styles.primaryButton, loading && styles.disabledButton]}
          onPress={handleCreateSession}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.buttonText}>Create Session</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Join Session */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>👥 Join Friends</Text>
        <Text style={styles.sectionDescription}>
          Enter a room code to join your friend's session
        </Text>
        
        <TextInput
          style={styles.input}
          placeholder="Enter room code (e.g., ABC123)"
          value={roomCode}
          onChangeText={setRoomCode}
          autoCapitalize="characters"
          maxLength={6}
        />
        
        <TouchableOpacity
          style={[styles.button, styles.primaryButton, loading && styles.disabledButton]}
          onPress={handleJoinSession}
          disabled={loading || !roomCode.trim()}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.buttonText}>Join Session</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* How it Works */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>❓ How it Works</Text>
        <View style={styles.howItWorks}>
          <Text style={styles.stepText}>1. 🏠 Create or join a session with friends</Text>
          <Text style={styles.stepText}>2. 📍 Share your location to find nearby restaurants</Text>
          <Text style={styles.stepText}>3. 👆 Swipe right on restaurants you like</Text>
          <Text style={styles.stepText}>4. 🎉 Get matches when everyone likes the same place</Text>
          <Text style={styles.stepText}>5. 🍽️ Go eat at your matched restaurant!</Text>
        </View>
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
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  userBadge: {
    backgroundColor: '#4ECDC4',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  userText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  currentSessionContainer: {
    marginBottom: 30,
  },
  sessionCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sessionCode: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4ECDC4',
    marginBottom: 8,
  },
  sessionInfo: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  sessionStatus: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
  },
  sessionActions: {
    flexDirection: 'row',
    gap: 10,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    lineHeight: 20,
  },
  button: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
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
  disabledButton: {
    opacity: 0.6,
  },
  input: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    marginBottom: 15,
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#666',
  },
  howItWorks: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  stepText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 10,
    lineHeight: 20,
  },
});

export default HomeScreen; 
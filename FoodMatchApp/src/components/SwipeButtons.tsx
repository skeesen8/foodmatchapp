import React from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Dimensions
} from 'react-native';

const { width: screenWidth } = Dimensions.get('window');

interface SwipeButtonsProps {
  onLike: () => void;
  onPass: () => void;
  likeLabel?: string;
  passLabel?: string;
  disabled?: boolean;
}

const SwipeButtons: React.FC<SwipeButtonsProps> = ({
  onLike,
  onPass,
  likeLabel = 'Like',
  passLabel = 'Pass',
  disabled = false
}) => {
  return (
    <View style={styles.container}>
      {/* Pass Button */}
      <TouchableOpacity
        style={[styles.button, styles.passButton, disabled && styles.disabledButton]}
        onPress={onPass}
        disabled={disabled}
        activeOpacity={0.8}
      >
        <View style={styles.buttonContent}>
          <Text style={styles.buttonIcon}>❌</Text>
          <Text style={[styles.buttonText, styles.passText]}>{passLabel}</Text>
        </View>
      </TouchableOpacity>

      {/* Like Button */}
      <TouchableOpacity
        style={[styles.button, styles.likeButton, disabled && styles.disabledButton]}
        onPress={onLike}
        disabled={disabled}
        activeOpacity={0.8}
      >
        <View style={styles.buttonContent}>
          <Text style={styles.buttonIcon}>💚</Text>
          <Text style={[styles.buttonText, styles.likeText]}>{likeLabel}</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    width: '100%',
    paddingVertical: 15,
  },
  button: {
    width: 65,
    height: 65,
    borderRadius: 32.5,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  passButton: {
    backgroundColor: '#FF6B6B',
  },
  likeButton: {
    backgroundColor: '#4ECDC4',
  },
  disabledButton: {
    opacity: 0.5,
    backgroundColor: '#ccc',
  },
  buttonContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonIcon: {
    fontSize: 20,
    marginBottom: 2,
  },
  buttonText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: 'white',
  },
  passText: {
    color: 'white',
  },
  likeText: {
    color: 'white',
  },
});

export default SwipeButtons; 
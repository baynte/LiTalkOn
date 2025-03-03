import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faMicrophone, faStop } from '@fortawesome/free-solid-svg-icons';
import { TouchableOpacity } from 'react-native-gesture-handler';

interface FontAwesomeExampleProps {
  isRecording: boolean;
  onStartRecording: () => void;
  onStopRecording: () => void;
}

const FontAwesomeExample: React.FC<FontAwesomeExampleProps> = ({
  isRecording,
  onStartRecording,
  onStopRecording,
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Font Awesome Example</Text>
      
      <TouchableOpacity
        onPress={isRecording ? onStopRecording : onStartRecording}
        style={[
          styles.recordButton,
          { backgroundColor: isRecording ? '#FF3B30' : '#007AFF' }
        ]}
      >
        <FontAwesomeIcon
          icon={isRecording ? faStop : faMicrophone}
          size={32}
          color="#FFFFFF"
        />
      </TouchableOpacity>
      
      <Text style={styles.instructions}>
        {isRecording
          ? 'Tap the button to stop recording'
          : 'Tap the button to start recording'}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    marginVertical: 8,
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    color: '#333',
  },
  recordButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    marginVertical: 16,
  },
  instructions: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});

export default FontAwesomeExample; 
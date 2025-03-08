import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';

interface LogoPlaceholderProps {
  size?: number;
}

const LogoPlaceholder: React.FC<LogoPlaceholderProps> = ({ size = 100 }) => {
  const theme = useTheme();
  const { colors } = theme;

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: colors.primary,
        },
      ]}
    >
      <Text style={[styles.text, { fontSize: size * 0.4 }]}>Li</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  text: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default LogoPlaceholder; 
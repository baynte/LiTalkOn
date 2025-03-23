import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { register } from '../services/auth';
import { RegisterData } from '../types';
import LogoPlaceholder from '../components/LogoPlaceholder';

interface RegisterScreenProps {
  navigation: any;
}

const RegisterScreen: React.FC<RegisterScreenProps> = ({ navigation }) => {
  const theme = useTheme();
  const { colors, spacing, borderRadius, shadows } = theme;

  const [formData, setFormData] = useState<RegisterData>({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    first_name: '',
    last_name: '',
    user_type: 'student',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRegister = async () => {
    // Basic validation
    if (!formData.username || !formData.email || !formData.password || 
        !formData.confirmPassword || !formData.first_name || !formData.last_name) {
      setError('Please fill in all fields');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('Submitting registration form...');
      const result = await register(formData);
      
      console.log('Registration successful:', result);
      
      // Navigate based on user type
      if (formData.user_type === 'teacher') {
        navigation.replace('TeacherDashboard');
      } else {
        navigation.replace('StudentDashboard');
      }
    } catch (err: any) {
      console.error('Registration error in component:', err);
      
      // Display a more user-friendly error message
      if (err.message.includes('already in use') || err.message.includes('already exists')) {
        setError('This email or username is already registered. Please try another one.');
      } else if (err.message.includes('network') || err.message.includes('Network')) {
        setError('Network error. Please check your internet connection and try again.');
      } else {
        setError(err.message || 'Registration failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.logoContainer}>
          <LogoPlaceholder size={80} />
          <Text style={[styles.appName, { color: colors.primary }]}>LiTalkOn</Text>
        </View>

        <View
          style={[
            styles.formContainer,
            {
              backgroundColor: colors.surface,
              borderRadius: borderRadius.lg,
              ...shadows.medium,
            },
          ]}
        >
          <Text style={[styles.title, { color: colors.text }]}>Create Account</Text>

          {error && (
            <View style={[styles.errorContainer, { backgroundColor: colors.error + '20' }]}>
              <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
            </View>
          )}

          <View style={styles.nameRow}>
            <View style={[styles.inputGroup, styles.halfInput]}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>First Name</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                    color: colors.text,
                  },
                ]}
                placeholder="First name"
                placeholderTextColor={colors.textLight}
                value={formData.first_name}
                onChangeText={(text) => setFormData({ ...formData, first_name: text })}
                editable={!isLoading}
              />
            </View>

            <View style={[styles.inputGroup, styles.halfInput]}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Last Name</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                    color: colors.text,
                  },
                ]}
                placeholder="Last name"
                placeholderTextColor={colors.textLight}
                value={formData.last_name}
                onChangeText={(text) => setFormData({ ...formData, last_name: text })}
                editable={!isLoading}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Username</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                  color: colors.text,
                },
              ]}
              placeholder="Choose a username"
              placeholderTextColor={colors.textLight}
              autoCapitalize="none"
              value={formData.username}
              onChangeText={(text) => setFormData({ ...formData, username: text })}
              editable={!isLoading}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Email</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                  color: colors.text,
                },
              ]}
              placeholder="Enter your email"
              placeholderTextColor={colors.textLight}
              keyboardType="email-address"
              autoCapitalize="none"
              value={formData.email}
              onChangeText={(text) => setFormData({ ...formData, email: text })}
              editable={!isLoading}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Password</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                  color: colors.text,
                },
              ]}
              placeholder="Create a password"
              placeholderTextColor={colors.textLight}
              secureTextEntry
              value={formData.password}
              onChangeText={(text) => setFormData({ ...formData, password: text })}
              editable={!isLoading}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Confirm Password</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                  color: colors.text,
                },
              ]}
              placeholder="Confirm your password"
              placeholderTextColor={colors.textLight}
              secureTextEntry
              value={formData.confirmPassword}
              onChangeText={(text) => setFormData({ ...formData, confirmPassword: text })}
              editable={!isLoading}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>User Type</Text>
            <View style={styles.userTypeContainer}>
              <TouchableOpacity
                style={[
                  styles.userTypeButton,
                  {
                    backgroundColor: formData.user_type === 'student' ? colors.primary : colors.background,
                    borderColor: colors.border,
                  },
                ]}
                onPress={() => setFormData({ ...formData, user_type: 'student' })}
              >
                <Text
                  style={[
                    styles.userTypeText,
                    { color: formData.user_type === 'student' ? colors.textOnPrimary : colors.text },
                  ]}
                >
                  Student
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.userTypeButton,
                  {
                    backgroundColor: formData.user_type === 'teacher' ? colors.primary : colors.background,
                    borderColor: colors.border,
                  },
                ]}
                onPress={() => setFormData({ ...formData, user_type: 'teacher' })}
              >
                <Text
                  style={[
                    styles.userTypeText,
                    { color: formData.user_type === 'teacher' ? colors.textOnPrimary : colors.text },
                  ]}
                >
                  Teacher
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.button,
              { backgroundColor: colors.primary },
              isLoading && { opacity: 0.7 },
            ]}
            onPress={handleRegister}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color={colors.textOnPrimary} />
            ) : (
              <Text style={[styles.buttonText, { color: colors.textOnPrimary }]}>Register</Text>
            )}
          </TouchableOpacity>

          <View style={styles.loginContainer}>
            <Text style={[styles.loginText, { color: colors.textSecondary }]}>
              Already have an account?
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={[styles.loginLink, { color: colors.primary }]}>
                {' '}
                Login
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.textLight }]}>
            By registering, you agree to our Terms of Service and Privacy Policy.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 16,
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 16,
  },
  appName: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  formContainer: {
    padding: 24,
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
  },
  errorContainer: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfInput: {
    width: '48%',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  button: {
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginText: {
    fontSize: 14,
  },
  loginLink: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  footer: {
    marginTop: 24,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    textAlign: 'center',
  },
  userTypeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  userTypeButton: {
    flex: 1,
    height: 50,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userTypeText: {
    fontSize: 16,
    fontWeight: '500',
  },
});

export default RegisterScreen; 
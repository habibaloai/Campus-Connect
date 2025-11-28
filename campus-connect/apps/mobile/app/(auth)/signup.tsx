import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  ImageBackground,
  StyleSheet,
  Dimensions,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Eye, EyeOff } from 'lucide-react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useAuth } from '@/providers';

const { width, height } = Dimensions.get('window');

export default function SignUpScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);
  const { signUp } = useAuth();

  const handleSignUp = async () => {
    setMessage(null);
    
    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPassword = password;

    if (!trimmedName || !trimmedEmail || !trimmedPassword || !confirmPassword) {
      setMessage({ type: 'error', text: 'Please fill in all fields' });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setMessage({ type: 'error', text: 'Please enter a valid email address' });
      return;
    }

    if (trimmedPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match' });
      return;
    }

    if (trimmedPassword.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters' });
      return;
    }

    setIsLoading(true);
    
    try {
      const { error } = await signUp(trimmedEmail, trimmedPassword, trimmedName);
      
      if (error) {
        let errorMessage = error.message;
        if (error.message?.includes('already registered')) {
          errorMessage = 'An account with this email already exists. Please sign in instead.';
        } else if (error.message?.includes('invalid')) {
          errorMessage = 'Please check your email address and try again.';
        }
        setMessage({ type: 'error', text: errorMessage });
      } else {
        setMessage({ 
          type: 'success', 
          text: 'Account created successfully! Redirecting to sign in...' 
        });
        setTimeout(() => {
          router.replace('/(auth)/login');
        }, 2000);
      }
    } catch (err: any) {
      console.error('Signup error:', err);
      setMessage({ type: 'error', text: 'Something went wrong. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const backgroundSource = require('../../assets/images/splash-screen.png');

  return (
    <ImageBackground
      source={backgroundSource}
      style={styles.background}
      resizeMode="cover"
    >
      {/* Gradient Overlay */}
      <LinearGradient
        colors={['rgba(0,0,0,0.5)', 'rgba(0,0,0,0.1)']}
        style={styles.gradientOverlay}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />

      {/* Dark gradient at bottom */}
      <LinearGradient
        colors={['rgba(17,17,16,0)', 'rgba(17,17,16,1)', 'rgba(17,17,16,1)']}
        locations={[0, 0.4424, 1]}
        style={styles.bottomGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <StatusBar style="light" />
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            {/* Signup Title */}
            <Animated.View
              entering={FadeInUp.duration(800).springify()}
              style={styles.titleContainer}
            >
              <Text style={styles.title}>Signup</Text>
            </Animated.View>

            {/* Message Display */}
            {message && (
              <Animated.View
                entering={FadeInDown.duration(400)}
                style={[
                  styles.messageContainer,
                  message.type === 'error' ? styles.errorMessage : styles.successMessage,
                ]}
              >
                <Text style={[
                  styles.messageText,
                  message.type === 'error' ? styles.errorText : styles.successText,
                ]}>
                  {message.text}
                </Text>
              </Animated.View>
            )}

            {/* Form */}
            <Animated.View 
              entering={FadeInDown.duration(800).delay(150).springify()}
              style={styles.formContainer}
            >
              {/* User Name Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>User Name</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    placeholder="User name"
                    placeholderTextColor="#a09f99"
                    value={name}
                    onChangeText={setName}
                    autoCapitalize="words"
                  />
                </View>
              </View>

              {/* Email Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    placeholder="Email address"
                    placeholderTextColor="#a09f99"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
              </View>

              {/* Password Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Password</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    placeholder="Password"
                    placeholderTextColor="#a09f99"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.visibilityToggle}
                  >
                    {showPassword ? (
                      <EyeOff size={24} color="#a09f99" />
                    ) : (
                      <Eye size={24} color="#a09f99" />
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              {/* Confirm Password Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Confirm password</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    placeholder="Confirm password"
                    placeholderTextColor="#a09f99"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showConfirmPassword}
                  />
                  <TouchableOpacity
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={styles.visibilityToggle}
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={24} color="#a09f99" />
                    ) : (
                      <Eye size={24} color="#a09f99" />
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </Animated.View>

            {/* Signup Button */}
            <Animated.View
              entering={FadeInDown.duration(800).delay(250).springify()}
              style={styles.buttonContainer}
            >
              <TouchableOpacity
                onPress={handleSignUp}
                disabled={isLoading}
                style={[styles.signupButton, isLoading && styles.signupButtonDisabled]}
                activeOpacity={0.8}
              >
                {isLoading ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.signupButtonText}>Signup</Text>
                )}
              </TouchableOpacity>
            </Animated.View>

            {/* Login Link */}
            <Animated.View
              entering={FadeInDown.duration(800).delay(300).springify()}
              style={styles.loginContainer}
            >
              <Text style={styles.loginText}>Already have an account! </Text>
              <Link href="/(auth)/login" asChild>
                <TouchableOpacity>
                  <Text style={styles.loginLink}>Login</Text>
                </TouchableOpacity>
              </Link>
            </Animated.View>

            {/* Progress Indicator */}
            <View style={styles.progressIndicator} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: width,
    height: height,
    backgroundColor: '#111110',
    borderRadius: 30,
    overflow: 'hidden',
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 30,
  },
  bottomGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: height * 0.525,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingVertical: 20,
  },
  content: {
    paddingHorizontal: 39,
    paddingTop: 94,
    paddingBottom: 40,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 88,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  messageContainer: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    width: '100%',
  },
  errorMessage: {
    backgroundColor: 'rgba(254, 242, 242, 0.95)',
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  successMessage: {
    backgroundColor: 'rgba(240, 253, 244, 0.95)',
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  messageText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  errorText: {
    color: '#dc2626',
  },
  successText: {
    color: '#16a34a',
  },
  formContainer: {
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 15,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#d8d8dd',
    borderRadius: 6,
    height: 55,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1e293b',
    letterSpacing: 0.16,
  },
  visibilityToggle: {
    padding: 4,
  },
  buttonContainer: {
    marginTop: 26,
    marginBottom: 24,
  },
  signupButton: {
    backgroundColor: '#0066cc',
    borderRadius: 6,
    height: 55,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2.767 },
    shadowOpacity: 0.2,
    shadowRadius: 2.214,
    elevation: 4,
  },
  signupButtonDisabled: {
    opacity: 0.7,
  },
  signupButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  loginText: {
    fontSize: 16,
    color: '#d8d8dd',
    letterSpacing: 0.16,
    textAlign: 'center',
  },
  loginLink: {
    fontSize: 16,
    color: '#11c986',
    fontWeight: 'bold',
    letterSpacing: 0.16,
  },
  progressIndicator: {
    width: 135,
    height: 5,
    backgroundColor: '#0066cc',
    borderRadius: 100,
    alignSelf: 'center',
    marginTop: 16,
  },
});

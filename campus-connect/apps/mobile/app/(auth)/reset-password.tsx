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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Eye, EyeOff } from 'lucide-react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { auth } from '@/lib/supabase';

const { width, height } = Dimensions.get('window');

export default function ResetPasswordScreen() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  const handleResetPassword = async () => {
    // Clear previous message
    setMessage(null);

    // Validate passwords
    if (!newPassword || !confirmPassword) {
      setMessage({ type: 'error', text: 'Please fill in all fields' });
      return;
    }

    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match' });
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await auth.updatePassword(newPassword);

      if (error) {
        // Handle specific error messages
        let errorMessage = error.message;
        if (error.message?.includes('expired') || error.message?.includes('invalid')) {
          errorMessage = 'This password reset link has expired or is invalid. Please request a new one.';
        } else if (error.message?.includes('network')) {
          errorMessage = 'Network error. Please check your connection and try again.';
        }
        setMessage({ type: 'error', text: errorMessage });
      } else {
        // Success - show message and redirect to login
        setMessage({
          type: 'success',
          text: 'Password reset successfully! Redirecting to login...',
        });
        // Navigate to login after 2-3 seconds
        setTimeout(() => {
          router.replace('/(auth)/login');
        }, 2500);
      }
    } catch (err: any) {
      console.error('Reset password error:', err);
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
            {/* Title */}
            <Animated.View
              entering={FadeInUp.duration(800).springify()}
              style={styles.titleContainer}
            >
              <Text style={styles.title}>Reset Password</Text>
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
              {/* New Password Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>New Password</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    placeholder="New Password"
                    placeholderTextColor="#a09f99"
                    value={newPassword}
                    onChangeText={setNewPassword}
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
                <Text style={styles.inputLabel}>Confirm Password</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    placeholder="Confirm Password"
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

            {/* Reset Password Button */}
            <Animated.View
              entering={FadeInDown.duration(800).delay(250).springify()}
              style={styles.buttonContainer}
            >
              <TouchableOpacity
                onPress={handleResetPassword}
                disabled={isLoading}
                style={[styles.resetButton, isLoading && styles.resetButtonDisabled]}
                activeOpacity={0.8}
              >
                {isLoading ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.resetButtonText}>Reset Password</Text>
                )}
              </TouchableOpacity>
            </Animated.View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Progress Indicator - At bottom of screen */}
      <View style={styles.progressIndicator} />
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: width,
    height: height,
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
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
    justifyContent: 'center',
    paddingVertical: 20,
  },
  content: {
    paddingHorizontal: 39,
    paddingVertical: 20,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 24,
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
    marginBottom: 24,
  },
  resetButton: {
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
  resetButtonDisabled: {
    opacity: 0.7,
  },
  resetButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  progressIndicator: {
    position: 'absolute',
    bottom: 7,
    left: '50%',
    marginLeft: -67.5, // Half of 135px width to center it
    width: 135,
    height: 5,
    backgroundColor: '#0066cc',
    borderRadius: 100,
  },
});


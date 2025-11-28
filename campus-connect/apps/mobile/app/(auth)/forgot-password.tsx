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
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { auth } from '@/lib/supabase';

const { width, height } = Dimensions.get('window');

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  const handleResetPassword = async () => {
    setMessage(null);
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedEmail) {
      setMessage({ type: 'error', text: 'Please enter your email address' });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setMessage({ type: 'error', text: 'Please enter a valid email address' });
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await auth.resetPassword(trimmedEmail);

      if (error) {
        // Show specific error for rate limiting
        if (error.status === 429) {
          setMessage({
            type: 'error',
            text: error.message || 'Too many requests. Please wait a few minutes before trying again.',
          });
        } else if (error.message?.includes('valid email')) {
          setMessage({
            type: 'error',
            text: 'Please enter a valid email address.',
          });
        } else {
          // For other errors, show success for security (don't reveal if email exists)
          setMessage({
            type: 'success',
            text: 'If an account exists, a password reset link has been sent to your email. Please check your inbox and spam folder.',
          });
        }
      } else {
        // Success - show success message
        setMessage({
          type: 'success',
          text: 'If an account exists, a password reset link has been sent to your email. Please check your inbox and spam folder.',
        });
      }
    } catch (err: any) {
      console.error('Password reset error:', err);
      setMessage({
        type: 'success',
        text: 'If an account exists, a password reset link has been sent to your email. Please check your inbox and spam folder.',
      });
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
              <Text style={styles.title}>Forgot Password?</Text>
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
              {/* Email Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    placeholder="Email Address"
                    placeholderTextColor="#a09f99"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
              </View>
            </Animated.View>

            {/* Send Reset Link Button */}
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
                  <Text style={styles.resetButtonText}>Send Reset Link</Text>
                )}
              </TouchableOpacity>
            </Animated.View>

            {/* Back to Login Link */}
            <Animated.View
              entering={FadeInDown.duration(800).delay(300).springify()}
              style={styles.backToLoginContainer}
            >
              <Text style={styles.backToLoginText}>Remember your password? </Text>
              <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
                <Text style={styles.backToLoginLink}>Back to Login</Text>
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
  backToLoginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  backToLoginText: {
    fontSize: 16,
    color: '#FFFFFF',
  },
  backToLoginLink: {
    fontSize: 16,
    color: '#11c986',
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

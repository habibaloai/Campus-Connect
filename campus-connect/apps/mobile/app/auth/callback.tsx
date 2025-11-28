import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { CheckCircle, XCircle } from 'lucide-react-native';
import Animated, { FadeIn, FadeInDown, FadeInUp, ZoomIn, BounceIn } from 'react-native-reanimated';

export default function AuthCallbackScreen() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verifying your email...');
  const params = useLocalSearchParams();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Log all params for debugging
        console.log('Callback params:', params);
        console.log('All param keys:', Object.keys(params));
        
        // Check if we have tokens in the URL (from email verification)
        // Supabase might send them as access_token, refresh_token, or in hash fragments
        // For React Native, expo-router handles URL parameters automatically
        const accessToken = (params.access_token || params['#access_token'] || '') as string;
        const refreshToken = (params.refresh_token || params['#refresh_token'] || '') as string;
        const type = (params.type || params['#type'] || '') as string;

        console.log('Callback params received:', { 
          hasAccessToken: !!accessToken, 
          hasRefreshToken: !!refreshToken, 
          type,
          allParamKeys: Object.keys(params),
          paramValues: Object.values(params).slice(0, 3) // Log first 3 values for debugging
        });

        // Check if we have a code parameter (PKCE flow from Supabase)
        const code = (params.code || params['#code']) as string;
        
        // If we have a code, exchange it for a session (newer Supabase flow)
        if (code) {
          console.log('Found code parameter, exchanging for session...');
          const { data: sessionData, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          
          if (exchangeError) {
            console.error('Code exchange error:', exchangeError);
            setStatus('error');
            setMessage(exchangeError.message || 'Verification failed. Please try again.');
            setTimeout(() => {
              router.replace('/(auth)/login');
            }, 3000);
            return;
          }
          
          if (sessionData?.session) {
            // Successfully verified - show success page
            setStatus('success');
            setMessage('Email verified successfully! Your account is ready.');
            
            // Redirect to login after showing success animation
            setTimeout(() => {
              router.replace('/(auth)/login');
            }, 4000);
            return;
          }
        }

        // If no params at all, show error
        if (!accessToken && !refreshToken && !type && !code) {
          console.warn('No callback parameters found');
          setStatus('error');
          setMessage('Invalid verification link. Please request a new verification email.');
          setTimeout(() => {
            router.replace('/(auth)/login');
          }, 3000);
          return;
        }

        if (type === 'signup' || type === 'email_change' || type === 'recovery') {
          if (accessToken && refreshToken) {
            // Set the session with the tokens from the URL
            const { error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });

            if (error) {
              throw error;
            }

            // Handle password recovery differently
            if (type === 'recovery') {
              setStatus('success');
              setMessage('Password reset link verified! Redirecting...');
              
              // Redirect to reset password screen after showing success animation
              setTimeout(() => {
                router.replace('/(auth)/reset-password');
              }, 3000); // Give time for animation
            } else if (type === 'signup') {
              // For signup verification, show success page with animation
              setStatus('success');
              setMessage('Email verified successfully! Your account is ready.');
              
              // Redirect to login after showing success animation (longer delay for better UX)
              setTimeout(() => {
                router.replace('/(auth)/login');
              }, 4000); // 4 seconds to enjoy the success animation
            } else {
              // For email_change, redirect to login
              setStatus('success');
              setMessage('Email verified successfully! Redirecting to login...');
              
              // Redirect to login after 2 seconds
              setTimeout(() => {
                router.replace('/(auth)/login');
              }, 3000);
            }
          } else {
            // No tokens, check if already verified
            const { data: { session } } = await supabase.auth.getSession();
            
            if (session) {
              setStatus('success');
              setMessage('You are already signed in! Redirecting...');
              setTimeout(() => {
                router.replace('/(tabs)/home');
              }, 2000);
            } else {
              setStatus('success');
              setMessage('Email verified! Please sign in.');
              setTimeout(() => {
                router.replace('/(auth)/login');
              }, 2000);
            }
          }
        } else if (type) {
          // Unknown type, just redirect to login
          console.warn('Unknown callback type:', type);
          setStatus('success');
          setMessage('Redirecting to login...');
          setTimeout(() => {
            router.replace('/(auth)/login');
          }, 2000);
        } else {
          // No type specified, try to handle as recovery if we have tokens
          if (accessToken && refreshToken) {
            console.log('No type specified, but tokens found. Attempting recovery flow...');
            const { error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });

            if (error) {
              throw error;
            }

            // Assume it's a recovery if we got here with tokens
            setStatus('success');
            setMessage('Password reset link verified! Redirecting...');
            setTimeout(() => {
              router.replace('/(auth)/reset-password');
            }, 2000);
          } else {
            setStatus('error');
            setMessage('Invalid reset link. Please request a new password reset.');
            setTimeout(() => {
              router.replace('/(auth)/login');
            }, 3000);
          }
        }
      } catch (error: any) {
        console.error('Auth callback error:', error);
        setStatus('error');
        setMessage(error.message || 'Verification failed. Please try again.');
        
        // Redirect to login after showing error
        setTimeout(() => {
          router.replace('/(auth)/login');
        }, 4000); // Give time to see the error message
      }
    };

    handleCallback();
  }, [params]);

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: '#f8fafc',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
      }}
    >
      <View
        style={{
          backgroundColor: 'white',
          borderRadius: 24,
          padding: 32,
          alignItems: 'center',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.1,
          shadowRadius: 12,
          elevation: 5,
          width: '100%',
          maxWidth: 400,
        }}
      >
        {status === 'loading' && (
          <>
            <ActivityIndicator size="large" color="#3b82f6" />
            <Text
              style={{
                marginTop: 24,
                fontSize: 18,
                fontWeight: '600',
                color: '#374151',
                textAlign: 'center',
              }}
            >
              {message}
            </Text>
          </>
        )}

        {status === 'success' && (
          <>
            {/* Animated Success Icon */}
            <Animated.View
              entering={ZoomIn.duration(600).springify()}
              style={{
                backgroundColor: '#dcfce7',
                borderRadius: 50,
                padding: 16,
                marginBottom: 8,
              }}
            >
              <Animated.View entering={BounceIn.delay(200).duration(800)}>
                <CheckCircle size={64} color="#16a34a" strokeWidth={2.5} />
              </Animated.View>
            </Animated.View>

            {/* Animated Success Title */}
            <Animated.Text
              entering={FadeInDown.delay(400).duration(600)}
              style={{
                marginTop: 24,
                fontSize: 28,
                fontWeight: 'bold',
                color: '#16a34a',
                textAlign: 'center',
              }}
            >
              Successfully Verified!
            </Animated.Text>

            {/* Animated Success Message */}
            <Animated.Text
              entering={FadeInUp.delay(600).duration(600)}
              style={{
                marginTop: 12,
                fontSize: 16,
                color: '#6b7280',
                textAlign: 'center',
                lineHeight: 24,
                paddingHorizontal: 8,
              }}
            >
              {message}
            </Animated.Text>

            {/* Animated Loading Indicator for Redirect */}
            <Animated.View
              entering={FadeIn.delay(1000).duration(400)}
              style={{ marginTop: 32 }}
            >
              <ActivityIndicator size="small" color="#16a34a" />
              <Text
                style={{
                  marginTop: 12,
                  fontSize: 14,
                  color: '#9ca3af',
                  textAlign: 'center',
                }}
              >
                Redirecting...
              </Text>
            </Animated.View>
          </>
        )}

        {status === 'error' && (
          <>
            {/* Animated Error Icon */}
            <Animated.View
              entering={ZoomIn.duration(600).springify()}
              style={{
                backgroundColor: '#fee2e2',
                borderRadius: 50,
                padding: 16,
                marginBottom: 8,
              }}
            >
              <XCircle size={64} color="#dc2626" strokeWidth={2.5} />
            </Animated.View>

            {/* Animated Error Title */}
            <Animated.Text
              entering={FadeInDown.delay(200).duration(600)}
              style={{
                marginTop: 24,
                fontSize: 24,
                fontWeight: 'bold',
                color: '#dc2626',
                textAlign: 'center',
              }}
            >
              Verification Failed
            </Animated.Text>

            {/* Animated Error Message */}
            <Animated.Text
              entering={FadeInUp.delay(400).duration(600)}
              style={{
                marginTop: 12,
                fontSize: 16,
                color: '#6b7280',
                textAlign: 'center',
                lineHeight: 24,
                paddingHorizontal: 8,
              }}
            >
              {message}
            </Animated.Text>

            {/* Redirect indicator */}
            <Animated.View
              entering={FadeIn.delay(800).duration(400)}
              style={{ marginTop: 32 }}
            >
              <ActivityIndicator size="small" color="#dc2626" />
              <Text
                style={{
                  marginTop: 12,
                  fontSize: 14,
                  color: '#9ca3af',
                  textAlign: 'center',
                }}
              >
                Redirecting...
              </Text>
            </Animated.View>
          </>
        )}
      </View>
    </View>
  );
}




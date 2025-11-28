import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, auth, api } from '@/lib/supabase';
import { Profile } from '@/types';
import { router } from 'expo-router';
import * as LocalAuthentication from 'expo-local-authentication';
import { biometricStorage } from '@/lib/storage';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  biometricAvailable: boolean;
  biometricEnabled: boolean;
  signUp: (email: string, password: string, name: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signInWithBiometric: () => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  enableBiometric: () => Promise<void>;
  disableBiometric: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await api.getProfile(userId);
      if (error) {
        console.warn('Profile fetch error (normal for new users):', error.message);
      }
      if (data) {
        setProfile(data as Profile);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const checkBiometricAvailability = async () => {
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      setBiometricAvailable(compatible && enrolled);
      
      const enabled = await biometricStorage.isEnabled();
      setBiometricEnabled(enabled);
    } catch (error) {
      console.error('Error checking biometric availability:', error);
      setBiometricAvailable(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        console.log('Initializing auth...');
        
        // Check biometric availability
        await checkBiometricAvailability();

        // Get session with timeout
        const timeoutPromise = new Promise<null>((resolve) =>
          setTimeout(() => {
            console.log('Auth timeout - proceeding without session');
            resolve(null);
          }, 5000)
        );

        const sessionPromise = auth.getSession();
        const session = await Promise.race([sessionPromise, timeoutPromise]);

        if (!mounted) return;

        console.log('Session retrieved:', session ? 'exists' : 'null');
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          fetchProfile(session.user.id);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        if (mounted) {
          setLoading(false);
          console.log('Auth initialized');
        }
      }
    };

    initAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      console.log('Auth state changed:', event);

      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string, name: string) => {
    try {
      console.log('Signing up with email:', email);
      const { data, error } = await auth.signUp(email, password, name);
      
      if (error) {
        console.log('SignUp error:', error.message);
        return { error };
      }

      console.log('SignUp successful, user created:', data?.user?.id);

      // If we have a user and session (email verification disabled), set it up
      if (data?.user && data?.session) {
        setUser(data.user);
        setSession(data.session);
        await fetchProfile(data.user.id);
      }

      return { error: null };
    } catch (error: any) {
      console.error('SignUp exception:', error);
      return { error: { message: error.message || 'Network error. Please try again.' } };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      console.log('Signing in...');
      const { data, error } = await auth.signIn(email, password);
      console.log('SignIn result:', error ? error.message : 'success');

      if (!error && data?.session) {
        console.log('Sign in successful, navigating to home...');
        router.replace('/(tabs)/home');
      }
      return { error };
    } catch (error: any) {
      console.error('SignIn error:', error);
      return { error: { message: 'Network error. Please try again.' } };
    }
  };

  const signInWithBiometric = async () => {
    try {
      if (!biometricAvailable || !biometricEnabled) {
        return { error: { message: 'Biometric authentication not available or enabled' } };
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate to sign in',
        fallbackLabel: 'Use password',
        disableDeviceFallback: false,
      });

      if (result.success) {
        // Refresh the session if we have one stored
        const { data, error } = await auth.refreshSession();
        if (error) {
          return { error };
        }
        if (data?.session) {
          router.replace('/(tabs)/home');
        }
        return { error: null };
      } else {
        return { error: { message: 'Biometric authentication failed' } };
      }
    } catch (error: any) {
      console.error('Biometric sign in error:', error);
      return { error: { message: error.message || 'Biometric authentication failed' } };
    }
  };

  const signOut = async () => {
    try {
      console.log('Signing out...');
      await auth.signOut();

      setUser(null);
      setProfile(null);
      setSession(null);

      console.log('Sign out successful');
      router.replace('/(auth)/login');
    } catch (error) {
      console.error('SignOut error:', error);
      setUser(null);
      setProfile(null);
      setSession(null);
      router.replace('/(auth)/login');
    }
  };

  const refreshProfile = async () => {
    if (user) {
      console.log('[AuthContext] Refreshing profile for user:', user.id);
      await fetchProfile(user.id);
      console.log('[AuthContext] Profile refresh completed');
    } else {
      console.log('[AuthContext] No user, cannot refresh profile');
    }
  };

  const enableBiometric = async () => {
    await biometricStorage.enable();
    setBiometricEnabled(true);
  };

  const disableBiometric = async () => {
    await biometricStorage.disable();
    setBiometricEnabled(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        session,
        loading,
        biometricAvailable,
        biometricEnabled,
        signUp,
        signIn,
        signInWithBiometric,
        signOut,
        refreshProfile,
        enableBiometric,
        disableBiometric,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}






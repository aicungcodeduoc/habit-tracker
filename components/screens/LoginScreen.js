import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FONTS } from '../../config/fonts';
import { supabase } from '../../config/supabase';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { syncOnboardingToDatabase } from '../../services/onboardingService';

// Complete the OAuth flow
WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen({ navigation }) {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Handle deep links when app is opened from OAuth redirect
    const handleDeepLink = async (event) => {
      const url = event.url;
      if (url && url.includes('access_token')) {
        // Parse the URL to extract tokens from hash fragments
        const hashParams = new URLSearchParams(url.split('#')[1] || '');
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        
        if (accessToken && refreshToken) {
          // Set the session with the tokens
          const { data: { session }, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          
          if (session && !error) {
            navigation.replace('Main');
          }
        }
      }
    };

    // Get initial URL if app was opened from a link
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink({ url });
      }
    });

    // Listen for deep links while app is running
    const subscription = Linking.addEventListener('url', handleDeepLink);

    return () => {
      subscription?.remove();
    };
  }, [navigation]);

  const handleGetStarted = () => {
    // Navigate to onboarding process
    navigation.replace('Onboarding');
  };

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);

      // Get the redirect URL - this should match your Supabase redirect URL configuration
      // Format: small:// (for production) or exp://localhost:8081 (for Expo Go)
      const redirectUrl = Linking.createURL('/');
      
      // Sign in with Google
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
        },
      });

      if (error) {
        throw error;
      }

      // Open the OAuth URL in browser
      if (data?.url) {
        const result = await WebBrowser.openAuthSessionAsync(
          data.url,
          redirectUrl
        );

        if (result.type === 'success') {
          // Parse the redirect URL to extract tokens
          const url = result.url;
          console.log('OAuth redirect URL:', url);
          
          // Extract hash fragments from URL (access_token, refresh_token, etc.)
          const hashParams = new URLSearchParams(url.split('#')[1] || '');
          const accessToken = hashParams.get('access_token');
          const refreshToken = hashParams.get('refresh_token');
          
          if (accessToken && refreshToken) {
            // Set the session manually with the tokens from the OAuth callback
            const { data: { session }, error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });
            
            if (session && !sessionError) {
              // Sync any local onboarding data to database after authentication
              await syncOnboardingToDatabase();
              
              // Session is set, navigation will be handled by App.js auth state listener
              // But we can navigate here as well to ensure it happens
              navigation.replace('Main');
            } else {
              console.error('Session error:', sessionError);
              Alert.alert('Error', sessionError?.message || 'Failed to complete sign in. Please try again.');
              setLoading(false);
            }
          } else {
            // Try to get session from Supabase (it might have processed it automatically)
            setTimeout(async () => {
              const { data: { session } } = await supabase.auth.getSession();
              if (session) {
                navigation.replace('Main');
              } else {
                Alert.alert('Error', 'Failed to complete sign in. Please try again.');
                setLoading(false);
              }
            }, 1000);
          }
        } else if (result.type === 'cancel') {
          // User cancelled the OAuth flow
          setLoading(false);
        } else {
          setLoading(false);
        }
      }
    } catch (error) {
      console.error('Error signing in with Google:', error);
      Alert.alert('Error', error.message || 'Failed to sign in with Google');
      setLoading(false);
    }
  };

  return (
    <ImageBackground
      source={require('../../assets/login/login.png')}
      style={styles.background}
      resizeMode="cover"
    >
      <SafeAreaView style={styles.container}>
        {/* Logo and Tagline Section */}
        <View style={styles.logoSection}>
          <Image
            source={require('../../assets/logo/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <View style={styles.taglineContainer}>
            <Text style={styles.tagline}>just start</Text>
            <Text style={styles.tagline}>done daily</Text>
          </View>
        </View>

        {/* Buttons Section */}
        <View style={styles.buttonsContainer}>
          <TouchableOpacity
            style={styles.getStartedButton}
            onPress={handleGetStarted}
            activeOpacity={0.8}
          >
            <Text style={styles.getStartedText}>get started</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.continueButton}
            onPress={handleGoogleSignIn}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.continueText}>continue with my account</Text>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  container: {
    flex: 1,
    justifyContent: 'space-between',
  },
  logoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
    alignSelf: 'center',
  },
  logo: {
    width: 78,
    height: 78,
    borderRadius: 6,
  },
  taglineContainer: {
    marginLeft: 16,
  },
  tagline: {
    fontSize: 21,
    color: '#FFFFFF',
    fontFamily: FONTS.anton,
    textTransform: 'lowercase',
    lineHeight: 26,
  },
  buttonsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 16,
  },
  getStartedButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 50,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
  },
  getStartedText: {
    fontSize: 16,
    color: '#01C459',
    fontFamily: FONTS.anton,
    textTransform: 'lowercase',
    fontWeight: 'bold',
  },
  continueButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 50,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  continueText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontFamily: FONTS.anton,
    textTransform: 'lowercase',
    fontWeight: 'bold',
  },
});

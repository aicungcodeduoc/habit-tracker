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
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';
import { FONTS } from '../../config/fonts';
import { supabase } from '../../config/supabase';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { syncOnboardingToDatabase } from '../../src/api/onboardingService';
import { signInWithApple } from '../../src/api/appleAuth';

WebBrowser.maybeCompleteAuthSession();

export default function SignInScreen({ navigation }) {
  const [loading, setLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);

  useEffect(() => {
    const handleDeepLink = async (event) => {
      const url = event.url;
      if (url && url.includes('access_token')) {
        const hashParams = new URLSearchParams(url.split('#')[1] || '');
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');

        if (accessToken && refreshToken) {
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

    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink({ url });
      }
    });

    const subscription = Linking.addEventListener('url', handleDeepLink);

    return () => {
      subscription?.remove();
    };
  }, [navigation]);

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);

      const redirectUrl = Linking.createURL('/');

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
        },
      });

      if (error) {
        throw error;
      }

      if (data?.url) {
        const result = await WebBrowser.openAuthSessionAsync(
          data.url,
          redirectUrl
        );

        if (result.type === 'success') {
          const url = result.url;
          const hashParams = new URLSearchParams(url.split('#')[1] || '');
          const accessToken = hashParams.get('access_token');
          const refreshToken = hashParams.get('refresh_token');

          if (accessToken && refreshToken) {
            const { data: { session }, error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });

            if (session && !sessionError) {
              await syncOnboardingToDatabase();
              navigation.replace('Main');
            } else {
              console.error('Session error:', sessionError);
              Alert.alert('Error', sessionError?.message || 'Failed to complete sign in. Please try again.');
              setLoading(false);
            }
          } else {
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

  const handleAppleSignIn = async () => {
    if (loading || appleLoading) return;
    setAppleLoading(true);
    try {
      const { session, error, cancelled } = await signInWithApple(supabase);
      if (cancelled) return;
      if (error) {
        Alert.alert('Error', error.message || 'Sign in with Apple failed.');
        return;
      }
      if (session) {
        await syncOnboardingToDatabase();
        navigation.replace('Main');
      }
    } finally {
      setAppleLoading(false);
    }
  };

  return (
    <ImageBackground
      source={require('../../assets/login/login.png')}
      style={styles.background}
      resizeMode="cover"
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.topArea}>
          <TouchableOpacity
            style={styles.backRow}
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityRole="button"
            accessibilityLabel="Back"
          >
            <ChevronLeft size={28} color="#FFFFFF" />
            <Text style={styles.backText}>back</Text>
          </TouchableOpacity>

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
        </View>

        <View style={styles.buttonsContainer}>
          {Platform.OS === 'ios' ? (
            <View style={styles.appleButtonWrap}>
              {appleLoading ? (
                <ActivityIndicator color="#01C459" style={styles.appleLoading} />
              ) : (
                <TouchableOpacity
                  style={styles.appleButton}
                  onPress={handleAppleSignIn}
                  activeOpacity={0.85}
                  accessibilityRole="button"
                  accessibilityLabel="Sign in with Apple"
                >
                  <Text style={styles.appleButtonText}>sign in with apple</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : null}

          <TouchableOpacity
            style={styles.googleButton}
            onPress={handleGoogleSignIn}
            disabled={loading || appleLoading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#01C459" />
            ) : (
              <>
                <Image
                  source={require('../../assets/onboarding/login_with_google.png')}
                  style={styles.googleButtonImage}
                  resizeMode="contain"
                />
                <Text style={styles.googleButtonText}>continue with google</Text>
              </>
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
  },
  topArea: {
    flex: 1,
    paddingTop: 8,
  },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    alignSelf: 'flex-start',
  },
  backText: {
    fontSize: 18,
    color: '#FFFFFF',
    fontFamily: FONTS.anton,
    textTransform: 'lowercase',
    marginLeft: 4,
  },
  logoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
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
    gap: 12,
  },
  appleButtonWrap: {
    width: '100%',
    minHeight: 56,
    justifyContent: 'center',
  },
  appleButton: {
    width: '100%',
    height: 56,
    borderRadius: 30,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  appleButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontFamily: FONTS.anton,
    textTransform: 'lowercase',
    fontWeight: 'bold',
  },
  appleLoading: {
    paddingVertical: 16,
  },
  googleButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    minHeight: 56,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  googleButtonImage: {
    width: 24,
    height: 24,
    marginRight: 12,
  },
  googleButtonText: {
    fontSize: 16,
    color: '#01C459',
    fontFamily: FONTS.anton,
    textTransform: 'lowercase',
    fontWeight: 'bold',
  },
});

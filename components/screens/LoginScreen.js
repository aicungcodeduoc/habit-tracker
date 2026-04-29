import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  Image,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FONTS } from '../../config/fonts';

export default function LoginScreen({ navigation }) {
  const handleGetStarted = () => {
    navigation.replace('Onboarding');
  };

  const handleContinueWithAccount = () => {
    navigation.navigate('SignIn');
  };

  return (
    <ImageBackground
      source={require('../../assets/login/login.png')}
      style={styles.background}
      resizeMode="cover"
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.topArea}>
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
          <TouchableOpacity
            style={styles.getStartedButton}
            onPress={handleGetStarted}
            activeOpacity={0.8}
          >
            <Text style={styles.getStartedText}>get started</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.continueButton}
            onPress={handleContinueWithAccount}
            activeOpacity={0.8}
          >
            <Text style={styles.continueText}>continue with my account</Text>
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
    paddingTop: 24,
  },
  logoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
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

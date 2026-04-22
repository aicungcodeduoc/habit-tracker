import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  Image,
  Animated,
  Alert,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import * as Notifications from 'expo-notifications';
import { useNavigation } from '@react-navigation/native';
import { FONTS } from '../../config/fonts';
import { ChevronRight, Sparkles } from 'lucide-react-native';
import { OnboardingImage, OnboardingHeading } from '../molecules';
import { useStepAnimation } from '../hooks';
import { supabase } from '../../config/supabase';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { saveOnboardingData, syncOnboardingToDatabase } from '../../src/api/onboardingService';
import { signInWithApple } from '../../src/api/appleAuth';
import * as AppleAuthentication from 'expo-apple-authentication';

// Complete the OAuth flow
WebBrowser.maybeCompleteAuthSession();

export default function OnboardingScreen() {
  const navigation = useNavigation();
  const [currentStep, setCurrentStep] = useState(0);
  const [habitInput, setHabitInput] = useState('');
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [selectedDistraction, setSelectedDistraction] = useState(null);
  const [isFromGoogleSignIn, setIsFromGoogleSignIn] = useState(false);
  const [appleSigning, setAppleSigning] = useState(false);
  
  // Get screen dimensions
  const screenWidth = Dimensions.get('window').width;
  const screenHeight = Dimensions.get('window').height;
  
  // Calculate image positioning (150% size with offsets to center the overflow)
  const imageWidth = screenWidth * 1.3; // 150% of screen width
  const imageHeight = screenHeight * 1.3; // 150% of screen height
  const offsetX = (imageWidth - screenWidth) / 2; // Center horizontally
  const offsetY = (imageHeight - screenHeight) / 2; // Center vertically

  // Steps will be defined later
  // Based on design, there are 6 steps total (including final screen)
  const totalSteps = 6;

  const suggestedHabits = [
    'reading book', 
    'running daily', 
    'yoga everyday',
    'drink water',
    'meditation',
    'exercise daily'
  ];

  const distractions = [
    "i'm not sure where to start",
    "i get distracted",
    "i feel unmotivated",
    "i lose focus",
    "i skip once and give up"
  ];

  // Animation values for step 3 buttons
  const [buttonAnimations] = useState(() => 
    distractions.map(() => new Animated.Value(0))
  );
  // Exit animation values for step 3 buttons (for sliding out to left)
  const [buttonExitAnimations] = useState(() => 
    distractions.map(() => new Animated.Value(0))
  );
  
  // Animation value for headings
  const [headingAnimation] = useState(() => new Animated.Value(0));
  
  // Animation values for step 1 elements
  const [step1InputAnimation] = useState(() => new Animated.Value(0));
  const [step1SuggestionsAnimation] = useState(() => new Animated.Value(0));
  // Exit animation values for step 1 elements (for sliding out to left)
  const [step1HeadingExitAnimation] = useState(() => new Animated.Value(0));
  const [step1InputExitAnimation] = useState(() => new Animated.Value(0));
  const [step1SuggestionsExitAnimation] = useState(() => new Animated.Value(0));
  
  // Animation values for other steps (subtitle, title, buttons)
  const [subtitleAnimation] = useState(() => new Animated.Value(0));
  const [titleAnimation] = useState(() => new Animated.Value(0));
  const [buttonAnimation] = useState(() => new Animated.Value(0));
  
  // Step 2 animation hook
  const step2Animation = useStepAnimation(currentStep, 1, {
    elements: [
      {
        name: 'subtitle',
        entry: { delay: 0, duration: 400 },
      },
      {
        name: 'title',
        entry: { delay: 200, duration: 400 },
      },
      {
        name: 'button',
        entry: { delay: 400, duration: 400 },
      },
    ],
    exit: { duration: 400, parallel: true },
  });

  // Step 3 animation hook (only subtitle and title, buttons have special handling)
  const step3Animation = useStepAnimation(currentStep, 2, {
    elements: [
      {
        name: 'subtitle',
        entry: { delay: 0, duration: 400 },
      },
      {
        name: 'title',
        entry: { delay: 200, duration: 400 },
      },
    ],
    exit: { duration: 400, parallel: true },
  });

  // Step 4 animation hook
  const step4Animation = useStepAnimation(currentStep, 3, {
    elements: [
      {
        name: 'subtitle',
        entry: { delay: 0, duration: 400 },
      },
      {
        name: 'title',
        entry: { delay: 200, duration: 400 },
      },
      {
        name: 'button',
        entry: { delay: 400, duration: 400 },
      },
    ],
    exit: { duration: 400, parallel: true },
  });

  // Animate headings and buttons when step changes
  useEffect(() => {
    // Reset all animations
    headingAnimation.setValue(0);
    subtitleAnimation.setValue(0);
    titleAnimation.setValue(0);
    buttonAnimation.setValue(0);

    if (currentStep === 0) {
      // Step 1: Animate heading first, then input and suggestions
      step1InputAnimation.setValue(0);
      step1SuggestionsAnimation.setValue(0);
      // Reset exit animations
      step1HeadingExitAnimation.setValue(0);
      step1InputExitAnimation.setValue(0);
      step1SuggestionsExitAnimation.setValue(0);
      
      // Animate heading
      Animated.timing(headingAnimation, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
      
      // Animate input after heading
      Animated.sequence([
        Animated.delay(300), // Wait for heading to start
        Animated.timing(step1InputAnimation, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();
      
      // Animate suggestions after input
      Animated.sequence([
        Animated.delay(600), // Wait for heading and input
        Animated.timing(step1SuggestionsAnimation, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();
    } else if (currentStep === 2) {
      // Step 3: Animate buttons (subtitle and title use hook)
      // Reset button exit animations
      buttonExitAnimations.forEach(anim => anim.setValue(0));
      // Animate each distraction button with a slight delay after title
      Animated.sequence([
        Animated.delay(400),
        Animated.parallel(
          buttonAnimations.map((anim, index) =>
            Animated.timing(anim, {
              toValue: 1,
              duration: 400,
              delay: index * 100,
              useNativeDriver: true,
            })
          )
        ),
      ]).start();
    } else if (currentStep === 5) {
      // Final screen: Animate subtitle and title with slide-in animation
      
      // Animate subtitle first
      Animated.timing(subtitleAnimation, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
      
      // Animate title after subtitle
      const titleAnimationSequence = Animated.sequence([
        Animated.delay(200),
        Animated.timing(titleAnimation, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]);
      
      // Only auto-navigate if coming from Google sign-in
      if (isFromGoogleSignIn) {
        titleAnimationSequence.start(() => {
          // After text animation completes (200ms delay + 400ms duration = 600ms total),
          // wait 2 seconds then navigate to Main
          setTimeout(() => {
            // Save completion status
            saveOnboardingData({
              onboardingCompleted: true,
            }).then(() => {
              setIsFromGoogleSignIn(false); // Reset flag
              navigation.replace('Main');
            });
          }, 2000); // 2 seconds after animation completes
        });
      } else {
        titleAnimationSequence.start();
      }
    } else if (currentStep === 4) {
      // Step 5: Animate subtitle, title, then button (steps 2, 3, 4 use hooks)
      // Animate subtitle first
      Animated.timing(subtitleAnimation, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
      
      // Animate title after subtitle
      Animated.sequence([
        Animated.delay(200),
        Animated.timing(titleAnimation, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();
      
      // Animate button after title
      Animated.sequence([
        Animated.delay(400),
        Animated.timing(buttonAnimation, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Reset step 1 animations when leaving
      step1InputAnimation.setValue(0);
      step1SuggestionsAnimation.setValue(0);
      // Reset step 3 button animations
      buttonAnimations.forEach(anim => anim.setValue(0));
      buttonExitAnimations.forEach(anim => anim.setValue(0));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- only react to currentStep
  }, [currentStep]);

  const handleNext = async () => {
    // Save data based on current step before moving forward
    if (currentStep === 0 && habitInput.trim()) {
      // Save habit name from step 1
      await saveOnboardingData({
        habitName: habitInput.trim(),
      });
    } else if (currentStep === 2 && selectedDistraction !== null) {
      // Save distraction selection from step 3
      const distractionText = distractions[selectedDistraction];
      await saveOnboardingData({
        distractionIndex: selectedDistraction,
        distractionText: distractionText,
      });
    }

    // Handle step 1 exit animation (slide out to left)
    if (currentStep === 0) {
      // Reset exit animations
      step1HeadingExitAnimation.setValue(0);
      step1InputExitAnimation.setValue(0);
      step1SuggestionsExitAnimation.setValue(0);
      
      // Create exit animations that slide elements out to the left
      const exitDuration = 400;
      const nextStep = currentStep + 1;
      
      // Animate all three elements out simultaneously
      Animated.parallel([
        Animated.timing(step1HeadingExitAnimation, {
          toValue: 1,
          duration: exitDuration,
          useNativeDriver: true,
        }),
        Animated.timing(step1InputExitAnimation, {
          toValue: 1,
          duration: exitDuration,
          useNativeDriver: true,
        }),
        Animated.timing(step1SuggestionsExitAnimation, {
          toValue: 1,
          duration: exitDuration,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // After exit animation completes, move to next step
        setCurrentStep(nextStep);
        setIsInputFocused(false);
      });
      return;
    }

    // Handle step 2 exit animation (slide out to left)
    if (currentStep === 1) {
      const nextStep = currentStep + 1;
      step2Animation.triggerExit(() => {
        // After exit animation completes, move to next step
        setCurrentStep(nextStep);
        setIsInputFocused(false);
      });
      return;
    }

    // Handle step 4 exit animation (slide out to left)
    if (currentStep === 3) {
      const nextStep = currentStep + 1;
      step4Animation.triggerExit(() => {
        // After exit animation completes, move to next step
        setCurrentStep(nextStep);
        setIsInputFocused(false);
      });
      return;
    }

    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
      setIsInputFocused(false);
    } else {
      // Complete onboarding and save completion status
      await saveOnboardingData({
        onboardingCompleted: true,
      });
      
      // Navigate to Main
      navigation.replace('Main');
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      setIsInputFocused(false);
    }
  };

  const handleSkipNotifications = async () => {
    await saveOnboardingData({ notificationsEnabled: false });
    handleNext();
  };

  const handleRequestNotification = async () => {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus === 'granted') {
        await saveOnboardingData({
          notificationsEnabled: true,
        });
        handleNext();
      } else {
        await saveOnboardingData({ notificationsEnabled: false });
        handleNext();
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      await saveOnboardingData({ notificationsEnabled: false });
      handleNext();
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      // Get the redirect URL
      const redirectUrl = Linking.createURL('/');
      console.log('Redirect URL:', redirectUrl); // Debug log

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
              
              // Set flag to indicate coming from Google sign-in
              setIsFromGoogleSignIn(true);
              // Navigate to final onboarding screen instead of Main
              setCurrentStep(5);
            } else {
              console.error('Session error:', sessionError);
              Alert.alert('Error', sessionError?.message || 'Failed to complete sign in. Please try again.');
            }
          } else {
            // Try to get session from Supabase (it might have processed it automatically)
            setTimeout(async () => {
              const { data: { session } } = await supabase.auth.getSession();
              if (session) {
                // Sync any local onboarding data to database after authentication
                await syncOnboardingToDatabase();
                // Set flag to indicate coming from Google sign-in
                setIsFromGoogleSignIn(true);
                // Navigate to final onboarding screen instead of Main
                setCurrentStep(5);
              } else {
                Alert.alert('Error', 'Failed to complete sign in. Please try again.');
              }
            }, 1000);
          }
        } else if (result.type === 'cancel') {
          // User cancelled, do nothing
        } else {
          Alert.alert('Error', 'Failed to complete sign in. Please try again.');
        }
      }
    } catch (error) {
      console.error('Google sign in error:', error);
      Alert.alert('Error', error.message || 'Failed to sign in with Google. Please try again.');
    }
  };

  const handleAppleSignIn = async () => {
    if (appleSigning || Platform.OS !== 'ios') return;
    setAppleSigning(true);
    try {
      const { session, error, cancelled } = await signInWithApple(supabase);
      if (cancelled) return;
      if (error) {
        Alert.alert('Error', error.message || 'Sign in with Apple failed.');
        return;
      }
      if (session) {
        await syncOnboardingToDatabase();
        setIsFromGoogleSignIn(true);
        setCurrentStep(5);
      }
    } finally {
      setAppleSigning(false);
    }
  };

  const handleSuggestedHabit = (habit) => {
    setHabitInput(habit);
  };

  const handleDistractionSelect = async (index) => {
    // Set the selected distraction
    setSelectedDistraction(index);
    
    // Save the distraction selection
    const distractionText = distractions[index];
    await saveOnboardingData({
      distractionIndex: index,
      distractionText: distractionText,
    });
    
    // Reset exit animations
    buttonExitAnimations.forEach(anim => anim.setValue(0));
    
    // Animate exit: slide heading and buttons out to the left
    // Use hook's exit animation for heading, and buttons separately
    Animated.parallel([
      // Slide heading out using hook
      Animated.timing(step3Animation.exitAnimations.subtitle, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(step3Animation.exitAnimations.title, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      // Slide all buttons out to the left
      Animated.parallel(
        buttonExitAnimations.map((anim) =>
          Animated.timing(anim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          })
        )
      ),
    ]).start(() => {
      // After exit animation completes, move to next step
      if (currentStep < totalSteps - 1) {
        setCurrentStep(currentStep + 1);
        setIsInputFocused(false);
      }
    });
  };

  const renderStepContent = () => {
    // Step 1: Input habit
    if (currentStep === 0) {
      return (
        <View style={styles.stepContent}>
          <Animated.View
            style={{
              opacity: headingAnimation,
              transform: [
                {
                  translateX: Animated.add(
                    headingAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [300, 0],
                    }),
                    step1HeadingExitAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, -400],
                    })
                  ),
                },
              ],
            }}
          >
            {!isInputFocused && (
              <Text style={styles.stepTitle}>let's start now,</Text>
            )}
          </Animated.View>
          
          <Animated.View
            style={[
              styles.inputContainer,
              {
                opacity: step1InputAnimation,
                transform: [
                  {
                    translateX: Animated.add(
                      step1InputAnimation.interpolate({
                        inputRange: [0, 1],
                        outputRange: [300, 0],
                      }),
                      step1InputExitAnimation.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, -400],
                      })
                    ),
                  },
                ],
              },
            ]}
          >
            <TextInput
              style={[
                styles.input,
                habitInput && styles.inputActive
              ]}
              placeholder="type 1 habit you wanna do..."
              placeholderTextColor="#999"
              value={habitInput}
              onChangeText={setHabitInput}
              onFocus={() => setIsInputFocused(true)}
              onBlur={() => setIsInputFocused(false)}
              autoFocus={false}
            />
          </Animated.View>

          <Animated.View
            style={[
              styles.suggestedContainer,
              {
                opacity: step1SuggestionsAnimation,
                transform: [
                  {
                    translateX: Animated.add(
                      step1SuggestionsAnimation.interpolate({
                        inputRange: [0, 1],
                        outputRange: [300, 0],
                      }),
                      step1SuggestionsExitAnimation.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, -400],
                      })
                    ),
                  },
                ],
              },
            ]}
          >
            <Sparkles size={16} color="#999" />
            <Text style={styles.maybeText}>may be</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.suggestedScrollContent}
              style={styles.suggestedScrollView}
            >
              {suggestedHabits.map((habit, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.suggestedPill,
                    habitInput.toLowerCase() === habit.toLowerCase() && styles.suggestedPillSelected
                  ]}
                  onPress={() => handleSuggestedHabit(habit)}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.suggestedText,
                    habitInput.toLowerCase() === habit.toLowerCase() && styles.suggestedTextSelected
                  ]}>{habit}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Animated.View>
        </View>
      );
    }

    // Step 2: Commit
    if (currentStep === 1) {
      return (
        <View style={styles.step2Container}>
          <OnboardingHeading
            subtitle="you don't need perfection"
            title="just consistency"
            style={styles.stepHeading}
            subtitleAnimation={step2Animation.animations.subtitle}
            titleAnimation={step2Animation.animations.title}
            subtitleExitAnimation={step2Animation.exitAnimations.subtitle}
            titleExitAnimation={step2Animation.exitAnimations.title}
          />
          
          <View style={styles.onboardingImageContainer}>
            <OnboardingImage
              source={require('../../assets/onboarding/commit.png')}
            />
          </View>

          <Animated.View
            style={[
              styles.commitButtonContainer,
              step2Animation.getAnimationStyle('button'),
            ]}
          >
            <TouchableOpacity
              style={styles.commitButton}
              onPress={handleNext}
              activeOpacity={0.8}
            >
              <Text style={styles.commitButtonText}>yes, i commit</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      );
    }

    // Step 3: What distracts you
    if (currentStep === 2) {
      return (
        <View style={styles.step3Container}>
          <OnboardingHeading
            subtitle="to be honest,"
            title="what usually gets in your way?"
            style={styles.stepHeading}
            subtitleAnimation={step3Animation.animations.subtitle}
            titleAnimation={step3Animation.animations.title}
            subtitleExitAnimation={step3Animation.exitAnimations.subtitle}
            titleExitAnimation={step3Animation.exitAnimations.title}
          />
          
          <View style={styles.onboardingImageContainer}>
            <OnboardingImage
              source={require('../../assets/onboarding/commit.png')}
            />
          </View>

          <View style={styles.distractionButtonsContainer}>
            {distractions.map((distraction, index) => {
              const entryTranslateX = buttonAnimations[index].interpolate({
                inputRange: [0, 1],
                outputRange: [300, 0], // Slide in from right
              });
              const exitTranslateX = buttonExitAnimations[index].interpolate({
                inputRange: [0, 1],
                outputRange: [0, -400], // Slide out to left
              });
              const translateX = Animated.add(entryTranslateX, exitTranslateX);
              const opacity = buttonAnimations[index];

              return (
                <Animated.View
                  key={index}
                  style={[
                    styles.distractionButtonWrapper,
                    {
                      transform: [{ translateX }],
                      opacity,
                    },
                  ]}
                >
                  <TouchableOpacity
                    style={[
                      styles.distractionButton,
                      selectedDistraction === index && styles.distractionButtonSelected,
                    ]}
                    onPress={() => handleDistractionSelect(index)}
                    activeOpacity={0.7}
                  >
                    <Text style={[
                      styles.distractionButtonText,
                      selectedDistraction === index && styles.distractionButtonTextSelected,
                    ]}>
                      {distraction}
                    </Text>
                  </TouchableOpacity>
                </Animated.View>
              );
            })}
          </View>
        </View>
      );
    }

    // Step 4: Stay on track
    if (currentStep === 3) {
      return (
        <View style={styles.step4Container}>
          <OnboardingHeading
            subtitle='let "small" remind you,'
            title="stay on track, daily"
            style={styles.stepHeading}
            subtitleAnimation={step4Animation.animations.subtitle}
            titleAnimation={step4Animation.animations.title}
            subtitleExitAnimation={step4Animation.exitAnimations.subtitle}
            titleExitAnimation={step4Animation.exitAnimations.title}
          />
          
          <View style={styles.onboardingImageContainer}>
            <OnboardingImage
              source={require('../../assets/onboarding/commit.png')}
            />
          </View>

          <Animated.View
            style={[
              styles.allowButtonContainer,
              step4Animation.getAnimationStyle('button'),
            ]}
          >
            <TouchableOpacity
              style={styles.allowButton}
              onPress={handleRequestNotification}
              activeOpacity={0.8}
            >
              <Text style={styles.allowButtonText}>yes, i allow</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.notNowButton}
              onPress={handleSkipNotifications}
              activeOpacity={0.8}
            >
              <Text style={styles.notNowButtonText}>not now</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      );
    }

    // Step 5: Keep your small wins
    if (currentStep === 4) {
      return (
        <View style={styles.step5Container}>
          <OnboardingHeading
            subtitle="keep your small wins,"
            title="save progress"
            style={styles.stepHeading}
            subtitleAnimation={subtitleAnimation}
            titleAnimation={titleAnimation}
          />
          
          <View style={styles.onboardingImageContainer}>
            <OnboardingImage
              source={require('../../assets/onboarding/watering_tree.png')}
            />
          </View>

          <Animated.View
            style={[
              styles.googleButtonContainer,
              {
                opacity: buttonAnimation,
                transform: [
                  {
                    translateX: buttonAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [300, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <View style={styles.oauthButtonsColumn}>
              {Platform.OS === 'ios' ? (
                <View style={styles.onboardingAppleWrap}>
                  {appleSigning ? (
                    <ActivityIndicator color="#01C459" style={styles.onboardingAppleSpinner} />
                  ) : (
                    <AppleAuthentication.AppleAuthenticationButton
                      buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
                      buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
                      cornerRadius={30}
                      style={styles.onboardingAppleButton}
                      onPress={handleAppleSignIn}
                    />
                  )}
                </View>
              ) : null}
              <TouchableOpacity
                style={styles.googleButton}
                onPress={handleGoogleSignIn}
                activeOpacity={0.8}
                disabled={appleSigning}
              >
                <Image
                  source={require('../../assets/onboarding/login_with_google.png')}
                  style={styles.googleButtonImage}
                  resizeMode="contain"
                />
                <Text style={styles.googleButtonText}>continue with google</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      );
    }

    // Final Onboarding Screen
    if (currentStep === 5) {
      // Dynamic styles for final image based on screen dimensions
      const finalImageStyle = {
        width: imageWidth,
        height: imageHeight,
        position: 'absolute',
        top: -offsetY,
        left: -offsetX,
      };
      
      return (
        <View style={styles.finalOnboardingContainer}>
          <Image
            source={require('../../assets/onboarding/final_onboarding.png')}
            style={finalImageStyle}
            resizeMode="cover"
          />
          <View style={styles.finalHeadingContainer}>
            <Animated.View
              style={{
                opacity: subtitleAnimation,
                transform: [
                  {
                    translateX: subtitleAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [300, 0],
                    }),
                  },
                ],
              }}
            >
              <Text style={[styles.finalSubtitle]}>you're in,</Text>
            </Animated.View>
            <Animated.View
              style={{
                opacity: titleAnimation,
                transform: [
                  {
                    translateX: titleAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [300, 0],
                    }),
                  },
                ],
              }}
            >
              <Text style={styles.finalTitle}>small wins count</Text>
            </Animated.View>
          </View>
        </View>
      );
    }

    // Placeholder for other steps
    return (
      <View style={styles.stepContent}>
        <Text style={styles.stepTitle}>Step {currentStep + 1}</Text>
        <Text style={styles.stepDescription}>
          Step content will be defined here
        </Text>
      </View>
    );
  };

  const isNextButtonActive = currentStep === 0 
    ? habitInput.trim().length > 0 
    : currentStep === 2 
    ? selectedDistraction !== null 
    : true;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <View style={styles.content}>
        {/* Back button and progress indicator - hidden on final screen */}
        {currentStep !== 5 && (
          <View style={styles.topBar}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={handlePrevious}
              activeOpacity={0.7}
              disabled={currentStep === 0}
            >
              <Text style={[styles.backText, currentStep === 0 && styles.backTextDisabled]}>&lt; back</Text>
            </TouchableOpacity>
            
            <View style={styles.progressContainer}>
              {Array.from({ length: totalSteps }).map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.progressStep,
                    index <= currentStep && styles.progressStepActive,
                  ]}
                />
              ))}
            </View>
          </View>
        )}

        {/* Step content */}
        <View style={styles.stepContainer}>
          {renderStepContent()}
        </View>

        {/* Next button - hidden on step 2 (uses commit button instead), step 3 (auto-advances on selection), step 4 (uses allow button instead), step 5 (uses Google button instead), and final screen (no buttons) */}
        {currentStep !== 1 && currentStep !== 2 && currentStep !== 3 && currentStep !== 4 && currentStep !== 5 && (
          <View style={[
            styles.bottomNavigation,
            currentStep === 2 && styles.bottomNavigationAbsolute
          ]}>
            <TouchableOpacity
              style={[
                styles.nextButton,
                isNextButtonActive && styles.nextButtonActive,
              ]}
              onPress={handleNext}
              disabled={!isNextButtonActive}
              activeOpacity={0.8}
            >
              <ChevronRight 
                size={32} 
                color={isNextButtonActive ? "#FFFFFF" : "#E0E0E0"} 
              />
            </TouchableOpacity>
          </View>
        )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 40,
  },
  backButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  backText: {
    fontSize: 16,
    color: '#333',
    fontFamily: FONTS.anton,
    textTransform: 'lowercase',
  },
  backTextDisabled: {
    color: '#999',
    opacity: 0.5,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressStep: {
    width: 32,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E0F5E8',
  },
  progressStepActive: {
    backgroundColor: '#01C459',
  },
  topBarLogo: {
    width: 40,
    height: 40,
    borderRadius: 4,
  },
  stepContainer: {
    flex: 1,
    justifyContent: 'flex-start',
    paddingTop: 20,
  },
  stepContent: {
    flex: 1,
  },
  step2Container: {
    flex: 1,
    position: 'relative',
  },
  stepTitle: {
    fontSize: 54,
    color: '#333',
    fontFamily: FONTS.anton,
    textTransform: 'lowercase',
    marginBottom: 20,
    width: '100%',
  },
  stepDescription: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  inputContainer: {
    marginBottom: 16,
  },
  input: {
    fontSize: 36,
    color: '#999',
    fontFamily: FONTS.anton,
    textTransform: 'lowercase',
    // minHeight: 60,
    paddingVertical: 16,
    paddingHorizontal: 0,
    lineHeight: 48,
    includeFontPadding: true,
    textAlignVertical: 'top',
  },
  inputActive: {
    color: '#01C459',
  },
  suggestedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'nowrap',
    marginTop: 16,
  },
  maybeText: {
    fontSize: 14,
    color: '#999',
    marginLeft: 4,
    marginRight: 12,
  },
  suggestedScrollView: {
    flex: 1,
  },
  suggestedScrollContent: {
    paddingRight: 20,
  },
  suggestedPill: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 8,
  },
  suggestedPillSelected: {
    backgroundColor: '#01C459',
    borderColor: '#01C459',
  },
  suggestedText: {
    fontSize: 14,
    color: '#333',
    fontFamily: FONTS.anton,
    textTransform: 'lowercase',
  },
  suggestedTextSelected: {
    color: '#FFFFFF',
  },
  bottomNavigation: {
    alignItems: 'flex-end',
    // paddingBottom: 20,
    // paddingRight: 20,
  },
  bottomNavigationAbsolute: {
    position: 'absolute',
    bottom: -10,
    right: 20,
    paddingBottom: 0,
    paddingRight: 0,
    zIndex: 15,
  },
  nextButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E0F5E8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextButtonActive: {
    backgroundColor: '#01C459',
  },
  // Step 2 styles
  stepHeading: {
    paddingTop: 0,
    marginTop: -20,
  },
  onboardingImageContainer: {
    position: 'absolute',
    top: 120,
    left: 0,
    right: 0,
    bottom: 0,
    // backgroundColor: 'red',
    marginBottom: -100,
  },
  commitButtonContainer: {
    position: 'absolute',
    bottom: -30,
    left: 20,
    right: 20,
    zIndex: 10,
  },
  commitButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  commitButtonText: {
    fontSize: 18,
    color: '#333',
    fontFamily: FONTS.anton,
    textTransform: 'lowercase',
    fontWeight: 'bold',
  },
  // Step 3 styles
  step3Container: {
    flex: 1,
    position: 'relative',
  },
  distractionButtonsContainer: {
    position: 'absolute',
    top: '40%',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    paddingHorizontal: 20,
  },
  distractionButtonWrapper: {
    width: '100%',
    marginBottom: 12,
    alignItems: 'center',
  },
  distractionButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 30,
    width: '90%',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 60,
  },
  distractionButtonSelected: {
    backgroundColor: '#01C459',
  },
  distractionButtonText: {
    fontSize: 18,
    color: '#01C459',
    fontFamily: FONTS.anton,
    textTransform: 'lowercase',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  distractionButtonTextSelected: {
    color: '#FFFFFF',
  },
  // Step 4 styles
  step4Container: {
    flex: 1,
    position: 'relative',
  },
  allowButtonContainer: {
    position: 'absolute',
    bottom: -30,
    left: 20,
    right: 20,
    zIndex: 10,
  },
  allowButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  allowButtonText: {
    fontSize: 18,
    color: '#333',
    fontFamily: FONTS.anton,
    textTransform: 'lowercase',
    fontWeight: 'bold',
  },
  notNowButton: {
    marginTop: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  notNowButtonText: {
    fontSize: 16,
    color: 'rgba(51, 51, 51, 0.75)',
    fontFamily: FONTS.anton,
    textTransform: 'lowercase',
  },
  // Step 5 styles
  step5Container: {
    flex: 1,
    position: 'relative',
  },
  googleButtonContainer: {
    position: 'absolute',
    bottom: -30,
    left: 20,
    right: 20,
    zIndex: 10,
  },
  oauthButtonsColumn: {
    width: '100%',
    gap: 12,
  },
  onboardingAppleWrap: {
    width: '100%',
    minHeight: 56,
    justifyContent: 'center',
  },
  onboardingAppleButton: {
    width: '100%',
    height: 56,
  },
  onboardingAppleSpinner: {
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
  // Final Onboarding Screen styles
  finalOnboardingContainer: {
    flex: 1,
    position: 'relative',
  },
  // finalOnboardingImage styles are now calculated dynamically in render
  // based on screen dimensions (see finalImageStyle in step 5 render)
  finalHeadingContainer: {
    position: 'absolute',
    bottom: 80,
    left: 20,
    right: 20,
    zIndex: 10,
  },
  finalHeading: {
    marginBottom: 0,
  },
  finalSubtitle: {
    fontSize: 20,
    color: '#FFFFFF',
    opacity: 0.8,
    fontFamily: FONTS.anton,
    textTransform: 'lowercase',
    marginBottom: 8,
  },
  finalTitle: {
    fontSize: 42,
    color: '#FFFFFF',
    fontFamily: FONTS.anton,
    textTransform: 'lowercase',
    fontWeight: 'bold',
    lineHeight: 50,
  },
  finalButtonContainer: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
    zIndex: 20,
  },
  finalButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  finalButtonText: {
    fontSize: 18,
    color: '#FFFFFF',
    fontFamily: FONTS.anton,
    textTransform: 'lowercase',
    fontWeight: 'bold',
  },
});

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { AIIcon } from '../atoms';
import { COLORS } from '../../config/colors';
import { FONTS } from '../../config/fonts';

export default function AIResultScreen({ route, navigation }) {
  const { imageUri, habit, analysisResult } = route?.params || {};
  const isCorrect = analysisResult?.data?.correct === true;
  const message = analysisResult?.data?.message || 'Unable to analyze image.';

  const handleContinue = () => {
    if (isCorrect) {
      // Navigate to HabitSuccessScreen for correct responses
      navigation.navigate('HabitSuccess', {
        habit: habit,
        imageUri: imageUri,
      });
    } else {
      // Navigate back to HabitDetailScreen for incorrect responses
      navigation.navigate('HabitDetail', { habit: habit });
    }
  };

  const handleBack = () => {
    navigation.navigate('HabitDetail', { habit: habit });
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.headerButton}
          onPress={handleBack}
        >
          <ArrowLeft size={20} color={COLORS.textGrey} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Uploaded Image */}
        {imageUri && (
          <View style={styles.imageContainer}>
            <Image source={{ uri: imageUri }} style={styles.uploadedImage} resizeMode="cover" />
          </View>
        )}

        {/* AI Buddy Chat Bubble */}
        <View style={styles.chatContainer}>
          <View style={styles.bubbleContainer}>
            <View style={styles.buddyHeader}>
              <View style={[styles.avatar, isCorrect ? styles.avatarSuccess : styles.avatarError]}>
                <AIIcon size={20} color={COLORS.white} />
              </View>
              <Text style={styles.buddyLabel}>AI BUDDY</Text>
            </View>
            <View style={[styles.chatBubble, isCorrect ? styles.bubbleSuccess : styles.bubbleError]}>
              <Text style={styles.messageText}>{message}</Text>
            </View>
          </View>
        </View>

        {/* Action Button */}
        <TouchableOpacity 
          style={[styles.continueButton, isCorrect ? styles.buttonSuccess : styles.buttonError]}
          onPress={handleContinue}
        >
          <Text style={styles.continueButtonText}>
            {isCorrect ? 'Continue' : 'Try Again'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  headerButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 40,
    justifyContent: 'center',
  },
  imageContainer: {
    width: '100%',
    marginBottom: 32,
    alignItems: 'center',
  },
  uploadedImage: {
    width: '100%',
    height: 300,
    borderRadius: 16,
    backgroundColor: '#F0F0F0',
  },
  chatContainer: {
    marginBottom: 40,
  },
  bubbleContainer: {
    flex: 1,
  },
  buddyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarSuccess: {
    backgroundColor: COLORS.primary,
  },
  avatarError: {
    backgroundColor: '#FF6B35',
  },
  buddyLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
    fontFamily: FONTS.anton,
  },
  chatBubble: {
    padding: 16,
    borderRadius: 16,
  },
  bubbleSuccess: {
    backgroundColor: '#E8F5E9',
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  bubbleError: {
    backgroundColor: '#FFF3E0',
    borderWidth: 1,
    borderColor: '#FF6B35',
  },
  messageText: {
    fontSize: 16,
    fontWeight: '400',
    color: COLORS.textDark,
    fontFamily: FONTS.anton,
    lineHeight: 24,
  },
  continueButton: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonSuccess: {
    backgroundColor: COLORS.primary,
  },
  buttonError: {
    backgroundColor: '#FF6B35',
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
    fontFamily: FONTS.anton,
  },
});

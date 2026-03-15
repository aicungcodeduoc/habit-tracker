import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../../utils';

const ACTION_LABELS = {
  create_habit: 'Tạo thói quen',
  delete_habit: 'Xoá thói quen',
  toggle_completion: 'Cập nhật hoàn thành',
  get_habits: 'Xem thói quen',
  get_today_progress: 'Xem tiến độ',
};

export const MessageBubble = ({ message, isUser }) => {
  const timeString = new Date(message.created_at).toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const actions = message.metadata?.actions;
  const hasActions = !isUser && actions?.length > 0;

  return (
    <View style={[styles.container, isUser ? styles.userContainer : styles.buddyContainer]}>
      {hasActions && (
        <View style={styles.actionBadge}>
          {actions.map((action, i) => (
            <Text key={i} style={styles.actionBadgeText}>
              {action.success ? '\u2713' : '\u2717'} {ACTION_LABELS[action.name] || action.name}
            </Text>
          ))}
        </View>
      )}
      <View style={[styles.bubble, isUser ? styles.userBubble : styles.buddyBubble]}>
        <Text style={[styles.text, isUser ? styles.userText : styles.buddyText]}>
          {message.content}
        </Text>
      </View>
      <Text style={[styles.time, isUser ? styles.timeRight : styles.timeLeft]}>
        {timeString}
      </Text>
    </View>
  );
};

export const ErrorBubble = ({ message, onRetry }) => (
  <View style={styles.buddyContainer}>
    <View style={[styles.bubble, styles.errorBubble]}>
      <Text style={styles.errorText}>{message}</Text>
      {onRetry && (
        <Text style={styles.retryText} onPress={onRetry}>
          Thử lại
        </Text>
      )}
    </View>
  </View>
);

export const TypingBubble = () => (
  <View style={styles.buddyContainer}>
    <View style={[styles.bubble, styles.buddyBubble, styles.typingBubble]}>
      <Text style={styles.typingDots}>●  ●  ●</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
    paddingHorizontal: 16,
  },
  userContainer: {
    alignItems: 'flex-end',
  },
  buddyContainer: {
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    marginVertical: 4,
  },
  bubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 18,
  },
  userBubble: {
    backgroundColor: COLORS.primary,
    borderBottomRightRadius: 4,
  },
  buddyBubble: {
    backgroundColor: COLORS.white,
    borderBottomLeftRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  errorBubble: {
    backgroundColor: '#FEF2F2',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  typingBubble: {
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  text: {
    fontSize: 15,
    lineHeight: 22,
  },
  userText: {
    color: COLORS.white,
  },
  buddyText: {
    color: COLORS.textDark,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 14,
    lineHeight: 20,
  },
  retryText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
  },
  typingDots: {
    color: COLORS.textLight,
    fontSize: 14,
    letterSpacing: 2,
  },
  time: {
    fontSize: 11,
    color: COLORS.textLight,
    marginTop: 4,
  },
  timeRight: {
    textAlign: 'right',
    marginRight: 4,
  },
  timeLeft: {
    textAlign: 'left',
    marginLeft: 4,
  },
  actionBadge: {
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  actionBadgeText: {
    fontSize: 12,
    color: '#15803D',
    fontWeight: '600',
  },
});

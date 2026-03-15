import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS } from '../../config/colors';
import { FONTS } from '../../config/fonts';
import { AIIcon } from '../../src/components/atoms';
import { MessageBubble, TypingBubble, ErrorBubble, ChatInput } from '../../src/components/molecules';
import { getMessages, saveMessage } from '../../src/api/buddyService';
import { sendBuddyMessage } from '../../src/api/geminiService';
import { getHabits } from '../../src/api/habitService';
import { getCompletionsForDate } from '../../src/api/completionService';
import { supabase } from '../../src/api/supabase';

const QUICK_ACTIONS = [
  { label: 'Hôm nay thế nào?', message: 'Hôm nay tình hình thói quen của tôi thế nào?' },
  { label: 'Streak của tôi', message: 'Cho tôi xem streak các thói quen của tôi' },
  { label: 'Động viên tôi', message: 'Hãy động viên tôi tiếp tục duy trì thói quen' },
  { label: 'Gợi ý cải thiện', message: 'Gợi ý cho tôi cách cải thiện thói quen' },
];

const formatLocalDate = (date) => {
  const d = date || new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getDayOfWeek = () => {
  const days = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'];
  return days[new Date().getDay()];
};

export default function BuddyScreen() {
  const [messages, setMessages] = useState([]);
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState(null);
  const habitContextRef = useRef(null);
  const flatListRef = useRef(null);

  const buildHabitContext = useCallback(async () => {
    try {
      const [habitsResult, completionsResult, sessionResult] = await Promise.all([
        getHabits(),
        getCompletionsForDate(new Date()),
        supabase.auth.getSession(),
      ]);

      const habits = habitsResult.data || [];
      const completions = completionsResult.data || [];
      const userName = sessionResult.data?.session?.user?.user_metadata?.full_name
        || sessionResult.data?.session?.user?.user_metadata?.name
        || '';

      const completedHabitIds = new Set(completions.map(c => c.habit_id));

      const context = {
        userName,
        totalHabits: habits.length,
        habits: habits.map(h => ({
          title: h.title,
          frequency: h.frequency,
          streak: h.streak || 0,
          longestStreak: h.longest_streak || 0,
          completedToday: completedHabitIds.has(h.id),
        })),
        todayProgress: {
          completed: habits.filter(h => completedHabitIds.has(h.id)).length,
          total: habits.length,
        },
        currentDate: formatLocalDate(new Date()),
        dayOfWeek: getDayOfWeek(),
      };

      habitContextRef.current = context;
      return context;
    } catch (err) {
      console.error('Error building habit context:', err);
      return habitContextRef.current || {};
    }
  }, []);

  const loadMessages = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await getMessages(50);
      if (fetchError) throw fetchError;
      setMessages(data || []);
      setHasMore((data || []).length >= 50);
    } catch (err) {
      console.error('Error loading messages:', err);
      setError('Không thể tải tin nhắn');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadMoreMessages = useCallback(async () => {
    if (isLoadingMore || !hasMore || messages.length === 0) return;
    setIsLoadingMore(true);
    try {
      const oldestMessage = messages[messages.length - 1];
      const { data } = await getMessages(50, oldestMessage.created_at);
      if (data && data.length > 0) {
        setMessages(prev => [...prev, ...data]);
        setHasMore(data.length >= 50);
      } else {
        setHasMore(false);
      }
    } catch (err) {
      console.error('Error loading more messages:', err);
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, hasMore, messages]);

  useFocusEffect(
    useCallback(() => {
      loadMessages();
      buildHabitContext();
    }, [loadMessages, buildHabitContext])
  );

  const handleSend = useCallback(async (text, metadata = {}) => {
    if (isSending) return;

    // Optimistically add user message to UI
    const tempUserMsg = {
      id: `temp-user-${Date.now()}`,
      role: 'user',
      content: text,
      metadata,
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [tempUserMsg, ...prev]);
    setIsSending(true);
    setError(null);

    try {
      // Save user message to DB
      const { data: savedUserMsg } = await saveMessage('user', text, metadata);

      // Replace temp message with saved one
      if (savedUserMsg) {
        setMessages(prev => prev.map(m => m.id === tempUserMsg.id ? savedUserMsg : m));
      }

      // Build context and get conversation history for Gemini
      const context = await buildHabitContext();
      const recentMessages = messages.slice(0, 10).reverse().map(m => ({
        role: m.role,
        content: m.content,
      }));

      // Send to Gemini
      const result = await sendBuddyMessage(text, recentMessages, context);

      if (!result.success) {
        throw new Error(result.error);
      }

      // Save assistant response (include action metadata if any)
      const buddyMetadata = result.actions?.length > 0
        ? { actions: result.actions.map(a => ({ name: a.name, success: a.result?.success })) }
        : {};
      const { data: savedBuddyMsg } = await saveMessage('assistant', result.data, buddyMetadata);

      const buddyMsg = savedBuddyMsg || {
        id: `temp-buddy-${Date.now()}`,
        role: 'assistant',
        content: result.data,
        metadata: buddyMetadata,
        created_at: new Date().toISOString(),
      };

      setMessages(prev => [buddyMsg, ...prev]);

      // Refresh habit context if Buddy performed any actions
      if (result.actions?.length > 0) {
        buildHabitContext();
      }
    } catch (err) {
      console.error('Error sending message:', err);
      setError(err.message || 'Buddy đang gặp sự cố, bạn thử lại nhé!');
    } finally {
      setIsSending(false);
    }
  }, [isSending, messages, buildHabitContext]);

  const handleQuickAction = useCallback((action) => {
    handleSend(action.message, { quickAction: action.label });
  }, [handleSend]);

  const handleRetry = useCallback(() => {
    if (messages.length > 0 && messages[0].role === 'user') {
      const lastUserMsg = messages[0];
      // Remove the last user message and resend
      setMessages(prev => prev.slice(1));
      setError(null);
      handleSend(lastUserMsg.content, lastUserMsg.metadata);
    }
  }, [messages, handleSend]);

  const renderMessage = useCallback(({ item }) => (
    <MessageBubble message={item} isUser={item.role === 'user'} />
  ), []);

  const renderEmpty = () => {
    if (isLoading) return null;
    return (
      <View style={styles.emptyContainer}>
        <AIIcon size={64} color={COLORS.primary} />
        <Text style={styles.emptyTitle}>xin chào!</Text>
        <Text style={styles.emptyText}>
          Mình là Buddy, bạn đồng hành giúp bạn xây dựng thói quen tốt. Hãy bắt đầu trò chuyện nào!
        </Text>
      </View>
    );
  };

  const renderFooter = () => {
    if (isLoadingMore) {
      return (
        <View style={styles.loadingMore}>
          <ActivityIndicator size="small" color={COLORS.primary} />
        </View>
      );
    }
    return null;
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <AIIcon size={24} color={COLORS.primary} />
        <Text style={styles.headerTitle}>buddy</Text>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={item => item.id}
            inverted
            contentContainerStyle={[
              styles.messagesList,
              messages.length === 0 && styles.messagesListEmpty,
            ]}
            ListEmptyComponent={renderEmpty}
            ListFooterComponent={renderFooter}
            onEndReached={loadMoreMessages}
            onEndReachedThreshold={0.3}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={
              <>
                {error && (
                  <ErrorBubble message={error} onRetry={handleRetry} />
                )}
                {isSending && <TypingBubble />}
              </>
            }
          />
        )}

        <View style={styles.bottomSection}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.quickActionsContent}
            style={styles.quickActions}
          >
            {QUICK_ACTIONS.map((action) => (
              <TouchableOpacity
                key={action.label}
                style={[styles.quickActionChip, isSending && styles.quickActionDisabled]}
                onPress={() => handleQuickAction(action)}
                disabled={isSending}
                activeOpacity={0.7}
              >
                <Text style={styles.quickActionText}>{action.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <ChatInput onSend={handleSend} disabled={isSending} />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.homeBackground,
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: FONTS.anton,
    color: COLORS.textDark,
    textTransform: 'lowercase',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messagesList: {
    paddingVertical: 8,
    flexGrow: 1,
  },
  messagesListEmpty: {
    justifyContent: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingHorizontal: 40,
    gap: 12,
    transform: [{ scaleY: -1 }],
  },
  emptyTitle: {
    fontSize: 22,
    fontFamily: FONTS.anton,
    color: COLORS.textDark,
    textTransform: 'lowercase',
    marginTop: 8,
  },
  emptyText: {
    fontSize: 15,
    color: COLORS.textGrey,
    textAlign: 'center',
    lineHeight: 22,
  },
  loadingMore: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  bottomSection: {
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingBottom: 80,
  },
  quickActions: {
    maxHeight: 52,
  },
  quickActionsContent: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  quickActionChip: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    backgroundColor: 'transparent',
  },
  quickActionDisabled: {
    opacity: 0.4,
  },
  quickActionText: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '600',
  },
});

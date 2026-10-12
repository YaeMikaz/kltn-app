import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { askChatbot } from '../services/api';
import { useTheme } from '../context/ThemeContext';
import { Icon } from '../components/Icon';

const QUICK_PROMPTS = [
  'Độ ẩm hiện tại có tốt cho cây không?',
  'Hướng dẫn xử lý khi chỉ số EC tăng cao',
  'Liều lượng tưới và bón phân đợt này',
  'Nhiệt độ môi trường ảnh hưởng cây thế nào?',
  'Cách phòng ngừa sâu bệnh trong 24 giờ tới',
];

function simplifyAnswerText(rawText) {
  if (!rawText || typeof rawText !== 'string') {
    return 'Không có phản hồi từ trợ lý AI.';
  }
  let text = rawText
    .replace(/\$\$(.*?)\$\$/gs, '$1')
    .replace(/\$(.*?)\$/gs, '$1')
    .replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, '$1/$2')
    .replace(/\\times/g, ' x ')
    .replace(/\\cdot/g, ' * ')
    .replace(/\\degree/g, '°')
    .replace(/\\[a-zA-Z]+/g, '')
    .trim();
  if (text.length > 600) {
    text = `${text.slice(0, 600).trim()}...`;
  }
  return text || 'Không có phản hồi từ trợ lý AI.';
}

function TypingIndicator({ colors }) {
  const dots = useMemo(() => [
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ], []);

  useEffect(() => {
    const animations = dots.map((dot, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 180),
          Animated.timing(dot, { toValue: -6, duration: 280, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0, duration: 280, useNativeDriver: true }),
        ]),
      ),
    );
    animations.forEach((a) => a.start());
    return () => animations.forEach((a) => a.stop());
  }, [dots]);

  return (
    <View style={styles.typingContainer}>
      <View style={[styles.avatarBox, { backgroundColor: colors.accentSoft }]}>
        <Icon name="bot" size={16} color={colors.accent} />
      </View>
      <View style={[styles.typingBubble, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        {dots.map((dot, i) => (
          <Animated.View
            key={i}
            style={[styles.typingDot, { backgroundColor: colors.accent, transform: [{ translateY: dot }] }]}
          />
        ))}
      </View>
    </View>
  );
}

function MessageBubble({ item, colors, tokens }) {
  const isUser = item.role === 'user';
  return (
    <View style={[styles.messageRow, isUser ? styles.messageRowUser : styles.messageRowBot]}>
      {!isUser && (
        <View style={[styles.avatarBox, { backgroundColor: colors.primarySoft }]}>
          <Icon name="bot" size={16} color={colors.primary} />
        </View>
      )}

      <View
        style={[
          styles.bubble,
          isUser
            ? [styles.userBubble, { backgroundColor: colors.primary }]
            : [styles.botBubble, { backgroundColor: colors.surface, borderColor: colors.border }],
          tokens.shadows.sm,
        ]}
      >
        <Text
          style={[
            styles.bubbleText,
            { color: isUser ? '#FFFFFF' : colors.text },
          ]}
        >
          {item.text}
        </Text>
      </View>
    </View>
  );
}

export default function ChatbotScreen() {
  const insets = useSafeAreaInsets();
  const { colors, tokens } = useTheme();
  const idRef = useRef(0);

  const [messages, setMessages] = useState([]);
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const nextId = () => {
    idRef.current += 1;
    return `msg-${idRef.current}`;
  };

  const handleClearChat = () => {
    Alert.alert('Xóa đoạn chat', 'Bạn có chắc chắn muốn xóa toàn bộ lịch sử tư vấn hiện tại?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa tất cả',
        style: 'destructive',
        onPress: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
          setMessages([]);
          setQuestion('');
          setError('');
          Keyboard.dismiss();
        },
      },
    ]);
  };

  const handleSend = async (text) => {
    const trimmed = (text || question).trim();
    if (!trimmed || loading) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setMessages((prev) => [{ id: nextId(), role: 'user', text: trimmed }, ...prev]);
    setQuestion('');
    setError('');
    setLoading(true);

    try {
      const data = await askChatbot(trimmed);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      setMessages((prev) => [
        { id: nextId(), role: 'bot', text: simplifyAnswerText(data?.answer) },
        ...prev,
      ]);
    } catch (err) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      setError(
        err.code === 'ECONNABORTED'
          ? 'Máy chủ AI quá hạn phản hồi (10s). Thử câu hỏi ngắn hơn.'
          : 'Không thể kết nối đến Trợ lý AI.',
      );
    } finally {
      setLoading(false);
    }
  };

  const showPrompts = messages.length === 0 && !loading;

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.bg }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Top Header */}
      <View
        style={[
          styles.headerBar,
          {
            paddingTop: Math.max(16, insets.top + 8),
            backgroundColor: colors.bg,
            borderBottomColor: colors.hairline,
          },
        ]}
      >
        <View style={styles.headerLeft}>
          <Text style={[styles.kicker, { color: colors.accent }]}>TRỢ LÝ CHUYÊN GIA NÔNG NGHIỆP</Text>
          <Text style={[styles.title, { color: colors.text }]}>Cố vấn Gemini AI</Text>
        </View>

        {messages.length > 0 && (
          <TouchableOpacity
            style={[styles.clearBtn, { backgroundColor: colors.dangerSoft, borderColor: colors.danger }]}
            onPress={handleClearChat}
            disabled={loading}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Icon name="trash" size={16} color={colors.danger} />
          </TouchableOpacity>
        )}
      </View>

      <View style={[styles.content, { paddingBottom: Math.max(12, insets.bottom + 6) }]}>
        {error ? (
          <View style={[styles.errorBanner, { backgroundColor: colors.dangerSoft, borderColor: colors.danger }]}>
            <Icon name="alert" size={16} color={colors.danger} />
            <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text>
          </View>
        ) : null}

        {/* Quick Prompts on Empty State */}
        {showPrompts ? (
          <ScrollView
            style={styles.emptyContainer}
            contentContainerStyle={styles.emptyContent}
            keyboardShouldPersistTaps="handled"
          >
            <View style={[styles.emptyBotBadge, { backgroundColor: colors.primarySoft }]}>
              <Icon name="bot" size={32} color={colors.primary} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>Hỏi chuyên gia về vườn</Text>
            <Text style={[styles.emptySub, { color: colors.textSecondary }]}>
              Dựa trên dữ liệu 10 bản ghi cảm biến mới nhất từ trạm quan trắc để đưa ra khuyến nghị thực tế.
            </Text>

            <View style={styles.promptsGrid}>
              <Text style={[styles.promptsLabel, { color: colors.textMuted }]}>GỢI Ý CÂU HỎI NHANH</Text>
              {QUICK_PROMPTS.map((prompt) => (
                <TouchableOpacity
                  key={prompt}
                  style={[
                    styles.promptChip,
                    { backgroundColor: colors.surface, borderColor: colors.border },
                    tokens.shadows.sm,
                  ]}
                  onPress={() => handleSend(prompt)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.promptText, { color: colors.text }]}>{prompt}</Text>
                  <Icon name="arrow-forward" size={16} color={colors.accent} />
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        ) : (
          <FlatList
            data={messages}
            keyExtractor={(item) => item.id}
            inverted
            keyboardShouldPersistTaps="handled"
            style={styles.list}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => <MessageBubble item={item} colors={colors} tokens={tokens} />}
          />
        )}

        {loading ? <TypingIndicator colors={colors} /> : null}

        {/* Input Bar */}
        <View style={[styles.inputRow, { backgroundColor: colors.surface, borderColor: colors.border }, tokens.shadows.md]}>
          <TextInput
            style={[styles.input, { color: colors.text }]}
            value={question}
            onChangeText={setQuestion}
            placeholder="Hỏi về bón phân, tưới nước, sâu bệnh..."
            placeholderTextColor={colors.textMuted}
            multiline
          />
          <TouchableOpacity
            style={[
              styles.sendBtn,
              { backgroundColor: colors.primary },
              (!question.trim() || loading) && { opacity: 0.35 },
            ]}
            onPress={() => handleSend()}
            disabled={!question.trim() || loading}
            activeOpacity={0.7}
          >
            <Icon name="arrow-up" size={18} color="#FFFFFF" strokeWidth={2.4} />
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flex: 1,
  },
  kicker: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.4,
    marginTop: 2,
  },
  clearBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 10,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 12,
    borderWidth: 1,
    padding: 10,
  },
  errorText: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
  },
  emptyContent: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 8,
  },
  emptyBotBadge: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  emptySub: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  promptsGrid: {
    width: '100%',
    gap: 8,
  },
  promptsLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 2,
    marginLeft: 4,
  },
  promptChip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
  },
  promptText: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  list: {
    flex: 1,
  },
  listContent: {
    flexGrow: 1,
    justifyContent: 'flex-end',
    gap: 12,
    paddingVertical: 8,
  },
  messageRow: {
    flexDirection: 'row',
    maxWidth: '88%',
    gap: 8,
    alignItems: 'flex-end',
  },
  messageRowUser: {
    alignSelf: 'flex-end',
  },
  messageRowBot: {
    alignSelf: 'flex-start',
  },
  avatarBox: {
    width: 28,
    height: 28,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  bubble: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 18,
  },
  userBubble: {
    borderBottomRightRadius: 4,
  },
  botBubble: {
    borderBottomLeftRadius: 4,
    borderWidth: 1,
  },
  bubbleText: {
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '500',
  },
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    borderRadius: 18,
    padding: 6,
    paddingLeft: 16,
    borderWidth: 1,
  },
  input: {
    flex: 1,
    maxHeight: 100,
    paddingVertical: 8,
    fontSize: 14,
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

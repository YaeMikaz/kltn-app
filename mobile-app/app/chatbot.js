import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { askChatbot } from '../services/api';
import { COLORS, SHADOWS, RADIUS } from '../constants/theme';

const QUICK_PROMPTS = [
  'Độ ẩm hiện tại có tốt cho cây không?',
  'Hướng dẫn xử lý khi chỉ số EC tăng cao',
  'Liều lượng tưới và bón phân đợt này',
  'Nhiệt độ môi trường ảnh hưởng cây thế nào?',
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
  if (text.length > 500) {
    text = `${text.slice(0, 500).trim()}...`;
  }
  return text || 'Không có phản hồi từ trợ lý AI.';
}

function TypingIndicator() {
  const dots = [useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current];

  useEffect(() => {
    const animations = dots.map((dot, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 200),
          Animated.timing(dot, { toValue: -6, duration: 300, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0, duration: 300, useNativeDriver: true }),
        ]),
      ),
    );
    animations.forEach((a) => a.start());
    return () => animations.forEach((a) => a.stop());
  }, []);

  return (
    <View style={styles.typingContainer}>
      <View style={styles.typingAvatar}>
        <Ionicons name="leaf" size={14} color={COLORS.white} />
      </View>
      <View style={styles.typingBubble}>
        {dots.map((dot, i) => (
          <Animated.View key={i} style={[styles.typingDot, { transform: [{ translateY: dot }] }]} />
        ))}
      </View>
    </View>
  );
}

function MessageBubble({ item }) {
  const isUser = item.role === 'user';
  return (
    <View style={[styles.messageRow, isUser && styles.messageRowUser]}>
      {!isUser ? (
        <View style={styles.botAvatar}>
          <Ionicons name="leaf" size={16} color={COLORS.white} />
        </View>
      ) : null}
      <View style={[styles.bubble, isUser ? styles.userBubble : styles.botBubble, SHADOWS.sm]}>
        <Text style={[styles.bubbleText, isUser && styles.userBubbleText]}>{item.text}</Text>
      </View>
      {isUser ? (
        <View style={styles.userAvatar}>
          <Ionicons name="person" size={16} color={COLORS.white} />
        </View>
      ) : null}
    </View>
  );
}

export default function ChatbotScreen() {
  const insets = useSafeAreaInsets();

  const [messages, setMessages] = useState([]);
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleClearChat = () => {
    Alert.alert('Xóa đoạn chat', 'Bạn có chắc chắn muốn xóa toàn bộ cuộc trò chuyện?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa tất cả',
        style: 'destructive',
        onPress: () => {
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

    const userMessage = {
      id: `${Date.now()}-user`,
      role: 'user',
      text: trimmed,
    };

    setMessages((prev) => [userMessage, ...prev]);
    setQuestion('');
    setError('');
    setLoading(true);

    try {
      const data = await askChatbot(trimmed);
      const botMessage = {
        id: `${Date.now()}-bot`,
        role: 'bot',
        text: simplifyAnswerText(data?.answer),
      };
      setMessages((prev) => [botMessage, ...prev]);
    } catch (err) {
      const message = err.code === 'ECONNABORTED'
        ? 'Server phản hồi quá chậm (quá 10 giây).'
        : 'Không thể gửi câu hỏi đến máy chủ.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const showPrompts = messages.length === 0 && !loading;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <View style={[styles.content, { paddingBottom: Math.max(10, insets.bottom) }]}>
        {/* Header */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.title}>Trợ lý Nông nghiệp AI</Text>
            <Text style={styles.headerSubtitle}>Tư vấn canh tác và giải đáp thắc mắc cây trồng</Text>
          </View>
          {messages.length > 0 ? (
            <TouchableOpacity
              style={[styles.clearBtn, loading ? styles.clearBtnDisabled : null]}
              onPress={handleClearChat}
              disabled={loading}
              activeOpacity={0.7}
            >
              <Ionicons name="trash-outline" size={16} color={COLORS.danger} />
            </TouchableOpacity>
          ) : null}
        </View>

        {error ? (
          <View style={[styles.errorBanner, SHADOWS.sm]}>
            <Ionicons name="alert-circle-outline" size={16} color={COLORS.danger} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* Quick Prompts */}
        {showPrompts ? (
          <View style={styles.promptsSection}>
            <View style={styles.emptyStateIcon}>
              <Ionicons name="chatbubbles-outline" size={48} color={COLORS.accent} />
            </View>
            <Text style={styles.emptyText}>Bắt đầu bằng một câu hỏi về chỉ số đất hoặc kỹ thuật chăm sóc cây.</Text>
            <View style={styles.promptsGrid}>
              {QUICK_PROMPTS.map((prompt, i) => (
                <TouchableOpacity
                  key={i}
                  style={[styles.promptChip, SHADOWS.sm]}
                  onPress={() => handleSend(prompt)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="chatbubble-ellipses-outline" size={16} color={COLORS.primary} />
                  <Text style={styles.promptText}>{prompt}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : null}

        {/* Messages */}
        <FlatList
          data={messages}
          keyExtractor={(item) => item.id}
          inverted
          keyboardShouldPersistTaps="handled"
          style={styles.list}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => <MessageBubble item={item} />}
        />

        {/* Typing Indicator */}
        {loading ? <TypingIndicator /> : null}

        {/* Input Row */}
        <View style={[styles.inputRow, SHADOWS.md]}>
          <TextInput
            style={styles.input}
            value={question}
            onChangeText={setQuestion}
            placeholder="Nhập câu hỏi cần tư vấn..."
            placeholderTextColor={COLORS.textMuted}
            multiline
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!question.trim() || loading) && styles.sendBtnDisabled]}
            onPress={() => handleSend()}
            disabled={!question.trim() || loading}
            activeOpacity={0.7}
          >
            <Ionicons name="send" size={20} color={COLORS.white} />
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  content: {
    flex: 1,
    padding: 16,
    gap: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.primaryDark,
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  clearBtn: {
    backgroundColor: '#FFF5F5',
    borderWidth: 1,
    borderColor: '#FFCDD2',
    padding: 8,
    borderRadius: RADIUS.sm,
  },
  clearBtnDisabled: {
    opacity: 0.4,
  },

  // Error
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFF5F5',
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: '#FFCDD2',
    padding: 10,
  },
  errorText: {
    color: COLORS.danger,
    fontSize: 13,
    flex: 1,
    fontWeight: '500',
  },

  // Quick Prompts
  promptsSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    paddingHorizontal: 8,
  },
  emptyStateIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    textAlign: 'center',
    color: COLORS.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
  promptsGrid: {
    width: '100%',
    gap: 8,
  },
  promptChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  promptText: {
    color: COLORS.primaryDark,
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },

  // Messages
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
    alignItems: 'flex-end',
    gap: 8,
    maxWidth: '88%',
  },
  messageRowUser: {
    alignSelf: 'flex-end',
    flexDirection: 'row',
  },
  botAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubble: {
    maxWidth: '82%',
    borderRadius: RADIUS.md,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  userBubble: {
    backgroundColor: COLORS.primary,
    borderBottomRightRadius: 4,
  },
  botBubble: {
    backgroundColor: COLORS.white,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  bubbleText: {
    color: COLORS.primaryDark,
    lineHeight: 20,
    fontSize: 14,
  },
  userBubbleText: {
    color: COLORS.white,
  },

  // Typing
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  typingAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.accent,
  },

  // Input
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: 6,
    paddingLeft: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  input: {
    flex: 1,
    maxHeight: 100,
    color: COLORS.primaryDark,
    paddingVertical: 8,
    fontSize: 15,
  },
  sendBtn: {
    backgroundColor: COLORS.primary,
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: COLORS.accent,
    opacity: 0.5,
  },
});

import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { askChatbot } from '../services/api';

const COLORS = {
  bg: '#F1F8E9',
  primary: '#2E7D32',
  text: '#1B4332',
  white: '#ffffff',
  userBubble: '#A5D6A7',
  botBubble: '#E8F5E9',
  danger: '#C62828',
};

function simplifyAnswerText(rawText) {
  if (!rawText || typeof rawText !== 'string') {
    return 'Không có phản hồi từ chatbot.';
  }

  // Làm gọn markdown/latex cơ bản để người dùng dễ đọc trên điện thoại.
  let text = rawText
    .replace(/\$\$(.*?)\$\$/gs, '$1')
    .replace(/\$(.*?)\$/gs, '$1')
    .replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, '$1/$2')
    .replace(/\\times/g, ' x ')
    .replace(/\\cdot/g, ' * ')
    .replace(/\\degree/g, ' độ')
    .replace(/\\[a-zA-Z]+/g, '')
    .replace(/[*_`#>-]/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();

  // Giới hạn độ dài để bubble chat gọn, dễ đọc nhanh.
  if (text.length > 420) {
    text = `${text.slice(0, 420).trim()}...`;
  }

  return text || 'Không có phản hồi từ chatbot.';
}

export default function ChatbotScreen() {
  const tabBarHeight = useBottomTabBarHeight();
  const insets = useSafeAreaInsets();

  const [messages, setMessages] = useState([]);
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleClearChat = () => {
    Alert.alert('Xóa đoạn chat', 'Bạn có chắc muốn xóa toàn bộ hội thoại?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa',
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

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const handleSend = async () => {
    const trimmed = question.trim();
    if (!trimmed || loading) return;

    // Lưu lịch sử hỏi đáp trong session của màn hình Chatbot.
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
        : 'Không gửi được câu hỏi đến server.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior="padding"
      keyboardVerticalOffset={Platform.OS === 'ios' ? tabBarHeight : 0}
    >
      <View style={[styles.content, { paddingBottom: Math.max(10, insets.bottom) }]}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Chatbot chăm sóc cây</Text>
          {messages.length > 0 ? (
            <TouchableOpacity
              style={[styles.clearBtn, loading ? styles.clearBtnDisabled : null]}
              onPress={handleClearChat}
              disabled={loading}
            >
              <Text style={styles.clearBtnText}>Xóa chat</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <FlatList
          data={messages}
          keyExtractor={(item) => item.id}
          inverted
          keyboardShouldPersistTaps="handled"
          style={styles.list}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <View
              style={[
                styles.bubble,
                item.role === 'user' ? styles.userBubble : styles.botBubble,
              ]}
            >
              <Text style={styles.bubbleText}>{item.text}</Text>
            </View>
          )}
          ListEmptyComponent={
            <Text style={styles.emptyText}>Hãy bắt đầu bằng một câu hỏi về chỉ số đất.</Text>
          }
        />

        {loading ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator size="small" color={COLORS.primary} />
            <Text style={styles.loadingText}>Đang chờ LLM trả lời...</Text>
          </View>
        ) : null}

        <View
          style={styles.inputRow}
        >
          <TextInput
            style={styles.input}
            value={question}
            onChangeText={setQuestion}
            placeholder="Nhập câu hỏi..."
            placeholderTextColor="#6b7280"
            multiline
          />
          <TouchableOpacity
            style={[styles.sendBtn, loading ? styles.sendBtnDisabled : null]}
            onPress={handleSend}
            disabled={loading}
          >
            <Text style={styles.sendBtnText}>Gửi</Text>
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
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.primary,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  clearBtn: {
    backgroundColor: '#E8F5E9',
    borderWidth: 1,
    borderColor: '#81C784',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  clearBtnDisabled: {
    opacity: 0.6,
  },
  clearBtnText: {
    color: '#2E7D32',
    fontWeight: '700',
    fontSize: 12,
  },
  listContent: {
    flexGrow: 1,
    justifyContent: 'flex-end',
    gap: 8,
  },
  list: {
    flex: 1,
  },
  bubble: {
    maxWidth: '85%',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: COLORS.userBubble,
  },
  botBubble: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.botBubble,
  },
  bubbleText: {
    color: COLORS.text,
    lineHeight: 20,
  },
  emptyText: {
    textAlign: 'center',
    color: '#4b5563',
    marginTop: 20,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 8,
    marginBottom: 32,
  },
  input: {
    flex: 1,
    maxHeight: 100,
    color: COLORS.text,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  sendBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  sendBtnDisabled: {
    opacity: 0.6,
  },
  sendBtnText: {
    color: '#ffffff',
    fontWeight: '700',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    color: COLORS.text,
  },
  errorText: {
    color: COLORS.danger,
    fontWeight: '600',
  },
});

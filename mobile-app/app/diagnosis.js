import React, { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { classifyImage } from '../services/api';
import { useTheme } from '../context/ThemeContext';
import { Icon } from '../components/Icon';

function getErrorMessage(error) {
  if (error?.code === 'ECONNABORTED' || error?.code === 'ETIMEDOUT') {
    return 'Hết thời gian phản hồi từ server AI. Vui lòng thử lại sau.';
  }
  const detail = error?.response?.data?.detail;
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) return detail.map((d) => d.msg).join(', ');
  return error?.message || 'Không thể phân tích ảnh.';
}

function getSeverityConfig(severity, colors) {
  const s = (severity || '').toLowerCase();
  if (s.includes('nặng') || s.includes('cao')) {
    return { color: colors.danger, bg: colors.dangerSoft, label: 'Nghiêm trọng', icon: 'alert' };
  }
  if (s.includes('trung bình') || s.includes('vừa')) {
    return { color: colors.warning, bg: colors.warningSoft, label: 'Trung bình', icon: 'warning' };
  }
  return { color: colors.success, bg: colors.successSoft, label: 'Nhẹ / Tốt', icon: 'check' };
}

export default function DiagnosisScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors, tokens } = useTheme();

  const [image, setImage] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const chooseImage = async (source) => {
    setError('');
    Haptics.selectionAsync().catch(() => {});

    const permission = source === 'camera'
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      setError(source === 'camera'
        ? 'Chưa cấp quyền truy cập máy ảnh. Vui lòng bật quyền trong Cài đặt.'
        : 'Chưa cấp quyền truy cập thư viện ảnh.');
      return;
    }

    const res = source === 'camera'
      ? await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.85 })
      : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.85 });

    if (!res.canceled && res.assets?.[0]) {
      setImage(res.assets[0]);
      setResult(null);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
  };

  const handleAnalyze = async () => {
    if (!image) return;
    setLoading(true);
    setError('');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});

    try {
      const res = await classifyImage(image);
      setResult(res);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    } catch (err) {
      setError(getErrorMessage(err));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
    } finally {
      setLoading(false);
    }
  };

  const severityConfig = result ? getSeverityConfig(result.severity, colors) : null;
  const top3 = result?.top3?.length
    ? result.top3
    : (result ? [{ name: result.disease, confidence: result.confidence || 0 }] : []);

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
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
        <Text style={[styles.kicker, { color: colors.accent }]}>THỊ GIÁC MÁY TÍNH & AI</Text>
        <Text style={[styles.title, { color: colors.text }]}>Chẩn đoán bệnh lá</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Mô hình EfficientNet-B0 CNN nhận diện 15 loại bệnh hại
        </Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {/* Image Capture / Upload Area */}
        {!image ? (
          <View style={styles.uploadSection}>
            <View style={styles.uploadButtonsRow}>
              <TouchableOpacity
                style={[
                  styles.uploadBtn,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                  tokens.shadows.sm,
                ]}
                onPress={() => chooseImage('camera')}
                activeOpacity={0.8}
              >
                <View style={[styles.uploadIconBox, { backgroundColor: colors.primarySoft }]}>
                  <Icon name="camera" size={26} color={colors.primary} />
                </View>
                <Text style={[styles.uploadBtnTitle, { color: colors.text }]}>Chụp ảnh mới</Text>
                <Text style={[styles.uploadBtnSub, { color: colors.textMuted }]}>Dùng máy ảnh điện thoại</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.uploadBtn,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                  tokens.shadows.sm,
                ]}
                onPress={() => chooseImage('library')}
                activeOpacity={0.8}
              >
                <View style={[styles.uploadIconBox, { backgroundColor: colors.accentSoft }]}>
                  <Icon name="images" size={26} color={colors.accent} />
                </View>
                <Text style={[styles.uploadBtnTitle, { color: colors.text }]}>Thư viện ảnh</Text>
                <Text style={[styles.uploadBtnSub, { color: colors.textMuted }]}>Chọn ảnh sẵn có</Text>
              </TouchableOpacity>
            </View>

            {/* Instruction / Guiding Tip Box */}
            <View style={[styles.tipCard, { backgroundColor: colors.surfaceSecondary, borderColor: colors.hairline }]}>
              <View style={styles.tipHeader}>
                <Icon name="sparkles" size={16} color={colors.accent} />
                <Text style={[styles.tipTitle, { color: colors.text }]}>Mẹo chụp để AI chuẩn xác nhất</Text>
              </View>
              <Text style={[styles.tipText, { color: colors.textSecondary }]}>
                • Đặt lá cây ở giữa khung hình, tránh rung tay{'\n'}
                • Chụp dưới ánh sáng ban ngày rõ nét{'\n'}
                • Lấy cận cảnh vùng lá xuất hiện đốm, cháy hoặc biến sắc
              </Text>
            </View>
          </View>
        ) : (
          /* Image Preview with Viewfinder Framing Overlay */
          <View style={[styles.previewCard, { backgroundColor: colors.surface, borderColor: colors.border }, tokens.shadows.md]}>
            <View style={styles.previewContainer}>
              <Image source={{ uri: image.uri }} style={styles.previewImage} resizeMode="cover" />

              {/* Viewfinder Corner Overlays */}
              <View style={[styles.bracket, styles.bracketTopLeft, { borderColor: colors.primary }]} />
              <View style={[styles.bracket, styles.bracketTopRight, { borderColor: colors.primary }]} />
              <View style={[styles.bracket, styles.bracketBottomLeft, { borderColor: colors.primary }]} />
              <View style={[styles.bracket, styles.bracketBottomRight, { borderColor: colors.primary }]} />

              {/* Dismiss / Delete preview button */}
              <TouchableOpacity
                style={[styles.closeBtn, { backgroundColor: 'rgba(0,0,0,0.6)' }]}
                onPress={() => {
                  setImage(null);
                  setResult(null);
                }}
                activeOpacity={0.7}
              >
                <Icon name="close" size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            {!result && (
              <TouchableOpacity
                style={[
                  styles.analyzeActionBtn,
                  { backgroundColor: colors.primary },
                  loading && { opacity: 0.8 },
                ]}
                onPress={handleAnalyze}
                disabled={loading}
                activeOpacity={0.8}
              >
                {loading ? (
                  <View style={styles.analyzingRow}>
                    <ActivityIndicator color="#FFFFFF" size="small" />
                    <Text style={styles.analyzeBtnText}>Đang nhận diện qua CNN...</Text>
                  </View>
                ) : (
                  <View style={styles.analyzingRow}>
                    <Icon name="sparkles" size={18} color="#FFFFFF" />
                    <Text style={styles.analyzeBtnText}>Phân tích chẩn đoán ngay</Text>
                  </View>
                )}
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Error Notification */}
        {error ? (
          <View style={[styles.errorBanner, { backgroundColor: colors.dangerSoft, borderColor: colors.danger }]}>
            <Icon name="alert" size={18} color={colors.danger} />
            <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text>
          </View>
        ) : null}

        {/* Result Card */}
        {result && (
          <View
            style={[
              styles.resultCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
              tokens.shadows.md,
            ]}
          >
            {/* Severity Pill */}
            <View style={[styles.severityPill, { backgroundColor: severityConfig.bg }]}>
              <Icon name={severityConfig.icon} size={15} color={severityConfig.color} />
              <Text style={[styles.severityText, { color: severityConfig.color }]}>
                Mức độ: {severityConfig.label}
              </Text>
            </View>

            <View style={styles.diseaseHeader}>
              <Text style={[styles.plantCategory, { color: colors.textMuted }]}>
                CÂY TRỒNG: {result.plant || 'Rau màu'}
              </Text>
              <Text style={[styles.diseaseTitle, { color: colors.text }]}>
                {result.disease || 'Cây khỏe mạnh'}
              </Text>
            </View>

            <View style={[styles.divider, { backgroundColor: colors.hairline }]} />

            {/* Top 3 Confidence Progress Bars */}
            <Text style={[styles.sectionHeading, { color: colors.text }]}>
              Độ tin cậy mô hình AI (Top-3)
            </Text>

            <View style={styles.confList}>
              {top3.map((item, i) => {
                const pct = Math.min(100, Math.max(0, (item.confidence || 0) * 100));
                const isTop = i === 0;
                return (
                  <View key={`${item.name}-${i}`} style={styles.confRow}>
                    <View style={styles.confHeader}>
                      <Text
                        style={[
                          styles.confName,
                          {
                            color: isTop ? colors.text : colors.textSecondary,
                            fontWeight: isTop ? '700' : '500',
                          },
                        ]}
                        numberOfLines={1}
                      >
                        {item.name}
                      </Text>
                      <Text
                        style={[
                          styles.confPct,
                          {
                            color: isTop ? colors.primary : colors.textMuted,
                            fontWeight: isTop ? '800' : '600',
                          },
                        ]}
                      >
                        {pct.toFixed(1)}%
                      </Text>
                    </View>
                    <View style={[styles.confTrack, { backgroundColor: colors.surfaceSecondary }]}>
                      <View
                        style={[
                          styles.confFill,
                          {
                            width: `${pct}%`,
                            backgroundColor: isTop ? colors.primary : colors.textMuted,
                          },
                        ]}
                      />
                    </View>
                  </View>
                );
              })}
            </View>

            <View style={[styles.divider, { backgroundColor: colors.hairline }]} />

            {/* Recommendations */}
            <Text style={[styles.sectionHeading, { color: colors.text }]}>
              Khuyến nghị biện pháp xử lý
            </Text>
            <View style={[styles.recBox, { backgroundColor: colors.surfaceSecondary }]}>
              <Icon name="check" size={18} color={colors.primary} style={{ marginTop: 2 }} />
              <Text style={[styles.recText, { color: colors.text }]}>
                {result.recommendation || 'Hiện chưa phát hiện triệu chứng bất thường cần can thiệp hóa chất.'}
              </Text>
            </View>

            {/* Direct Synergistic Action: Ask AI about this result */}
            <TouchableOpacity
              style={[styles.askAiBtn, { borderColor: colors.border, backgroundColor: colors.surface }]}
              onPress={() => {
                const prompt = `Tôi có cây ${result.plant} bị ${result.disease} (Mức độ: ${result.severity}). Hãy tư vấn chi tiết cách điều trị và phòng ngừa trong 24 giờ tới.`;
                router.push({
                  pathname: '/chatbot',
                  params: {
                    initialQuestion: prompt,
                    includeSensors: 'false',
                    plant: result.plant,
                    disease: result.disease,
                    contextTs: String(Date.now()),
                  },
                });
              }}
              activeOpacity={0.8}
            >
              <Icon name="bot" size={18} color={colors.accent} />
              <Text style={[styles.askAiText, { color: colors.text }]}>
                Hỏi Trợ lý AI thêm về cách điều trị
              </Text>
              <Icon name="arrow-forward" size={16} color={colors.accent} />
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerBar: {
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  kicker: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.4,
    marginTop: 2,
  },
  subtitle: {
    fontSize: 12,
    marginTop: 3,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: 16,
    gap: 16,
    paddingBottom: 40,
  },
  uploadSection: {
    gap: 14,
  },
  uploadButtonsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  uploadBtn: {
    flex: 1,
    padding: 18,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    gap: 8,
  },
  uploadIconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadBtnTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  uploadBtnSub: {
    fontSize: 11,
  },
  tipCard: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 8,
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tipTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  tipText: {
    fontSize: 12,
    lineHeight: 18,
  },
  previewCard: {
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
    padding: 12,
    gap: 12,
  },
  previewContainer: {
    width: '100%',
    height: 240,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  bracket: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderWidth: 3,
  },
  bracketTopLeft: {
    top: 14,
    left: 14,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: 6,
  },
  bracketTopRight: {
    top: 14,
    right: 14,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderTopRightRadius: 6,
  },
  bracketBottomLeft: {
    bottom: 14,
    left: 14,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomLeftRadius: 6,
  },
  bracketBottomRight: {
    bottom: 14,
    right: 14,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomRightRadius: 6,
  },
  closeBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  analyzeActionBtn: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  analyzingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  analyzeBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  errorText: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  resultCard: {
    padding: 18,
    borderRadius: 18,
    borderWidth: 1,
    gap: 12,
  },
  severityPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
  },
  severityText: {
    fontSize: 12,
    fontWeight: '700',
  },
  diseaseHeader: {
    marginTop: 4,
  },
  plantCategory: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  diseaseTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginTop: 2,
  },
  divider: {
    height: 1,
    marginVertical: 4,
  },
  sectionHeading: {
    fontSize: 13,
    fontWeight: '700',
  },
  confList: {
    gap: 10,
  },
  confRow: {
    gap: 4,
  },
  confHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  confName: {
    fontSize: 13,
  },
  confPct: {
    fontSize: 13,
  },
  confTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  confFill: {
    height: '100%',
    borderRadius: 3,
  },
  recBox: {
    flexDirection: 'row',
    gap: 10,
    padding: 14,
    borderRadius: 12,
  },
  recText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '500',
  },
  askAiBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 13,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 4,
  },
  askAiText: {
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
    marginLeft: 8,
  },
});

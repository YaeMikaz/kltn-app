import { useState } from 'react';
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
import { Ionicons } from '@expo/vector-icons';
import { classifyImage } from '../services/api';
import { COLORS, SHADOWS, RADIUS } from '../constants/theme';

function getErrorMessage(error) {
  if (error?.code === 'ECONNABORTED' || error?.code === 'ETIMEDOUT') {
    return 'Server không phản hồi sau 30 giây. Vui lòng thử lại.';
  }
  const detail = error?.response?.data?.detail;
  if (typeof detail === 'string') {
    return detail;
  }
  if (Array.isArray(detail)) {
    return detail.map((d) => d.msg || JSON.stringify(d)).join(', ');
  }
  if (detail && typeof detail === 'object') {
    return detail.msg || JSON.stringify(detail);
  }
  return error?.message || 'Không thể phân tích ảnh. Vui lòng kiểm tra kết nối và thử lại.';
}

function getSeverityConfig(severity) {
  const s = (severity || '').toLowerCase();
  if (s.includes('nặng') || s.includes('nang') || s.includes('cao') || s.includes('nghiêm trọng') || s.includes('nghiem trong'))
    return { color: COLORS.danger, bg: '#FFF5F5', border: '#FFCDD2', icon: 'alert-circle', label: 'Nghiêm trọng' };
  if (s.includes('trung bình') || s.includes('trung binh') || s.includes('vừa') || s.includes('vua'))
    return { color: COLORS.warning, bg: '#FFF8E1', border: '#FFE082', icon: 'warning', label: 'Trung bình' };
  if (s.includes('nhẹ') || s.includes('nhe') || s.includes('ít'))
    return { color: '#F9A825', bg: '#FFFDE7', border: '#FFF9C4', icon: 'information-circle', label: 'Nhẹ' };
  return { color: COLORS.success, bg: COLORS.primarySoft, border: COLORS.border, icon: 'checkmark-circle', label: severity || 'Khỏe mạnh / Chưa rõ' };
}

function ConfidenceBar({ label, value, color, isTop }) {
  const pct = Math.max(0, Math.min(100, value * 100));
  return (
    <View style={styles.confBarWrapper}>
      <View style={styles.confBarHeader}>
        <Text style={[styles.confBarLabel, isTop && styles.confBarLabelTop]} numberOfLines={1}>{label}</Text>
        <Text style={[styles.confBarPct, { color }]}>{pct.toFixed(1)}%</Text>
      </View>
      <View style={styles.confBarTrack}>
        <View style={[styles.confBarFill, { width: `${pct}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

export default function DiagnosisScreen() {
  const [image, setImage] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const chooseImage = async (source) => {
    setError('');
    const permission = source === 'camera'
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      setError(source === 'camera'
        ? 'Bạn chưa cấp quyền máy ảnh. Hãy bật quyền camera trong cài đặt điện thoại.'
        : 'Bạn chưa cấp quyền thư viện ảnh. Hãy bật quyền ảnh trong cài đặt điện thoại.');
      return;
    }

    const pickerResult = source === 'camera'
      ? await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.8 })
      : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });

    if (!pickerResult.canceled && pickerResult.assets?.[0]) {
      setImage(pickerResult.assets[0]);
      setResult(null);
      setError('');
    }
  };

  const handleAnalyze = async () => {
    if (!image || loading) return;
    setLoading(true);
    setError('');
    try {
      setResult(await classifyImage(image));
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setImage(null);
    setResult(null);
    setError('');
  };

  const hasDisease = Boolean(
    result?.disease &&
    result.disease.toLowerCase() !== 'cây khỏe mạnh' &&
    result.disease.toLowerCase() !== 'khỏe mạnh' &&
    result.disease.toLowerCase() !== 'không phát hiện' &&
    result.disease.toLowerCase() !== 'healthy'
  );
  const severityConfig = result ? getSeverityConfig(result.severity) : null;

  // Sử dụng top3 từ backend API nếu có, fallback về mảng chứa Top 1
  const top3 = result?.top3 && result.top3.length > 0
    ? result.top3
    : (result ? [{ name: result.disease || 'Cây khỏe mạnh', confidence: result.confidence || 0 }] : []);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.headerSection}>
        <Text style={styles.title}>Chẩn đoán bệnh cây</Text>
        <Text style={styles.subtitle}>Chụp hoặc tải ảnh lá cây để nhận diện bệnh tự động bằng AI.</Text>
      </View>

      {/* Image Upload Area */}
      {!image ? (
        <View style={[styles.uploadArea, SHADOWS.sm]}>
          <View style={styles.uploadDashedBorder}>
            <Ionicons name="cloud-upload-outline" size={44} color={COLORS.accent} />
            <Text style={styles.uploadTitle}>Tải ảnh lên để phân tích</Text>
            <Text style={styles.uploadHint}>Hỗ trợ định dạng JPEG, PNG</Text>
          </View>
        </View>
      ) : (
        <View style={[styles.previewContainer, SHADOWS.md]}>
          <Image source={{ uri: image.uri }} style={styles.preview} />
          <TouchableOpacity style={styles.changeImageBtn} onPress={reset}>
            <Ionicons name="close-circle" size={28} color={COLORS.white} />
          </TouchableOpacity>
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionButton, SHADOWS.md]}
          onPress={() => chooseImage('camera')}
          disabled={loading}
          activeOpacity={0.7}
        >
          <Ionicons name="camera" size={22} color={COLORS.white} />
          <Text style={styles.actionText}>Chụp ảnh</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.secondaryButton, SHADOWS.sm]}
          onPress={() => chooseImage('library')}
          disabled={loading}
          activeOpacity={0.7}
        >
          <Ionicons name="images" size={22} color={COLORS.primary} />
          <Text style={styles.secondaryText}>Thư viện</Text>
        </TouchableOpacity>
      </View>

      {/* Analyze Button */}
      {image && !result ? (
        <TouchableOpacity
          style={[styles.analyzeButton, SHADOWS.md]}
          onPress={handleAnalyze}
          disabled={loading}
          activeOpacity={0.7}
        >
          {loading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color={COLORS.white} />
              <Text style={styles.analyzeText}>Đang phân tích...</Text>
            </View>
          ) : (
            <View style={styles.loadingRow}>
              <Ionicons name="scan" size={20} color={COLORS.white} />
              <Text style={styles.analyzeText}>Bắt đầu chẩn đoán</Text>
            </View>
          )}
        </TouchableOpacity>
      ) : null}

      {/* Error */}
      {error ? (
        <View style={[styles.errorBanner, SHADOWS.sm]}>
          <Ionicons name="alert-circle-outline" size={18} color={COLORS.danger} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {/* Result Card */}
      {result ? (
        <View style={[styles.resultCard, SHADOWS.lg]}>
          {/* Status Badge */}
          <View style={[styles.resultBadge, { backgroundColor: severityConfig.bg, borderColor: severityConfig.border }]}>
            <Ionicons name={severityConfig.icon} size={18} color={severityConfig.color} />
            <Text style={[styles.resultBadgeText, { color: severityConfig.color }]}>{severityConfig.label}</Text>
          </View>

          {/* Plant & Disease */}
          <Text style={styles.resultLabel}>KẾT QUẢ PHÂN TÍCH</Text>
          <Text style={styles.plantName}>{result.plant || 'Chưa xác định'}</Text>
          <Text style={[styles.diseaseName, hasDisease && { color: COLORS.danger }]}>
            {result.disease || 'Cây khỏe mạnh, không phát hiện bệnh'}
          </Text>

          {/* Confidence Section */}
          <View style={styles.sectionDivider} />
          <Text style={styles.sectionTitle}>Độ tin cậy</Text>
          {top3.map((item, i) => (
            <ConfidenceBar
              key={i}
              label={item.name}
              value={item.confidence}
              color={i === 0 ? COLORS.primary : i === 1 ? COLORS.primaryLight : COLORS.accent}
              isTop={i === 0}
            />
          ))}

          {/* Severity Section */}
          <View style={styles.sectionDivider} />
          <Text style={styles.sectionTitle}>Mức độ nghiêm trọng</Text>
          <View style={[styles.severityCard, { backgroundColor: severityConfig.bg, borderColor: severityConfig.border }]}>
            <Ionicons name={severityConfig.icon} size={24} color={severityConfig.color} />
            <View style={styles.severityContent}>
              <Text style={[styles.severityValue, { color: severityConfig.color }]}>
                {result.severity || 'Bình thường'}
              </Text>
            </View>
          </View>

          {/* Recommendation Section */}
          <View style={styles.sectionDivider} />
          <Text style={styles.sectionTitle}>Khuyến nghị xử lý</Text>
          <View style={styles.recommendBox}>
            <Ionicons name="medkit-outline" size={20} color={COLORS.primary} style={{ marginTop: 2 }} />
            <Text style={styles.recommendText}>{result.recommendation || 'Chưa có khuyến nghị cụ thể.'}</Text>
          </View>
        </View>
      ) : null}

      {/* Reset Button */}
      {result ? (
        <TouchableOpacity style={[styles.resetButton, SHADOWS.sm]} onPress={reset} activeOpacity={0.7}>
          <Ionicons name="refresh" size={20} color={COLORS.primary} />
          <Text style={styles.resetText}>Chẩn đoán ảnh khác</Text>
        </TouchableOpacity>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  content: { padding: 16, gap: 14, paddingBottom: 32 },
  headerSection: { gap: 2 },
  title: { color: COLORS.primaryDark, fontSize: 26, fontWeight: '800', letterSpacing: -0.3 },
  subtitle: { color: COLORS.textSecondary, fontSize: 14 },

  // Upload Area
  uploadArea: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: 4,
  },
  uploadDashedBorder: {
    borderWidth: 2,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
    borderRadius: RADIUS.lg - 2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 8,
  },
  uploadTitle: { color: COLORS.textSecondary, fontSize: 16, fontWeight: '600' },
  uploadHint: { color: COLORS.textMuted, fontSize: 12 },

  // Preview
  previewContainer: {
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    position: 'relative',
  },
  preview: {
    width: '100%',
    height: 260,
    borderRadius: RADIUS.lg,
  },
  changeImageBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: 20,
    padding: 2,
  },

  // Actions
  actions: { flexDirection: 'row', gap: 10 },
  actionButton: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    paddingVertical: 14,
  },
  secondaryButton: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    paddingVertical: 14,
  },
  actionText: { color: COLORS.white, fontSize: 15, fontWeight: '700' },
  secondaryText: { color: COLORS.primary, fontSize: 15, fontWeight: '700' },

  // Analyze
  analyzeButton: {
    alignItems: 'center',
    backgroundColor: '#1B5E20',
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    paddingVertical: 16,
  },
  analyzeText: { color: COLORS.white, fontSize: 16, fontWeight: '700' },
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },

  // Error
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFF5F5',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: '#FFCDD2',
    padding: 12,
  },
  errorText: { color: COLORS.danger, fontSize: 13, flex: 1, fontWeight: '500', lineHeight: 18 },

  // Result Card
  resultCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: 20,
  },
  resultBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 12,
  },
  resultBadgeText: { fontSize: 13, fontWeight: '700' },
  resultLabel: { color: COLORS.textMuted, fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  plantName: { color: COLORS.primaryDark, fontSize: 24, fontWeight: '800', marginTop: 4 },
  diseaseName: { color: COLORS.textSecondary, fontSize: 18, fontWeight: '600', marginTop: 2 },

  // Sections
  sectionDivider: { height: 1, backgroundColor: COLORS.overlay, marginVertical: 16 },
  sectionTitle: { color: COLORS.primaryDark, fontSize: 14, fontWeight: '700', marginBottom: 10 },

  // Confidence Bars
  confBarWrapper: { marginBottom: 10 },
  confBarHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  confBarLabel: { color: COLORS.textSecondary, fontSize: 13, flex: 1, marginRight: 8 },
  confBarLabelTop: { fontWeight: '700', color: COLORS.primaryDark },
  confBarPct: { fontSize: 14, fontWeight: '700' },
  confBarTrack: {
    height: 8,
    backgroundColor: '#F1F5F1',
    borderRadius: 4,
    overflow: 'hidden',
  },
  confBarFill: { height: '100%', borderRadius: 4 },

  // Severity
  severityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  severityContent: { flex: 1 },
  severityValue: { fontSize: 16, fontWeight: '700' },

  // Recommendation
  recommendBox: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: COLORS.primarySoft,
    borderRadius: RADIUS.md,
    padding: 14,
  },
  recommendText: { color: COLORS.primaryDark, fontSize: 14, lineHeight: 22, flex: 1 },

  // Reset
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  resetText: { color: COLORS.primary, fontSize: 15, fontWeight: '700' },
});

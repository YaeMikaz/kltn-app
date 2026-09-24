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

const COLORS = {
  bg: '#F1F8E9',
  primary: '#2E7D32',
  text: '#1B4332',
  white: '#FFFFFF',
  danger: '#C62828',
  border: '#A5D6A7',
  muted: '#607D6B',
};

function getErrorMessage(error) {
  if (error?.code === 'ECONNABORTED' || error?.code === 'ETIMEDOUT') {
    return 'Server không phản hồi sau 30 giây. Vui lòng thử lại.';
  }

  return error?.response?.data?.detail || 'Không thể phân tích ảnh. Kiểm tra kết nối và thử lại.';
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
        ? 'Bạn chưa cấp quyền camera. Hãy bật quyền camera trong cài đặt điện thoại.'
        : 'Bạn chưa cấp quyền thư viện ảnh. Hãy bật quyền ảnh trong cài đặt điện thoại.');
      return;
    }

    const pickerResult = source === 'camera'
      ? await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        quality: 0.8,
      })
      : await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.8,
      });

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

  const confidence = result ? Math.max(0, Math.min(100, Number(result.confidence) * 100)) : 0;
  const hasDisease = Boolean(result?.disease && result.disease.toLowerCase() !== 'không phát hiện');

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Chẩn đoán bệnh cây</Text>
      <Text style={styles.subtitle}>Chụp hoặc chọn ảnh lá cây để phân tích.</Text>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionButton} onPress={() => chooseImage('camera')} disabled={loading}>
          <Ionicons name="camera-outline" size={22} color={COLORS.white} />
          <Text style={styles.actionText}>Chụp ảnh</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryButton} onPress={() => chooseImage('library')} disabled={loading}>
          <Ionicons name="images-outline" size={22} color={COLORS.primary} />
          <Text style={styles.secondaryText}>Chọn từ thư viện</Text>
        </TouchableOpacity>
      </View>

      {image ? <Image source={{ uri: image.uri }} style={styles.preview} /> : null}

      {image && !result ? (
        <TouchableOpacity style={styles.analyzeButton} onPress={handleAnalyze} disabled={loading}>
          {loading ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.analyzeText}>Phân tích</Text>}
        </TouchableOpacity>
      ) : null}

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {result ? (
        <View style={styles.resultCard}>
          <Text style={styles.resultLabel}>KẾT QUẢ PHÂN TÍCH</Text>
          <Text style={styles.plantName}>{result.plant || 'Chưa xác định'}</Text>
          <Text style={[styles.diseaseName, hasDisease && styles.diseaseDanger]}>
            {result.disease || 'Không phát hiện bệnh'}
          </Text>

          <View style={styles.confidenceHeader}>
            <Text style={styles.sectionLabel}>Độ tin cậy</Text>
            <Text style={styles.confidenceValue}>{confidence.toFixed(0)}%</Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${confidence}%` }]} />
          </View>

          <Text style={styles.sectionLabel}>Mức độ nghiêm trọng</Text>
          <Text style={[styles.severity, hasDisease && styles.diseaseDanger]}>{result.severity || 'Chưa xác định'}</Text>
          <Text style={styles.sectionLabel}>Khuyến nghị xử lý</Text>
          <Text style={styles.recommendation}>{result.recommendation || 'Chưa có khuyến nghị.'}</Text>
        </View>
      ) : null}

      {result ? (
        <TouchableOpacity style={styles.resetButton} onPress={reset}>
          <Ionicons name="refresh-outline" size={20} color={COLORS.primary} />
          <Text style={styles.resetText}>Chẩn đoán lại</Text>
        </TouchableOpacity>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  content: { padding: 16, gap: 14 },
  title: { color: COLORS.primary, fontSize: 24, fontWeight: '700' },
  subtitle: { color: COLORS.text, fontSize: 14 },
  actions: { gap: 10 },
  actionButton: {
    alignItems: 'center', backgroundColor: COLORS.primary, borderRadius: 10,
    flexDirection: 'row', gap: 8, justifyContent: 'center', padding: 14,
  },
  secondaryButton: {
    alignItems: 'center', backgroundColor: COLORS.white, borderColor: COLORS.border,
    borderRadius: 10, borderWidth: 1, flexDirection: 'row', gap: 8, justifyContent: 'center', padding: 14,
  },
  actionText: { color: COLORS.white, fontSize: 16, fontWeight: '700' },
  secondaryText: { color: COLORS.primary, fontSize: 16, fontWeight: '700' },
  preview: { backgroundColor: '#DCEAD9', borderRadius: 10, height: 260, width: '100%' },
  analyzeButton: {
    alignItems: 'center', backgroundColor: '#558B2F', borderRadius: 10, justifyContent: 'center', minHeight: 50,
  },
  analyzeText: { color: COLORS.white, fontSize: 16, fontWeight: '700' },
  errorText: { color: COLORS.danger, fontSize: 14, lineHeight: 20 },
  resultCard: { backgroundColor: COLORS.white, borderRadius: 12, padding: 16 },
  resultLabel: { color: COLORS.muted, fontSize: 12, fontWeight: '700', letterSpacing: 0.6 },
  plantName: { color: COLORS.text, fontSize: 26, fontWeight: '700', marginTop: 8 },
  diseaseName: { color: COLORS.text, fontSize: 20, fontWeight: '600', marginBottom: 20, marginTop: 2 },
  diseaseDanger: { color: COLORS.danger },
  confidenceHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  sectionLabel: { color: COLORS.text, fontSize: 14, fontWeight: '700', marginTop: 12 },
  confidenceValue: { color: COLORS.primary, fontSize: 16, fontWeight: '700' },
  progressTrack: { backgroundColor: '#E8F5E9', borderRadius: 8, height: 12, marginTop: 8, overflow: 'hidden' },
  progressFill: { backgroundColor: COLORS.primary, borderRadius: 8, height: '100%' },
  severity: { color: COLORS.text, fontSize: 16, marginTop: 4 },
  recommendation: { color: COLORS.text, fontSize: 15, lineHeight: 22, marginTop: 4 },
  resetButton: { alignItems: 'center', flexDirection: 'row', gap: 6, justifyContent: 'center', padding: 8 },
  resetText: { color: COLORS.primary, fontSize: 15, fontWeight: '700' },
});
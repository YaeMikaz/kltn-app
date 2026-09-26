import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getLatestSensorData } from '../services/api';
import { COLORS, SHADOWS, RADIUS } from '../constants/theme';

const POLLING_MS = 3000;

function getMetricStatus(key, value) {
  if (value == null) return { label: 'Đang chờ...', color: COLORS.textMuted };
  switch (key) {
    case 'ec':
      if (value < 0.5) return { label: 'Quá thấp', color: COLORS.warning };
      if (value <= 2.5) return { label: 'Lý tưởng', color: COLORS.success };
      return { label: 'Quá cao', color: COLORS.danger };
    case 'moisture':
      if (value < 30) return { label: 'Cần tưới', color: COLORS.danger };
      if (value <= 70) return { label: 'Lý tưởng', color: COLORS.success };
      return { label: 'Quá ẩm', color: COLORS.warning };
    case 'temperature':
      if (value < 18) return { label: 'Quá lạnh', color: COLORS.info };
      if (value <= 32) return { label: 'Lý tưởng', color: COLORS.success };
      return { label: 'Quá nóng', color: COLORS.danger };
    case 'n_estimate':
      if (value < 20) return { label: 'Thiếu N', color: COLORS.warning };
      if (value <= 80) return { label: 'Lý tưởng', color: COLORS.success };
      return { label: 'Thừa N', color: COLORS.danger };
    default:
      return { label: '--', color: COLORS.textMuted };
  }
}

function getOverallStatus(data) {
  if (!data) return { text: 'Đang kết nối với cảm biến...', color: COLORS.textMuted, icon: 'ellipsis-horizontal' };
  const statuses = [
    getMetricStatus('ec', data.ec),
    getMetricStatus('moisture', data.moisture),
    getMetricStatus('temperature', data.temperature),
    getMetricStatus('n_estimate', data.n_estimate),
  ];
  const hasDanger = statuses.some((s) => s.color === COLORS.danger);
  const hasWarning = statuses.some((s) => s.color === COLORS.warning);
  if (hasDanger) return { text: 'Có chỉ số bất thường, cần kiểm tra!', color: COLORS.danger, icon: 'warning' };
  if (hasWarning) return { text: 'Một số chỉ số cần lưu ý.', color: COLORS.warning, icon: 'alert-circle' };
  return { text: 'Tất cả chỉ số đang ở mức lý tưởng.', color: COLORS.success, icon: 'checkmark-circle' };
}

function PulseIndicator() {
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.3, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 800, useNativeDriver: true }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View style={[styles.pulseIndicator, { opacity }]}>
      <View style={styles.pulseDot} />
    </Animated.View>
  );
}

function MetricCard({ title, value, unit, icon, bgColor, metricKey }) {
  const status = getMetricStatus(metricKey, value);
  const displayValue = value != null ? (typeof value === 'number' ? value.toFixed(1) : value) : '--';

  return (
    <View style={[styles.card, { backgroundColor: bgColor }, SHADOWS.md]}>
      <View style={styles.cardHeader}>
        <View style={[styles.iconCircle, { backgroundColor: `${COLORS.primary}15` }]}>
          <Ionicons name={icon} size={22} color={COLORS.primary} />
        </View>
        <View style={[styles.statusBadge, { backgroundColor: `${status.color}18` }]}>
          <View style={[styles.statusDot, { backgroundColor: status.color }]} />
          <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
        </View>
      </View>
      <Text style={styles.cardTitle}>{title}</Text>
      <View style={styles.cardValueRow}>
        <Text style={styles.cardValue}>{displayValue}</Text>
        <Text style={styles.cardUnit}>{unit}</Text>
      </View>
    </View>
  );
}

export default function DashboardScreen() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchLatest = useCallback(async (isPullToRefresh = false) => {
    try {
      if (isPullToRefresh) setRefreshing(true);
      setError('');
      const latest = await getLatestSensorData();
      setData(latest);
    } catch (err) {
      const message = err.code === 'ECONNABORTED'
        ? 'Server phản hồi quá chậm (quá 10 giây).'
        : 'Không thể kết nối đến server FastAPI.';
      setError(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchLatest();
    const timer = setInterval(() => { fetchLatest(); }, POLLING_MS);
    return () => clearInterval(timer);
  }, [fetchLatest]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Đang tải dữ liệu...</Text>
      </View>
    );
  }

  const overall = getOverallStatus(data);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchLatest(true)} tintColor={COLORS.primary} />}
    >
      {/* Header */}
      <View style={styles.headerSection}>
        <View>
          <Text style={styles.title}>Giám sát cây trồng</Text>
          <Text style={styles.subtitle}>Theo dõi chỉ số đất theo thời gian thực</Text>
        </View>
        <PulseIndicator />
      </View>

      {/* Status Banner */}
      <View style={[styles.statusBanner, { backgroundColor: `${overall.color}12`, borderColor: `${overall.color}30` }, SHADOWS.sm]}>
        <Ionicons name={overall.icon} size={22} color={overall.color} />
        <Text style={[styles.statusBannerText, { color: overall.color }]}>{overall.text}</Text>
      </View>

      {error ? (
        <View style={[styles.errorBanner, SHADOWS.sm]}>
          <Ionicons name="cloud-offline-outline" size={18} color={COLORS.danger} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {/* Sensor Cards Grid */}
      <View style={styles.grid}>
        <MetricCard title="Độ dẫn điện (EC)" value={data?.ec} unit="mS/cm" icon="flash-outline" bgColor={COLORS.cardEc} metricKey="ec" />
        <MetricCard title="Độ ẩm đất" value={data?.moisture} unit="%" icon="water-outline" bgColor={COLORS.cardMoisture} metricKey="moisture" />
        <MetricCard title="Nhiệt độ đất" value={data?.temperature} unit="°C" icon="thermometer-outline" bgColor={COLORS.cardTemp} metricKey="temperature" />
        <MetricCard title="N ước lượng" value={data?.n_estimate} unit="mg/kg" icon="leaf-outline" bgColor={COLORS.cardN} metricKey="n_estimate" />
      </View>

      {/* Timestamp */}
      <View style={[styles.timestampBox, SHADOWS.sm]}>
        <Ionicons name="time-outline" size={18} color={COLORS.primary} />
        <Text style={styles.timestampText}>
          Lần đọc gần nhất: {data?.timestamp ? new Date(data.timestamp).toLocaleString('vi-VN') : '--'}
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  content: {
    padding: 16,
    gap: 14,
    paddingBottom: 24,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.bg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  loadingText: {
    color: COLORS.textSecondary,
    fontSize: 15,
  },
  headerSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.primaryDark,
    letterSpacing: -0.3,
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: 14,
    marginTop: 2,
  },
  pulseIndicator: {
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pulseDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.success,
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    padding: 14,
  },
  statusBannerText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
  },
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
  errorText: {
    color: COLORS.danger,
    fontWeight: '600',
    flex: 1,
    fontSize: 13,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 12,
  },
  card: {
    width: '48%',
    borderRadius: RADIUS.lg,
    padding: 16,
    minHeight: 150,
    justifyContent: 'space-between',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  cardTitle: {
    marginTop: 12,
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  cardValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    marginTop: 2,
  },
  cardValue: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.primaryDark,
  },
  cardUnit: {
    fontSize: 13,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  timestampBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    padding: 14,
  },
  timestampText: {
    color: COLORS.textSecondary,
    flex: 1,
    fontSize: 13,
  },
});

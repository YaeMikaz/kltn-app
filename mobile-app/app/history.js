import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Dimensions, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getSensorHistory } from '../services/api';
import { COLORS, SHADOWS, RADIUS } from '../constants/theme';

// react-native-chart-kit không hoạt động ổn trên Web, chỉ import trên Native
let LineChart = null;
if (Platform.OS !== 'web') {
  LineChart = require('react-native-chart-kit').LineChart;
}

const { width: screenWidth } = Dimensions.get('window');
const chartWidth = Math.max(300, Math.min(screenWidth - 64, 600));
const SHOW_LABEL_EVERY = 2;

const FILTERS = [
  { label: 'Gần nhất', value: 8 },
  { label: '15 mốc', value: 15 },
  { label: '30 mốc', value: 30 },
  { label: 'Tất cả', value: 50 },
];

function MetricChart({ title, labels, values, color, unit, icon, decimalPlaces = 2 }) {
  const hasValidData = Array.isArray(values) && values.length > 0 && Array.isArray(labels) && labels.length === values.length;

  return (
    <View style={[styles.chartCard, SHADOWS.md]}>
      <View style={styles.chartHeader}>
        <View style={[styles.chartIconCircle, { backgroundColor: `${color}18` }]}>
          <Ionicons name={icon} size={18} color={color} />
        </View>
        <View>
          <Text style={styles.chartTitle}>{title}</Text>
          <Text style={styles.chartUnit}>Đơn vị: {unit}</Text>
        </View>
        {hasValidData ? (
          <View style={styles.chartStat}>
            <Text style={[styles.chartStatValue, { color }]}>
              {values[values.length - 1]?.toFixed(decimalPlaces)}
            </Text>
            <Text style={styles.chartStatLabel}>hiện tại</Text>
          </View>
        ) : null}
      </View>
      {hasValidData ? (
        <LineChart
          data={{
            labels,
            datasets: [{ data: values }],
          }}
          width={chartWidth}
          height={180}
          yAxisSuffix=""
          chartConfig={{
            backgroundColor: COLORS.white,
            backgroundGradientFrom: COLORS.white,
            backgroundGradientTo: COLORS.white,
            decimalPlaces,
            color: (opacity = 1) => `${color}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`,
            labelColor: () => COLORS.textMuted,
            propsForDots: {
              r: '3',
              strokeWidth: '2',
              stroke: color,
              fill: COLORS.white,
            },
            propsForBackgroundLines: {
              strokeDasharray: '4 4',
              stroke: '#E8EDE8',
              strokeWidth: 1,
            },
            fillShadowGradientFrom: color,
            fillShadowGradientTo: `${color}05`,
            fillShadowGradientOpacity: 0.15,
          }}
          style={styles.chart}
          bezier
          withShadow={false}
        />
      ) : (
        <View style={styles.emptyChart}>
          <Ionicons name="bar-chart-outline" size={32} color={COLORS.accent} />
          <Text style={styles.emptyText}>Chưa có dữ liệu cho {title}.</Text>
        </View>
      )}
    </View>
  );
}

export default function HistoryScreen() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeFilter, setActiveFilter] = useState(8);

  const fetchHistory = async () => {
    try {
      setError('');
      const rows = await getSensorHistory();
      setHistory(Array.isArray(rows) ? rows : []);
    } catch (err) {
      const message = err.code === 'ECONNABORTED'
        ? 'Server phản hồi quá chậm (quá 10 giây).'
        : 'Không thể lấy lịch sử dữ liệu cảm biến.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const latestPoints = useMemo(() => {
    return [...history].slice(0, activeFilter).reverse();
  }, [history, activeFilter]);

  const labels = useMemo(() => {
    return latestPoints.map((item, index) => {
      const timeLabel = new Date(item.timestamp).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });
      return index % SHOW_LABEL_EVERY === 0 ? timeLabel : '';
    });
  }, [latestPoints]);

  const ecValues = latestPoints.map((item) => Number(item.ec) || 0);
  const moistureValues = latestPoints.map((item) => Number(item.moisture) || 0);
  const temperatureValues = latestPoints.map((item) => Number(item.temperature) || 0);
  const nEstimateValues = latestPoints.map((item) => Number(item.n_estimate) || 0);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Đang tải lịch sử đo...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.headerSection}>
        <View>
          <Text style={styles.title}>Lịch sử đo đạc</Text>
          <Text style={styles.subtitle}>{latestPoints.length} mốc dữ liệu theo thời gian (hh:mm)</Text>
        </View>
        <TouchableOpacity
          style={[styles.refreshBtn, SHADOWS.sm]}
          onPress={() => { setLoading(true); fetchHistory(); }}
          activeOpacity={0.7}
        >
          <Ionicons name="refresh" size={20} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {/* Filter */}
      <View style={styles.filterRow}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f.value}
            style={[styles.filterChip, activeFilter === f.value && styles.filterChipActive]}
            onPress={() => setActiveFilter(f.value)}
            activeOpacity={0.7}
          >
            <Text style={[styles.filterText, activeFilter === f.value && styles.filterTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {error ? (
        <View style={[styles.errorBanner, SHADOWS.sm]}>
          <Ionicons name="cloud-offline-outline" size={16} color={COLORS.danger} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {/* Charts */}
      <MetricChart
        title="Độ dẫn điện (EC)"
        labels={labels}
        values={ecValues}
        color="#2E7D32"
        unit="mS/cm"
        icon="flash-outline"
        decimalPlaces={2}
      />
      <MetricChart
        title="Độ ẩm đất"
        labels={labels}
        values={moistureValues}
        color="#0288D1"
        unit="%"
        icon="water-outline"
        decimalPlaces={1}
      />
      <MetricChart
        title="Nhiệt độ đất"
        labels={labels}
        values={temperatureValues}
        color="#EF6C00"
        unit="°C"
        icon="thermometer-outline"
        decimalPlaces={1}
      />
      <MetricChart
        title="N ước lượng"
        labels={labels}
        values={nEstimateValues}
        color="#558B2F"
        unit="mg/kg"
        icon="leaf-outline"
        decimalPlaces={1}
      />
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
    gap: 12,
    paddingBottom: 32,
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
    marginTop: 2,
    fontSize: 13,
  },
  refreshBtn: {
    backgroundColor: COLORS.white,
    padding: 10,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  // Filter
  filterRow: {
    flexDirection: 'row',
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  filterTextActive: {
    color: COLORS.white,
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

  // Chart Card
  chartCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: 16,
  },
  chartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  chartIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chartTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.primaryDark,
  },
  chartUnit: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  chartStat: {
    marginLeft: 'auto',
    alignItems: 'flex-end',
  },
  chartStatValue: {
    fontSize: 20,
    fontWeight: '800',
  },
  chartStatLabel: {
    fontSize: 10,
    color: COLORS.textMuted,
  },
  chart: {
    borderRadius: RADIUS.md,
    marginLeft: -8,
  },
  emptyChart: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 8,
  },
  emptyText: {
    color: COLORS.textSecondary,
    fontSize: 13,
  },
});

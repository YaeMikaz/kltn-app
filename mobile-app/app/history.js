import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getSensorHistory } from '../services/api';
import { useTheme } from '../context/ThemeContext';
import { Icon } from '../components/Icon';

let LineChart = null;
if (Platform.OS !== 'web') {
  LineChart = require('react-native-chart-kit').LineChart;
}

const { width: screenWidth } = Dimensions.get('window');
const chartWidth = Math.max(300, Math.min(screenWidth - 40, 600));

const FILTERS = [
  { label: '8 mốc', value: 8 },
  { label: '15 mốc', value: 15 },
  { label: '30 mốc', value: 30 },
  { label: '50 mốc', value: 50 },
];

function MetricChart({
  title,
  labels,
  values,
  color,
  unit,
  icon,
  decimalPlaces = 2,
  selectedIndex,
  onSelectPoint,
  colors,
  isDark,
}) {
  const hasValidData = Array.isArray(values) && values.length > 0 && Array.isArray(labels) && labels.length === values.length;
  const currentValue = selectedIndex != null && selectedIndex >= 0 && selectedIndex < values.length
    ? values[selectedIndex]
    : (values.length > 0 ? values[values.length - 1] : null);

  return (
    <View style={[styles.chartCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.chartHeader}>
        <View style={styles.chartHeaderLeft}>
          <View style={[styles.chartIconBadge, { backgroundColor: `${color}18` }]}>
            <Icon name={icon} size={15} color={color} />
          </View>
          <Text style={[styles.chartTitle, { color: colors.text }]}>{title}</Text>
        </View>

        {hasValidData && currentValue != null ? (
          <View style={styles.chartStat}>
            <Text style={[styles.chartStatValue, { color }]}>
              {currentValue.toFixed(decimalPlaces)}
            </Text>
            <Text style={[styles.chartStatUnit, { color: colors.textSecondary }]}>{unit}</Text>
          </View>
        ) : null}
      </View>

      {hasValidData ? (
        <View style={styles.chartContainer}>
          <LineChart
            data={{
              labels,
              datasets: [{ data: values }],
            }}
            width={chartWidth}
            height={175}
            yAxisSuffix=""
            onDataPointClick={({ index }) => {
              Haptics.selectionAsync().catch(() => {});
              if (onSelectPoint) onSelectPoint(index);
            }}
            chartConfig={{
              backgroundColor: colors.surface,
              backgroundGradientFrom: colors.surface,
              backgroundGradientTo: colors.surface,
              decimalPlaces,
              color: (opacity = 1) => `${color}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`,
              labelColor: () => colors.textMuted,
              propsForDots: {
                r: '3.5',
                strokeWidth: '1.5',
                stroke: color,
                fill: colors.surface,
              },
              propsForBackgroundLines: {
                strokeDasharray: '3 3',
                stroke: colors.hairline,
                strokeWidth: 1,
              },
              fillShadowGradientFrom: color,
              fillShadowGradientTo: `${color}00`,
              fillShadowGradientOpacity: isDark ? 0.22 : 0.12,
            }}
            style={styles.chart}
            bezier
            withShadow={false}
          />
        </View>
      ) : (
        <View style={styles.emptyChart}>
          <Icon name="chart" size={28} color={colors.textMuted} />
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>
            Chưa có dữ liệu cho {title}.
          </Text>
        </View>
      )}
    </View>
  );
}

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const { colors, isDark, tokens } = useTheme();

  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeFilter, setActiveFilter] = useState(15);
  const [selectedPointIndex, setSelectedPointIndex] = useState(null);

  const fetchHistory = async () => {
    try {
      setError('');
      const rows = await getSensorHistory();
      setHistory(Array.isArray(rows) ? rows : []);
    } catch {
      setError('Không thể lấy lịch sử dữ liệu cảm biến.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchHistory();
  }, []);

  const latestPoints = useMemo(() => {
    return [...history].slice(0, activeFilter).reverse();
  }, [history, activeFilter]);

  // (a) Smart Label Sampling: compute interval so labels never overlap on mobile screen
  const labels = useMemo(() => {
    const len = latestPoints.length;
    if (len === 0) return [];

    // Aim for 3 to 4 visible labels max across the screen width
    const targetCount = chartWidth < 360 ? 3 : 4;
    const step = Math.max(1, Math.ceil((len - 1) / (targetCount - 1)));

    return latestPoints.map((item, index) => {
      // Always show first and last, and every step
      const isKeyPoint = index === 0 || index === len - 1 || index % step === 0;
      if (!isKeyPoint) return '';

      const d = new Date(item.timestamp);
      return d.toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
      });
    });
  }, [latestPoints]);

  const ecValues = latestPoints.map((item) => Number(item.ec) || 0);
  const moistureValues = latestPoints.map((item) => Number(item.moisture) || 0);
  const temperatureValues = latestPoints.map((item) => Number(item.temperature) || 0);
  const nEstimateValues = latestPoints.map((item) => Number(item.n_estimate) || 0);

  const selectedPoint = selectedPointIndex != null && selectedPointIndex >= 0 && selectedPointIndex < latestPoints.length
    ? latestPoints[selectedPointIndex]
    : (latestPoints.length > 0 ? latestPoints[latestPoints.length - 1] : null);

  const selectedTimeStr = selectedPoint
    ? new Date(selectedPoint.timestamp).toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    : '--:--';

  const selectedDateStr = selectedPoint
    ? new Date(selectedPoint.timestamp).toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
      })
    : '';

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.bg }]}>
        <ActivityIndicator size="small" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          Đang tải lịch sử đo đạc...
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* Header */}
      <View
        style={[
          styles.headerSection,
          {
            paddingTop: Math.max(16, insets.top + 8),
            backgroundColor: colors.bg,
            borderBottomColor: colors.hairline,
          },
        ]}
      >
        <View>
          <Text style={[styles.eyebrow, { color: colors.accent }]}>XU HƯỚNG THEO THỜI GIAN</Text>
          <Text style={[styles.title, { color: colors.text }]}>Lịch sử đo đạc</Text>
        </View>

        <TouchableOpacity
          style={[styles.refreshBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
            setLoading(true);
            fetchHistory();
          }}
          activeOpacity={0.7}
        >
          <Icon name="refresh" size={18} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {/* Segmented Filter Pills */}
        <View style={[styles.filterContainer, { backgroundColor: colors.surfaceSecondary }]}>
          {FILTERS.map((f) => {
            const active = activeFilter === f.value;
            return (
              <TouchableOpacity
                key={f.value}
                style={[
                  styles.filterChip,
                  active && [
                    styles.filterChipActive,
                    { backgroundColor: colors.surface, shadowColor: colors.shadow },
                  ],
                ]}
                onPress={() => {
                  Haptics.selectionAsync().catch(() => {});
                  setActiveFilter(f.value);
                  setSelectedPointIndex(null);
                }}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.filterText,
                    {
                      color: active ? colors.text : colors.textSecondary,
                      fontWeight: active ? '800' : '500',
                    },
                  ]}
                >
                  {f.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* (c) Interactive Inspector Banner: Shows when user taps any data point */}
        {selectedPoint ? (
          <View
            style={[
              styles.inspectorCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
              tokens.shadows.sm,
            ]}
          >
            <View style={styles.inspectorHeader}>
              <View style={styles.inspectorHeaderLeft}>
                <Icon name="history" size={15} color={colors.accent} />
                <Text style={[styles.inspectorTitle, { color: colors.text }]}>
                  Mốc đo: {selectedDateStr} lúc {selectedTimeStr}
                </Text>
              </View>
              <Text style={[styles.inspectorHint, { color: colors.textMuted }]}>
                Chạm điểm để soi
              </Text>
            </View>

            <View style={styles.inspectorGrid}>
              <View style={styles.inspectorMetric}>
                <Text style={[styles.inspectorLabel, { color: colors.textSecondary }]}>EC</Text>
                <Text style={[styles.inspectorValue, { color: colors.primary }]}>
                  {Number(selectedPoint.ec).toFixed(2)} <Text style={styles.inspectorUnit}>mS/cm</Text>
                </Text>
              </View>
              <View style={styles.inspectorMetric}>
                <Text style={[styles.inspectorLabel, { color: colors.textSecondary }]}>Độ ẩm</Text>
                <Text style={[styles.inspectorValue, { color: colors.info }]}>
                  {Number(selectedPoint.moisture).toFixed(0)} <Text style={styles.inspectorUnit}>%</Text>
                </Text>
              </View>
              <View style={styles.inspectorMetric}>
                <Text style={[styles.inspectorLabel, { color: colors.textSecondary }]}>Nhiệt độ</Text>
                <Text style={[styles.inspectorValue, { color: colors.warning }]}>
                  {Number(selectedPoint.temperature).toFixed(1)} <Text style={styles.inspectorUnit}>°C</Text>
                </Text>
              </View>
              <View style={styles.inspectorMetric}>
                <Text style={[styles.inspectorLabel, { color: colors.textSecondary }]}>Nitrogen</Text>
                <Text style={[styles.inspectorValue, { color: colors.success }]}>
                  {Number(selectedPoint.n_estimate).toFixed(0)} <Text style={styles.inspectorUnit}>mg</Text>
                </Text>
              </View>
            </View>
          </View>
        ) : null}

        {error ? (
          <View style={[styles.errorBanner, { backgroundColor: colors.dangerSoft, borderColor: colors.danger }]}>
            <Icon name="alert" size={16} color={colors.danger} />
            <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text>
          </View>
        ) : null}

        {/* Charts */}
        <MetricChart
          title="Độ dẫn điện EC đất"
          labels={labels}
          values={ecValues}
          color={colors.primary}
          unit="mS/cm"
          icon="zap"
          decimalPlaces={2}
          selectedIndex={selectedPointIndex}
          onSelectPoint={setSelectedPointIndex}
          colors={colors}
          isDark={isDark}
        />
        <MetricChart
          title="Độ ẩm đất"
          labels={labels}
          values={moistureValues}
          color={colors.info}
          unit="%"
          icon="droplets"
          decimalPlaces={1}
          selectedIndex={selectedPointIndex}
          onSelectPoint={setSelectedPointIndex}
          colors={colors}
          isDark={isDark}
        />
        <MetricChart
          title="Nhiệt độ đất"
          labels={labels}
          values={temperatureValues}
          color={colors.warning}
          unit="°C"
          icon="thermometer"
          decimalPlaces={1}
          selectedIndex={selectedPointIndex}
          onSelectPoint={setSelectedPointIndex}
          colors={colors}
          isDark={isDark}
        />
        <MetricChart
          title="Nitrogen ước lượng"
          labels={labels}
          values={nEstimateValues}
          color={colors.success}
          unit="mg/kg"
          icon="sprout"
          decimalPlaces={1}
          selectedIndex={selectedPointIndex}
          onSelectPoint={setSelectedPointIndex}
          colors={colors}
          isDark={isDark}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  loadingText: {
    fontSize: 14,
  },
  headerSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  eyebrow: {
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
  refreshBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: 16,
    gap: 14,
    paddingBottom: 40,
  },
  filterContainer: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
    gap: 4,
  },
  filterChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 8,
  },
  filterChipActive: {
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  filterText: {
    fontSize: 12,
  },
  inspectorCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 10,
  },
  inspectorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  inspectorHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  inspectorTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  inspectorHint: {
    fontSize: 11,
    fontWeight: '500',
  },
  inspectorGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: 'rgba(128,128,128,0.15)',
    paddingTop: 8,
  },
  inspectorMetric: {
    alignItems: 'center',
  },
  inspectorLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  inspectorValue: {
    fontSize: 14,
    fontWeight: '800',
    marginTop: 1,
  },
  inspectorUnit: {
    fontSize: 10,
    fontWeight: '500',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
  },
  errorText: {
    fontSize: 13,
    flex: 1,
    fontWeight: '600',
  },
  chartCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  chartHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  chartIconBadge: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chartTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  chartStat: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 3,
  },
  chartStatValue: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  chartStatUnit: {
    fontSize: 11,
    fontWeight: '600',
  },
  chartContainer: {
    alignItems: 'center',
  },
  chart: {
    borderRadius: 12,
    marginLeft: -16,
  },
  emptyChart: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 36,
    gap: 6,
  },
  emptyText: {
    fontSize: 13,
  },
});

import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Dimensions, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { getSensorHistory } from '../services/api';

const COLORS = {
  bg: '#F1F8E9',
  primary: '#2E7D32',
  text: '#1B4332',
  danger: '#C62828',
  white: '#ffffff',
};

const chartWidth = Dimensions.get('window').width - 32;
// Số điểm dữ liệu hiển thị trên mỗi biểu đồ (tăng/giảm node tại đây).
const POINT_LIMIT = 8;
// Hiển thị nhãn thời gian mỗi N điểm để tránh rối trục X.
const SHOW_LABEL_EVERY = 2;

function MetricChart({ title, labels, values, color, unit, decimalPlaces = 2 }) {
  return (
    <View style={styles.chartCard}>
      <Text style={styles.chartTitle}>{title}</Text>
      {values.length > 0 ? (
        <LineChart
          data={{
            labels,
            datasets: [{ data: values }],
          }}
          width={chartWidth}
          height={220}
          yAxisSuffix=""
          chartConfig={{
            backgroundColor: '#ffffff',
            backgroundGradientFrom: '#ffffff',
            backgroundGradientTo: '#ffffff',
            decimalPlaces,
            color: (opacity = 1) => `${color}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`,
            labelColor: (opacity = 1) => `rgba(27, 67, 50, ${opacity})`,
            propsForDots: {
              r: '4',
              strokeWidth: '2',
              stroke: color,
            },
          }}
          style={styles.chart}
          bezier
        />
      ) : (
        <Text style={styles.emptyText}>Chưa có dữ liệu cho {title}.</Text>
      )}
      <Text style={styles.unitText}>Đơn vị: {unit}</Text>
    </View>
  );
}

export default function HistoryScreen() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchHistory = async () => {
    try {
      setError('');
      const rows = await getSensorHistory();
      setHistory(Array.isArray(rows) ? rows : []);
    } catch (err) {
      const message = err.code === 'ECONNABORTED'
        ? 'Server phản hồi quá chậm (quá 10 giây).'
        : 'Không thể lấy lịch sử dữ liệu.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const latestPoints = useMemo(() => {
    // API history đang trả về mới nhất -> cũ nhất, cần đảo ngược để vẽ theo trục thời gian tăng dần.
    return [...history].slice(0, POINT_LIMIT).reverse();
  }, [history]);

  const labels = useMemo(() => {
    return latestPoints.map((item, index) => {
      const timeLabel = new Date(item.timestamp).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });

      // Chỉ hiển thị một phần nhãn để dễ nhìn, vẫn giữ đủ số node dữ liệu.
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
        <Text style={styles.loadingText}>Đang tải lịch sử...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Lịch sử cảm biến</Text>
      <Text style={styles.subtitle}>{POINT_LIMIT} mốc dữ liệu gần nhất (hh:mm:ss)</Text>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <MetricChart
        title="EC"
        labels={labels}
        values={ecValues}
        color="#2E7D32"
        unit="mS/cm"
        decimalPlaces={2}
      />
      <MetricChart
        title="Độ ẩm"
        labels={labels}
        values={moistureValues}
        color="#0288D1"
        unit="%"
        decimalPlaces={1}
      />
      <MetricChart
        title="Nhiệt độ"
        labels={labels}
        values={temperatureValues}
        color="#EF6C00"
        unit="°C"
        decimalPlaces={1}
      />
      <MetricChart
        title="N ước lượng"
        labels={labels}
        values={nEstimateValues}
        color="#558B2F"
        unit="mg/kg"
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
    gap: 10,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.bg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  loadingText: {
    color: COLORS.text,
    fontSize: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.primary,
  },
  subtitle: {
    color: COLORS.text,
    marginBottom: 8,
  },
  chartCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: 'center',
  },
  chartTitle: {
    alignSelf: 'flex-start',
    marginLeft: 14,
    marginBottom: 8,
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
  },
  chart: {
    borderRadius: 16,
  },
  emptyText: {
    color: COLORS.text,
    padding: 20,
  },
  unitText: {
    alignSelf: 'flex-start',
    marginTop: 8,
    marginLeft: 14,
    color: '#355e3b',
    fontSize: 12,
  },
  errorText: {
    color: COLORS.danger,
    fontWeight: '600',
  },
});

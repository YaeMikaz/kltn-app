import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getLatestSensorData } from '../services/api';

const COLORS = {
  bg: '#F1F8E9',
  primary: '#2E7D32',
  text: '#1B4332',
  cardEc: '#C8E6C9',
  cardMoisture: '#B3E5FC',
  cardTemp: '#FFE0B2',
  cardN: '#DCEDC8',
  white: '#ffffff',
  danger: '#C62828',
};

const POLLING_MS = 3000;

function MetricCard({ title, value, unit, icon, bgColor }) {
  return (
    <View style={[styles.card, { backgroundColor: bgColor }]}>
      <Ionicons name={icon} size={26} color={COLORS.primary} />
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.cardValue}>{value ?? '--'}</Text>
      <Text style={styles.cardUnit}>{unit}</Text>
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
      if (isPullToRefresh) {
        setRefreshing(true);
      }
      setError('');
      const latest = await getLatestSensorData();
      setData(latest);
    } catch (err) {
      // Xử lý lỗi timeout/không kết nối để người dùng biết tình trạng server.
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

    // Polling nhanh hơn để giảm độ trễ cảm nhận khi ESP32 vừa gửi dữ liệu.
    const timer = setInterval(() => {
      fetchLatest();
    }, POLLING_MS);

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

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchLatest(true)} />}
    >
      <Text style={styles.title}>Giám sát cây xanh</Text>
      <Text style={styles.subtitle}>Theo dõi chỉ số đất theo thời gian thực</Text>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <View style={styles.grid}>
        <MetricCard
          title="EC"
          value={data?.ec}
          unit="mS/cm"
          icon="flash-outline"
          bgColor={COLORS.cardEc}
        />
        <MetricCard
          title="Độ ẩm"
          value={data?.moisture}
          unit="%"
          icon="water-outline"
          bgColor={COLORS.cardMoisture}
        />
        <MetricCard
          title="Nhiệt độ"
          value={data?.temperature}
          unit="°C"
          icon="thermometer-outline"
          bgColor={COLORS.cardTemp}
        />
        <MetricCard
          title="N ước lượng"
          value={data?.n_estimate}
          unit="mg/kg"
          icon="leaf-outline"
          bgColor={COLORS.cardN}
        />
      </View>

      <View style={styles.timestampBox}>
        <Ionicons name="time-outline" size={18} color={COLORS.primary} />
        <Text style={styles.timestampText}>
          Lần đọc gần nhất: {data?.timestamp ? new Date(data.timestamp).toLocaleString() : '--'}
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
    fontSize: 14,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 12,
  },
  card: {
    width: '48%',
    borderRadius: 14,
    padding: 14,
    minHeight: 130,
    justifyContent: 'space-between',
  },
  cardTitle: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  cardValue: {
    fontSize: 26,
    fontWeight: '700',
    color: '#0f5132',
  },
  cardUnit: {
    fontSize: 13,
    color: '#355e3b',
  },
  timestampBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 12,
  },
  timestampText: {
    color: COLORS.text,
    flex: 1,
  },
  errorText: {
    color: COLORS.danger,
    fontWeight: '600',
  },
});

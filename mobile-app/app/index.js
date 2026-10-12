import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { getLatestSensorData, getSensorHistory } from '../services/api';
import { useTheme } from '../context/ThemeContext';
import { Icon } from '../components/Icon';
import { SettingsModal } from '../components/SettingsModal';
import { Sparkline } from '../components/Sparkline';

const POLLING_MS = 5000;

function getMetricStatus(key, value, colors) {
  if (value == null) return { label: 'Chờ...', color: colors.textMuted, bg: colors.surfaceSecondary };
  switch (key) {
    case 'ec':
      if (value < 0.5) return { label: 'Thấp', color: colors.warning, bg: colors.warningSoft };
      if (value <= 2.5) return { label: 'Tối ưu', color: colors.success, bg: colors.successSoft };
      return { label: 'Cao', color: colors.danger, bg: colors.dangerSoft };
    case 'moisture':
      if (value < 30) return { label: 'Cần tưới', color: colors.danger, bg: colors.dangerSoft };
      if (value <= 70) return { label: 'Tối ưu', color: colors.success, bg: colors.successSoft };
      return { label: 'Quá ẩm', color: colors.warning, bg: colors.warningSoft };
    case 'temperature':
      if (value < 18) return { label: 'Lạnh', color: colors.info, bg: colors.infoSoft };
      if (value <= 32) return { label: 'Tối ưu', color: colors.success, bg: colors.successSoft };
      return { label: 'Nóng', color: colors.danger, bg: colors.dangerSoft };
    case 'n_estimate':
      if (value < 20) return { label: 'Thiếu', color: colors.warning, bg: colors.warningSoft };
      if (value <= 80) return { label: 'Tối ưu', color: colors.success, bg: colors.successSoft };
      return { label: 'Thừa', color: colors.danger, bg: colors.dangerSoft };
    default:
      return { label: '--', color: colors.textMuted, bg: colors.surfaceSecondary };
  }
}

function getOverall(data, colors) {
  if (!data) return null;
  const all = [
    getMetricStatus('ec', data.ec, colors),
    getMetricStatus('moisture', data.moisture, colors),
    getMetricStatus('temperature', data.temperature, colors),
    getMetricStatus('n_estimate', data.n_estimate, colors),
  ];
  if (all.some((s) => s.color === colors.danger)) {
    return { text: 'Cần can thiệp', color: colors.danger, bg: colors.dangerSoft, icon: 'alert' };
  }
  if (all.some((s) => s.color === colors.warning)) {
    return { text: 'Cần theo dõi', color: colors.warning, bg: colors.warningSoft, icon: 'eye' };
  }
  return { text: 'Vườn ổn định', color: colors.success, bg: colors.successSoft, icon: 'check' };
}

function fmt(v, d = 1) {
  if (v == null) return '--';
  return typeof v === 'number' ? v.toFixed(d) : String(v);
}

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors, tokens } = useTheme();

  const [data, setData] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [settingsVisible, setSettingsVisible] = useState(false);

  const fetchData = useCallback(async (pull = false) => {
    try {
      if (pull) setRefreshing(true);
      setError('');
      const [latestRes, historyRes] = await Promise.all([
        getLatestSensorData(),
        getSensorHistory().catch(() => []),
      ]);
      setData(latestRes);
      if (Array.isArray(historyRes)) {
        setHistory(historyRes.slice(0, 15).reverse());
      }
    } catch {
      setError('Mất kết nối trạm quan trắc.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const handlePullRefresh = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    fetchData(true);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
    const t = setInterval(() => {
      fetchData();
    }, POLLING_MS);
    return () => clearInterval(t);
  }, [fetchData]);

  if (loading) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.bg }]}>
        <ActivityIndicator size="small" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          Đang kết nối trạm cảm biến...
        </Text>
      </View>
    );
  }

  const overall = getOverall(data, colors);
  const ec = getMetricStatus('ec', data?.ec, colors);
  const moist = getMetricStatus('moisture', data?.moisture, colors);
  const temp = getMetricStatus('temperature', data?.temperature, colors);
  const n = getMetricStatus('n_estimate', data?.n_estimate, colors);

  const ecHistory = history.map((h) => h.ec);
  const moistHistory = history.map((h) => h.moisture);
  const tempHistory = history.map((h) => h.temperature);
  const nHistory = history.map((h) => h.n_estimate);

  return (
    <View style={[styles.page, { backgroundColor: colors.bg }]}>
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
        <View style={styles.headerLeft}>
          <Text style={[styles.headerKicker, { color: colors.accent }]}>TRẠM NÔNG NGHIỆP THÔNG MINH</Text>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Tổng quan vườn</Text>
        </View>

        <View style={styles.headerRight}>
          <View style={[styles.liveBadge, { backgroundColor: colors.surfaceSecondary, borderColor: colors.hairline }]}>
            <View style={[styles.liveDot, { backgroundColor: error ? colors.danger : colors.success }]} />
            <Text style={[styles.liveText, { color: colors.textSecondary }]}>
              {error ? 'Ngoại tuyến' : 'Trực tiếp'}
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.settingsBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => setSettingsVisible(true)}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Icon name="settings" size={20} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handlePullRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {/* Overall Status Banner */}
        <View style={[styles.overallBanner, { backgroundColor: colors.surface, borderColor: colors.border }, tokens.shadows.sm]}>
          <View style={styles.overallLeft}>
            <Text style={[styles.overallKicker, { color: colors.textMuted }]}>TÌNH TRẠNG CHUNG</Text>
            <Text style={[styles.overallTitle, { color: colors.text }]}>{overall ? overall.text : 'Đang cập nhật'}</Text>
            <Text style={[styles.overallTime, { color: colors.textSecondary }]}>
              {data?.timestamp
                ? `Đo lúc ${new Date(data.timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`
                : 'Chưa có bản ghi mới'}
            </Text>
          </View>

          {overall ? (
            <View style={[styles.overallBadge, { backgroundColor: overall.bg, borderColor: overall.color }]}>
              <Icon name={overall.icon} size={24} color={overall.color} />
            </View>
          ) : null}
        </View>

        {error ? (
          <View style={[styles.errorBox, { backgroundColor: colors.dangerSoft, borderColor: colors.danger }]}>
            <Icon name="offline" size={18} color={colors.danger} />
            <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text>
            <TouchableOpacity onPress={() => fetchData(true)} style={[styles.retryBtn, { backgroundColor: colors.surface }]}>
              <Text style={[styles.retryText, { color: colors.danger }]}>Thử lại</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {/* Feature Hero Card: Soil EC */}
        <View style={[styles.featureCard, { backgroundColor: colors.surface, borderColor: colors.border }, tokens.shadows.md]}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.cardTitleGroup}>
              <View style={[styles.iconBadge, { backgroundColor: colors.accentSoft }]}>
                <Icon name="zap" size={16} color={colors.accent} />
              </View>
              <View>
                <Text style={[styles.cardTitle, { color: colors.text }]}>Độ dẫn điện EC</Text>
                <Text style={[styles.cardSub, { color: colors.textMuted }]}>Nồng độ dinh dưỡng & muối đất</Text>
              </View>
            </View>

            <View style={[styles.statusPill, { backgroundColor: ec.bg }]}>
              <View style={[styles.statusDot, { backgroundColor: ec.color }]} />
              <Text style={[styles.statusPillText, { color: ec.color }]}>{ec.label}</Text>
            </View>
          </View>

          <View style={styles.featureValueRow}>
            <View style={styles.valueGroup}>
              <Text style={[styles.featureNumber, { color: colors.text }]}>{fmt(data?.ec, 2)}</Text>
              <Text style={[styles.featureUnit, { color: colors.textSecondary }]}>mS/cm</Text>
            </View>

            {ecHistory.length > 1 ? (
              <Sparkline data={ecHistory} width={130} height={42} color={ec.color} />
            ) : null}
          </View>

          {/* Range Visualizer Bar */}
          <View style={styles.rangeBarTrack}>
            <View
              style={[
                styles.rangeBarFill,
                {
                  backgroundColor: colors.primary,
                  width: `${Math.min(100, Math.max(8, ((data?.ec ?? 0) / 3.2) * 100))}%`,
                },
              ]}
            />
            {/* Ideal reference zone: 0.5 to 2.5 mS/cm */}
            <View style={[styles.rangeBarOptimal, { borderColor: colors.accent }]} />
          </View>

          <View style={styles.rangeFooter}>
            <Text style={[styles.rangeLabel, { color: colors.textMuted }]}>0.0</Text>
            <Text style={[styles.rangeIdealText, { color: colors.accent }]}>Dải tối ưu: 0.5 – 2.5 mS/cm</Text>
            <Text style={[styles.rangeLabel, { color: colors.textMuted }]}>3.2+</Text>
          </View>
        </View>

        {/* Duo Cards: Moisture & Temperature */}
        <View style={styles.duoRow}>
          {/* Soil Moisture */}
          <View style={[styles.miniCard, { backgroundColor: colors.surface, borderColor: colors.border }, tokens.shadows.sm]}>
            <View style={styles.miniCardTop}>
              <View style={[styles.iconBadgeMini, { backgroundColor: colors.infoSoft }]}>
                <Icon name="droplets" size={15} color={colors.info} />
              </View>
              <View style={[styles.statusPillMini, { backgroundColor: moist.bg }]}>
                <Text style={[styles.statusPillTextMini, { color: moist.color }]}>{moist.label}</Text>
              </View>
            </View>

            <Text style={[styles.miniTitle, { color: colors.textSecondary }]}>Độ ẩm đất</Text>
            <View style={styles.miniValueRow}>
              <Text style={[styles.miniNumber, { color: colors.text }]}>{fmt(data?.moisture, 0)}</Text>
              <Text style={[styles.miniUnit, { color: colors.textSecondary }]}>%</Text>
            </View>

            {moistHistory.length > 1 ? (
              <View style={styles.miniSparkline}>
                <Sparkline data={moistHistory} width={100} height={28} color={moist.color} />
              </View>
            ) : null}
          </View>

          {/* Soil Temperature */}
          <View style={[styles.miniCard, { backgroundColor: colors.surface, borderColor: colors.border }, tokens.shadows.sm]}>
            <View style={styles.miniCardTop}>
              <View style={[styles.iconBadgeMini, { backgroundColor: colors.warningSoft }]}>
                <Icon name="thermometer" size={15} color={colors.warning} />
              </View>
              <View style={[styles.statusPillMini, { backgroundColor: temp.bg }]}>
                <Text style={[styles.statusPillTextMini, { color: temp.color }]}>{temp.label}</Text>
              </View>
            </View>

            <Text style={[styles.miniTitle, { color: colors.textSecondary }]}>Nhiệt độ đất</Text>
            <View style={styles.miniValueRow}>
              <Text style={[styles.miniNumber, { color: colors.text }]}>{fmt(data?.temperature, 1)}</Text>
              <Text style={[styles.miniUnit, { color: colors.textSecondary }]}>°C</Text>
            </View>

            {tempHistory.length > 1 ? (
              <View style={styles.miniSparkline}>
                <Sparkline data={tempHistory} width={100} height={28} color={temp.color} />
              </View>
            ) : null}
          </View>
        </View>

        {/* Nitrogen Estimation Card */}
        <View style={[styles.nCard, { backgroundColor: colors.surface, borderColor: colors.border }, tokens.shadows.sm]}>
          <View style={[styles.nIconBox, { backgroundColor: colors.primarySoft }]}>
            <Icon name="sprout" size={22} color={colors.primary} />
          </View>

          <View style={styles.nContent}>
            <View style={styles.nTitleRow}>
              <Text style={[styles.nLabel, { color: colors.textSecondary }]}>Nitrogen ước lượng</Text>
              <View style={[styles.statusPillMini, { backgroundColor: n.bg }]}>
                <Text style={[styles.statusPillTextMini, { color: n.color }]}>{n.label}</Text>
              </View>
            </View>
            <View style={styles.nValueRow}>
              <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
                <Text style={[styles.nNumber, { color: colors.text }]}>{fmt(data?.n_estimate, 0)}</Text>
                <Text style={[styles.nUnit, { color: colors.textSecondary }]}>mg/kg đất</Text>
              </View>
              {nHistory.length > 1 ? (
                <Sparkline data={nHistory} width={80} height={24} color={n.color} />
              ) : null}
            </View>
            <Text style={[styles.nNote, { color: colors.textMuted }]}>
              Ước tính hàm lượng đạm khả dụng dựa trên độ dẫn điện
            </Text>
          </View>
        </View>

        {/* Action Shortcuts */}
        <View style={styles.shortcutsRow}>
          <TouchableOpacity
            style={[styles.shortcutCard, { backgroundColor: colors.surface, borderColor: colors.border }, tokens.shadows.sm]}
            onPress={() => router.push('/diagnosis')}
            activeOpacity={0.8}
          >
            <View style={[styles.shortcutIconBox, { backgroundColor: colors.primarySoft }]}>
              <Icon name="scan" size={20} color={colors.primary} />
            </View>
            <View style={styles.shortcutTextGroup}>
              <Text style={[styles.shortcutTitle, { color: colors.text }]}>Chẩn đoán lá cây</Text>
              <Text style={[styles.shortcutSub, { color: colors.textSecondary }]}>Chụp ảnh nhận diện bệnh</Text>
            </View>
            <Icon name="chevron" size={16} color={colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.shortcutCard, { backgroundColor: colors.surface, borderColor: colors.border }, tokens.shadows.sm]}
            onPress={() => router.push('/chatbot')}
            activeOpacity={0.8}
          >
            <View style={[styles.shortcutIconBox, { backgroundColor: colors.accentSoft }]}>
              <Icon name="bot" size={20} color={colors.accent} />
            </View>
            <View style={styles.shortcutTextGroup}>
              <Text style={[styles.shortcutTitle, { color: colors.text }]}>Hỏi Trợ lý AI</Text>
              <Text style={[styles.shortcutSub, { color: colors.textSecondary }]}>Tư vấn tưới & bón phân</Text>
            </View>
            <Icon name="chevron" size={16} color={colors.textMuted} />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Settings Modal */}
      <SettingsModal visible={settingsVisible} onClose={() => setSettingsVisible(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '500',
  },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flex: 1,
  },
  headerKicker: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.4,
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  liveText: {
    fontSize: 11,
    fontWeight: '700',
  },
  settingsBtn: {
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
    paddingBottom: 36,
  },
  overallBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  overallLeft: {
    flex: 1,
  },
  overallKicker: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  overallTitle: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginTop: 2,
  },
  overallTime: {
    fontSize: 12,
    marginTop: 3,
  },
  overallBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
  },
  retryBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  retryText: {
    fontSize: 12,
    fontWeight: '700',
  },
  featureCard: {
    padding: 18,
    borderRadius: 18,
    borderWidth: 1,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconBadge: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  cardSub: {
    fontSize: 11,
    marginTop: 1,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 14,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusPillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  featureValueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 14,
  },
  valueGroup: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  featureNumber: {
    fontSize: 52,
    fontWeight: '800',
    letterSpacing: -2,
    lineHeight: 56,
  },
  featureUnit: {
    fontSize: 15,
    fontWeight: '700',
  },
  rangeBarTrack: {
    height: 7,
    borderRadius: 4,
    backgroundColor: 'rgba(128, 128, 128, 0.15)',
    marginTop: 14,
    overflow: 'hidden',
    position: 'relative',
  },
  rangeBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  rangeBarOptimal: {
    position: 'absolute',
    left: '15.6%', // 0.5 / 3.2
    width: '62.5%', // (2.5 - 0.5) / 3.2
    top: 0,
    bottom: 0,
    borderLeftWidth: 1.5,
    borderRightWidth: 1.5,
  },
  rangeFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  rangeLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  rangeIdealText: {
    fontSize: 11,
    fontWeight: '700',
  },
  duoRow: {
    flexDirection: 'row',
    gap: 12,
  },
  miniCard: {
    flex: 1,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  miniCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  iconBadgeMini: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusPillMini: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 10,
  },
  statusPillTextMini: {
    fontSize: 10,
    fontWeight: '700',
  },
  miniTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 8,
  },
  miniValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 3,
    marginTop: 2,
  },
  miniNumber: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  miniUnit: {
    fontSize: 13,
    fontWeight: '700',
  },
  miniSparkline: {
    marginTop: 8,
    alignItems: 'flex-start',
  },
  nCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 14,
    alignItems: 'center',
  },
  nIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nContent: {
    flex: 1,
  },
  nTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  nLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  nValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    marginTop: 2,
  },
  nNumber: {
    fontSize: 20,
    fontWeight: '800',
  },
  nUnit: {
    fontSize: 12,
    fontWeight: '600',
  },
  nNote: {
    fontSize: 11,
    marginTop: 3,
  },
  shortcutsRow: {
    gap: 10,
    marginTop: 4,
  },
  shortcutCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
  },
  shortcutIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shortcutTextGroup: {
    flex: 1,
  },
  shortcutTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  shortcutSub: {
    fontSize: 11,
    marginTop: 1,
  },
});

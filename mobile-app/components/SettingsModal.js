// mobile-app/components/SettingsModal.js
import React from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { Icon } from './Icon';

export function SettingsModal({ visible, onClose }) {
  const insets = useSafeAreaInsets();
  const { colors, themeMode, setThemeMode } = useTheme();

  const handleSelectTheme = (mode) => {
    Haptics.selectionAsync().catch(() => {});
    setThemeMode(mode);
  };

  const themeOptions = [
    { key: 'system', label: 'Tự động', icon: 'monitor' },
    { key: 'light', label: 'Sáng', icon: 'sun' },
    { key: 'dark', label: 'Tối', icon: 'moon' },
  ];

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={[styles.backdrop, { backgroundColor: colors.overlay }]}>
          <TouchableWithoutFeedback>
            <View
              style={[
                styles.sheet,
                {
                  backgroundColor: colors.surface,
                  borderTopColor: colors.border,
                  paddingBottom: Math.max(24, insets.bottom + 12),
                },
              ]}
            >
              {/* Grabber handle */}
              <View style={styles.grabberContainer}>
                <View style={[styles.grabber, { backgroundColor: colors.border }]} />
              </View>

              {/* Header */}
              <View style={styles.header}>
                <View>
                  <Text style={[styles.title, { color: colors.text }]}>Cài đặt hệ thống</Text>
                  <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                    Tùy chỉnh giao diện & thông số
                  </Text>
                </View>
                <TouchableOpacity
                  style={[styles.closeBtn, { backgroundColor: colors.surfaceSecondary, borderColor: colors.hairline }]}
                  onPress={onClose}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                >
                  <Icon name="x" size={18} color={colors.text} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
                {/* Theme Selector */}
                <View style={[styles.section, { borderColor: colors.hairline }]}>
                  <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
                    CHẾ ĐỘ GIAO DIỆN
                  </Text>
                  <View style={[styles.segmentedContainer, { backgroundColor: colors.surfaceSecondary }]}>
                    {themeOptions.map((opt) => {
                      const active = themeMode === opt.key;
                      return (
                        <TouchableOpacity
                          key={opt.key}
                          style={[
                            styles.segmentBtn,
                            active && [
                              styles.segmentBtnActive,
                              {
                                backgroundColor: colors.surface,
                                shadowColor: colors.shadow,
                              },
                            ],
                          ]}
                          onPress={() => handleSelectTheme(opt.key)}
                          activeOpacity={0.8}
                        >
                          <Icon
                            name={opt.icon}
                            size={16}
                            color={active ? colors.primary : colors.textMuted}
                          />
                          <Text
                            style={[
                              styles.segmentLabel,
                              {
                                color: active ? colors.text : colors.textSecondary,
                                fontWeight: active ? '700' : '500',
                              },
                            ]}
                          >
                            {opt.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* Sensor Metrics Standard */}
                <View style={[styles.section, { borderColor: colors.hairline }]}>
                  <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
                    QUY CHUẨN ĐO LƯỜNG VƯỜN
                  </Text>
                  <View style={[styles.cardList, { backgroundColor: colors.surfaceSecondary, borderColor: colors.hairline }]}>
                    <View style={styles.itemRow}>
                      <View style={styles.itemLeft}>
                        <Icon name="zap" size={16} color={colors.accent} />
                        <Text style={[styles.itemText, { color: colors.text }]}>Độ dẫn điện đất (EC)</Text>
                      </View>
                      <Text style={[styles.itemValue, { color: colors.textSecondary }]}>0.5 - 2.5 mS/cm</Text>
                    </View>
                    <View style={[styles.itemDivider, { backgroundColor: colors.hairline }]} />
                    <View style={styles.itemRow}>
                      <View style={styles.itemLeft}>
                        <Icon name="droplets" size={16} color={colors.info} />
                        <Text style={[styles.itemText, { color: colors.text }]}>Độ ẩm tối ưu</Text>
                      </View>
                      <Text style={[styles.itemValue, { color: colors.textSecondary }]}>30 - 70 %</Text>
                    </View>
                    <View style={[styles.itemDivider, { backgroundColor: colors.hairline }]} />
                    <View style={styles.itemRow}>
                      <View style={styles.itemLeft}>
                        <Icon name="thermometer" size={16} color={colors.warning} />
                        <Text style={[styles.itemText, { color: colors.text }]}>Nhiệt độ tối ưu</Text>
                      </View>
                      <Text style={[styles.itemValue, { color: colors.textSecondary }]}>18 - 32 °C</Text>
                    </View>
                  </View>
                </View>

                {/* System Info */}
                <View style={[styles.section, { borderColor: colors.hairline }]}>
                  <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
                    THÔNG TIN HỆ THỐNG
                  </Text>
                  <View style={[styles.cardList, { backgroundColor: colors.surfaceSecondary, borderColor: colors.hairline }]}>
                    <View style={styles.itemRow}>
                      <Text style={[styles.itemText, { color: colors.text }]}>Phần cứng trạm</Text>
                      <Text style={[styles.itemValue, { color: colors.textSecondary }]}>ESP32 + RS485</Text>
                    </View>
                    <View style={[styles.itemDivider, { backgroundColor: colors.hairline }]} />
                    <View style={styles.itemRow}>
                      <Text style={[styles.itemText, { color: colors.text }]}>Mô hình Thị giác</Text>
                      <Text style={[styles.itemValue, { color: colors.textSecondary }]}>EfficientNet-B0 CNN</Text>
                    </View>
                    <View style={[styles.itemDivider, { backgroundColor: colors.hairline }]} />
                    <View style={styles.itemRow}>
                      <Text style={[styles.itemText, { color: colors.text }]}>Trợ lý Cố vấn</Text>
                      <Text style={[styles.itemValue, { color: colors.textSecondary }]}>Gemini AI 3.5</Text>
                    </View>
                  </View>
                </View>

                {/* Footer Credits */}
                <View style={styles.footer}>
                  <Text style={[styles.footerText, { color: colors.textMuted }]}>
                    Khóa Luận Tốt Nghiệp · Ứng Dụng IoT & AI Nông Nghiệp
                  </Text>
                  <Text style={[styles.footerSub, { color: colors.textMuted }]}>
                    Phiên bản 1.2.0 · Hoạt động ngoại tuyến & Trực tuyến
                  </Text>
                </View>
              </ScrollView>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    maxHeight: '85%',
  },
  grabberContainer: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 6,
  },
  grabber: {
    width: 36,
    height: 4,
    borderRadius: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    paddingHorizontal: 20,
  },
  scrollContent: {
    paddingVertical: 10,
    gap: 20,
  },
  section: {
    gap: 8,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  segmentedContainer: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
    gap: 4,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
  },
  segmentBtnActive: {
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  segmentLabel: {
    fontSize: 13,
  },
  cardList: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 16,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 13,
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  itemText: {
    fontSize: 14,
    fontWeight: '600',
  },
  itemValue: {
    fontSize: 13,
    fontWeight: '600',
  },
  itemDivider: {
    height: 1,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 12,
    gap: 4,
  },
  footerText: {
    fontSize: 12,
    fontWeight: '600',
  },
  footerSub: {
    fontSize: 11,
  },
});

// mobile-app/components/Icon.js
import React from 'react';
import {
  Leaf,
  Sprout,
  Activity,
  LineChart,
  Clock,
  MessageSquare,
  Bot,
  User,
  ScanLine,
  Settings2,
  Settings,
  Sun,
  Moon,
  Monitor,
  Zap,
  Droplets,
  Droplet,
  Thermometer,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Eye,
  WifiOff,
  RotateCw,
  Camera,
  Image,
  X,
  Trash2,
  Send,
  ArrowUp,
  ArrowRight,
  ChevronRight,
  Info,
  Sparkles,
  HelpCircle,
} from 'lucide-react-native';

const ICON_MAP = {
  // Nav & General
  leaf: Leaf,
  sprout: Sprout,
  pulse: Activity,
  activity: Activity,
  chart: LineChart,
  history: Clock,
  chatbubble: MessageSquare,
  bot: Bot,
  user: User,
  scan: ScanLine,
  settings: Settings2,
  gear: Settings,

  // Theme & Mode
  sun: Sun,
  moon: Moon,
  monitor: Monitor,

  // Metrics
  flash: Zap,
  zap: Zap,
  water: Droplets,
  droplets: Droplets,
  droplet: Droplet,
  thermometer: Thermometer,
  temp: Thermometer,
  nitrogen: Sprout,

  // Feedback & Status
  alert: AlertCircle,
  warning: AlertTriangle,
  check: CheckCircle2,
  checkmark: CheckCircle2,
  eye: Eye,
  offline: WifiOff,
  refresh: RotateCw,

  // Actions
  camera: Camera,
  images: Image,
  image: Image,
  close: X,
  x: X,
  trash: Trash2,
  send: Send,
  'arrow-up': ArrowUp,
  'arrow-forward': ArrowRight,
  chevron: ChevronRight,
  info: Info,
  sparkles: Sparkles,
};

/**
 * Universal Icon component backed by Lucide Icons
 * Automatically handles sizing, colors, and fallbacks.
 */
export function Icon({ name, size = 20, color = '#1B4332', strokeWidth = 2, style }) {
  const Component = ICON_MAP[name?.toLowerCase()] || HelpCircle;
  return <Component size={size} color={color} strokeWidth={strokeWidth} style={style} />;
}

// mobile-app/components/Sparkline.js
import React from 'react';
import { View } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';

export function Sparkline({
  data = [],
  width = 110,
  height = 36,
  color = '#2E7D32',
  strokeWidth = 2,
}) {
  if (!Array.isArray(data) || data.length < 2) {
    return <View style={{ width, height }} />;
  }

  const valid = data.map((v) => Number(v) || 0);
  const min = Math.min(...valid);
  const max = Math.max(...valid);
  const range = max - min === 0 ? 1 : max - min;
  const padding = 3;
  const drawHeight = height - padding * 2;
  const stepX = (width - padding * 2) / (valid.length - 1);

  const points = valid.map((val, idx) => {
    const x = padding + idx * stepX;
    const y = padding + drawHeight - ((val - min) / range) * drawHeight;
    return { x, y };
  });

  // Construct SVG path
  let pathD = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    // Smooth bezier or straight lines
    const prev = points[i - 1];
    const curr = points[i];
    const cpX = (prev.x + curr.x) / 2;
    pathD += ` C ${cpX} ${prev.y}, ${cpX} ${curr.y}, ${curr.x} ${curr.y}`;
  }

  const fillD = `${pathD} L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`;

  return (
    <View style={{ width, height, overflow: 'hidden' }}>
      <Svg width={width} height={height}>
        <Defs>
          <LinearGradient id={`grad-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={color} stopOpacity="0.25" />
            <Stop offset="100%" stopColor={color} stopOpacity="0.0" />
          </LinearGradient>
        </Defs>
        <Path d={fillD} fill={`url(#grad-${color.replace('#', '')})`} />
        <Path d={pathD} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    </View>
  );
}

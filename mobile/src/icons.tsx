import React from 'react';
import Svg, { Circle, Line, Path, Polyline, Rect } from 'react-native-svg';

type P = { size?: number; color: string; strokeWidth?: number };
const base = (size: number) => ({ width: size, height: size, viewBox: '0 0 24 24', fill: 'none' as const });

export const IconHome = ({ size = 24, color, strokeWidth = 1.8 }: P) => (
  <Svg {...base(size)}><Path d="M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" stroke={color} strokeWidth={strokeWidth} strokeLinejoin="round" /></Svg>
);
export const IconChart = ({ size = 24, color, strokeWidth = 1.8 }: P) => (
  <Svg {...base(size)}>
    <Polyline points="3,17 9,11 13,15 21,6" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    <Polyline points="15,6 21,6 21,12" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);
export const IconBuilding = ({ size = 24, color, strokeWidth = 1.8 }: P) => (
  <Svg {...base(size)}>
    <Rect x="5" y="3" width="14" height="18" rx="1.5" stroke={color} strokeWidth={strokeWidth} />
    <Line x1="9" y1="8" x2="10" y2="8" stroke={color} strokeWidth={2} strokeLinecap="round" />
    <Line x1="14" y1="8" x2="15" y2="8" stroke={color} strokeWidth={2} strokeLinecap="round" />
    <Line x1="9" y1="12" x2="10" y2="12" stroke={color} strokeWidth={2} strokeLinecap="round" />
    <Line x1="14" y1="12" x2="15" y2="12" stroke={color} strokeWidth={2} strokeLinecap="round" />
    <Path d="M10 21v-4h4v4" stroke={color} strokeWidth={strokeWidth} />
  </Svg>
);
export const IconGrid = ({ size = 24, color, strokeWidth = 1.8 }: P) => (
  <Svg {...base(size)}>
    {[[4, 4], [14, 4], [4, 14], [14, 14]].map(([x, y]) => <Rect key={`${x}${y}`} x={x} y={y} width="6" height="6" rx="1.5" stroke={color} strokeWidth={strokeWidth} />)}
  </Svg>
);
export const IconUser = ({ size = 24, color, strokeWidth = 1.8 }: P) => (
  <Svg {...base(size)}>
    <Circle cx="12" cy="8" r="4" stroke={color} strokeWidth={strokeWidth} />
    <Path d="M4 21c0-4 3.6-6 8-6s8 2 8 6" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
  </Svg>
);
export const IconChevron = ({ size = 18, color }: P) => (
  <Svg {...base(size)}><Polyline points="9,6 15,12 9,18" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" /></Svg>
);
export const IconSearch = ({ size = 20, color }: P) => (
  <Svg {...base(size)}>
    <Circle cx="11" cy="11" r="6.5" stroke={color} strokeWidth={2} />
    <Line x1="16" y1="16" x2="21" y2="21" stroke={color} strokeWidth={2} strokeLinecap="round" />
  </Svg>
);

const CLOUD = 'M7 18a4 4 0 1 1 .9-7.9A5 5 0 0 1 17.5 11 3.5 3.5 0 0 1 17 18z';
export function WeatherIcon({ code, size = 28, color, accent }: { code: string; size?: number; color: string; accent: string }) {
  if (code === 'clear')
    return (
      <Svg {...base(size)}>
        <Circle cx="12" cy="12" r="4.5" fill={accent} />
        {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => {
          const r = (a * Math.PI) / 180;
          return <Line key={a} x1={12 + Math.cos(r) * 7.5} y1={12 + Math.sin(r) * 7.5} x2={12 + Math.cos(r) * 10} y2={12 + Math.sin(r) * 10} stroke={accent} strokeWidth={1.8} strokeLinecap="round" />;
        })}
      </Svg>
    );
  return (
    <Svg {...base(size)}>
      <Path d={CLOUD} fill={color} opacity={0.9} />
      {code === 'rain' && [8, 12, 16].map((x) => <Line key={x} x1={x} y1="19.5" x2={x - 1.2} y2="22.5" stroke={accent} strokeWidth={1.8} strokeLinecap="round" />)}
    </Svg>
  );
}

import React, { createContext, useContext } from 'react';
import { useColorScheme } from 'react-native';

// frontend/src/theme/tokens.ts dagi `ds` qiymatlari (kunduzgi) va tungi juftlari
const light = {
  brand: '#1F2937', onBrand: '#FFFFFF', onBrandMuted: '#D1D5DB',
  primary: '#155EEF', primarySoft: '#EBF2FE', accent: '#F0A14A', accentStrong: '#D97706',
  bg: '#F3F5F9', surface: '#FFFFFF', border: '#E6E9F0', text: '#172B4D', textMuted: '#667085',
  success: '#0B7A63', successBg: '#E3F4EF', warning: '#8A5300', warningBg: '#FDF1DC',
  danger: '#C0343F', dangerBg: '#FBE7E9', info: '#0A5FB4', infoBg: '#EBF2FE',
};
const dark: typeof light = {
  brand: '#111827', onBrand: '#FFFFFF', onBrandMuted: '#9CA3AF',
  primary: '#5B8DEF', primarySoft: '#1B2A4A', accent: '#F0A14A', accentStrong: '#F59E0B',
  bg: '#0B1220', surface: '#151E30', border: '#26324A', text: '#E6EAF2', textMuted: '#9AA6BD',
  success: '#34C3A0', successBg: '#12332C', warning: '#F2B45C', warningBg: '#3A2A10',
  danger: '#F07C85', dangerBg: '#40181C', info: '#7DB4F0', infoBg: '#14263F',
};

export type Colors = typeof light;
const Ctx = createContext<Colors>(light);
export const useColors = () => useContext(Ctx);
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const scheme = useColorScheme();
  return <Ctx.Provider value={scheme === 'dark' ? dark : light}>{children}</Ctx.Provider>;
}
export const space = (n: number) => n * 4;
export const radius = { sm: 8, md: 16, pill: 999 };

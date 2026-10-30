import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ROOT } from './data';

const KEY = 'mystat.region';
const Ctx = createContext<{ soato: string; setSoato: (s: string) => void }>({ soato: ROOT, setSoato: () => {} });
export const useRegion = () => useContext(Ctx);

export function RegionProvider({ children }: { children: React.ReactNode }) {
  const [soato, set] = useState(ROOT);
  useEffect(() => {
    AsyncStorage.getItem(KEY).then((v) => v && set(v)).catch(() => {});
  }, []);
  const setSoato = (s: string) => {
    set(s);
    AsyncStorage.setItem(KEY, s).catch(() => {});
  };
  return <Ctx.Provider value={{ soato, setSoato }}>{children}</Ctx.Provider>;
}

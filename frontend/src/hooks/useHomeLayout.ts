import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  DEFAULT_LAYOUT, MAX_CARDS, MIN_CARDS, isRegionCode, loadStoredLayout, normalizeLayout, storeLayout,
  type HomeCardKey, type HomeLayout, type WidgetKey,
} from "../config/homeWidgets";

/**
 * Bosh sahifa vidjetlari holati. Ustuvorlik: URL `?r=` (hudud) > brauzerda saqlangan sozlama > standart.
 * Har o'zgarish 300 ms debounce bilan `localStorage` ga yoziladi (xotira yopiq bo'lsa jim o'tadi).
 */
export function useHomeLayout() {
  const [params, setParams] = useSearchParams();
  const [stored, setStored] = useState<HomeLayout>(() => loadStoredLayout());
  const urlRegion = params.get("r");
  const layout = useMemo<HomeLayout>(() => (isRegionCode(urlRegion) ? { ...stored, region: urlRegion } : stored), [stored, urlRegion]);

  const timer = useRef<number>();
  useEffect(() => {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => storeLayout(stored), 300);
    return () => window.clearTimeout(timer.current);
  }, [stored]);

  const update = useCallback((fn: (l: HomeLayout) => HomeLayout) => setStored((prev) => normalizeLayout(fn(prev))), []);

  const setRegion = useCallback((region: string) => {
    setParams((prev) => {
      const next = new URLSearchParams(prev);
      if (region === DEFAULT_LAYOUT.region) next.delete("r");
      else next.set("r", region);
      return next;
    }, { replace: true });
    update((l) => ({ ...l, region }));
  }, [setParams, update]);

  const enabledCards = layout.cards.filter((c) => c.enabled).length;

  const toggleWidget = useCallback((key: WidgetKey) => update((l) => ({ ...l, widgets: l.widgets.map((w) => (w.key === key ? { ...w, enabled: !w.enabled } : w)) })), [update]);
  const toggleCard = useCallback((key: HomeCardKey) => update((l) => {
    const on = l.cards.filter((c) => c.enabled).length;
    return {
      ...l,
      cards: l.cards.map((c) => {
        if (c.key !== key) return c;
        if (c.enabled && on <= MIN_CARDS) return c; // kamida 4 ta ko'rinib turadi
        if (!c.enabled && on >= MAX_CARDS) return c;
        return { ...c, enabled: !c.enabled };
      }),
    };
  }), [update]);
  const moveCard = useCallback((key: HomeCardKey, dir: -1 | 1) => update((l) => {
    const i = l.cards.findIndex((c) => c.key === key);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= l.cards.length) return l;
    const cards = [...l.cards];
    [cards[i], cards[j]] = [cards[j], cards[i]];
    return { ...l, cards };
  }), [update]);
  const moveWidget = useCallback((key: WidgetKey, dir: -1 | 1) => update((l) => {
    const i = l.widgets.findIndex((w) => w.key === key);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= l.widgets.length) return l;
    const widgets = [...l.widgets];
    [widgets[i], widgets[j]] = [widgets[j], widgets[i]];
    return { ...l, widgets };
  }), [update]);
  const setMapIndicator = useCallback((indicator: HomeCardKey) => update((l) => ({ ...l, map: { indicator } })), [update]);
  const setForecast = useCallback((forecast: boolean) => update((l) => ({ ...l, weather: { forecast } })), [update]);
  const reset = useCallback(() => {
    setStored(DEFAULT_LAYOUT);
    setParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete("r");
      return next;
    }, { replace: true });
  }, [setParams]);

  const restore = useCallback((l: HomeLayout) => {
    setStored(l);
    setParams((prev) => {
      const next = new URLSearchParams(prev);
      if (l.region === DEFAULT_LAYOUT.region) next.delete("r");
      else next.set("r", l.region);
      return next;
    }, { replace: true });
  }, [setParams]);

  return { layout, enabledCards, restore, setRegion, toggleWidget, toggleCard, moveCard, moveWidget, setMapIndicator, setForecast, reset };
}

export type HomeLayoutApi = ReturnType<typeof useHomeLayout>;

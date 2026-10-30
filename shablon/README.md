# Dizayn shabloni (React + Tailwind)

`mystat` loyihasining dizaynidan ajratib olingan mustaqil shablon: tokenlar, tungi rejim, maxsus imkoniyatlar, qobiq (chap panel, ustki panel, footer) va asosiy komponentlar. Backend, API va routerga bog'liq emas.

## Ishga tushirish

```bash
cd shablon
npm install
npm run dev      # http://localhost:5173
npm run build    # tsc + vite build
```

## Tuzilma

| Joy | Nima |
|---|---|
| `src/theme/tokens.css` | Barcha ranglar, radius, soya (`--ds-*`), kunduzgi va tungi (`.dark`) |
| `src/theme/a11y.css` | Yuqori kontrast, rangsiz va animatsiyasiz rejimlar (`<html data-*>`) |
| `src/index.css` | `--mg-*` nomlari `--ds-*` ga ulanadi (Tailwind `bg-mg-surface` kabi sinflar shu orqali) |
| `tailwind.config.js` | `mg-*` ranglar, `rounded-mg`, soyalar, Inter shrifti |
| `src/components/layout/` | `Shell` (qobiq), `Sidebar`, `Header`, `Footer`, `AccessibilityMenu`, `nav.ts` (menyu ro'yxati) |
| `src/components/ui/` | `SectionHeader`, `ActionCard`, `ServiceCard`, `StatCard`, `PageHeader`, `EmptyState`, `ExternalLink` |
| `src/App.tsx` | Namunaviy bosh sahifa |

## O'zingizga moslash

1. **Rang**: faqat `src/theme/tokens.css` dagi `--ds-primary`, `--ds-brand`, `--ds-accent` va panel ranglarini (`--ds-panel*`) o'zgartiring. Komponentlar hech qayerda `#hex` ishlatmaydi.
2. **Menyu va footer**: `src/components/layout/nav.ts` ni tahrirlang, chap panel va footerning birinchi ikki ustuni shundan quriladi.
3. **Logo va nomlar**: `src/components/Logo.tsx`, `Header.tsx`, `Footer.tsx` dagi "Loyiha nomi", "Tashkilot nomi" matnlari.
4. **Router**: havolalar oddiy `<a href>`. `react-router-dom` ulasangiz, `<a>` ni `<Link>` ga almashtiring (Sidebar, Header, Footer, ActionCard, ServiceCard, SectionHeader).

## Qoidalar (dizayn tizimidan)

- Matn uslubi qisqa va rasmiy; tugma matni fe'l ("Kalendarni ochish"), menyu bandi ot.
- Har bo'lim `SectionHeader` bilan, "Barcha ..." havolasi manzilini aytadi ("Batafsil" emas).
- Faqat ikonkali tugmada `aria-label` majburiy.
- Raqamlarda `tabular-nums`, har ko'rsatkichda manba va davr.
- Karusel yo'q; yuklanayotgan raqam o'rnida "0" ko'rsatilmaydi.

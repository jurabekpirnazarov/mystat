import { Bell, LogIn, Menu, Phone, Search } from "lucide-react";
import { LogoMark } from "../Logo";
import AccessibilityMenu from "./AccessibilityMenu";

/** Ustki panel: portal nomi, qidiruv, aloqa, maxsus imkoniyatlar va kirish tugmasi (matnli). */
export default function Header({ onOpenMenu }: { onOpenMenu: () => void }) {
  return (
    <header className="sticky top-3 z-30 mb-4 mt-3 flex items-center justify-between gap-3 rounded-mg border border-[rgb(var(--ds-panel-line))] bg-[rgb(var(--ds-panel))] px-3 py-2 md:px-4">
      <div className="flex min-w-0 items-center gap-3">
        <button type="button" onClick={onOpenMenu} aria-label="Menyuni ochish" className="rounded-lg p-1.5 text-mg-primary hover:bg-mg-surface/70 lg:hidden">
          <Menu className="h-7 w-7" aria-hidden="true" />
        </button>
        <span className="lg:hidden"><LogoMark size={40} /></span>
        <span className="hidden whitespace-nowrap leading-tight sm:block">
          <span className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-[rgb(var(--ds-on-panel-muted))]">Tashkilot nomi</span>
          <span className="block text-[15px] font-semibold text-[rgb(var(--ds-on-panel))]">Yagona onlayn portal</span>
        </span>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <div className="flex h-12 items-center gap-1 rounded-full border border-mg-border bg-mg-surface px-1.5">
          <button type="button" aria-label="Qidiruv" className="flex h-9 w-9 items-center justify-center rounded-full text-mg-primary hover:bg-mg-info">
            <Search className="h-5 w-5" aria-hidden="true" />
          </button>
          <a href="tel:+998712000000" className="hidden items-center gap-2 rounded-full py-1 pl-1 pr-2 hover:bg-mg-info md:flex">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-mg-primary/10 text-mg-primary"><Phone className="h-[18px] w-[18px]" aria-hidden="true" /></span>
            <span className="whitespace-nowrap text-sm font-bold text-mg-heading">71 200-00-00</span>
          </a>
          <AccessibilityMenu />
        </div>
        <button type="button" aria-label="Xabarnomalar" className="flex h-12 w-12 items-center justify-center rounded-full border border-mg-border bg-mg-surface text-mg-primary hover:bg-mg-info">
          <Bell className="h-5 w-5" aria-hidden="true" />
        </button>
        <a href="#" className="flex h-12 items-center gap-3 rounded-full bg-mg-primary py-2 pl-2 pr-5 text-[15px] font-semibold text-[rgb(var(--ds-on-primary))] shadow-mg-btn hover:bg-mg-primary-dark">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20"><LogIn className="h-4 w-4" aria-hidden="true" /></span>
          Kirish
        </a>
      </div>
    </header>
  );
}

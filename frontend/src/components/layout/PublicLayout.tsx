import { useState, type ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import { useLang } from "../../i18n/LangContext";
import { UI } from "../../i18n/ui";
import FloatingSupport from "../FloatingSupport";
import Breadcrumbs from "./Breadcrumbs";
import PageFeedback from "./PageFeedback";
import PublicFooter from "./PublicFooter";
import { MainNav, MobileMenu, PublicHeader, TopBar } from "./PublicShell";
import TypoReporter from "./TypoReporter";

/**
 * UI_QAYTA_TUZISH.md 4.2: ommaviy qobiq v2 (lex.uz andozasi): SkipLink → test rejimi → TopBar → PublicHeader → MainNav →
 * breadcrumb → <main> (1200 px) → fikr vidjeti → ixcham footer. Kabinet (`/cabinet`) o'zining qobig'ida qoladi.
 * `data-density="list"` (LX-13): ro'yxat va jadvallar zichroq.
 */
export default function PublicLayout({ children }: { children: ReactNode }) {
  const { t } = useLang();
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <div className="min-h-screen overflow-x-clip bg-mg-bg text-mg-text transition-colors duration-300" data-density="list">
      <a href="#main-content" className="skip-link">{t(UI.skip)}</a>
      <p className="flex items-center justify-center gap-2 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
        <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />{t(UI.testMode)}
      </p>
      <TopBar />
      <PublicHeader onOpenMenu={() => setMenuOpen(true)} />
      <MainNav />
      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
      <div className="mx-auto w-full max-w-[1600px] px-4 pt-4 sm:px-6">
        <Breadcrumbs />
        <main id="main-content" tabIndex={-1} className="min-h-[70vh] focus:outline-none">{children}</main>
        <PageFeedback />
      </div>
      <PublicFooter />
      <TypoReporter />
      <FloatingSupport />
    </div>
  );
}

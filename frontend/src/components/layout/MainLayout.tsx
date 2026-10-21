import { useState, type ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import { useLang } from "../../i18n/LangContext";
import { UI } from "../../i18n/ui";
import FloatingSupport from "../FloatingSupport";
import Breadcrumbs from "./Breadcrumbs";
import Footer from "./Footer";
import Header from "./Header";
import PageFeedback from "./PageFeedback";
import { DesktopSidebar, MobileSidebar } from "./Sidebar";
import TypoReporter from "./TypoReporter";

/**
 * MG-02: umumiy layout (my.gov.uz tuzilishi, MG-00): SkipLink → chap sidebar → [test rejimi] → Header → breadcrumb →
 * <main> → oxirgi o'zgarish sanasi va fikr vidjeti → Footer. Kabinet ham shu layout ichida (MG-12).
 * Kontent sidebar'dan o'ngda: 22px chekka + 85px sidebar, ichki bo'shliq 30px (1280 da kontent x=137, my.gov.uz bilan bir xil).
 */
export default function MainLayout({ children }: { children: ReactNode }) {
  const { t } = useLang();
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <div className="min-h-screen bg-mg-bg text-mg-text transition-colors duration-300">
      <a href="#main-content" className="skip-link">{t(UI.skip)}</a>
      <DesktopSidebar />
      <MobileSidebar open={menuOpen} onClose={() => setMenuOpen(false)} />
      <div className="lg:pl-[107px]">
        <div className="mx-auto w-full max-w-[1400px] px-4 sm:px-6 lg:px-[30px]">
          <Header onOpenMenu={() => setMenuOpen(true)} />
          <p className="mb-4 flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
            <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
            {t(UI.testMode)}
          </p>
          <Breadcrumbs />
          {/* min-h: sahifa yuklanguncha footer ko'rinmaydi — keyin pastga "sakramaydi" (CLS) */}
          <main id="main-content" tabIndex={-1} className="min-h-[70vh] focus:outline-none">
            {children}
          </main>
          <PageFeedback />
          <Footer />
        </div>
      </div>
      <TypoReporter />
      <FloatingSupport />
    </div>
  );
}

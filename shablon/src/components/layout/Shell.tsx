import { useState, type ReactNode } from "react";
import Footer from "./Footer";
import Header from "./Header";
import { DesktopSidebar, MobileSidebar } from "./Sidebar";

/** Umumiy qobiq: skip-link → chap panel → ustki panel → <main> → footer. Kontent panel o'ngida (lg:pl-[290px]). */
export default function Shell({ children, activeHref }: { children: ReactNode; activeHref?: string }) {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <div className="min-h-screen bg-mg-bg text-mg-text transition-colors duration-300">
      <a href="#main-content" className="skip-link">Asosiy kontentga o'tish</a>
      <DesktopSidebar activeHref={activeHref} />
      <MobileSidebar open={menuOpen} onClose={() => setMenuOpen(false)} activeHref={activeHref} />
      <div className="lg:pl-[290px]">
        <div className="mx-auto w-full max-w-[1400px] px-4 sm:px-6 lg:px-[30px]">
          <Header onOpenMenu={() => setMenuOpen(true)} />
          <main id="main-content" tabIndex={-1} className="min-h-[70vh] focus:outline-none">{children}</main>
          <Footer />
        </div>
      </div>
    </div>
  );
}

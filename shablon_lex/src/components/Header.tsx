import { Eye, Globe, Menu, User } from "lucide-react";
import { useState } from "react";

/** lex.uz tuzilishi: ingichka ko'k chiziq → logo + tagline + til → katta qalin ko'k menyu va "Kirish" tugmasi. */
const NAV = ["Ko'rsatkichlar", "Xizmatlar", "Nashrlar", "Ma'lumotnomalar", "Tushuntirishlar"];

function Mark() {
  return (
    <svg width="52" height="40" viewBox="0 0 52 40" aria-hidden="true">
      <path d="M0 6h40l-6 28H4z" fill="#0C57A6" />
      <rect x="9" y="22" width="5" height="8" fill="#fff" />
      <rect x="17" y="16" width="5" height="14" fill="#fff" />
      <rect x="25" y="10" width="5" height="20" fill="#fff" />
    </svg>
  );
}

export default function Header() {
  const [open, setOpen] = useState(false);
  return (
    <header className="border-b border-lx-line shadow-[0_1px_4px_rgba(0,0,0,.06)]">
      <div className="bg-lx-blue text-white">
        <div className="mx-auto flex h-[30px] max-w-[1296px] items-center justify-between px-4 text-sm">
          <a href="#" className="inline-flex items-center gap-1.5 hover:underline"><Globe className="h-3.5 w-3.5" aria-hidden="true" />ai.stat.uz</a>
          <span>@statuz_xabar</span>
        </div>
      </div>
      <div className="mx-auto flex max-w-[1296px] items-center justify-between gap-4 px-4 py-5">
        <a href="#" className="flex items-center gap-3" aria-label="Bosh sahifa">
          <Mark />
          <span className="text-[15px] font-bold uppercase leading-tight text-lx-blue">
            O'zbekiston Respublikasi<br />statistika ma'lumotlari milliy bazasi
          </span>
        </a>
        <div className="flex items-center gap-3">
          <button type="button" aria-label="Maxsus imkoniyatlar" className="rounded-lx p-2 text-lx-blue hover:bg-lx-blue-soft"><Eye className="h-5 w-5" aria-hidden="true" /></button>
          <button type="button" className="rounded-lx px-2 py-1 text-[15px] font-semibold text-lx-blue hover:bg-lx-blue-soft" aria-label="Til: O'zbekcha">O'ZB ▾</button>
          <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} aria-label="Menyu" className="rounded-lx p-2 text-lx-blue hover:bg-lx-blue-soft lg:hidden">
            <Menu className="h-6 w-6" aria-hidden="true" />
          </button>
        </div>
      </div>
      <div className="mx-auto max-w-[1296px] px-4">
        <nav aria-label="Asosiy menyu" className={`${open ? "block" : "hidden"} lg:flex lg:items-center lg:justify-between`}>
          <ul className="flex flex-col lg:flex-row lg:gap-2">
            {NAV.map((n) => (
              <li key={n}>
                <a href="#" className="block py-3 pr-6 text-[16px] font-bold uppercase tracking-wide text-lx-blue hover:text-lx-blue-dark lg:px-5 lg:py-6 lg:text-[17px]">{n}</a>
              </li>
            ))}
          </ul>
          <a href="#" className="mb-4 inline-flex items-center gap-2 rounded-lx bg-lx-blue px-12 py-4 text-base text-white hover:bg-lx-blue-dark lg:mb-0">
            <User className="h-4 w-4" aria-hidden="true" />Kirish
          </a>
        </nav>
      </div>
    </header>
  );
}

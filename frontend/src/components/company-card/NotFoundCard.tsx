import { Link } from "react-router-dom";
import { ArrowRight, BookOpen, SearchX } from "lucide-react";

/**
 * Kontragent kartasi: STIR statistik manbalarda yo'q (backend 404). Ilgari faqat "Korxona topilmadi" chiqardi —
 * foydalanuvchi sababini va keyingi qadamni bilmasdi. Karta faqat KTUT (~65 ming hisobot topshiruvchi) va sanoat
 * reyestriga tayanadi (`apps/analytics/company_card.py`), to'liq davlat reyestri — pullik #101 xizmatida.
 */
export default function NotFoundCard({ stir, onSearchByName }: { stir: string; onSearchByName: () => void }) {
  return (
    <div className="rounded-mg border border-mg-border bg-mg-surface p-6 md:p-8">
      <div className="flex items-start gap-4">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-900/40">
          <SearchX className="h-6 w-6" aria-hidden="true" />
        </span>
        <div>
          <h2 className="text-lg font-semibold text-mg-heading">STIR {stir} statistik manbalarda topilmadi</h2>
          <p className="mt-1 max-w-3xl text-sm leading-relaxed text-mg-text">
            Kontragent kartasi ikki rasmiy statistik manbadan tuziladi: <b>statistik hisobot topshiruvchilar ro'yxati</b> (KTUT,
            taxminan 65 ming korxona) va <b>sanoat mahsulotlari ishlab chiqaruvchilari reyestri</b>. Bu STIR ularning hech birida yo'q.
          </p>
          <p className="mt-4 text-sm font-semibold text-mg-heading">Mumkin sabablar</p>
          <ul className="mt-1 list-disc space-y-0.5 pl-5 text-sm text-mg-text">
            <li>korxona yaqinda ro'yxatdan o'tgan va hali statistik hisobot topshirmagan;</li>
            <li>korxona statistik kuzatuvga kirmaydi (masalan, kichik korxona yoki yakka tartibdagi tadbirkor);</li>
            <li>STIR xato terilgan — raqamlarni tekshiring yoki nom bo'yicha qidiring.</li>
          </ul>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link to="/orginfo" className="inline-flex items-center gap-2 rounded-mg bg-mg-primary px-4 py-2 text-sm font-medium text-white hover:brightness-110">
              To'liq davlat reyestridan ma'lumot <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <button type="button" onClick={onSearchByName}
              className="inline-flex items-center gap-2 rounded-mg border border-mg-border px-4 py-2 text-sm font-medium text-mg-heading hover:bg-mg-info">
              Nom bo'yicha qidirish
            </button>
            <Link to="/methodology/company-card" className="inline-flex items-center gap-2 rounded-mg px-3 py-2 text-sm text-mg-muted hover:text-mg-primary">
              <BookOpen className="h-4 w-4" aria-hidden="true" />Manbalar va cheklovlar
            </Link>
          </div>
          <p className="mt-3 text-xs text-mg-muted">
            "Korxona to'g'risida ma'lumot" (#101) — STIR bo'yicha to'liq reyestr, tarif paketi limitidan.
          </p>
        </div>
      </div>
    </div>
  );
}

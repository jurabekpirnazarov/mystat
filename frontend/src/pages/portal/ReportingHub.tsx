import { Link } from "react-router-dom";
import { BadgeCheck, CalendarDays, ClipboardList, FileText, HelpCircle, ScrollText } from "lucide-react";
import { PageHeader } from "../../components/ui";

/** HT-09: hisobot topshiruvchilar uchun yagona kirish sahifasi. Eski manzillar o'z joyida qoladi. */
const TILES = [
  { to: "/report-calendar", icon: CalendarDays, title: "Hisobot kalendari", text: "STIR bo'yicha majburiy shakllar va ularning muddatlari." },
  { to: "/cabinet?tab=reports", icon: ClipboardList, title: "Hisobotlarim", text: "Davrlar, muddatlar, eslatmalar va kalendarga ulash (kirish kerak)." },
  { to: "/reglaments", icon: ScrollText, title: "Reglamentlar", text: "Hisobot shakllari va topshirish tartibi bo'yicha reglamentlar." },
  { to: "/stat-codes", icon: FileText, title: "Statistik kodlar ma'lumotnomasi", text: "Korxonaning statistik kodlari va hisobotlari, QR bilan tekshiriladigan PDF." },
  { to: "/check", icon: BadgeCheck, title: "Korxonani tekshirish", text: "STIR bo'yicha ochiq ma'lumotlar va majburiy hisobotlar." },
  { to: "/questions", icon: HelpCircle, title: "Savol-javob", text: "Hisobot topshirish bo'yicha tez-tez beriladigan savollar." },
];

export default function ReportingHub() {
  return (
    <div className="mx-auto max-w-5xl p-4 sm:p-6">
      <PageHeader title="Hisobot topshiruvchilarga" description="Muddatlar, shakllar, reglamentlar va ma'lumotnomalar bir joyda." />
      <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {TILES.map(({ to, icon: Icon, title, text }) => (
          <li key={to}>
            <Link to={to} className="flex h-full flex-col gap-2 rounded-lg border border-gray-200 p-4 hover:border-blue-400 dark:border-gray-700">
              <Icon className="h-5 w-5 text-blue-600" aria-hidden />
              <span className="font-semibold text-gray-900 dark:text-white">{title}</span>
              <span className="text-sm text-gray-600 dark:text-gray-300">{text}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

import { Link } from "react-router-dom";
import { BarChart3, Calculator, CalendarCheck, Code2, Database, Globe2, Search, Users } from "lucide-react";

const BUSINESS = [
  { to: "/tariffs", icon: Calculator, title: "Tariflar va narx kalkulyatori", text: "Paketlarni taqqoslang, tarmog'ingiz bo'yicha narx." },
  { to: "/market-report", icon: Globe2, title: "Bozor tahlili", text: "Mahsulot (HS kodi) bo'yicha eksport, import va hamkorlar." },
  { to: "/partners", icon: Search, title: "Hamkor va raqobatchilar", text: "Korxonalarni hudud va faoliyat bo'yicha toping." },
  { to: "/cabinet", state: { name: "benchmark" }, icon: BarChart3, title: "Tarmoq benchmarki", text: "Ko'rsatkichlaringizni tarmoq bilan solishtiring." },
  { to: "/cabinet", state: { name: "custom" }, icon: Database, title: "Individual ma'lumot", text: "Katalogda yo'q ma'lumotni buyurtma qiling." },
  { to: "/consultation", icon: CalendarCheck, title: "Konsultatsiya", text: "Statistika mutaxassisi bilan uchrashuv." },
];
const CITIZEN = [
  { to: "/citizens", icon: Users, title: "Fuqarolar uchun", text: "Hududim, inflyatsiya, maosh, narxlar — bepul." },
  { to: "/developers", icon: Code2, title: "Ochiq ma'lumotlar API", text: "Tadqiqotchi va dasturchilar uchun." },
];

/** "Barcha xizmatlar" sahifasidagi yangi xizmatlar bloki (K, FQ, A bosqichlari). */
export default function NewServices() {
  const card = "group rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 hover:border-blue-300 flex gap-3";
  return (
    <section className="mb-10" aria-labelledby="new-services">
      <h2 id="new-services" className="text-xl font-bold text-gray-900 dark:text-white mb-4">Yangi xizmatlar</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {[...BUSINESS, ...CITIZEN].map((s) => (
          <Link key={s.title} to={s.to} state={"state" in s ? s.state : undefined} className={card}>
            <s.icon className="w-6 h-6 text-blue-600 shrink-0" aria-hidden="true" />
            <span>
              <span className="block font-semibold text-sm text-gray-900 dark:text-white group-hover:text-blue-700 dark:group-hover:text-blue-300">{s.title}</span>
              <span className="block text-xs text-gray-600 dark:text-gray-300">{s.text}</span>
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

import { Link } from "react-router-dom";
import { BookOpen, Calculator, Code2, HelpCircle, MapPin, ShoppingBasket, Users, Vote, Wallet } from "lucide-react";
import { PageHeader } from "../../components/ui";

const ITEMS = [
  { to: "/regions", icon: MapPin, title: "Mening hududim", text: "Viloyat va tumaningiz ko'rsatkichlari, xarita va infografika." },
  { to: "/cpi-calculator", icon: Calculator, title: "Inflyatsiya kalkulyatori", text: "Maosh, ijara va omonat foizini inflyatsiya bilan solishtiring." },
  { to: "/my-salary", icon: Wallet, title: "Mening maoshim", text: "Maoshingiz hudud va tarmoqdagi xodimlar orasida qayerda?" },
  { to: "/prices", icon: ShoppingBasket, title: "Narxlar", text: "Asosiy mahsulotlar narxi va o'z savatingiz qiymati." },
  { to: "/learn", icon: BookOpen, title: "Statistika oddiy tilda", text: "Qisqa maqolalar va atamalar lug'ati." },
  { to: "/surveys", icon: Vote, title: "So'rovnomalar", text: "Qatnashing va natijalarni ko'ring." },
  { to: "/names", icon: Users, title: "Ismlar", text: "Ismingiz qanchalik ommabop?" },
  { to: "/answers", icon: HelpCircle, title: "Savol bering", text: "Statistik savolingizga xodim javob beradi." },
  { to: "/developers", icon: Code2, title: "Ochiq ma'lumotlar API", text: "Tadqiqotchi va dasturchilar uchun." },
];

/** FQ: "Fuqarolar uchun" bo'limi — barcha bepul xizmatlar. */
export default function CitizensHub() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <PageHeader title="Fuqarolar uchun" description="Bepul xizmatlar: raqamlar shaxsiy hayotingizga bog'lab, sodda tilda." breadcrumbs={[{ label: "Bosh sahifa", to: "/" }, { label: "Fuqarolar uchun" }]} />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {ITEMS.map(({ to, icon: Icon, title, text }) => (
            <Link key={to} to={to} className="group rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 hover:border-blue-300 hover:shadow-sm">
              <Icon className="w-7 h-7 text-blue-600 mb-3" aria-hidden="true" />
              <h2 className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-700 dark:group-hover:text-blue-300">{title}</h2>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">{text}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

import { Link } from "react-router-dom";
import { Code2, ExternalLink, KeyRound } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { PageHeader } from "../components/ui";
import { loginUrl } from "../utils/loginRedirect";

const ENDPOINTS = [
  ["GET /api/open/v1/cpi/", "Iste'mol narxlari indeksi: oylik va zanjirli", "real"],
  ["GET /api/open/v1/trade/summary/?year=2025&flow=export&group=country|hs2", "Tashqi savdo agregatlari (ming AQSh $)", "real"],
  ["GET /api/open/v1/reports/forms/", "Statistik hisobot shakllari va muddatlari", "real"],
  ["GET /api/open/v1/regions/indicators/?indicator=avg_salary&year=2025&period=Y", "Hududiy ko'rsatkichlar", "namuna"],
  ["GET /api/open/v1/classifications/", "Statistik klassifikatorlar", "namuna"],
  ["GET /api/open/v1/demographics/aholi_soni/?group_by=Yil,Hudud", "Demografiya bo'limlari agregati", "real/namuna"],
];

/** FQ-01: dasturchilar va tadqiqotchilar uchun ochiq API hujjati. */
export default function Developers() {
  const { isAuthenticated } = useAuth();
  return (
    <div className="py-2">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <PageHeader title="Ochiq ma'lumotlar API" description="Tadqiqotchi, jurnalist va dasturchilar uchun: statistik ko'rsatkichlarni JSON yoki CSV ko'rinishida oling."
          breadcrumbs={[{ label: "Fuqarolar uchun", to: "/citizens" }, { label: "Dasturchilar" }]}
          actions={<a href="/api/open/docs/" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm">Swagger hujjati <ExternalLink className="w-4 h-4" /></a>} />
        <section className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 space-y-3">
          <h2 className="font-semibold flex items-center gap-2"><KeyRound className="w-5 h-5 text-blue-600" /> 1. Kalit oling</h2>
          <p className="text-sm text-gray-700 dark:text-gray-300">Kalit kabinetda yaratiladi va faqat bir marta ko'rsatiladi. Kunlik limit — 1000 so'rov; limitdan oshganda 429 javobi qaytadi.</p>
          {isAuthenticated ? <Link to="/cabinet" state={{ name: "api-keys" }} className="inline-block px-3 py-2 rounded-lg bg-blue-600 text-white text-sm">API kalitlarim →</Link>
            : <Link to={loginUrl()} className="inline-block px-3 py-2 rounded-lg bg-blue-600 text-white text-sm">Kirish (login yoki OneID)</Link>}
        </section>
        <section className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 space-y-3">
          <h2 className="font-semibold flex items-center gap-2"><Code2 className="w-5 h-5 text-blue-600" /> 2. So'rov yuboring</h2>
          <pre className="overflow-x-auto rounded-lg bg-gray-900 text-gray-100 p-4 text-xs"><code>{`curl -H "X-API-Key: ms_...sizning_kalitingiz" \\
  "https://my.stat.uz/api/open/v1/cpi/?format=csv&limit=100" -o cpi.csv

# Python
import requests
r = requests.get("https://my.stat.uz/api/open/v1/trade/summary/",
                 params={"year": 2025, "flow": "export", "group": "hs2"},
                 headers={"X-API-Key": "ms_..."})
print(r.json()["results"][:5])`}</code></pre>
          <p className="text-xs text-gray-500">Sahifalash: <code>limit</code> (≤1000) va <code>offset</code>. CSV fayllar UTF-8 BOM bilan — Excel'da to'g'ri ochiladi. Namuna ma'lumotli jadvallarda <code>source: "synthetic"</code> va fayl nomi <code>_NAMUNA</code> bilan tugaydi.</p>
        </section>
        <section className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead><tr className="text-left text-xs text-gray-500"><th className="px-4 py-2">Endpoint</th><th className="px-2">Tavsif</th><th className="px-2">Manba</th></tr></thead>
            <tbody>{ENDPOINTS.map(([e, d, s]) => <tr key={e} className="border-t border-gray-100 dark:border-gray-700"><td className="px-4 py-2"><code className="text-xs">{e}</code></td><td className="px-2">{d}</td><td className="px-2 text-xs">{s}</td></tr>)}</tbody>
          </table>
        </section>
      </div>
    </div>
  );
}

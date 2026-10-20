import { useEffect } from "react";
import { Link } from "react-router-dom";
import { PageHeader } from "../../components/ui";

/**
 * IHAMKOR_MUQOBIL.md IH-12: kontragent kartasi metodologiyasi — har blok qaysi manbadan, qamrovi va cheklovlari.
 * Raqamlar 2026-10-20 dagi bazaga asoslangan (IHAMKOR_MUQOBIL 0-bo'lim); manba o'zgarsa shu sahifa yangilanadi.
 */
const BLOCKS: { title: string; source: string; coverage: string; notes: string[] }[] = [
  {
    title: "Pasport",
    source: "KTUT (statistik hisobot topshiruvchilar ro'yxati): STIR, OKPO, nom. Sanoat mahsulotlari ishlab chiqaruvchilari reyestri: tuman va manzil.",
    coverage: "Rekvizitlar ~65 ming korxona; hudud va manzil ~39 ming ishlab chiqaruvchi korxona uchun.",
    notes: [
      "Tashkiliy-huquqiy shakl korxona nomidan aniqlanadi.",
      "Faoliyat holati, ro'yxatdan o'tgan sana va OKED portal manbalarida yo'q — kartada \"Manbada yo'q\" deb ko'rsatiladi, taxmin qilinmaydi.",
    ],
  },
  {
    title: "Xulosa belgilari",
    source: "Pastdagi bloklardan avtomatik.",
    coverage: "Faqat ma'lumoti bor belgilar chiqadi.",
    notes: [
      "\"Ommaviy manzil\" — sanoat reyestrida aynan shu manzilda 10 va undan ko'p boshqa korxona bo'lsa. Bu qoidabuzarlik emas (biznes-markaz bo'lishi mumkin), faqat tekshirishga signal.",
      "KTUT ro'yxatida yo'qlik salbiy belgi emas: bu ro'yxat to'liq davlat registri emas, shuning uchun \"topilmadi\" belgisi qo'yilmaydi.",
    ],
  },
  {
    title: "Statistik hisobotlar",
    source: "KTUT bo'yicha korxonaga biriktirilgan majburiy statistik hisobot shakllari (108 shakl).",
    coverage: "~65 ming korxona.",
    notes: ["O'z vaqtida topshirilgan hisobotlar ulushi hozircha hisoblanmaydi: topshirish ma'lumoti portalga ulanmagan."],
  },
  {
    title: "Ishlab chiqarish",
    source: "Sanoat mahsulotlari ishlab chiqaruvchilari reyestri (mahsulot klassifikatori SKP bo'yicha).",
    coverage: "~39 ming korxona, 53 ming yozuv.",
    notes: ["Ishlab chiqarish hajmi va narxi ko'rsatilmaydi — faqat mahsulot turlari."],
  },
  {
    title: "Korxona bali",
    source: "Korxonalar scoringi (6 ustun, tengdoshlar bilan solishtirish).",
    coverage: "Ball ochiq bo'lgan muhitda.",
    notes: ["Namuna (sintetik) ma'lumotdan hisoblangan ball \"Namuna\" belgisi bilan chiqadi va PDF'da suv belgisi qo'yiladi."],
  },
];

const NOT_INCLUDED = [
  ["Soliq qarzi, to'langan soliqlar, moliyaviy hisobot", "Soliq organlari ma'lumoti; idoralararo kelishuvsiz portalga ulanmaydi."],
  ["Sud va ijro ishlari, davlat xaridlari, litsenziyalar", "Tashqi davlat portallari; har biri uchun foydalanish sharti tekshiriladi."],
  ["Rahbar, ta'sischilar, telefon", "Jismoniy shaxs ma'lumoti kartaga va eksportga kirmaydi."],
  ["Begona korxonaning xom moliyaviy raqamlari", "Faqat tengdoshlar orasidagi o'rni (scoring) ko'rsatiladi."],
];

export default function CompanyCardMethodology() {
  useEffect(() => { document.title = "Kontragent kartasi: manbalar va cheklovlar — my.stat.uz"; }, []);
  return (
    <div className="min-h-screen bg-gray-50 py-8 dark:bg-gray-900">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <PageHeader title="Kontragent kartasi: manbalar va cheklovlar"
          description="Kartadagi har bir ma'lumot qayerdan olinadi, qancha korxonani qamraydi va nima ataylab ko'rsatilmaydi."
          breadcrumbs={[{ label: "Bosh sahifa", to: "/" }, { label: "Kontragentni tekshirish", to: "/check" }, { label: "Metodologiya" }]} />

        <div className="space-y-4">
          {BLOCKS.map((b) => (
            <section key={b.title} className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
              <h2 className="font-semibold text-gray-900 dark:text-white">{b.title}</h2>
              <dl className="mt-2 grid gap-2 text-sm sm:grid-cols-[8rem_1fr]">
                <dt className="text-gray-500">Manba</dt><dd className="text-gray-800 dark:text-gray-100">{b.source}</dd>
                <dt className="text-gray-500">Qamrov</dt><dd className="text-gray-800 dark:text-gray-100">{b.coverage}</dd>
              </dl>
              <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-gray-600 dark:text-gray-300">
                {b.notes.map((n) => <li key={n}>{n}</li>)}
              </ul>
            </section>
          ))}

          <section className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
            <h2 className="font-semibold text-gray-900 dark:text-white">Kartaga kirmaydigan ma'lumotlar</h2>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="text-left text-xs uppercase tracking-wide text-gray-500"><th className="py-2 pr-4 font-medium">Ma'lumot</th><th className="py-2 font-medium">Sabab</th></tr></thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {NOT_INCLUDED.map(([what, why]) => (
                    <tr key={what}><td className="py-2 pr-4 align-top text-gray-900 dark:text-white">{what}</td><td className="py-2 text-gray-600 dark:text-gray-300">{why}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
            Karta rasmiy statistik manbalardan yig'iladi, lekin kontragent haqida yakuniy xulosa yoki rasmiy baho emas.
            Rasmiy hujjat kerak bo'lsa — <Link to="/stat-codes" className="underline">statistik kodlar ma'lumotnomasi</Link> (QR va tekshiruv kodi bilan).
          </section>
        </div>
      </div>
    </div>
  );
}

import { Banknote, Briefcase, Building2, Globe2, Home, Leaf, LineChart, Scale, ShoppingCart, Users, Wheat, Wifi } from "lucide-react";

/** Soha kartalari: 4 ustun, chiziqli ikonka (ko'k, stroke 1.4) chapda, matn o'ngda, tekis oq karta va ingichka chegara. */
const FIELDS = [
  { icon: LineChart, label: "Iqtisodiyot va YaIM" },
  { icon: Users, label: "Aholi va demografiya" },
  { icon: Briefcase, label: "Mehnat va aholi bandligi" },
  { icon: ShoppingCart, label: "Narxlar va inflyatsiya" },
  { icon: Building2, label: "Korxonalar va tadbirkorlik" },
  { icon: Banknote, label: "Moliya va bank faoliyati" },
  { icon: Globe2, label: "Tashqi savdo va bojxona" },
  { icon: Home, label: "Uy-joy va qurilish" },
  { icon: Wheat, label: "Qishloq xo'jaligi" },
  { icon: Leaf, label: "Atrof-muhit va resurslar" },
  { icon: Scale, label: "Ijtimoiy ta'minot va sog'liq" },
  { icon: Wifi, label: "Axborot va raqamlashtirish" },
];

export default function FieldGrid() {
  return (
    <section aria-labelledby="fields-h" className="mx-auto max-w-[1296px] px-4 py-12">
      <h2 id="fields-h" className="text-[21px] font-bold uppercase text-lx-ink">Statistika sohalari</h2>
      <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {FIELDS.map(({ icon: Icon, label }) => (
          <li key={label}>
            <a href="#" className="flex min-h-[104px] items-center gap-5 rounded-lx border border-lx-line bg-white px-6 py-4 hover:border-lx-blue">
              <Icon className="h-11 w-11 shrink-0 text-lx-blue" strokeWidth={1.3} aria-hidden="true" />
              <span className="text-[15px] font-medium leading-snug text-lx-ink">{label}</span>
            </a>
          </li>
        ))}
      </ul>
      <p className="mt-6 text-center"><a href="#" className="text-[15px] text-lx-link hover:underline">Hammasini ochish</a></p>
    </section>
  );
}

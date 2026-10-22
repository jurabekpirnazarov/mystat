import { useId, type ReactNode } from "react";

/**
 * MG-05 / checklist 2.3: "Ommabop xizmatlar" plitkalari uchun o'z illyustratsiyalari (my.gov.uz "story" plitkalari
 * uslubida — och fonda qurilma va kartochkalar sahnasi). Tashqi rasm yo'q: hammasi SVG, 120×120 sahna.
 * Har sahna xizmat ma'nosini beradi (docs/LOGO.md 4-bo'lim).
 */
const C = {
  blue: "#1D5FBF", blueL: "#CFE0FA", blueXL: "#E6F0FD", green: "#18794A", greenL: "#D3F2DD", amber: "#F5A524",
  amberL: "#FDEBC8", coral: "#F26B5B", violet: "#7C5CFF", violetL: "#E6E0FF", gray: "#E3E8EF", grayD: "#B8C4D6",
  white: "#FFFFFF", ink: "#18212F",
};

function Check({ x, y, r = 9 }: { x: number; y: number; r?: number }) {
  return (
    <g>
      <circle cx={x} cy={y} r={r} fill={C.green} />
      <path d={`M${x - r * 0.42} ${y} l${r * 0.3} ${r * 0.32} l${r * 0.55} ${-r * 0.6}`} stroke={C.white} strokeWidth={r * 0.24}
        fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </g>
  );
}

function Lens({ x, y, r = 10, color = C.blue }: { x: number; y: number; r?: number; color?: string }) {
  return (
    <g>
      <line x1={x + r * 0.7} y1={y + r * 0.7} x2={x + r * 1.5} y2={y + r * 1.5} stroke={C.ink} strokeWidth={r * 0.38} strokeLinecap="round" />
      <circle cx={x} cy={y} r={r} fill={C.white} stroke={color} strokeWidth={r * 0.32} />
      <circle cx={x - r * 0.3} cy={y - r * 0.3} r={r * 0.22} fill={C.blueXL} />
    </g>
  );
}

function Lines({ x, y, widths, gap = 7, color = C.gray }: { x: number; y: number; widths: number[]; gap?: number; color?: string }) {
  return <g>{widths.map((w, i) => <rect key={i} x={x} y={y + i * gap} width={w} height={3.2} rx={1.6} fill={color} />)}</g>;
}

function Pin({ x, y, s = 1, color = C.coral }: { x: number; y: number; s?: number; color?: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M0 0 C-7 -8 -9 -12 -9 -16 A9 9 0 0 1 9 -16 C9 -12 7 -8 0 0Z" fill={color} />
      <circle cx="0" cy="-16" r="3.6" fill={C.white} />
    </g>
  );
}

const SCENES: Record<number, (sh: string) => ReactNode> = {
  // Korxona to'g'risida ma'lumot: bino + STIR ma'lumotnomasi + lupa
  101: (sh) => (
    <>
      <rect x="12" y="42" width="40" height="64" rx="4" fill={C.blueL} />
      {[0, 1, 2, 3].map((r) => [0, 1, 2].map((c) => <rect key={`${r}${c}`} x={18 + c * 11} y={50 + r * 12} width="6" height="7" rx="1.2" fill="#9CC0F5" />))}
      <g filter={sh}>
        <rect x="46" y="24" width="56" height="70" rx="8" fill={C.white} />
      </g>
      <rect x="54" y="33" width="26" height="6" rx="3" fill={C.blue} />
      <text x="54" y="51" fontSize="7" fontWeight="700" fill={C.ink} fontFamily="Inter Variable, sans-serif">STIR</text>
      <rect x="72" y="45.5" width="22" height="6" rx="2" fill={C.blueXL} />
      <Lines x={54} y={60} widths={[40, 32, 36, 24]} />
      <Lens x={90} y={88} r={10} />
      <Check x={98} y={26} />
    </>
  ),
  // Kontragentni tekshirish: ikki korxona + qalqon (ishonchli)
  102: (sh) => (
    <>
      <rect x="8" y="56" width="30" height="50" rx="4" fill={C.blueL} />
      <rect x="82" y="50" width="30" height="56" rx="4" fill={C.greenL} />
      {[0, 1, 2].map((r) => <rect key={r} x="15" y={64 + r * 12} width="16" height="6" rx="1.5" fill="#9CC0F5" />)}
      {[0, 1, 2].map((r) => <rect key={r} x="89" y={58 + r * 12} width="16" height="6" rx="1.5" fill="#8FD9A8" />)}
      <path d="M38 80 Q60 96 82 80" stroke={C.grayD} strokeWidth="2.4" strokeDasharray="4 4" fill="none" />
      <g filter={sh}>
        <path d="M60 18 L84 27 V48 C84 64 73 74 60 80 C47 74 36 64 36 48 V27 Z" fill={C.white} />
      </g>
      <path d="M60 25 L78 32 V48 C78 60 70 68 60 73 C50 68 42 60 42 48 V32 Z" fill={C.blueXL} />
      <Check x={60} y={49} r={12} />
    </>
  ),
  // Hisobot kalendari: kalendar, belgilangan muddat va soat
  201: (sh) => (
    <>
      <g filter={sh}>
        <rect x="14" y="24" width="76" height="74" rx="9" fill={C.white} />
      </g>
      <path d="M14 33 a9 9 0 0 1 9 -9 h58 a9 9 0 0 1 9 9 v9 h-76z" fill={C.violet} />
      <rect x="30" y="18" width="5" height="14" rx="2.5" fill={C.ink} />
      <rect x="69" y="18" width="5" height="14" rx="2.5" fill={C.ink} />
      {[0, 1, 2].map((r) => [0, 1, 2, 3, 4].map((c) => {
        const hot = r === 1 && c === 3;
        return <rect key={`${r}${c}`} x={21 + c * 13.5} y={50 + r * 14} width="10" height="10" rx="2.5" fill={hot ? C.coral : r === 0 && c < 2 ? C.violetL : C.gray} />;
      }))}
      <text x="66.5" y="71.4" fontSize="6.5" fontWeight="700" fill={C.white} fontFamily="Inter Variable, sans-serif" textAnchor="middle">25</text>
      <g filter={sh}>
        <circle cx="94" cy="88" r="16" fill={C.white} />
      </g>
      <circle cx="94" cy="88" r="12.5" fill="none" stroke={C.violet} strokeWidth="3" />
      <path d="M94 81 V88 L99 91" stroke={C.ink} strokeWidth="2.6" fill="none" strokeLinecap="round" />
    </>
  ),
  // Tashqi savdo: globus, savdo yo'llari va konteyner kemasi
  301: () => (
    <>
      <circle cx="60" cy="46" r="30" fill={C.blueXL} stroke={C.blue} strokeWidth="2.5" />
      <ellipse cx="60" cy="46" rx="13" ry="30" fill="none" stroke={C.blue} strokeWidth="1.6" />
      <path d="M31 38 H89 M31 54 H89" stroke={C.blue} strokeWidth="1.6" />
      <path d="M44 30 q8 -4 12 2 q-2 8 -10 8z M66 52 q10 -2 12 6 q-6 6 -14 2z" fill="#8FD9A8" />
      <path d="M18 34 Q14 10 40 12" stroke={C.green} strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M36 7 L42 12 L35 16" stroke={C.green} strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M102 58 Q108 80 84 84" stroke={C.amber} strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M88 79 L82 84 L89 88" stroke={C.amber} strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="30" y="84" width="14" height="10" rx="1.5" fill={C.amber} />
      <rect x="45" y="84" width="14" height="10" rx="1.5" fill={C.green} />
      <rect x="60" y="84" width="14" height="10" rx="1.5" fill={C.coral} />
      <rect x="45" y="75" width="14" height="9" rx="1.5" fill={C.violet} />
      <path d="M20 94 H96 L88 108 H28 Z" fill={C.blue} />
      <path d="M8 112 q8 -4 16 0 t16 0 t16 0 t16 0 t16 0 t16 0 t16 0" stroke="#9CC0F5" strokeWidth="2.4" fill="none" />
    </>
  ),
  // Bozor tahlili: ekranda o'sish grafigi va HS kodi bo'yicha lupa
  302: (sh) => (
    <>
      <g filter={sh}>
        <rect x="22" y="14" width="64" height="92" rx="11" fill={C.white} />
      </g>
      <rect x="30" y="24" width="30" height="5" rx="2.5" fill={C.ink} />
      <rect x="30" y="33" width="20" height="4" rx="2" fill={C.gray} />
      <path d="M30 84 L40 72 L50 76 L62 58 L76 50 V92 H30 Z" fill={C.blueXL} />
      <path d="M30 84 L40 72 L50 76 L62 58 L76 50" stroke={C.blue} strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="76" cy="50" r="3.5" fill={C.blue} />
      {[0, 1, 2, 3].map((i) => <rect key={i} x={32 + i * 11} y={96 - [4, 7, 5, 9][i]} width="6" height={[4, 7, 5, 9][i]} rx="1.5" fill={C.grayD} />)}
      <Lens x={90} y={78} r={13} color={C.green} />
      <text x="90" y="81" fontSize="8" fontWeight="800" fill={C.green} fontFamily="Inter Variable, sans-serif" textAnchor="middle">HS</text>
    </>
  ),
  // Hamkor qidirish: xaritada korxonalar va ular orasidagi aloqalar
  401: (sh) => (
    <>
      <g filter={sh}>
        <rect x="10" y="30" width="100" height="72" rx="10" fill="#E8F7EE" />
      </g>
      <path d="M10 62 H110 M48 30 V102 M10 88 Q60 70 110 44" stroke={C.white} strokeWidth="5" fill="none" />
      <path d="M34 66 L66 50 L86 78" stroke={C.blue} strokeWidth="2.2" strokeDasharray="4 3" fill="none" />
      <Pin x={34} y={70} color={C.blue} />
      <Pin x={66} y={54} s={1.15} color={C.green} />
      <Pin x={86} y={82} color={C.amber} />
      <Lens x={92} y={22} r={11} />
    </>
  ),
  // Inflyatsiya: savat, narx yorlig'i va o'sish
  501: (sh) => (
    <>
      <circle cx="44" cy="58" r="11" fill="#F6C27A" />
      <rect x="54" y="40" width="12" height="28" rx="4" fill={C.green} />
      <rect x="57" y="34" width="6" height="8" rx="2" fill={C.ink} />
      <circle cx="76" cy="60" r="9" fill={C.coral} />
      <path d="M76 51 q3 -5 6 -4" stroke={C.green} strokeWidth="2" fill="none" />
      <path d="M22 66 H98 L90 104 H30 Z" fill={C.amber} />
      <path d="M38 74 L41 98 M52 74 L53 98 M68 74 L67 98 M82 74 L79 98" stroke="#E08E0B" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M36 66 Q60 30 84 66" stroke={C.ink} strokeWidth="3" fill="none" />
      <g filter={sh} transform="rotate(-14 92 26)">
        <path d="M76 16 H104 a4 4 0 0 1 4 4 V36 a4 4 0 0 1 -4 4 H76 L68 28 Z" fill={C.white} />
      </g>
      <text x="90" y="33" fontSize="13" fontWeight="800" fill={C.coral} fontFamily="Inter Variable, sans-serif" textAnchor="middle" transform="rotate(-14 92 26)">%</text>
      <path d="M14 40 L24 30 L30 34 L40 22" stroke={C.coral} strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M34 21 L40 22 L39 28" stroke={C.coral} strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  // Demografiya: aholi va taqsimot diagrammasi
  601: (sh) => (
    <>
      <g filter={sh}>
        <circle cx="86" cy="32" r="20" fill={C.white} />
      </g>
      <circle cx="86" cy="32" r="13" fill="none" stroke={C.blueXL} strokeWidth="7" />
      <circle cx="86" cy="32" r="13" fill="none" stroke={C.blue} strokeWidth="7" strokeDasharray="45 82" transform="rotate(-90 86 32)" />
      <circle cx="86" cy="32" r="13" fill="none" stroke={C.coral} strokeWidth="7" strokeDasharray="22 82" strokeDashoffset="-45" transform="rotate(-90 86 32)" />
      <circle cx="34" cy="52" r="11" fill="#F6C27A" />
      <path d="M16 104 V82 a18 18 0 0 1 36 0 V104 Z" fill={C.blue} />
      <circle cx="64" cy="62" r="9" fill="#E9A66B" />
      <path d="M50 104 V88 a14 14 0 0 1 28 0 V104 Z" fill={C.green} />
      <circle cx="92" cy="70" r="7.5" fill="#F6C27A" />
      <path d="M81 104 V93 a11 11 0 0 1 22 0 V104 Z" fill={C.amber} />
    </>
  ),
  // Mening maoshim: hamyon, tangalar va solishtirish
  701: (sh) => (
    <>
      <g filter={sh}>
        <rect x="12" y="16" width="50" height="40" rx="7" fill={C.white} />
      </g>
      <rect x="20" y="38" width="8" height="12" rx="2" fill={C.grayD} />
      <rect x="32" y="30" width="8" height="20" rx="2" fill={C.blue} />
      <rect x="44" y="24" width="8" height="26" rx="2" fill={C.green} />
      <path d="M36 25 l-3 -5 l-3 5" stroke={C.blue} strokeWidth="2" fill="none" strokeLinecap="round" />
      <rect x="18" y="56" width="70" height="48" rx="9" fill={C.green} />
      <rect x="18" y="56" width="70" height="12" rx="6" fill="#23964A" />
      <rect x="66" y="72" width="26" height="18" rx="6" fill="#23964A" />
      <circle cx="76" cy="81" r="4" fill={C.amber} />
      {[0, 1, 2, 3].map((i) => <ellipse key={i} cx="100" cy={100 - i * 7} rx="12" ry="4.5" fill={i % 2 ? "#F7BB48" : C.amber} stroke="#E08E0B" strokeWidth="1.2" />)}
    </>
  ),
  // Mening hududim: hududlar xaritasi va joylashuv belgisi
  801: (sh) => (
    <>
      <g filter={sh}>
        <rect x="10" y="22" width="100" height="80" rx="10" fill={C.white} />
      </g>
      <path d="M18 46 L36 34 L54 40 L50 60 L28 66 Z" fill={C.blueL} stroke={C.white} strokeWidth="2" />
      <path d="M54 40 L78 32 L92 46 L80 62 L50 60 Z" fill="#9CC0F5" stroke={C.white} strokeWidth="2" />
      <path d="M28 66 L50 60 L58 82 L36 92 L22 80 Z" fill="#7FB0F0" stroke={C.white} strokeWidth="2" />
      <path d="M50 60 L80 62 L100 76 L84 94 L58 82 Z" fill={C.blue} stroke={C.white} strokeWidth="2" />
      <Pin x={76} y={74} s={1.5} color={C.coral} />
      <rect x="18" y="94" width="30" height="4" rx="2" fill={C.gray} />
    </>
  ),
  // Nashrlar: kitoblar va statistik to'plam
  1001: (sh) => (
    <>
      <rect x="14" y="86" width="56" height="12" rx="2.5" fill={C.blue} />
      <rect x="18" y="74" width="52" height="12" rx="2.5" fill={C.green} />
      <rect x="12" y="62" width="54" height="12" rx="2.5" fill={C.amber} />
      <path d="M14 98 h56 v4 h-56z" fill="#0052B0" />
      {[66, 78, 90].map((y) => <rect key={y} x="22" y={y} width="30" height="2.4" rx="1.2" fill={C.white} opacity=".7" />)}
      <g filter={sh} transform="rotate(8 82 50)">
        <rect x="58" y="16" width="48" height="66" rx="5" fill={C.white} />
        <rect x="64" y="23" width="36" height="7" rx="2" fill={C.blue} />
        <text x="82" y="42" fontSize="9" fontWeight="800" fill={C.ink} fontFamily="Inter Variable, sans-serif" textAnchor="middle">2026</text>
        {[0, 1, 2, 3].map((i) => <rect key={i} x={66 + i * 8} y={70 - [8, 14, 10, 18][i]} width="5" height={[8, 14, 10, 18][i]} rx="1.2" fill={i === 3 ? C.green : "#9CC0F5"} />)}
      </g>
    </>
  ),
  // Ochiq API: noutbukda kod va ma'lumotlar bazasi
  1201: (sh) => (
    <>
      <g filter={sh}>
        <rect x="14" y="30" width="78" height="54" rx="7" fill={C.ink} />
      </g>
      <rect x="19" y="35" width="68" height="44" rx="4" fill="#0F1B33" />
      <text x="25" y="50" fontSize="9" fontWeight="800" fill={C.amber} fontFamily="monospace">{"{ }"}</text>
      <rect x="44" y="44" width="30" height="3.4" rx="1.7" fill={C.green} />
      <rect x="27" y="56" width="40" height="3.4" rx="1.7" fill="#5B8DEF" />
      <rect x="27" y="64" width="26" height="3.4" rx="1.7" fill={C.violet} />
      <rect x="57" y="64" width="18" height="3.4" rx="1.7" fill={C.coral} />
      <path d="M6 86 H100 L94 94 H12 Z" fill={C.grayD} />
      <g filter={sh}>
        <ellipse cx="96" cy="26" rx="14" ry="5" fill={C.green} />
        <path d="M82 26 V44 a14 5 0 0 0 28 0 V26 a14 5 0 0 1 -28 0" fill="#23964A" />
      </g>
      <path d="M82 35 a14 5 0 0 0 28 0" stroke={C.greenL} strokeWidth="1.5" fill="none" />
      <path d="M90 50 Q92 62 84 66" stroke={C.green} strokeWidth="2.2" strokeDasharray="3 3" fill="none" />
    </>
  ),
};

export default function TileArt({ number, className = "" }: { number: number; className?: string }) {
  const id = useId().replace(/:/g, "");
  const scene = SCENES[number];
  if (!scene) return null;
  return (
    <svg viewBox="0 0 120 120" className={className} aria-hidden="true">
      <defs>
        <filter id={`sh${id}`} x="-20%" y="-20%" width="140%" height="150%">
          <feDropShadow dx="0" dy="2.5" stdDeviation="2.5" floodColor="#0B3B8C" floodOpacity="0.18" />
        </filter>
      </defs>
      {scene(`url(#sh${id})`)}
    </svg>
  );
}

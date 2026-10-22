import { useEffect, useState } from "react";
import { Users } from "lucide-react";
import type { PopulationClock as Clock } from "../../api/statPublic";
import { estimatePopulation, formatInt as fmt, secondsPerPerson } from "../../utils/statPublic";
import { formatDateTime } from "../../utils/format";

/**
 * JAHON_TAJRIBASI JT-02: "Aholi soati". SIAT'dagi 1-yanvar holatidagi aholi soni va oxirgi yillik o'sish
 * sur'atidan brauzerda hisoblanadi: N(t) = N0 · (1 + g)^(t − t0). Bu baho, rasmiy raqam emas.
 */

export default function PopulationClock({ clock, compact }: { clock: Clock; compact?: boolean }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);
  const value = estimatePopulation(clock, now);
  const step = secondsPerPerson(clock);
  const sinceBase = value - clock.base_population;

  return (
    <section aria-label="Aholi soati"
      className={`rounded-2xl border border-blue-100 dark:border-blue-900 bg-mg-info/60 ${compact ? "p-4" : "p-6"}`}>
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 shrink-0 rounded-lg bg-blue-600/10 flex items-center justify-center">
          <Users className="w-5 h-5 text-blue-600" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <p className="text-sm text-gray-600 dark:text-gray-300">Hozir O'zbekistonda taxminan</p>
          <p className={`${compact ? "text-2xl" : "text-3xl sm:text-4xl"} font-bold text-gray-900 dark:text-white tabular-nums`} aria-live="off">
            {fmt(value)} <span className="text-base font-medium text-gray-500">kishi</span>
          </p>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {step && <>Har ~{step < 60 ? `${Math.round(step)} soniyada` : `${(step / 60).toFixed(1)} daqiqada`} aholi bittaga ko'payadi · </>}
            {formatDateTime(clock.base_at)} holatidan beri +{fmt(sinceBase)} · yillik o'sish {clock.annual_growth_pct.toFixed(2)}%
          </p>
          {!compact && (
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              {clock.kind === "official"
                ? `Boshlang'ich nuqta — ${clock.source} (${formatDateTime(clock.base_at)} holatiga ${fmt(clock.base_population)} kishi). Undan keyingi raqam yillik o'sish sur'ati bo'yicha baho.`
                : `Baho: ${clock.source} va oxirgi o'sish sur'atidan hisoblanadi, rasmiy raqam emas.`}{" "}
              {clock.source_url && <a href={clock.source_url} target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-700">Manba</a>}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

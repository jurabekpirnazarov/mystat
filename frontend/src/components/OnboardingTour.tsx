import { useEffect, useState } from "react";
import { X } from "lucide-react";
import axiosT from "../api/baseUrl";

interface Step {
  title: string;
  text: string;
  tab?: string;
}

const LEGAL_STEPS: Step[] = [
  { title: "Xush kelibsiz!", text: "Bu — korxonangiz kabineti. Bir necha qadamda asosiy bo'limlarni ko'rsatamiz." },
  { title: "Xizmatlar va tariflar", text: "Paketingizdagi xizmatlar va limitlar shu yerda. Tariflarni taqqoslash va narx kalkulyatori — \"Xizmatlar\" sahifasida.", tab: "services" },
  { title: "Hisobotlarim", text: "Korxonangiz topshiradigan hisobotlar, muddatlar, yo'riqnomalar va eslatmalar.", tab: "reports" },
  { title: "Xabarnomalar", text: "Shartnoma holati, so'rovlarga javoblar va hisobot eslatmalari shu yerga keladi.", tab: "notifications" },
  { title: "Profil", text: "Korxona ma'lumotlarini to'ldiring — shartnoma va formalar avtomatik to'ldiriladi.", tab: "profile" },
];
const CITIZEN_STEPS: Step[] = [
  { title: "Xush kelibsiz!", text: "Fuqarolar uchun bepul xizmatlar: hududingiz, inflyatsiya, maosh, narxlar va boshqalar." },
  { title: "Mening hududim", text: "Bosh panelda hududingiz ko'rsatkichlari va sevimli ko'rsatkichlaringiz." },
  { title: "Savol bering", text: "Statistik savolingizni yuboring — xodim javob beradi.", tab: "questions" },
  { title: "Obunalar", text: "Inflyatsiya yoki hududingiz ko'rsatkichlari yangilanganda xabar oling.", tab: "subscriptions" },
];

/** U-15: birinchi kirishdagi 4–5 qadamli tanishtiruv; yopilgani profilda saqlanadi (bir marta chiqadi). */
export default function OnboardingTour({ citizen, onNavigate }: { citizen: boolean; onNavigate: (tab: string) => void }) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const steps = citizen ? CITIZEN_STEPS : LEGAL_STEPS;

  useEffect(() => {
    axiosT.get<{ onboarding_done: boolean }>("/accounts/me/preferences/")
      .then((r) => setOpen(!r.data.onboarding_done))
      .catch(() => setOpen(false));
  }, []);

  const finish = () => {
    setOpen(false);
    void axiosT.patch("/accounts/me/preferences/", { onboarding_done: true }).catch(() => undefined);
  };
  if (!open) return null;
  const s = steps[step];
  const last = step === steps.length - 1;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-labelledby="tour-title">
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-gray-900 shadow-2xl p-6">
        <div className="flex items-start justify-between gap-3">
          <h2 id="tour-title" className="text-lg font-semibold text-gray-900 dark:text-white">{s.title}</h2>
          <button type="button" onClick={finish} aria-label="Tanishtiruvni yopish" className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800"><X className="w-5 h-5" /></button>
        </div>
        <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">{s.text}</p>
        <div className="mt-4 flex items-center gap-1.5" aria-hidden="true">
          {steps.map((_, i) => <span key={i} className={`h-1.5 rounded-full ${i === step ? "w-6 bg-blue-600" : "w-1.5 bg-gray-300 dark:bg-gray-600"}`} />)}
        </div>
        <div className="mt-5 flex justify-between gap-2">
          <button type="button" onClick={finish} className="text-sm text-gray-500 hover:underline">O'tkazib yuborish</button>
          <div className="flex gap-2">
            {s.tab && <button type="button" onClick={() => onNavigate(s.tab as string)} className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm">Ko'rish</button>}
            <button type="button" onClick={() => (last ? finish() : setStep((v) => v + 1))} className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm">
              {last ? "Boshlash" : "Keyingi"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

import { Mic, Search } from "lucide-react";

/** "Universal qidiruv" bloki: to'q ko'k fon, oq maydonlar, tagida "Kengaytirilgan qidiruv" havolasi. */
export default function SearchBand() {
  const field = "h-[52px] w-full rounded-lx border border-transparent bg-white px-4 text-[15px] text-lx-ink outline-none placeholder:text-lx-muted focus-visible:border-lx-blue-dark";
  return (
    <section aria-labelledby="search-h" className="bg-lx-blue">
      <div className="mx-auto max-w-[1296px] px-4 py-8">
        <h2 id="search-h" className="text-[28px] font-bold text-white">Universal qidiruv</h2>
        <form role="search" onSubmit={(e) => e.preventDefault()} className="mt-6 grid gap-3 md:grid-cols-[150px_1fr_220px_190px_auto_56px]">
          <label><span className="sr-only">Ko'rsatkich kodi</span><input className={field} placeholder="Ko'rsatkich kodi" inputMode="numeric" /></label>
          <label><span className="sr-only">Ko'rsatkich nomi</span><input className={field} placeholder="Ko'rsatkich nomi" /></label>
          <label><span className="sr-only">Davr</span><input className={field} placeholder="Davr (2020–2026)" /></label>
          <label>
            <span className="sr-only">Soha</span>
            <select className={field} defaultValue=""><option value="" disabled>Soha</option><option>Iqtisodiyot</option><option>Aholi</option><option>Mehnat</option><option>Narxlar</option></select>
          </label>
          <button type="submit" className="inline-flex h-[52px] items-center justify-center gap-2 rounded-lx bg-white px-5 text-[15px] font-semibold text-lx-blue hover:bg-lx-blue-soft"><Search className="h-4 w-4" aria-hidden="true" />Izlash</button>
          <button type="button" aria-label="Ovozli qidiruv" className="inline-flex h-[52px] items-center justify-center rounded-lx bg-white text-lx-blue hover:bg-lx-blue-soft"><Mic className="h-5 w-5" aria-hidden="true" /></button>
        </form>
        <a href="#" className="mt-5 inline-block text-[15px] text-white underline underline-offset-4 hover:opacity-90">Kengaytirilgan qidiruv</a>
      </div>
    </section>
  );
}

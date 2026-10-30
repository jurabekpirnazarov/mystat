/** Ixcham footer: 4 havola va bitta huquqiy qator. */
export default function Footer() {
  return (
    <footer className="border-t border-lx-line bg-white">
      <div className="mx-auto max-w-[1296px] px-4 py-8">
        <ul className="flex flex-wrap gap-x-8 gap-y-2 text-[15px]">
          {["Portal haqida", "Yangiliklar", "Reklama", "RSS"].map((l) => <li key={l}><a href="#" className="text-lx-ink hover:text-lx-blue hover:underline">{l}</a></li>)}
        </ul>
        <p className="mt-5 max-w-3xl text-[13px] leading-relaxed text-lx-muted">© O'zbekiston Respublikasi Statistika agentligi huzuridagi milliy statistika ma'lumotlari markazi davlat muassasasi</p>
      </div>
    </footer>
  );
}

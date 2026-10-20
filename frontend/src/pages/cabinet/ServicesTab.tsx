import { FileText, ChevronDown, ChevronsRight } from "lucide-react";
import type { PackageItem, UserPackageService } from "./types";
import { stripHtml } from "../../utils/format";

interface Props {
  userPackageServices: UserPackageService[];
  packageItemsLoading: boolean;
  expandedServices: Set<number>;
  toggleServiceExpansion: (id: number) => void;
  handleServiceNavigation: (name: string) => void;
}

/** Admin'da nomlar rich-text (CKEditor) bilan kiritilgan: `<p>`, `&lsquo;` va h.k. — oddiy matnga. */
const plain = (html: string | null | undefined) => stripHtml(html).replace(/\s+/g, " ").replace(/:$/, "");

/**
 * -1 = cheksiz, N = limit. 0 — soni hisoblanmaydigan imkoniyat (telefon orqali tushuntirish, eslatmalar va h.k.):
 * paket tarkibida ko'rsatiladi, bosh paneldagi hisoblagichga kirmaydi (cabinet_views.py).
 */
function LimitBadge({ limit }: { limit: number }) {
  if (limit < 0) {
    return <span className="rounded px-2 py-0.5 text-xs font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">Cheksiz</span>;
  }
  if (limit === 0) {
    return <span title="Foydalanish soni hisoblanmaydi" className="rounded px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300">Paketda bor</span>;
  }
  return <span className="rounded px-2 py-0.5 text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 tabular-nums">{limit} ta</span>;
}

function ItemRow({ item }: { item: PackageItem }) {
  return (
    <li className="flex items-start justify-between gap-4 px-5 py-3">
      <span className="text-sm text-gray-800 dark:text-gray-100">{plain(item.name_uz) || plain(item.name_ru)}</span>
      <span className="shrink-0"><LimitBadge limit={item.limit} /></span>
    </li>
  );
}

/** Q-01: PersonalCabinet.tsx dan ajratilgan bo'lim. */
export default function ServicesTab({ userPackageServices, packageItemsLoading, expandedServices, toggleServiceExpansion, handleServiceNavigation }: Props) {
  return (
    <div className="p-4 sm:p-6">
      <div className="mb-5">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Mening xizmatlarim</h2>
        {!packageItemsLoading && userPackageServices.length > 0 && (
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Tarif paketingizdagi {userPackageServices.length} ta xizmat yo'nalishi. Tarkibini ko'rish uchun yo'nalish ustiga bosing.
          </p>
        )}
      </div>

      {packageItemsLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-500 dark:text-gray-400 mt-4">Xizmatlar yuklanmoqda...</p>
        </div>
      ) : userPackageServices.length > 0 ? (
        <div className="space-y-3">
          {userPackageServices.map(({ package_service: service, items }) => {
            const open = expandedServices.has(service.id);
            const panelId = `package-service-${service.id}`;
            return (
              <div key={service.id} className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="flex items-center gap-3 px-5 py-4 bg-white dark:bg-gray-800">
                  <button
                    type="button"
                    onClick={() => toggleServiceExpansion(service.id)}
                    aria-expanded={open}
                    aria-controls={panelId}
                    className="flex flex-1 min-w-0 items-start gap-3 text-left"
                  >
                    <ChevronDown className={`mt-0.5 h-5 w-5 shrink-0 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} aria-hidden="true" />
                    <span className="min-w-0">
                      <span className="block font-semibold leading-snug text-gray-900 dark:text-white">{plain(service.name_uz) || plain(service.name_ru)}</span>
                      <span className="mt-1 block text-xs text-gray-500 dark:text-gray-400">{items.length} ta xizmat</span>
                    </span>
                  </button>
                  {service.slug && (
                    <button
                      type="button"
                      onClick={() => handleServiceNavigation(service.slug)}
                      className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
                    >
                      O'tish <ChevronsRight className="h-4 w-4" aria-hidden="true" />
                    </button>
                  )}
                </div>
                {open && (
                  <ul id={panelId} className="divide-y divide-gray-100 border-t border-gray-200 bg-gray-50 dark:divide-gray-700 dark:border-gray-700 dark:bg-gray-900/40">
                    {items.map((item) => <ItemRow key={item.id} item={item} />)}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-8">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Xizmatlar mavjud emas</h3>
          <p className="text-gray-500 dark:text-gray-400">Hozircha sizda faol xizmatlar yo'q</p>
        </div>
      )}
    </div>
  );
}

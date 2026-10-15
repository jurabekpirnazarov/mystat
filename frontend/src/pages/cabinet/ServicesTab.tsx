import { FileText, ChevronDown, ChevronUp, ChevronsRight } from "lucide-react";
import type { UserPackageService } from "./types";

interface Props {
  userPackageServices: UserPackageService[];
  packageItemsLoading: boolean;
  expandedServices: Set<number>;
  toggleServiceExpansion: (id: number) => void;
  handleServiceNavigation: (name: string) => void;
}

/** Q-01: PersonalCabinet.tsx dan ajratilgan bo'lim. */
export default function ServicesTab({ userPackageServices, packageItemsLoading, expandedServices, toggleServiceExpansion, handleServiceNavigation }: Props) {
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        Mening Xizmatlarim
      </h2>

      {packageItemsLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-500 dark:text-gray-400 mt-4">Xizmatlar yuklanmoqda...</p>
        </div>
      ) : userPackageServices.length > 0 ? (
        <div className="space-y-6">
          {userPackageServices.map((serviceGroup) => (
            <div
              key={serviceGroup.package_service.id}
              className="border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm overflow-hidden"
            >
              {/* Service Header */}
              <div
                className="bg-gray-50 dark:bg-gray-700 px-6 py-4 border-b border-gray-200 dark:border-gray-600 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                onClick={() => toggleServiceExpansion(serviceGroup.package_service.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
                      {serviceGroup.package_service.name_uz}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                      {serviceGroup.package_service.name_ru}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        ID: {serviceGroup.package_service.id}
                      </p>
                      <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded text-xs font-medium">
                        {serviceGroup.items.length} ta xizmat
                      </span>
                    </div>
                  </div>
                  <div className="ml-4 flex items-center space-x-3">
                    {/* Navigate Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent card collapse/expand
                        handleServiceNavigation(serviceGroup.package_service.slug);
                      }}
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors duration-200 flex items-center space-x-1"
                    >
                      <span>O'tish</span>
                      <ChevronsRight className="w-4 h-4" />
                    </button>
                    {/* Expand/Collapse Icon */}
                    {expandedServices.has(serviceGroup.package_service.id) ? (
                      <ChevronUp className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                    )}
                  </div>
                </div>
              </div>

              {/* Service Items - Collapsible */}
              <div className={`overflow-hidden transition-all duration-300 ease-in-out ${expandedServices.has(serviceGroup.package_service.id)
                  ? 'max-h-[2000px] opacity-100'
                  : 'max-h-0 opacity-0'
                }`}>
                <div className="p-6">
                  <div className="space-y-4">
                    {serviceGroup.items.map((item) => (
                      <div
                        key={item.id}
                        className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg p-4"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900 dark:text-white">
                              {item.name_uz}
                            </h4>
                            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                              {item.name_ru}
                            </p>
                            <div className="mt-3 flex items-center space-x-4">
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                ID: {item.id}
                              </span>
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                Paket: {item.package}
                              </span>
                            </div>
                          </div>
                          <div className="text-right ml-4">
                            {item.limit > 0 ? (
                              <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded text-sm font-medium">
                                Limit: {item.limit}
                              </span>
                            ) : (
                              <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded text-sm font-medium">
                                Cheksiz
                              </span>
                            )}
                            <div className="mt-2">
                              <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                                Faol
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Xizmatlar mavjud emas
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            Hozircha sizda faol xizmatlar yo'q
          </p>
        </div>
      )}
    </div>
  );
}

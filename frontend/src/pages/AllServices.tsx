import { useEffect, useState, useCallback } from "react";
import { Clock, CreditCard, CheckCircle, ChevronsRight, Search, Filter, X } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import OfferTermsModal from "../components/modals/OfferTermsModal";
import { getRequest } from "../api/request";
import { interactive_services } from "../api/apiUrls";
import { services } from "../data";
import { InteractiveService } from "../types";

interface GovernmentService {
  id: number;
  title: string;
  description: string;
  price: string;
  type: string;
  category: string;
  duration: string;
  rating: number;
  popular: boolean;
  features: string[];
  orders: number;
  slug: string;
}

interface ApiResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: InteractiveService[];
}

const AllServices = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [priceFilter, setPriceFilter] = useState("all");
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [isOffer, setIsOffer] = useState(false);
  const [interactiveServices, setInteractiveServices] = useState<InteractiveService[]>([]);
  const [governmentServices, setGovernmentServices] = useState<GovernmentService[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  // Function to transform API data to government service format
  const transformGovernmentServiceData = useCallback((apiData: InteractiveService[]): GovernmentService[] => {
    return apiData.map(service => ({
      id: service.id,
      title: service.name_uz,
      description: service.description_uz ? service.description_uz.replace(/<[^>]*>/g, '') : '',
      price: service.is_free ? "Tekin" : "Pullik",
      type: "both",
      category: "Davlat xizmatlari",
      duration: getDurationText(service.duration),
      rating: service.average_rating || 4.5,
      popular: service.is_popular,
      features: service.items ? service.items.map(item => item.name_uz) : [],
      orders: service.orders,
      slug: service.slug
    }));
  }, []);

  // Helper function to convert duration codes to readable text
  const getDurationText = (duration: string): string => {
    switch (duration) {
      case 'to_1_2_day': return '1-2 kun';
      case 'to_week': return '1 hafta';
      case 'instant': return 'Darhol';
      default: return '1-3 kun';
    }
  };

  // Fetch services data
  useEffect(() => {
    const fetchServices = async () => {
      setLoading(true);
      try {
        // Fetch both interactive and government services
        const [interactiveResponse, governmentResponse] = await Promise.all([
          getRequest(`${interactive_services}?category__name=interactive&limit=20`),
          getRequest(`${interactive_services}?category__name=government&limit=20`)
        ]);

        setInteractiveServices((interactiveResponse as ApiResponse).results || []);
        setGovernmentServices(transformGovernmentServiceData((governmentResponse as ApiResponse).results || []));
      } catch (error) {
        console.error('Error fetching services:', error);
        setInteractiveServices([]);
        setGovernmentServices([]);
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, [transformGovernmentServiceData]);

  // Filter functions
  const filteredInteractiveServices = interactiveServices.filter((service) => {
    const matchesSearch =
      service.name_uz.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.description_uz.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPrice =
      priceFilter === "all" ||
      (priceFilter === "free" && service.is_free && !service.in_package) ||
      (priceFilter === "paid" && !service.is_free && !service.in_package) ||
      (priceFilter === "package" && service.in_package);

    return matchesSearch && matchesPrice;
  });

  const filteredGovernmentServices = governmentServices.filter((service) => {
    const matchesSearch =
      service.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPrice =
      priceFilter === "all" ||
      (priceFilter === "free" && service.price === "Tekin") ||
      (priceFilter === "paid" && service.price !== "Tekin");

    return matchesSearch && matchesPrice;
  });

  // Handle navigation for interactive services
  const handleInteractiveServiceClick = (service: InteractiveService) => {
    if (service.slug.startsWith("http")) {
      window.open(service.slug, '_blank');
    } else {
      navigate(`/${service.slug}`)
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">Xizmatlar yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Barcha Xizmatlar
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Yuridik va jismoniy shaxslar uchun to'liq xizmatlar to'plami
          </p>
        </div>

        {/* Search and Filter Section */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8 border border-gray-200 dark:border-gray-700">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search Input */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Xizmatlarni qidirish..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>

            {/* Price Filter */}
            <div className="lg:w-64">
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <select
                  value={priceFilter}
                  onChange={(e) => setPriceFilter(e.target.value)}
                  className="w-full pl-10 pr-8 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 appearance-none cursor-pointer"
                >
                  <option value="all">Barcha xizmatlar</option>
                  <option value="free">Tekin xizmatlar</option>
                  <option value="paid">Pullik xizmatlar</option>
                  <option value="package">Tarif bo'yicha xizmatlar</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Active Filters Display */}
          {(searchTerm || priceFilter !== "all") && (
            <div className="mt-4 flex flex-wrap gap-2">
              {searchTerm && (
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-full text-sm">
                  <span>Qidiruv: "{searchTerm}"</span>
                  <button
                    onClick={() => setSearchTerm("")}
                    className="text-blue-600 dark:text-blue-300 hover:text-blue-800 dark:hover:text-blue-100"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
              {priceFilter !== "all" && (
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 rounded-full text-sm">
                  <span>
                    {priceFilter === "free" 
                      ? "Tekin xizmatlar" 
                      : priceFilter === "paid" 
                      ? "Pullik xizmatlar"
                      : "Tarif bo'yicha xizmatlar"
                    }
                  </span>
                  <button
                    onClick={() => setPriceFilter("all")}
                    className="text-green-600 dark:text-green-300 hover:text-green-800 dark:hover:text-green-100"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
              {(searchTerm || priceFilter !== "all") && (
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setPriceFilter("all");
                  }}
                  className="px-3 py-1 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 text-sm underline"
                >
                  Hammasini tozalash
                </button>
              )}
            </div>
          )}

          {/* Results Summary */}
          <div className="mt-4 text-sm text-gray-600 dark:text-gray-300">
            Jami natijalar: <span className="font-medium">{filteredInteractiveServices.length + filteredGovernmentServices.length}</span> ta xizmat
            {(searchTerm || priceFilter !== "all") && (
              <span className="ml-2 text-blue-600 dark:text-blue-400">
                (filtrlangan)
              </span>
            )}
          </div>
        </div>

        {/* Interactive Services Section */}
        <div className="mb-16">
          <div className="text-start mb-12">
            <h2 className="text-xl md:text-xl font-bold text-gray-900 dark:text-white mb-4">
              Interaktiv xizmatlar
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              ({filteredInteractiveServices.length} ta xizmat{(searchTerm || priceFilter !== "all") ? " topildi" : ""})
            </p>
          </div>

          {filteredInteractiveServices.length === 0 ? (
            <div className="text-center py-12">
              {(searchTerm || priceFilter !== "all") ? (
                <div>
                  <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400 text-lg mb-2">
                    Qidiruv bo'yicha interaktiv xizmatlar topilmadi
                  </p>
                  <p className="text-gray-400 dark:text-gray-500 text-sm">
                    Boshqa kalit so'zlar bilan qidiring yoki filtrlarni o'zgartiring
                  </p>
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-lg">
                  Hech qanday interaktiv xizmat topilmadi.
                </p>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredInteractiveServices.map((service, index) => {
                const Icon = services[index]?.icon || ChevronsRight;
                return (
                  <div
                    key={service.id}
                    onClick={() => handleInteractiveServiceClick(service)}
                    className="group relative bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 overflow-hidden border border-gray-200 dark:border-gray-700 cursor-pointer"
                  >
                    <div className="py-6 px-5 flex flex-col h-full">
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-4">
                          <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                            <Icon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div className="flex items-center gap-1">
                            {service.in_package && (
                              <div className="bg-gradient-to-r from-green-400 to-emerald-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                                Tarif bo'yicha
                              </div>
                            )}
                            {service.is_popular && (
                              <div className="bg-gradient-to-r from-orange-400 to-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                                Mashhur
                              </div>
                            )}
                          </div>
                        </div>

                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200">
                          {service.name_uz}
                        </h3>

                        <div
                          className="text-sm text-gray-600 dark:text-gray-300 mb-4 line-clamp-3"
                          dangerouslySetInnerHTML={{ __html: service.description_uz }}
                        />
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                        <span
                          className={`font-bold ${
                            service.in_package
                              ? "text-emerald-600 dark:text-emerald-400"
                              : service.is_free
                              ? "text-green-600"
                              : "text-blue-600"
                            }`}
                        >
                          {service.in_package 
                            ? "Tarif bo'yicha" 
                            : service.is_free 
                            ? "Tekin" 
                            : "Pullik"
                          }
                        </span>
                        <button className="flex items-center space-x-1 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium text-sm transition-colors duration-200">
                          <span>O'tish</span>
                          <ChevronsRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-blue-500 to-purple-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Government Services Section */}
        <div className="mb-16">
          <div className="text-start mb-12">
            <h2 className="text-xl md:text-xl font-bold text-gray-900 dark:text-white mb-4">
              Davlat xizmatlari
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              ({filteredGovernmentServices.length} ta xizmat{(searchTerm || priceFilter !== "all") ? " topildi" : ""})
            </p>
          </div>

          {filteredGovernmentServices.length === 0 ? (
            <div className="text-center py-12">
              {(searchTerm || priceFilter !== "all") ? (
                <div>
                  <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400 text-lg mb-2">
                    Qidiruv bo'yicha davlat xizmatlari topilmadi
                  </p>
                  <p className="text-gray-400 dark:text-gray-500 text-sm">
                    Boshqa kalit so'zlar bilan qidiring yoki filtrlarni o'zgartiring
                  </p>
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-lg">
                  Hech qanday davlat xizmati topilmadi.
                </p>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredGovernmentServices.map((service) => (
                <div
                  key={service.id}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-200 dark:border-gray-700"
                >
                  <div className="p-6 flex flex-col h-full">
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-2">
                          {service.popular && (
                            <span className="text-xs font-medium px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded">
                              Mashhur
                            </span>
                          )}
                        </div>
                      </div>

                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        {service.title}
                      </h3>

                      <p className="text-gray-600 dark:text-gray-300 mb-4 text-sm leading-relaxed">
                        {service.description}
                      </p>

                      <div className="space-y-3 mb-6">
                        {service.features.slice(0, 3).map((feature, index) => (
                          <div
                            key={index}
                            className="flex items-center space-x-2"
                          >
                            <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                            <span className="text-sm text-gray-600 dark:text-gray-300">
                              {feature}
                            </span>
                          </div>
                        ))}
                        {service.features.length > 3 && (
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              +{service.features.length - 3} ta boshqa
                            </span>
                          </div>
                        )}
                        {service.features.length === 0 && (
                          <div className="flex items-center space-x-2">
                            <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                            <span className="text-sm text-gray-600 dark:text-gray-300">
                              Statistik ma'lumotlar
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                      <div>
                        <div className="flex items-center space-x-2 mb-1">
                          <CreditCard className="w-4 h-4 text-gray-400" />
                          <span
                            className={`font-bold ${service.price === "Tekin"
                                ? "text-green-600"
                                : "text-blue-600"
                              }`}
                          >
                            {service.price}
                          </span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="w-3 h-3 text-gray-400" />
                          <span className="text-xs text-gray-500">
                            {service.duration}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            setIsOffer(true);
                          }}
                          className="flex items-center space-x-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors duration-200"
                        >
                          <span>Xizmatdan foydalanish</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* No Results Found - When both sections are empty */}
        {filteredInteractiveServices.length === 0 && filteredGovernmentServices.length === 0 && (searchTerm || priceFilter !== "all") && (
          <div className="text-center py-16">
            <div className="max-w-md mx-auto">
              <Search className="w-24 h-24 text-gray-300 mx-auto mb-6" />
              <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                Hech narsa topilmadi
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                "{searchTerm}" bo'yicha hech qanday xizmat topilmadi. Iltimos, boshqa kalit so'zlar bilan qidiring.
              </p>
              <button
                onClick={() => {
                  setSearchTerm("");
                  setPriceFilter("all");
                }}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200 inline-flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                Filtrlarni tozalash
              </button>
            </div>
          </div>
        )}
      </div>

      <OfferTermsModal
        isOpen={isOffer}
        onClose={() => setIsOffer(false)}
      />
    </div>
  );
};

export default AllServices;

import { ChevronsRight, LogIn, TrendingUp } from "lucide-react";
import { services } from "../data";
import { useNavigate } from "react-router-dom";
import ServiceModal from "./modals/ServiceModal";
import OfferTermsModal from "./modals/OfferTermsModal";
import { useState, useEffect } from "react";
import Modal from "./modals/Modal";
import ModalContent from "./modals/ModalContent";
import { interactive_services } from "../api/apiUrls";
import { getRequest } from "../api/request";
import { InteractiveServicesResponse } from "../types";

const Interactive = () => {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isOffer, setIsOffer] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [interactiveData, setInteractiveData] = useState<InteractiveServicesResponse | null>(null);

  useEffect(() => {
    getRequest(`${interactive_services}?category__name=interactive&limit=7`)
      .then((res) => setInteractiveData(res as InteractiveServicesResponse))
      .catch((err) => console.error(err));
  }, []);

  const closeModal = () => setIsOpen(false);
  const handlePayment = () => {
    setIsModalOpen(false);
    navigate("/cabinet", { state: { name: "contracts", contract: true } });
  };
  const handleOffer = () => {
    setIsModalOpen(false);
    setIsOffer(true);
  };

  const handleNavigate = () => {
    setIsOffer(true);
    setIsOpen(false);
  };

  return (
    <>
      <section className="py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Interaktiv xizmatlar
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {!interactiveData ? (
            // Loading skeleton
            Array.from({ length: 7 }).map((_, index) => (
              <div
                key={index}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 animate-pulse"
              >
                <div className="py-6 px-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                    <div className="w-16 h-6 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                  </div>
                  <div className="flex items-center justify-between pt-4 mt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                    <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            interactiveData.results.slice(0, 7).map((service, index) => {
              const Icon = services[index]?.icon || ChevronsRight; // fallback icon
              return (
                <div
                  key={service.id}
                  onClick={() => {
                    // Handle each service based on its slug or name
                    if (service.slug === "books") {
                      navigate(`/books`);
                    } else if (service.slug === "ex-trade") {
                      navigate(`/ex-trade`);
                    } else if (service.slug.startsWith("http")) {
                      window.open(service.slug, '_blank');
                    } else if (service.slug === "cpi-calculator") {
                      navigate('/cpi-calculator');
                    } else if (service.name_uz.includes("Sanoat mahsulotlari")) {
                      navigate('/industry');
                    } else if (service.name_uz.includes("Statistik klassifikatsiya")) {
                      navigate('/statistical-classifications');
                    } else if (service.name_uz.includes("Hisobotlar taqvimi")) {
                      navigate('/report-calendar');
                    } else if (service.name_uz.includes("Korxona va tashkilotlar")) {
                      navigate('/orginfo');
                    }
                  }}
                  className="group relative bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 overflow-hidden border border-gray-200 dark:border-gray-700 cursor-pointer"
                >
                  <div className="py-6 px-5 flex flex-col h-full">
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-4">
                        <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                          <Icon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="flex items-center gap-1">
                          {service.is_popular && (
                            <div className=" bg-gradient-to-r from-orange-400 to-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
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
                            ? "text-emerald-700 dark:text-emerald-400"
                            : service.is_free
                            ? "text-green-700"
                            : "text-blue-600"
                        }`}
                      >
                        {service.in_package ? "Tarif bo'yicha" : service.is_free ? "Tekin" : "Pullik"}
                        {service.requires_login && (
                          <span
                            title="Sahifa ochiq, ma'lumotni ko'rish uchun tizimga kirish kerak"
                            className="ml-2 inline-flex items-center gap-1 align-middle px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-xs font-medium text-gray-600 dark:text-gray-300"
                          >
                            <LogIn className="w-3 h-3" aria-hidden /> Kirish kerak
                          </span>
                        )}
                      </span>
                      <button
                        className="flex items-center space-x-1 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium text-sm transition-colors duration-200"
                      >
                        <span>O'tish</span>
                        <ChevronsRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-blue-500 to-purple-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
                </div>
              );
            })
          )}
        </div>

        <div className="text-center mt-12">
          <button
            onClick={() => navigate("/services")}
            className="inline-flex items-center px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg"
          >
            <span>Barcha xizmatlarni ko'rish</span>
            <TrendingUp className="w-5 h-5 ml-2" />
          </button>
        </div>
      </section>

      <ServiceModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onPayment={handlePayment}
        onOffer={handleOffer}
        id="interactive-service"
      />

      <OfferTermsModal
        isOpen={isOffer}
        onClose={() => setIsOffer(false)}
      />

      <Modal
        isOpen={isOpen}
        onClose={closeModal}
        title="Obyektni qayta ixtisoslashtirilish va rekonstruksiya qilish uchun ruxsatnoma"
      >
        <ModalContent handleNavigate={handleNavigate} />
      </Modal>
    </>
  );
};

export default Interactive;

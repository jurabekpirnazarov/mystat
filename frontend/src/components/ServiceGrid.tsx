import { TrendingUp, ChevronsRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, lazy, Suspense } from "react";
import OfferTermsModal from "./modals/OfferTermsModal";
import { services } from "../data";

const ServiceModal = lazy(() => import("./modals/ServiceModal"));

const ServiceGrid = () => {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isModalOpen2, setIsModalOpen2] = useState(false);

  const handlePayment2 = () => {
    setIsModalOpen2(false);
    setIsModalOpen(true);
  };
  return (
    <section className="py-16">
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
          Yuridik va jismoniy shaxslar uchun interaktiv xizmatlar
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {services.map((service, index) => {
          const Icon = service.icon;
          return (
            <div
              key={index}
              className="group relative bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 overflow-hidden border border-gray-200 dark:border-gray-700"
            >
              <div className="py-6 px-5 flex flex-col h-full">
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                      <Icon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex items-center gap-1">
                      {service.popular && (
                        <div className=" bg-gradient-to-r from-orange-400 to-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                          Mashhur
                        </div>
                      )}
                    </div>
                  </div>

                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200">
                    {service.title}
                  </h3>

                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">
                    {service.description}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                  <span
                    className={`font-bold ${
                      service.price === "Tekin"
                        ? "text-green-600"
                        : "text-blue-600"
                    }`}
                  >
                    {service.price === "Tekin" ? "Tekin" : "Pullik"}
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

      <div className="text-center mt-12">
        <button
          onClick={() => navigate("/services")}
          className="inline-flex items-center px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg"
        >
          <span>Barcha xizmatlarni ko'rish</span>
          <TrendingUp className="w-5 h-5 ml-2" />
        </button>
      </div>

      <OfferTermsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
      <Suspense fallback={<div>Loading...</div>}>
        <ServiceModal
          id="1"
          onOffer={() => setIsModalOpen(true)}
          isOpen={isModalOpen2}
          onClose={() => setIsModalOpen2(false)}
          onPayment={handlePayment2}
        />
      </Suspense>
    </section>
  );
};

export default ServiceGrid;

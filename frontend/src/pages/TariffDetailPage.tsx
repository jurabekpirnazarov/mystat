import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Plan, ServicePackage } from "../types";
import { Check } from "lucide-react";
import { useOrder } from "../contexts/OrdersContext";
import ServiceModal from "../components/modals/ServiceModal";
import { useEffect, useState } from "react";
import OfferTermsModal from "../components/modals/OfferTermsModal";
import { useAuth } from "../contexts/AuthContext";
import { getServicePackages } from "../api/reports";
import StatCoinPackagePanel from "../components/tariff/StatCoinPackagePanel";

const TariffDetailPage = () => {
  const { id } = useParams();
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isOffer, setIsOffer] = useState(false);
  const { addItem } = useOrder();
  const { isAuthenticated, setNav } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  // Helper function to strip HTML tags and decode entities from text
  const stripHtmlTags = (text: string): string => {
    if (!text) return '';
    
    // Create a temporary div element to decode HTML entities
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = text;
    
    // Get the text content which automatically decodes HTML entities
    const decodedText = tempDiv.textContent || tempDiv.innerText || '';
    
    // Remove any remaining HTML tags and trim whitespace
    return decodedText.replace(/<[^>]*>/g, '').trim();
  };

  useEffect(() => {
    // Function to map service package to plan with detailed features
    const mapServicePackageToPlan = (pkg: ServicePackage): Plan => {
      return {
        id: pkg.id.toString(),
        name: pkg.name_uz || pkg.name_ru || pkg.name_cry,
        price: parseFloat(pkg.price) === 0 ? 'Bepul' : `${(parseFloat(pkg.price) / 1000).toFixed(0)},000`,
        period: parseFloat(pkg.price) === 0 ? '' : ' so\'m',
        description: stripHtmlTags(pkg.description_uz || pkg.description_ru || pkg.description_cry),
        icon: <></>, // Not needed for detail page
        color: 'text-blue-400',
        gradient: 'from-blue-400 to-cyan-500',
        popular: false,
        features: [], // Not needed for detail page
        detailedFeatures: pkg.package_services.map(service => ({
          category: stripHtmlTags(service.name_uz || service.name_ru || service.name_cry),
          desc: "",
          icon: Check, // Default icon for detail page
          items: service.service_items.map(item => ({
            name: stripHtmlTags(item.name_uz || item.name_ru || item.name_cry),
            included: true,
            value: item.limit > 0 ? `Limit: ${item.limit}` : item.limit < 0 ? "Cheksiz" : undefined
          }))
        }))
      };
    };

    const fetchServicePackage = async () => {
      try {
        setLoading(true);
        const response = await getServicePackages();
        const packageData = response.results.find(pkg => pkg.id.toString() === id);
        
        if (packageData) {
          const mappedPlan = mapServicePackageToPlan(packageData);
          setSelectedPlan(mappedPlan);
          setError(null);
        } else {
          setError('Tarif topilmadi');
        }
      } catch (err) {
        console.error('Error fetching service package:', err);
        setError('Tarif ma\'lumotlarini yuklashda xatolik yuz berdi');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchServicePackage();
    }
  }, [id]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  const handlePayment = () => {
    setIsModalOpen(false);
    navigate("/cabinet", { state: { name: "contracts", contract: true } });
  };
  const handleOffer = () => {
    setIsModalOpen(false);
    setIsOffer(true);
  };
  const handleDirect = () => {
    if (id) {
      addItem(id);
    }
    navigate("/cabinet", { state: { name: "payments", contract: false } });
  };

  const onNext = () => {
    if (!isAuthenticated) {
      navigate("/login");
      setNav(`tariff/${id}`);
    } else {
      setIsModalOpen(true);
    }
  };
  return (
    <>
      <div className="py-2">
        <div className="w-full">
          {loading ? (
            // Loading state
            <div className="animate-pulse">
              <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded mb-8 w-64"></div>
              <div className="space-y-4">
                {[...Array(3)].map((_, index) => (
                  <div key={index} className="bg-gray-300 dark:bg-gray-700 rounded-lg h-32"></div>
                ))}
              </div>
            </div>
          ) : error ? (
            // Error state
            <div className="text-center py-12">
              <p className="text-red-500 text-lg mb-4">{error}</p>
              <button
                onClick={() => navigate('/')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Bosh sahifaga qaytish
              </button>
            </div>
          ) : selectedPlan ? (
            <>
              <h2 className="mb-5 text-gray-700 text-3xl font-semibold dark:text-white">
                {selectedPlan.name} tarifi
              </h2>
              {id && <StatCoinPackagePanel packageId={Number(id)} />}
              <div className="grid grid-cols-1 lg:grid-cols-1 gap-4">
                {selectedPlan.detailedFeatures.map((item) => (
                  <div
                    key={item.category}
                    className={`rounded-lg border p-5 transition-all duration-200 hover:shadow-lg dark:border-gray-700 dark:bg-gray-800 border-gray-200 bg-gray-50 hover:border-blue-300 dark:hover:border-blue-500`}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div
                        className={`flex-shrink-0 p-2 dark:bg-blue-900 dark:text-blue-300 bg-blue-100 text-blue-600 rounded-lg`}
                      >
                        <item.icon />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg leading-tight dark:text-white">
                          {item?.category} {item?.desc ? `(${item?.desc})` : ""}
                        </h3>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {item.items.length ? (
                        item.items.map(
                          (subItem, index) =>
                            subItem.included && (
                              <div
                                key={index}
                                className={`flex items-start gap-2 text-sm p-2 rounded dark:bg-gray-700 bg-white dark:text-white`}
                              >
                                <div>
                                  <Check className="text-green-500" />
                                </div>
                                {subItem.value && subItem.included ? (
                                  <span className="leading-relaxed">
                                    {subItem.name} - {subItem.value}
                                  </span>
                                ) : (
                                  <span className="leading-relaxed">
                                    {subItem.name}
                                  </span>
                                )}
                              </div>
                            )
                        )
                      ) : (
                        <div
                          className={`flex items-start gap-2 text-sm p-2 rounded dark:bg-gray-700 bg-white`}
                        >
                          <div>
                            <Check className="text-green-500" />
                          </div>
                          Mavjud
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end items-center space-x-3 mt-4">
                <button
                  onClick={() => navigate("/")}
                  className={`px-4 py-2 text-lg font-medium rounded-lg border transition-colors bg-white text-blue-500 duration-200 border-blue-400 hover:border-blue-800 hover:text-blue-700  hover:bg-white dark:border-blue-500 dark:hover:text-blue-700 dark:text-blue-500 dark:hover:bg-white-800`}
                >
                  Qaytish
                </button>
                <button
                  onClick={onNext}
                  className={`px-4 py-2 text-lg font-medium rounded-lg border transition-colors bg-blue-500 text-white duration-200 border-gray-300 hover:bg-blue-600 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800`}
                >
                  Xizmatdan foydalanish
                </button>
              </div>
            </>
          ) : null}
        </div>
      </div>

      <ServiceModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onPayment={handlePayment}
        onOffer={handleOffer}
        id={id || ""}
      />

      <OfferTermsModal
        isOpen={isOffer}
        onClose={() => setIsOffer(false)}
        onPayment={handleDirect}
      />
    </>
  );
};

export default TariffDetailPage;

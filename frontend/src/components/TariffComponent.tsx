import { Check, X, Eye, Star, Zap, Rocket, Crown } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import ServiceModal from "./modals/ServiceModal";
import OfferTermsModal from "./modals/OfferTermsModal";
import { useOrder } from "../contexts/OrdersContext";
import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import ContractNotificationModal from "./modals/ContractNotificationModal";
import { getServicePackages } from "../api/reports";
import { ServicePackage, Plan } from "../types";

// Function to map API data to UI data
const mapServicePackagesToPlans = (packages: ServicePackage[]): Plan[] => {
  // Helper function to strip HTML tags from text
  const stripHtmlTags = (text: string): string => {
    if (!text) return '';
    return text.replace(/<[^>]*>/g, '').trim();
  };

  const iconMap: { [key: string]: React.ReactNode } = {
    'Start': <Star className="w-6 h-6" />,
    'Plus': <Zap className="w-6 h-6" />,
    'Pro': <Rocket className="w-6 h-6" />,
    'Premium': <Crown className="w-6 h-6" />,
    'Старт': <Star className="w-6 h-6" />,
    'Плюс': <Zap className="w-6 h-6" />,
    'Про': <Rocket className="w-6 h-6" />,
    'Премиум': <Crown className="w-6 h-6" />,
  };

  const colorMap: { [key: string]: string } = {
    'Start': 'text-green-400',
    'Plus': 'text-blue-400',
    'Pro': 'text-purple-400',
    'Premium': 'text-yellow-400',
    'Старт': 'text-green-400',
    'Плюс': 'text-blue-400',
    'Про': 'text-purple-400',
    'Премиум': 'text-yellow-400',
  };

  const gradientMap: { [key: string]: string } = {
    'Start': 'from-green-400 to-emerald-500',
    'Plus': 'from-blue-400 to-cyan-500',
    'Pro': 'from-purple-400 to-pink-500',
    'Premium': 'from-yellow-400 to-orange-500',
    'Старт': 'from-green-400 to-emerald-500',
    'Плюс': 'from-blue-400 to-cyan-500',
    'Про': 'from-purple-400 to-pink-500',
    'Премиум': 'from-yellow-400 to-orange-500',
  };

  return packages.map((pkg) => {
    const price = parseFloat(pkg.price);
    const formattedPrice = price === 0 ? 'Bepul' : 
      `${(price / 1000).toFixed(0)},000`;
    
    // Create features list from package services
    const features = pkg.package_services.slice(0, 5).map((service) => ({
      name: service.name_uz || service.name_ru || service.name_cry,
      included: true
    }));

    // Add some default features if less than 5
    while (features.length < 5) {
      const defaultFeatures = ["API kirish", "Kengaytirilgan analytics", "Premium qo'llab-quvvatlash", "Custom integratsiya", "24/7 yordam"];
      features.push({
        name: defaultFeatures[features.length] || "Qo'shimcha xizmat",
        included: features.length < 3
      });
    }

    return {
      id: pkg.id.toString(),
      name: pkg.name_uz || pkg.name_ru || pkg.name_cry,
      price: formattedPrice,
      period: price === 0 ? '' : ' so\'m',
      description: stripHtmlTags(pkg.description_uz || pkg.description_ru || pkg.description_cry),
      icon: iconMap[pkg.name_uz] || iconMap[pkg.name_ru] || <Star className="w-6 h-6" />,
      color: colorMap[pkg.name_uz] || colorMap[pkg.name_ru] || 'text-blue-400',
      gradient: gradientMap[pkg.name_uz] || gradientMap[pkg.name_ru] || 'from-blue-400 to-cyan-500',
      popular: pkg.name_uz === 'Pro' || pkg.name_ru === 'Про',
      features,
      detailedFeatures: [] // We'll populate this if needed
    };
  });
};

const TariffComponent = () => {
  const navigate = useNavigate();
  const { addItem } = useOrder();
  const { isAuthenticated, setNav } = useAuth();
  const [id, setId] = useState("");
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [isContractModalOpen, setIsContractModalOpen] = useState(false);
  const [isOffer, setIsOffer] = useState(false);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchServicePackages = async () => {
      try {
        setLoading(true);
        const response = await getServicePackages();
        const mappedPlans = mapServicePackagesToPlans(response.results);
        setPlans(mappedPlans);
        setError(null);
      } catch (err) {
        console.error('Error fetching service packages:', err);
        setError('Xizmat to\'plamlarini yuklashda xatolik yuz berdi');
      } finally {
        setLoading(false);
      }
    };

    fetchServicePackages();
  }, []);

  const handlePayment = () => {
    setIsServiceModalOpen(false);
    navigate("/cabinet", { state: { name: "contracts", contract: true } });
  };

  const handleOffer = () => {
    setIsServiceModalOpen(false);
    setIsOffer(true);
  };

  const handleDirect = () => {
    if (id) {
      addItem(id);
    }
    navigate("/cabinet", { state: { name: "payments", contract: false } });
  };

  const onNext = (id: string) => {
    if (!isAuthenticated) {
      navigate("/login");
      setNav("");
    } else {
      setIsServiceModalOpen(true);
      setId(id);
    }
  };

  const handleViewDetails = (plan: string) => {
    navigate(`/tariff/${plan}`);
  };

  return (
    <>
      <section className="py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Yuridik va jismoniy shaxslar uchun konsalting xizmatlari
          </h2>
          <Link to="/tariffs" className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline">
            Tariflarni taqqoslash va narx kalkulyatori →
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-stretch">
          {loading ? (
            // Loading skeleton
            [...Array(4)].map((_, index) => (
              <div key={index} className="animate-pulse h-full">
                <div className="bg-gray-300 dark:bg-gray-700 rounded-2xl h-full p-6 flex flex-col">
                  <div className="h-24 bg-gray-400 dark:bg-gray-600 rounded-lg mb-4"></div>
                  <div className="space-y-3 flex-grow">
                    <div className="h-4 bg-gray-400 dark:bg-gray-600 rounded"></div>
                    <div className="h-4 bg-gray-400 dark:bg-gray-600 rounded"></div>
                    <div className="h-4 bg-gray-400 dark:bg-gray-600 rounded"></div>
                    <div className="h-4 bg-gray-400 dark:bg-gray-600 rounded"></div>
                  </div>
                  <div className="mt-6 space-y-2">
                    <div className="h-10 bg-gray-400 dark:bg-gray-600 rounded-lg"></div>
                    <div className="h-10 bg-gray-400 dark:bg-gray-600 rounded-lg"></div>
                  </div>
                </div>
              </div>
            ))
          ) : error ? (
            // Error message
            <div className="col-span-full text-center py-12">
              <p className="text-red-500 text-lg mb-4">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Qayta yuklash
              </button>
            </div>
          ) : (
            plans.map((plan, index) => (
              <div
                key={plan.id}
                className={`relative group transform transition-all duration-500 hover:scale-105 h-full`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div
                  className={`relative overflow-hidden rounded-2xl transition-all duration-300 dark:bg-gray-800 border dark:border-gray-700 dark:hover:border-gray-600 bg-white border-gray-200 hover:border-gray-300 shadow-xl hover:shadow-2xl h-full flex flex-col`}
                >
                  {/* Card Header */}
                  <div
                    className={`p-6 bg-gradient-to-r ${plan.gradient} text-white relative overflow-hidden`}
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 transform rotate-45 translate-x-16 -translate-y-16 bg-white opacity-10"></div>
                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-4">
                        <div
                          className={`p-3 rounded-full bg-white bg-opacity-20 ${plan.color}`}
                        >
                          {plan.icon}
                        </div>
                      </div>
                      <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                      <p className="text-white text-opacity-90 text-sm">
                        {plan.description}
                      </p>
                    </div>
                  </div>

                  {/* Price Section */}
                  <div className={`p-6 dark:bg-gray-800 bg-white flex-grow flex flex-col justify-between`}>
                    <div className="space-y-3 mb-8 flex-grow">
                      {plan.features.map((feature, idx) => (
                        <div key={idx} className="flex items-center">
                          {feature.included ? (
                            <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                          ) : (
                            <X className="w-5 h-5 text-gray-400 mr-3 flex-shrink-0" />
                          )}
                          <span
                            className={`text-sm text-gray-500 dark:text-gray-300 `}
                          >
                            {feature.name}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Buttons */}
                    <div className="space-y-3 mt-auto">
                      <button
                        onClick={() => handleViewDetails(plan.id)}
                        className={`w-full py-3 px-4 rounded-lg border transition-all duration-200 flex items-center justify-center dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:border-gray-500 border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400`}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Batafsil ko'rish
                      </button>
                      <button
                        onClick={() => onNext(plan.id)}
                        className={`w-full py-3 px-4 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 flex items-center justify-center bg-gradient-to-r ${plan.gradient} text-white hover:shadow-lg`}
                      >
                        Tarifni tanlash
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      <ServiceModal
        isOpen={isServiceModalOpen}
        onClose={() => setIsServiceModalOpen(false)}
        onPayment={handlePayment}
        onOffer={handleOffer}
        id={id}
      />

      <OfferTermsModal
        isOpen={isOffer}
        onClose={() => setIsOffer(false)}
        onPayment={handleDirect}
      />

      <ContractNotificationModal
        isVisible={isContractModalOpen}
        onClose={() => setIsContractModalOpen(false)}
      />
    </>
  );
};

export default TariffComponent;

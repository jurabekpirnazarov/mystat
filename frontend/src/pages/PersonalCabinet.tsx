import { useEffect, useState } from "react";
import { useNotifications } from "../contexts/NotificationsContext";
import Overview from "./cabinet/Overview";
import CabinetNotifications from "./cabinet/Notifications";
import Payments from "./cabinet/Payments";
import Requests from "./cabinet/Requests";
import ActivityPlan from "./cabinet/ActivityPlan";
// Contract type for contracts list
interface Contract {
  id: string;
  title: string;
  date: string;
  amount: string;
  status: string;
}

// Order type for orders list
interface BookOrder {
  id: number;
  total_amount: string;
  status: string;
  order_type: string;
  payment_url: string;
  postal_status?: string; // New field for delivery status
  postal_tracking_number?: string; // New field for tracking number
  items: {
    id: number;
    book: {
      id: number;
      name: string;
      price: number;
      image_url: string;
      description: string;
      year: number;
    };
    quantity: number;
    price_snapshot: number;
    subtotal: number;
  }[];
}

interface ServiceOrder {
  id: number;
  service: number;
  provider: string;
  payment_url: string;
}

// Package item type for user's services
interface PackageService {
  id: number;
  name_uz: string;
  name_ru: string;
  name_cry: string;
  slug: string;
}

interface PackageItem {
  id: number;
  package: number;
  package_service: number;
  name_uz: string;
  name_ru: string;
  name_cry: string;
  limit: number;
}

interface UserPackageService {
  package_service: PackageService;
  items: PackageItem[];
}
import {
  User,
  FileText,
  CreditCard,
  Bell,
  HelpCircle,
  LogOut,
  Download,
  ChevronDown,
  ChevronUp,
  ChevronsRight,
  LayoutDashboard,
  MessageSquarePlus,
  CalendarRange,
} from "lucide-react";
import { FaTelegramPlane } from "react-icons/fa";
import { useAuth } from "../contexts/AuthContext";
import { useLocation, useNavigate } from "react-router-dom";
import PaymentModal from "../components/modals/BuyModal";
import { getRequest } from "../api/request";
import { contracts_list, order_list, profile, me_package_items_api } from "../api/apiUrls";

interface FormData {
  stir: string;
  companyName: string;
  directorName: string;
  address: string;
  phoneNumber: string;
}

const PersonalCabinet = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const tabName = location.state;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { pathname } = useLocation();
  const [profileData, setProfileData] = useState<any>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    stir: "",
    companyName: "",
    directorName: "",
    address: "",
    phoneNumber: "",
  });

  const [isAgreed, setIsAgreed] = useState(false);

  const handlePayment = () => {
    setActiveTab("payments");
    setIsModalOpen(false);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
  };

  useEffect(() => {
    window.scrollTo(0, 0);
    if (tabName?.name) {
      setActiveTab(tabName.name);
    }
  }, [pathname, tabName?.name]);
  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const menuItems = [
    { id: "overview", label: "Bosh panel", icon: LayoutDashboard },
    { id: "profile", label: "Foydalanuvchi haqida", icon: User },
    { id: "services", label: "Mening xizmatlarim", icon: FileText },
    { id: "contracts", label: "Shartnomalar", icon: FileText },
    { id: "orders", label: "Buyurtmalarim", icon: FileText },
    { id: "requests", label: "Xizmat so'rovlari", icon: MessageSquarePlus },
    { id: "plan", label: "Faoliyat rejasi", icon: CalendarRange },
    { id: "payments", label: "To'lovlar", icon: CreditCard },
    { id: "notifications", label: "Xabarnomalar", icon: Bell },
    { id: "support", label: "Qo'llab quvatlash", icon: HelpCircle },
  ];

  const [contracts, setContracts] = useState<Contract[] | null>(null);
  const [bookOrders, setBookOrders] = useState<BookOrder[]>([]);
  const [serviceOrders, setServiceOrders] = useState<ServiceOrder[]>([]);
  const [userPackageServices, setUserPackageServices] = useState<UserPackageService[]>([]);
  const [packageItemsLoading, setPackageItemsLoading] = useState(false);
  const [expandedServices, setExpandedServices] = useState<Set<number>>(new Set());

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    const headers = token ? { Authorization: `Bearer ${token}` } : undefined;

    // Fetch profile data
    if (activeTab === "profile") {
      setProfileLoading(true);
      getRequest(profile, undefined, headers)
        .then((response: any) => {
          setProfileData(response?.data || response);
        })
        .catch((error) => {
          console.error("Profile yuklashda xatolik:", error);
        })
        .finally(() => {
          setProfileLoading(false);
        });
    }

    // Fetch package items for services tab
    if (activeTab === "services") {
      setPackageItemsLoading(true);
      getRequest(me_package_items_api, undefined, headers)
        .then((response: any) => {
          console.log("Package items data:", response);
          setUserPackageServices(response?.data || response || []);
        })
        .catch((error) => {
          console.error("Package items yuklashda xatolik:", error);
        })
        .finally(() => {
          setPackageItemsLoading(false);
        });
    }

    // Fetch contracts
    getRequest(contracts_list, undefined, headers)
      .then((response: any) => {
        // getRequest javob tanasini qaytaradi: { count, results }
        setContracts(response?.results || []);
      })
      .catch((err) => {
        console.log(err);
      });

    // Fetch orders
    getRequest(order_list, undefined, headers)
      .then((response: any) => {
        console.log(response, "orders res");
        setBookOrders(response?.book_orders || []);
        setServiceOrders(response?.service_orders || []);
      })
      .catch((err) => {
        console.log(err);
      });
  }, [activeTab])

  const { unreadCount } = useNotifications();

  // Toggle service group expansion
  // Handle navigation for services
  const handleServiceNavigation = (serviceName: string) => {
    navigate(`/${serviceName}`);
  };

  const toggleServiceExpansion = (serviceId: number) => {
    setExpandedServices((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(serviceId)) {
        newSet.delete(serviceId);
      } else {
        newSet.add(serviceId);
      }
      return newSet;
    });
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const isFormValid = () => {
    return (
      Object.values(formData).every((value) => value.trim() !== "") && isAgreed
    );
  };

  const handleSubmit = () => {
    if (isFormValid()) {
      console.log("Anketa yuborildi:", formData);
      navigate("/cabinet", { state: { name: "contracts", contract: false } });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Shaxsiy Kabinet
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Xush kelibsiz, {user?.name}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {user?.name}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {user?.type === "individual"
                        ? "Jismoniy shaxs"
                        : "Yuridik shaxs"}
                    </p>
                  </div>
                </div>
              </div>

              <nav className="p-2">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors duration-200 ${activeTab === item.id
                          ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                          : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                        }`}
                    >
                      <div className="relative">
                        <Icon className="w-5 h-5" />
                        {item.id === "notifications" && unreadCount > 0 && (
                          <span className="absolute bottom-3 left-2.5 bg-red-600 text-white rounded-full w-[1rem] h-[1rem] flex items-center justify-center text-xs">
                            {unreadCount}
                          </span>
                        )}
                      </div>
                      <span className="font-medium">{item.label}</span>
                    </button>
                  );
                })}

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-200 mt-4"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="font-medium">Chiqish</span>
                </button>
              </nav>
            </div>
          </div>

          <div className="lg:col-span-3">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md">
              {activeTab === "overview" && <Overview onNavigate={setActiveTab} />}

              {/* Profile Tab */}
              {activeTab === "profile" && (
                <div className="p-6">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                    Foydalanuvchi Ma'lumotlari
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        To'liq Ism
                      </label>
                      <input
                        type="text"
                        value={profileLoading ? "Yuklanmoqda..." : (
                          profileData ?
                            `${profileData.first_name || ""} ${profileData.last_name || ""}`.trim() || profileData.username || ""
                            : user?.name || ""
                        )}
                        readOnly
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Email
                      </label>
                      <input
                        type="email"
                        value={profileLoading ? "Yuklanmoqda..." : (profileData?.email || profileData?.username || user?.email || "")}
                        readOnly
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Foydalanuvchi Nomi
                      </label>
                      <input
                        type="text"
                        value={profileLoading ? "Yuklanmoqda..." : (profileData?.username || "")}
                        readOnly
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Foydalanuvchi Turi
                      </label>
                      <input
                        type="text"
                        value={
                          profileLoading ? "Yuklanmoqda..." : (
                            profileData?.user_type === "individual" || user?.type === "individual"
                              ? "Jismoniy Shaxs"
                              : "Yuridik Shaxs"
                          )
                        }
                        readOnly
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Telefon Raqami
                      </label>
                      <input
                        type="text"
                        value={profileLoading ? "Yuklanmoqda..." : (profileData?.phone || profileData?.phone_number || "")}
                        readOnly
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Tug'ilgan Sana
                      </label>
                      <input
                        type="text"
                        value={profileLoading ? "Yuklanmoqda..." : (profileData?.birth_date || "")}
                        readOnly
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Passport Raqami
                      </label>
                      <input
                        type="text"
                        value={profileLoading ? "Yuklanmoqda..." : (profileData?.passport_number || "")}
                        readOnly
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Ro'yxatdan O'tgan Sana
                      </label>
                      <input
                        type="text"
                        value={profileLoading ? "Yuklanmoqda..." : (profileData?.date_joined || profileData?.created_at || user?.date || "")}
                        readOnly
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>

                  <div className="mt-6 flex space-x-4">
                    <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200">
                      Ma'lumotlarni Yangilash
                    </button>
                    <button className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200">
                      Parolni O'zgartirish
                    </button>
                  </div>
                </div>
              )}

              {/* Services Tab */}
              {activeTab === "services" && (
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
                                          <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded text-sm font-medium">
                                            Cheksiz
                                          </span>
                                        )}
                                        <div className="mt-2">
                                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400">
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
              )}

              {/* Contracts Tab */}
              {activeTab === "contracts" &&
                (tabName?.contract ? (
                  <div className="p-6 bg-white shadow-lg rounded-lg">
                    <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
                      Shartnoma
                    </h2>

                    <div className="space-y-4">
                      {/* STIR */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Korxona STIRi <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={formData.stir}
                          onChange={(e) =>
                            handleInputChange("stir", e.target.value)
                          }
                          placeholder="STIR raqamini kiriting"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      {/* Korxona nomi */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Korxona nomi <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={formData.companyName}
                          onChange={(e) =>
                            handleInputChange("companyName", e.target.value)
                          }
                          placeholder="Korxona nomini kiriting"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      {/* Direktor F.I.Sh */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Direktor F.I.Sh{" "}
                          <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={formData.directorName}
                          onChange={(e) =>
                            handleInputChange("directorName", e.target.value)
                          }
                          placeholder="Direktor familiya, ism, sharifini kiriting"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      {/* Manzil */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Manzil <span className="text-red-500">*</span>
                        </label>
                        <textarea
                          value={formData.address}
                          onChange={(e) =>
                            handleInputChange("address", e.target.value)
                          }
                          placeholder="To'liq manzilni kiriting"
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                        />
                      </div>

                      {/* Telefon raqam */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Telefon raqam <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="tel"
                          value={formData.phoneNumber}
                          onChange={(e) =>
                            handleInputChange("phoneNumber", e.target.value)
                          }
                          placeholder="+998 XX XXX XX XX"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>

                    {/* Xizmat shartlari */}
                    <div className="mt-8 p-4 bg-gray-50 rounded-lg">
                      <h3 className="text-lg font-semibold text-gray-800 mb-3">
                        Xizmat ko'rsatish shartlari
                      </h3>
                      <div className="text-sm text-gray-600 space-y-2">
                        <p>• To'lov xizmati 24/7 faol holda ishlaydi</p>
                        <p>• Tranzaksiya uchun 0.5% komissiya olinadi</p>
                        <p>
                          • To'lov ma'lumotlari xavfsizlik standartlariga
                          muvofiq saqlanadi
                        </p>
                        <p>
                          • Noto'g'ri ma'lumotlar uchun javobgarlik mijoz
                          zimmasida
                        </p>
                        <p>
                          • Xizmat shartlari o'zgarishi mumkin, mijozlar
                          oldindan xabardor qilinadi
                        </p>
                        <p>• Texnik yordam 24/7 mavjud</p>
                      </div>
                    </div>

                    {/* Checkbox */}
                    <div className="mt-6 flex items-start space-x-3">
                      <input
                        id="agreement"
                        type="checkbox"
                        checked={isAgreed}
                        onChange={(e) => setIsAgreed(e.target.checked)}
                        className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label
                        htmlFor="agreement"
                        className="text-sm text-gray-700"
                      >
                        Men yuqoridagi xizmat ko'rsatish shartlariga roziman va
                        ularni to'liq o'qib chiqqanman
                      </label>
                    </div>

                    {/* Submit button */}
                    <div className="mt-8">
                      <button
                        onClick={handleSubmit}
                        disabled={!isFormValid()}
                        className={`w-full py-3 px-4 rounded-md font-medium transition-colors ${isFormValid()
                            ? "bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
                            : "bg-gray-300 text-gray-500 cursor-not-allowed"
                          }`}
                      >
                        ERI bilan tasdiqlash
                      </button>
                    </div>

                    {/* Form validation status */}
                    {!isFormValid() && (
                      <div className="mt-4 text-center">
                        <p className="text-sm text-gray-500">
                          Anketa yuborish uchun barcha maydonlarni to'ldiring va
                          shartlarga rozilik bering
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-6">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                      Shartnomalar
                    </h2>

                    <div className="space-y-4">
                      {Array.isArray(contracts) && contracts.map((contract: any) => {
                        const buyer = contract.didox_contract_data?.pending_document?.document_json?.buyer;
                        const seller = contract.didox_contract_data?.pending_document?.document_json?.seller;
                        const document = contract.didox_contract_data?.pending_document?.document_json?.document;
                        const contractDoc = contract.didox_contract_data?.pending_document?.document_json?.contractdoc;
                        const contractUrl = contract.contract_url;
                        return (
                          <div
                            key={contract.id}
                            className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div>
                                <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
                                  {contractDoc?.contractno || contract.contract_number}
                                </h3>
                                <span className={`px-3 py-1 rounded-full text-sm font-medium mr-2 ${contract.status === "created"
                                    ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400"
                                    : contract.status === "active"
                                      ? "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
                                      : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                                  }`}>
                                  {contract.status}
                                </span>
                              </div>
                              <a href={contractUrl} target="_blank" rel="noopener noreferrer" className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg flex items-center gap-1">
                                <Download className="w-4 h-4" />
                                <span className="text-xs">Yuklab olish</span>
                              </a>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
                              <div>
                                <p className="text-sm text-gray-600 dark:text-gray-300"><span className="font-semibold">Boshlanish:</span> {contract.start_date?.slice(0, 10)}</p>
                                <p className="text-sm text-gray-600 dark:text-gray-300"><span className="font-semibold">Tugash:</span> {contract.end_date?.slice(0, 10)}</p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-600 dark:text-gray-300"><span className="font-semibold">Hujjat nomi:</span> {document?.documentname}</p>
                                <p className="text-sm text-gray-600 dark:text-gray-300"><span className="font-semibold">Hujjat raqami:</span> {document?.documentno}</p>
                              </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <p className="text-sm text-gray-700 dark:text-gray-200 font-semibold mb-1">Xaridor:</p>
                                <p className="text-sm text-gray-600 dark:text-gray-300">{buyer?.name}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">{buyer?.address}</p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-700 dark:text-gray-200 font-semibold mb-1">Sotuvchi:</p>
                                <p className="text-sm text-gray-600 dark:text-gray-300">{seller?.name}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">{seller?.address}</p>
                              </div>
                            </div>
                            {contract.notes && (
                              <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                                <span className="font-semibold">Izoh:</span> {contract.notes}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}

              {/* Orders Tab */}
              {activeTab === "orders" && (
                <div className="p-6">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                    Buyurtmalarim
                  </h2>

                  {/* Book Orders Section */}
                  {bookOrders.length > 0 && (
                    <div className="mb-8">
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                        Kitob buyurtmalari
                      </h3>
                      <div className="space-y-4">
                        {bookOrders.map((order) => (
                          <div
                            key={order.id}
                            className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm"
                          >
                            <div className="flex items-center justify-between mb-4">
                              <div>
                                <h4 className="font-semibold text-gray-900 dark:text-white text-lg">
                                  Buyurtma #{order.id}
                                </h4>
                                <div className="flex gap-2 mt-2">
                                                                    {/* Payment Status */}
                                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${order.status === "paid"
                                      ? "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
                                      : order.status === "pending"
                                        ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400"
                                        : order.status === "cancelled"
                                          ? "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
                                          : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                                    }`}>
                                    {order.status === "paid" ? "To'langan" :
                                      order.status === "pending" ? "Kutilmoqda" :
                                        order.status === "cancelled" ? "Bekor qilingan" : order.status}
                                  </span>
                                  {/* Delivery Status */}
                                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                    order.postal_status === "processing" || (!order.postal_status && order.status === "paid")
                                      ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                                      : order.postal_status === "sent"
                                        ? "bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400"
                                        : order.postal_status === "delivered"
                                          ? "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
                                          : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                                  }`}>
                                    {order.postal_status === "processing" ? "Tayyorlanmoqda" :
                                      order.postal_status === "sent" ? "Yetkazilmoqda" :
                                        order.postal_status === "delivered" ? "Yetkazildi" :
                                          order.status === "paid" ? "Tayyorlanmoqda" : "Kutilmoqda"}
                                  </span>
                                  
                                  {/* Postal Tracking Number */}
                                  {order.postal_tracking_number && (
                                    <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                                      Pochta raqami: {order.postal_tracking_number}
                                    </span>
                                  )}
                                  

                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-xl font-bold text-gray-900 dark:text-white">
                                  {Number(order.total_amount).toLocaleString()} so'm
                                </p>
                                <span className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                                  {order.order_type === "electron" ? "Elektron" : "Bosma"}
                                </span>
                              </div>
                            </div>

                            {/* Book Items */}
                            <div className="space-y-3">
                              {order.items.map((item) => (
                                <div key={item.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                                  <div className="flex items-start space-x-4">
                                    <img
                                      src={item.book.image_url}
                                      alt={item.book.name}
                                      className="w-16 h-20 object-cover rounded-md"
                                      onError={(e) => {
                                        e.currentTarget.src = '/placeholder-book.jpg';
                                      }}
                                    />
                                    <div className="flex-1">
                                      <h5 className="font-medium text-gray-900 dark:text-white">
                                        {item.book.name}
                                      </h5>
                                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                                        Yil: {item.book.year}
                                      </p>
                                      <div className="flex items-center justify-between mt-2">
                                        <span className="text-sm text-gray-500 dark:text-gray-400">
                                          Miqdori: {item.quantity} dona
                                        </span>
                                        <span className="font-semibold text-gray-900 dark:text-white">
                                          {Number(item.subtotal).toLocaleString()} so'm
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>

                            {/* Payment URL */}
                            {order.payment_url && order.status !== "paid" && (
                              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                                <a
                                  href={order.payment_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                  <CreditCard className="w-4 h-4 mr-2" />
                                  To'lov qilish
                                </a>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Service Orders Section */}
                  {serviceOrders.length > 0 && (
                    <div className="mb-8">
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                        Xizmat buyurtmalari
                      </h3>
                      <div className="space-y-4">
                        {serviceOrders.map((order) => (
                          <div
                            key={order.id}
                            className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm"
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="font-semibold text-gray-900 dark:text-white text-lg">
                                  Xizmat buyurtmasi #{order.id}
                                </h4>
                                <p className="text-sm text-gray-600 dark:text-gray-300">
                                  Xizmat ID: {order.service}
                                </p>
                                <span className="inline-block mt-2 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded text-xs font-medium">
                                  {order.provider.toUpperCase()}
                                </span>
                              </div>
                              <div>
                                <a
                                  href={order.payment_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                                >
                                  <CreditCard className="w-4 h-4 mr-2" />
                                  To'lov qilish
                                </a>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Empty State */}
                  {bookOrders.length === 0 && serviceOrders.length === 0 && (
                    <div className="text-center py-8">
                      <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                        Buyurtmalar mavjud emas
                      </h3>
                      <p className="text-gray-500 dark:text-gray-400">
                        Hozircha sizda hech qanday buyurtma yo'q
                      </p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "payments" && <Payments />}

              {activeTab === "notifications" && <CabinetNotifications onNavigate={setActiveTab} />}

              {activeTab === "requests" && <Requests />}

              {activeTab === "plan" && <ActivityPlan />}

              {/* Support Tab */}
              {activeTab === "support" && (
                <div className="p-6">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                    Qo'llab-quvvatlash
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                          Telefon Qo'llab-quvvatlash
                        </h3>
                        <p className="text-gray-600 dark:text-gray-300 mb-2">
                          +998 71 233-45-67
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Dushanba - Juma: 09:00 - 18:00
                        </p>
                      </div>

                      <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                          Email Yordam
                        </h3>
                        <p className="text-gray-600 dark:text-gray-300 mb-2">
                          support@stat.uz
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          24 soat ichida javob
                        </p>
                      </div>


                      <div className="">
                        <a
                          href="https://t.me/MyStatUzRobot?start=MTA4c0c6e3b"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors w-fit"
                        >
                          <FaTelegramPlane className="w-5 h-5" />
                          <span>Telegram sahifamizga o'tish</span>
                        </a>
                      </div>

                    </div>



                    <div>
                      <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                          Tezkor Murojaat
                        </h3>
                        <form className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Mavzu
                            </label>
                            <input
                              type="text"
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                              placeholder="Muammoning qisqacha tavsifi"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Xabar
                            </label>
                            <textarea
                              rows={4}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                              placeholder="Batafsil tavsif..."
                            />
                          </div>
                          <button className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200">
                            Yuborish
                          </button>
                        </form>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <PaymentModal
        isOpen={isModalOpen}
        onClose={handleCancel}
        onPayment={handlePayment}
      />
    </div>
  );
};

export default PersonalCabinet;

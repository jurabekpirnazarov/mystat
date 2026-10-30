import { useEffect, useState } from "react";
import { useNotifications } from "../contexts/NotificationsContext";
import Overview from "./cabinet/Overview";
import CabinetNotifications from "./cabinet/Notifications";
import Payments from "./cabinet/Payments";
import Requests from "./cabinet/Requests";
import ActivityPlan from "./cabinet/ActivityPlan";
import type { BookOrder, Contract, FormData, ServiceOrder, UserPackageService } from "./cabinet/types";
import ProfileTab from "./cabinet/ProfileTab";
import ServicesTab from "./cabinet/ServicesTab";
import ContractsTab from "./cabinet/ContractsTab";
import OrdersTab from "./cabinet/OrdersTab";
import SupportTab from "./cabinet/SupportTab";
import Benchmark from "./cabinet/Benchmark";
import MyReports from "./cabinet/MyReports";
import CustomRequests from "./cabinet/CustomRequests";
import CitizenHome from "./cabinet/CitizenHome";
import CitizenQuestions from "./cabinet/CitizenQuestions";
import ApiKeys from "./cabinet/ApiKeys";
import Credits from "./cabinet/Credits";
import Subscriptions from "./cabinet/Subscriptions";
import Consultations from "./cabinet/Consultations";
import OnboardingTour from "../components/OnboardingTour";
import {
  User,
  FileText,
  CreditCard,
  Bell,
  HelpCircle,
  LogOut,
  LayoutDashboard,
  MessageSquarePlus,
  CalendarRange,
  BarChart3,
  CalendarClock,
  Database,
  BellRing,
  KeyRound,
  Coins,
  CalendarCheck,
  Star,
  Building,
  Settings,
  ShoppingBag,
} from "lucide-react";
import FavoritesTab from "./cabinet/FavoritesTab";
import { useAuth } from "../contexts/AuthContext";
import { useLocation, useNavigate } from "react-router-dom";
import PaymentModal from "../components/modals/BuyModal";
import { unwrap, type MaybeWrapped, type UserProfile } from "../types/api";
import { getRequest } from "../api/request";
import { contracts_list, order_list, profile, me_package_items_api } from "../api/apiUrls";
import { loginUrl } from "../utils/loginRedirect";


const PersonalCabinet = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const tabName = location.state;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { pathname } = useLocation();
  const [profileData, setProfileData] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [roleData, setRoleData] = useState<string | null>(null);
  useEffect(() => {
    getRequest(profile)
      .then((r) => setRoleData(unwrap(r as MaybeWrapped<UserProfile>)?.role ?? null))
      .catch(() => setRoleData(null));
  }, []);
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

  // Bo'lim: router state ({name}) yoki MG-04 katalogidagi havola `?tab=reports`
  const tabParam = new URLSearchParams(location.search).get("tab");
  useEffect(() => {
    window.scrollTo(0, 0);
    if (tabName?.name) {
      setActiveTab(tabName.name);
    } else if (tabParam) {
      setActiveTab(tabParam);
    }
  }, [pathname, tabName?.name, tabParam]);
  const handleLogout = () => {
    logout();
    navigate("/");
  };

  // FQ-04: jismoniy shaxsga korxona bo'limlari ko'rinmaydi; xodimlar (employee/manager/admin) navbatlar uchun hammasini ko'radi
  type Audience = "all" | "legal" | "citizen";
  // MYGOV_DIZAYN MG-12: my.gov.uz kabineti tartibi — avval kundalik bo'limlar (hisobotlar, xabarnomalar), keyin
  // xizmatlar, arizalar, shartnoma va to'lovlar, tanlanganlar, korxona pasporti, oxirida sozlamalar
  const menuItems: { id: string; label: string; icon: typeof User; audience: Audience; to?: string }[] = [
    { id: "overview", label: "Bosh panel", icon: LayoutDashboard, audience: "all" },
    { id: "reports", label: "Hisobotlarim", icon: CalendarClock, audience: "legal" },
    { id: "questions", label: "Savollarim", icon: HelpCircle, audience: "citizen" },
    { id: "notifications", label: "Xabarnomalar", icon: Bell, audience: "all" },
    { id: "services", label: "Mening xizmatlarim", icon: FileText, audience: "legal" },
    { id: "requests", label: "Arizalarim", icon: MessageSquarePlus, audience: "legal" },
    { id: "custom", label: "Individual ma'lumot", icon: Database, audience: "legal" },
    { id: "contracts", label: "Shartnomalar", icon: FileText, audience: "legal" },
    { id: "payments", label: "To'lovlar tarixi", icon: CreditCard, audience: "all" },
    { id: "orders", label: "Buyurtmalarim", icon: ShoppingBag, audience: "all" },
    { id: "favorites", label: "Tanlanganlar", icon: Star, audience: "all" },
    { id: "passport", label: "Korxona pasporti", icon: Building, audience: "legal", to: "/cabinet/organization" },
    { id: "benchmark", label: "Tarmoq benchmarki", icon: BarChart3, audience: "legal" },
    { id: "consultations", label: "Konsultatsiyalarim", icon: CalendarCheck, audience: "legal" },
    { id: "plan", label: "Faoliyat rejasi", icon: CalendarRange, audience: "legal" },
    { id: "subscriptions", label: "Obunalarim", icon: BellRing, audience: "all" },
    { id: "credits", label: "Hamyon", icon: Coins, audience: "all" },
    { id: "api-keys", label: "API kalitlarim", icon: KeyRound, audience: "all" },
    { id: "profile", label: "Sozlamalar", icon: Settings, audience: "all" },
    { id: "support", label: "Qo'llab quvatlash", icon: HelpCircle, audience: "all" },
  ];

  const isStaff = ["employee", "manager", "admin"].includes(roleData ?? "");
  const isCitizen = user?.type === "individual" && !isStaff;
  const visibleItems = menuItems.filter((i) => isStaff || i.audience === "all" || (i.audience === "citizen") === isCitizen);

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
        .then((response) => {
          setProfileData(unwrap(response as MaybeWrapped<UserProfile>));
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
        .then((response) => {
          setUserPackageServices((unwrap(response as MaybeWrapped<UserPackageService[]>) ?? []).filter((g) => "package_service" in g));
        })
        .catch((error) => {
          console.error("Package items yuklashda xatolik:", error);
        })
        .finally(() => {
          setPackageItemsLoading(false);
        });
    }

    // Fetch contracts
    getRequest<{ results?: Contract[] }>(contracts_list, undefined, headers)
      .then((response) => {
        // getRequest javob tanasini qaytaradi: { count, results }
        setContracts(response?.results || []);
      })
      .catch((err) => {
        console.error(err);
      });

    // Fetch orders
    getRequest<{ book_orders?: BookOrder[]; service_orders?: ServiceOrder[] }>(order_list, undefined, headers)
      .then((response) => {
        setBookOrders(response?.book_orders || []);
        setServiceOrders(response?.service_orders || []);
      })
      .catch((err) => {
        console.error(err);
      });
  }, [activeTab])

  const { unreadCount } = useNotifications();

  // Toggle service group expansion
  // Handle navigation for services
  // PackageService.slug: ba'zilari alohida sahifa emas, kabinet bo'limi yoki boshqa sahifa (aks holda 404)
  const SLUG_TARGETS: Record<string, { tab?: string; path?: string }> = {
    "cabinet/statistic-byulleten": { tab: "requests" },
    "cabinet/statistical-prints": { tab: "requests" },
    "cabinet/statistical-analysis": { tab: "requests" },
    benchmark: { tab: "benchmark" },
    "partners-export": { path: "/partners" },
  };
  const handleServiceNavigation = (serviceName: string) => {
    const target = SLUG_TARGETS[serviceName];
    if (target?.tab) {
      setActiveTab(target.tab);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    navigate(target?.path ?? `/${serviceName}`);
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
      navigate("/cabinet", { state: { name: "contracts", contract: false } });
    }
  };

  return (
    <div className="py-2">
      <div className="w-full">
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
            <div className="bg-mg-surface rounded-mg overflow-hidden">
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
                {visibleItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => (item.to ? navigate(item.to) : setActiveTab(item.id))}
                      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors duration-200 ${activeTab === item.id
                          ? "bg-mg-info text-mg-primary"
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
            <div className="bg-mg-surface rounded-mg">
              {activeTab === "overview" && (isCitizen ? <CitizenHome onNavigate={setActiveTab} /> : <Overview onNavigate={setActiveTab} />)}

              {activeTab === "questions" && <CitizenQuestions />}

              {activeTab === "subscriptions" && <Subscriptions />}

              {activeTab === "favorites" && <FavoritesTab />}

              {activeTab === "api-keys" && <ApiKeys />}

              {activeTab === "credits" && <Credits />}

              {activeTab === "consultations" && <Consultations />}

              {isCitizen && !visibleItems.some((i) => i.id === activeTab) && (
                <div className="p-6 text-sm text-gray-700 dark:text-gray-200">
                  Bu bo'lim korxonalar uchun. <a href={loginUrl()} className="text-blue-600 underline">Korxona sifatida kirish</a> yoki <button type="button" className="text-blue-600 underline" onClick={() => setActiveTab("overview")}>bosh panelga qaytish</button>.
                </div>
              )}

              {activeTab === "profile" && <ProfileTab profileData={profileData} profileLoading={profileLoading} user={user} />}

              {activeTab === "services" && <ServicesTab userPackageServices={userPackageServices} packageItemsLoading={packageItemsLoading} expandedServices={expandedServices} toggleServiceExpansion={toggleServiceExpansion} handleServiceNavigation={handleServiceNavigation} />}

              {activeTab === "contracts" && <ContractsTab contracts={contracts} formData={formData} handleInputChange={handleInputChange} isFormValid={isFormValid} handleSubmit={handleSubmit} isAgreed={isAgreed} setIsAgreed={setIsAgreed} tabName={tabName} />}

              {activeTab === "orders" && <OrdersTab bookOrders={bookOrders} serviceOrders={serviceOrders} />}

              {activeTab === "payments" && <Payments />}

              {activeTab === "notifications" && <CabinetNotifications onNavigate={setActiveTab} />}

              {activeTab === "requests" && <Requests />}

              {activeTab === "plan" && <ActivityPlan />}

              {activeTab === "benchmark" && <Benchmark />}

              {activeTab === "reports" && <MyReports />}

              {activeTab === "custom" && <CustomRequests />}

              {activeTab === "support" && <SupportTab />}
            </div>
          </div>
        </div>
      </div>

      <OnboardingTour citizen={isCitizen} onNavigate={setActiveTab} />

      <PaymentModal
        isOpen={isModalOpen}
        onClose={handleCancel}
        onPayment={handlePayment}
      />
    </div>
  );
};

export default PersonalCabinet;

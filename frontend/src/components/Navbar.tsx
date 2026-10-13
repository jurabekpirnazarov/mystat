import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Info,
  BarChart3,
  Grid3X3,
  Phone,
  LogIn,
  User,
  Menu,
  X,
  HelpCircle,
  Bell,
  FileText,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useOrder } from "../contexts/OrdersContext";
import { getRequest } from "../api/request";
import { profile } from "../api/apiUrls";
import logo from "../img/stat.png";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [profileData, setProfileData] = useState<any>(null);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const location = useLocation();
  const { isAuthenticated, user, logout } = useAuth();
  const { notifications } = useOrder();
  const unreadCount = notifications.filter(n => !n.read).length;
  const navigate = useNavigate();

  // Profile ma'lumotlarini yuklash
  useEffect(() => {
    if (isAuthenticated) {
      const token = localStorage.getItem("access_token");
      const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
      
      getRequest(profile, undefined, headers)
        .then((response: any) => {
          setProfileData(response?.data || response);
        })
        .catch((error) => {
          console.error("Profile yuklashda xatolik:", error);
        });
    }
  }, [isAuthenticated]);

  // Dropdown tashqarisini bosganida yopish
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const dropdown = document.querySelector('.profile-dropdown');
      if (dropdown && !dropdown.contains(event.target as Node)) {
        setIsProfileDropdownOpen(false);
      }
    };

    if (isProfileDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isProfileDropdownOpen]);

  const navItems = [
    // { path: "/", label: "Asosiy", icon: Home },
    { path: "/about", label: "Portal haqida", icon: Info },
    { path: "/statistics", label: "Statistika", icon: BarChart3 },
    {
      path: "/questions",
      label: "Savol va javoblar",
      icon: HelpCircle,
    },
    { path: "/services", label: "Barcha xizmatlar", icon: Grid3X3 },
    { path: "/reglaments", label: "Xizmatlar reglamenti", icon: FileText },
    { path: "/contact", label: "Aloqa", icon: Phone },
  ];

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <>
      <nav className="bg-white dark:bg-gray-800 shadow-lg sticky top-0 z-30 transition-colors duration-300">
        <div className="max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-10 h-10  rounded-full flex items-center justify-center">
                <img src={logo} />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-xs text-gray-600 dark:text-gray-300 ">
                  MILLIY STATISTIKA QO‘MITASI
                </h1>
                <p className="text-xs font-bold text-gray-900 dark:text-white">
                  INTERAKTIV XIZMATLAR PLATFORMASI
                </p>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                    isActive(item.path)
                      ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20"
                      : "text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-700"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => {
                navigate("/cabinet", {
                  state: { name: "notifications", contract: false },
                });
              }}
              className="relative p-2 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-0 right-0 bg-red-600 text-white rounded-full w-[1.15rem] h-[1.15rem] flex items-center justify-center text-xs">
                  {unreadCount}
                </span>
              )}
            </button>

            {isAuthenticated ? (
              <div className="flex items-center space-x-3 relative">
                <button
                  onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200"
                >
                  <User className="w-4 h-4" />
                  <span className="hidden sm:inline">
                    {profileData ? 
                      `${profileData.first_name || ""} ${profileData.last_name || ""}`.trim() || profileData.username
                      : user?.name || "Foydalanuvchi"}
                  </span>
                </button>
                
                {/* Profile Dropdown */}
                {isProfileDropdownOpen && (
                  <div className="profile-dropdown absolute top-12 right-0 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50">
                    <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {profileData ? 
                          `${profileData.first_name || ""} ${profileData.last_name || ""}`.trim() || profileData.username
                          : user?.name || "Foydalanuvchi"}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {profileData?.email || "Email ma'lumoti yo'q"}
                      </p>
                      {profileData?.phone && (
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {profileData.phone}
                        </p>
                      )}
                    </div>
                    <Link
                      to="/cabinet"
                      className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      onClick={() => setIsProfileDropdownOpen(false)}
                    >
                      Shaxsiy kabinet
                    </Link>
                    <button
                      onClick={() => {
                        handleLogout();
                        setIsProfileDropdownOpen(false);
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      Chiqish
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                className="flex items-center space-x-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200"
              >
                <LogIn className="w-4 h-4" />
                <span>Login</span>
              </Link>
            )}

            {/* Mobile menu button */}

            <button
              onClick={() => setIsOpen(!isOpen)}
              className="md:hidden p-2 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              {isOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 bg-white dark:bg-gray-800 border-t dark:border-gray-700">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 ${
                      isActive(item.path)
                        ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20"
                        : "text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-700"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
      </nav>
      {/* Animated warning bar below navbar */}
      <div className="relative w-full flex justify-center bg-red-600 overflow-hidden" style={{ minHeight: '38px' }}>
        <div className="absolute left-0 top-0 w-full h-full flex items-center">
          <div className="w-full overflow-hidden">
            <div className="animate-marquee whitespace-nowrap text-white font-bold text-lg py-2 tracking-wide" style={{ animation: 'marquee 20s linear infinite' }}>
              Ushbu platforma test sinovida ishlamoqda!!!
            </div>
          </div>
        </div>
        <style>{`
          @keyframes marquee {
            0% { transform: translateX(100%); }
            100% { transform: translateX(-100%); }
          }
          .animate-marquee {
            display: inline-block;
            min-width: 100%;
            will-change: transform;
          }
        `}</style>
      </div>
    </>
  );
};

export default Navbar;

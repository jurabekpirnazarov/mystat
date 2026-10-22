import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { Key, User, Mail, Lock, Shield, Building, AlertCircle } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { setStorage, setStorageR } from "../api/storage";
import { postRequest, getRequest } from "../api/request";
import { login_api, oneid_login } from "../api/apiUrls";
import { getCurrentDate } from "../utils/getCurrentDate";
import toast from "react-hot-toast";
import type { LoginResponse } from "../types/api";
import { rememberReturnTo, safeReturnPath, takeReturnTo } from "../utils/loginRedirect";

const Login = () => {
  const [userType, setUserType] = useState<"individual" | "legal">(
    "individual"
  );
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const [searchParams] = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  const { login } = useAuth();
  const navigate = useNavigate();
  const { user, nav } = useAuth();

  const { pathname } = useLocation();
  // Login talab qilgan sahifa (`?next=`) — kirgandan keyin o'sha yerga qaytariladi
  const next = safeReturnPath(searchParams.get("next"));

  useEffect(() => {
    window.scrollTo(0, 0);
    
    // Check for errors in URL params
    const errorParam = searchParams.get("error");
    if (errorParam === "oneid_failed") {
      setError("OneID autentifikatsiyasi muvaffaqiyatsiz tugadi. Qaytadan urinib ko'ring.");
    } else if (errorParam === "no_code") {
      setError("OneID dan kod olinmadi. Qaytadan urinib ko'ring.");
    }
  }, [pathname, searchParams]);

  useEffect(() => {
    if (user) {
      navigate(next ?? (takeReturnTo() || `/${nav}`), { replace: true });
    }
  }, [navigate, user, nav, next]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // If individual user, use OneID login
    if (userType === "individual") {
      handleOneIDLogin();
      return;
    }

    // Regular login for legal entities
    postRequest<LoginResponse>(login_api, {
      username: formData.username,
      password: formData.password,
    })
      .then((response: LoginResponse) => {
        // Handle both response structures
        const tokens = response?.data?.tokens || response?.tokens;
        const userData = response?.data?.user || response?.user;
        // login/ javobida faqat {id, username, tokens} keladi — ilgari ism undefined bo'lib,
        // AuthContext'dagi 'ООО "Технологии"' zaxira nomi ko'rinardi
        const username = response?.data?.username || response?.username || userData?.username || formData.username;
        const userName = response?.data?.name || response?.name || userData?.name || username;

        if (tokens?.access) {
          setStorage(tokens.access);
          setStorageR(tokens.refresh);
          login(
            userData?.email || username,
            userName,
            userType,
            getCurrentDate()
          );
          navigate(next ?? (takeReturnTo() || `/${nav}`));
        } else {
          console.error("No tokens found in response:", response);
          setError("Login jarayonida xatolik yuz berdi");
        }
      })
      .catch((error) => {
        console.error(error);
        setError("Username yoki parol noto'g'ri");
        toast.error("Username yoki parol noto'g'ri kiritildi", {
          duration: 3000,
          position: "top-center",
          icon: "⚠️",
        });
      });
  };

  const handleOneIDLogin = () => {
    // Get current origin for redirect URI
    const redirectUri = `${window.location.origin}/auth/oneid/callback`;
    rememberReturnTo(next);
    
    getRequest<{ one_id_url?: string }>(`${oneid_login}?redirect_uri=${encodeURIComponent(redirectUri)}`)
      .then((response: { one_id_url?: string }) => {
        
        // Redirect to OneID URL
        if (response?.one_id_url) {
          window.location.href = response.one_id_url;
        } else {
          console.error("OneID URL not found in response");
        }
      })
      .catch((error) => {
        console.error("OneID login error:", error);
      });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="py-2 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-mg-primary rounded-xl flex items-center justify-center mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Kirish
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 mt-2">
            Shaxsiy kabinetingizga xush kelibsiz
          </p>
          
          {/* Error message */}
          {error && (
            <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
              </div>
            </div>
          )}
        </div>

        {/* User Type Selection */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Foydalanuvchi Turi
          </h2>

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setUserType("individual")}
              className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                userType === "individual"
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                  : "border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500"
              }`}
            >
              <User
                className={`w-8 h-8 mx-auto mb-2 ${
                  userType === "individual" ? "text-blue-600" : "text-gray-400"
                }`}
              />
              <div className="text-center">
                <h3
                  className={`font-medium ${
                    userType === "individual"
                      ? "text-blue-600"
                      : "text-gray-700 dark:text-gray-300"
                  }`}
                >
                  Jismoniy Shaxs
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  OneID orqali
                </p>
              </div>
            </button>

            <button
              onClick={() => setUserType("legal")}
              className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                userType === "legal"
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                  : "border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500"
              }`}
            >
              <Building
                className={`w-8 h-8 mx-auto mb-2 ${
                  userType === "legal" ? "text-blue-600" : "text-gray-400"
                }`}
              />
              <div className="text-center">
                <h3
                  className={`font-medium ${
                    userType === "legal"
                      ? "text-blue-600"
                      : "text-gray-700 dark:text-gray-300"
                  }`}
                >
                  Yuridik Shaxs
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  E-Ri kalit orqali
                </p>
              </div>
            </button>
          </div>
        </div>

        {/* Login Form */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {userType === "legal" && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Username
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
                      <Mail className="w-5 h-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleChange}
                      required
                      className="pl-10 block w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Username"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Parol
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
                      <Lock className="w-5 h-5 text-gray-400" />
                    </div>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      className="pl-10 block w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="remind"
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label
                      htmlFor="remind"
                      className="ml-2 block text-sm text-gray-700 dark:text-gray-300"
                    >
                      Meni eslab qolish
                    </label>
                  </div>
                  <button
                    type="button"
                    className="text-sm text-blue-600 hover:text-blue-500"
                  >
                    Parolni unutdingizmi?
                  </button>
                </div>
              </>
            )}

            {userType === "individual" && (
              <div className="text-center py-8">
                <div className="mx-auto w-16 h-16 bg-green-700 rounded-xl flex items-center justify-center mb-4">
                  <Shield className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  OneID orqali kirish
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                  Xavfsiz va tezkor autentifikatsiya uchun OneID dan foydalaning
                </p>
              </div>
            )}

            <button
              type="submit"
              className={`w-full flex items-center justify-center space-x-2 py-3 px-4 border border-transparent rounded-lg shadow-sm text-white transition-colors duration-200 ${
                userType === "individual" 
                  ? "bg-green-600 hover:bg-green-700 focus:ring-green-500" 
                  : "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500"
              } focus:outline-none focus:ring-2 focus:ring-offset-2`}
            >
              <Key className="w-5 h-5" />
              <span>
                {userType === "individual"
                  ? "OneID orqali kirish"
                  : "E-Ri kalit orqali kirish"}
              </span>
            </button>
          </form>

          {/* Authentication Info */}
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="flex items-start space-x-3">
              <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                  Xavfsiz Autentifikatsiya
                </h4>
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                  {userType === "individual"
                    ? "OneID platformasi orqali xavfsiz kirish imkoniyati"
                    : "E-Ri kalit orqali korporativ xavfsizlik"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;

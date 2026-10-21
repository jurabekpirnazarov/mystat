import { useEffect, useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { setStorage, setStorageR } from "../api/storage";
import { postRequest } from "../api/request";
import { oneid_login } from "../api/apiUrls";
import { getCurrentDate } from "../utils/getCurrentDate";
import { Shield, AlertCircle } from "lucide-react";
import type { LoginResponse } from "../types/api";
import { takeReturnTo } from "../utils/loginRedirect";

const OneIDCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(true);
  const hasProcessed = useRef(false); // Bir marta ishlatish uchun

  useEffect(() => {
    // Agar allaqachon ishlagan bo'lsa, takrorlamaslik
    if (hasProcessed.current) {
      return;
    }

    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const token = searchParams.get("token"); // URL dan to'g'ridan-to'g'ri token olish
    const accessToken = searchParams.get("access_token"); // Boshqa token formati
    const authToken = searchParams.get("auth_token"); // Yana bir variant


    // Agar URL da token bo'lsa, uni localStorage ga saqlash
    const receivedToken = token || accessToken || authToken;
    if (receivedToken) {
      hasProcessed.current = true; // Ishlaganligi belgisi
      setStorage(receivedToken);
      login(
        "Foydalanuvchi", // Haqiqiy ism keyinroq profile API orqali yuklanadi
        "Foydalanuvchi", 
        "individual",
        getCurrentDate()
      );
      navigate(takeReturnTo() || "/"); // login talab qilgan sahifaga yoki bosh sahifaga
      return;
    }

    if (code) {
      hasProcessed.current = true; // Ishlaganligi belgisi
      
      // Add a delay to ensure the component is fully mounted
      setTimeout(() => {
        // Send the code to your backend to complete the OneID authentication
        postRequest<LoginResponse>(oneid_login, {
          code: code,
          state: state || "state"
        })
          .then((response: LoginResponse) => {

            // Handle both response structures
            const tokens = response?.data?.tokens || response?.tokens;
            const userData = response?.data?.user || response?.user || response?.data || response;
            const firstName = userData?.first_name || "";
            const lastName = userData?.last_name || "";
            const fullName = `${firstName} ${lastName}`.trim() || userData?.username || "Foydalanuvchi";

            // Save tokens and login user
            if (tokens?.access) {
              setStorage(tokens.access);
              setStorageR(tokens.refresh);
              login(
                fullName,
                fullName,
                "individual",
                getCurrentDate()
              );
              navigate(takeReturnTo() || "/"); // login talab qilgan sahifaga yoki bosh sahifaga
            } else if (response?.data?.access || response?.access) {
              // Alternative token structure
              const accessToken = response?.data?.access || response?.access || "";
              const refreshToken = response?.data?.refresh || response?.refresh;
              
              setStorage(accessToken);
              if (refreshToken) {
                setStorageR(refreshToken);
              }
              login(
                fullName,
                fullName,
                "individual",
                getCurrentDate()
              );
              navigate(takeReturnTo() || "/"); // login talab qilgan sahifaga yoki bosh sahifaga
            } else {
              console.error("No access token in response:", response);
              setError("OneID autentifikatsiyasida xatolik yuz berdi");
              setIsProcessing(false);
            }
          })
          .catch((error) => {
            console.error("OneID callback error:", error);
            console.error("Error details:", error.response?.data);
            setError("OneID bilan bog'lanishda xatolik yuz berdi");
            setIsProcessing(false);
            // Navigate to login with error after 3 seconds
            setTimeout(() => navigate("/login?error=oneid_failed"), 3000);
          });
      }, 500);
    } else {
      console.error("No authorization code received");
      setError("Autentifikatsiya kodi topilmadi");
      setIsProcessing(false);
      setTimeout(() => navigate("/login?error=no_code"), 3000);
    }
  }, []); // Dependencies bo'sh - faqat bir marta ishlaydi

  return (
    <div className="flex items-center justify-center py-10">
      <div className="text-center">
        <div className={`mx-auto w-16 h-16 rounded-xl flex items-center justify-center mb-4 ${
          error 
            ? 'bg-gradient-to-br from-red-500 to-red-600' 
            : 'bg-gradient-to-br from-green-500 to-green-600 animate-pulse'
        }`}>
          {error ? (
            <AlertCircle className="w-8 h-8 text-white" />
          ) : (
            <Shield className="w-8 h-8 text-white" />
          )}
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          {error ? "Xatolik yuz berdi" : "OneID orqali kirish"}
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          {error || (isProcessing ? "Autentifikatsiya jarayoni amalga oshirilmoqda..." : "Jarayon tugallandi")}
        </p>
        {isProcessing && !error && (
          <div className="mt-6">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
          </div>
        )}
        {error && (
          <div className="mt-6">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              3 soniyadan keyin login sahifasiga yo'naltirilasiz...
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default OneIDCallback;

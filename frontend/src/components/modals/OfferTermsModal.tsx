import React, { useState } from "react";
import { postRequest } from "../../api/request";
import { getStorage } from "../../api/storage";
import { X, Download, FileText } from "lucide-react";
import { order_create } from "../../api/apiUrls";
import RatingModal from "./RatingModal";
import { createRating } from "../../api/rating";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPayment?: () => void;
}
const OfferTermsModal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  onPayment,
}) => {
  const [isAgreed, setIsAgreed] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<0 | 1 | null>(null);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [showRating, setShowRating] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleRatingSubmit = async (rating: number, comment: string) => {
    try {
      await createRating({
        service: 1, // Service ID
        value: rating,
        comment: comment || "Oferta orqali xizmat yakunlandi"
      });
      setShowRating(false);
    } catch (error) {
      console.error('Rating submission error:', error);
      setShowRating(false);
    }
  };

  // Payment handler
  const handlePayment = async () => {
    const provider = selectedIndex === 0 ? "click" : "other";
    const payload = {
      service: 1,
      provider,
    };
    try {
      const token = getStorage();
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      const response = await postRequest(order_create, payload, headers) as { data: { payment_url?: string } };
      if (response?.data?.payment_url) {
        window.open(response.data.payment_url, "_blank");
        setIsSuccess(true);
        // 2 soniyadan keyin rating ko'rsatish
        setTimeout(() => {
          setIsSuccess(false);
          onClose();
          setShowRating(true);
        }, 2000);
        // Call the onPayment callback if provided
        onPayment?.();
      }
    } catch {
      alert("To'lovga o'tishda xatolik yuz berdi.");
    }
  };

  React.useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    setIsDarkMode(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsDarkMode(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const handleDownload = () => {
    // Oferta shartlarini yuklash funksiyasi
    const element = document.createElement("a");
    const file = new Blob(["Oferta shartlari mazmuni..."], {
      type: "text/plain",
    });
    element.href = URL.createObjectURL(file);
    element.download = "oferta-shartlari.txt";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  if (!isOpen) return null;

  // const themeClasses = isDarkMode
  //   ? "bg-gray-900 text-white"
  //   : "bg-white text-gray-900";

  // const cardClasses = isDarkMode
  //   ? "bg-gray-800 border-gray-700"
  //   : "bg-blue-50 border-blue-200";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className={`relative w-full max-w-md mx-4 rounded-xl shadow-2xl bg-white text-gray-900 dark:bg-gray-900 dark:text-white transition-all duration-300 transform`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <FileText className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold">Oferta Shartlari</h2>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className={`p-2 rounded-lg transition-colors 
                dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-300 bg-gray-100 hover:bg-gray-200 dark:text-gray-600"
              `}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Oferta haqida qisqacha ma'lumot */}
          <div
            className={`p-4 rounded-lg border bg-blue-50 border-blue-200 dark:bg-gray-800 dark:border-gray-700`}
          >
            <h3 className="font-medium text-blue-800 dark:text-blue-300 mb-2">
              Oferta shartlari haqida
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
              Ushbu oferta shartlari xizmatlarimizdan foydalanish
              tartib-qoidalarini, foydalanuvchi huquq va majburiyatlarini,
              shuningdek xizmat ko'rsatish shart-sharoitlarini belgilaydi.
              Xizmatdan foydalanishdan oldin ushbu hujjat bilan tanishib chiqish
              majburiydir.
            </p>
          </div>

          {/* Yuklash qismi */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">To'liq oferta shartlari</span>
            <button
              onClick={handleDownload}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" />
              <span className="text-sm">Yuklash</span>
            </button>
          </div>

          {/* Checkbox qismi */}
          <div className="flex items-start space-x-3">
            <input
              type="checkbox"
              id="agreement"
              checked={isAgreed}
              onChange={(e) => setIsAgreed(e.target.checked)}
              className="mt-1 w-4 h-4"
            />
            <label
              htmlFor="agreement"
              className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed cursor-pointer"
            >
              Men oferta shartlari bilan tanishib chiqdim va ularga to'liq
              roziman. Xizmatdan foydalanish uchun zarur bo'lgan barcha
              majburiyatlarni o'z zimmamga olaman.
            </label>
          </div>
            <span className="text-sm font-medium">To'lov turini tanlang :</span>

          <div
            style={{
              width: "100%",
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <div
              style={{
                width: "45%",
                height: "100px",
                border: selectedIndex === 0 ? (isDarkMode ? "2px solid #1AC081" : "2px solid #0065FF") : "none",
                backgroundColor: isDarkMode ? (selectedIndex === 0 ? "#1e293b" : "#334155") : "#2BB0E4",
                borderRadius: "15px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                boxShadow: selectedIndex === 0 ? (isDarkMode ? "0 0 0 2px #60A5FA33" : "0 0 0 2px #0065FF33") : undefined,
                transition: "border 0.2s, box-shadow 0.2s"
              }}
              onClick={() => setSelectedIndex(0)}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="157"
                height="40"
                viewBox="0 0 157 40"
                fill="none"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M39.3739 20.1572C39.3739 27.7941 27.2594 40.0006 19.6797 40.0006C12.1 40.0006 -0.0146637 27.7941 -0.0146637 20.1572C-0.0146637 12.5203 12.1 0.313477 19.6797 0.313477C27.2594 0.313477 39.3739 12.5203 39.3739 20.1572ZM27.5573 20.1572C27.5573 23.212 22.7113 28.0945 19.6797 28.0945C16.6477 28.0945 11.8019 23.212 11.8019 20.1572C11.8019 17.1025 16.6479 12.2197 19.6797 12.2197C22.7113 12.2197 27.5573 17.1025 27.5573 20.1572Z"
                  fill="#0065FF"
                />
                <path
                  d="M60.8212 39.9981C68.1709 39.9981 72.7769 35.3571 74.1744 29.2556H66.1004C65.1172 31.3415 63.5644 32.906 60.8212 32.906C57.5088 32.906 55.0764 30.5073 55.0764 26.3874C55.0764 22.2678 57.5088 19.8687 60.8212 19.8687C63.5644 19.8687 65.1172 21.4332 66.1004 23.5194H74.1744C72.7769 17.4179 68.1709 12.7766 60.8212 12.7766C52.9541 12.7766 47.2093 18.826 47.2093 26.3874C47.2093 33.9491 52.9541 39.9981 60.8212 39.9981ZM76.9305 39.4246H84.7459V0.313209H76.9305V39.4246ZM93.2986 9.80409C96.0417 9.80409 98.2155 7.61389 98.2155 4.90212C98.2155 2.19056 96.0417 0.000366211 93.2986 0.000366211C90.6592 0.000366211 88.4334 2.19056 88.4334 4.90212C88.4334 7.61389 90.6592 9.80409 93.2986 9.80409ZM89.4169 39.4246H97.2323V13.3504H89.4169V39.4246ZM113.963 39.9981C121.312 39.9981 125.918 35.3571 127.316 29.2556H119.242C118.258 31.3415 116.706 32.906 113.963 32.906C110.65 32.906 108.218 30.5073 108.218 26.3874C108.218 22.2678 110.65 19.8687 113.963 19.8687C116.706 19.8687 118.258 21.4332 119.242 23.5194H127.316C125.918 17.4179 121.312 12.7766 113.963 12.7766C106.096 12.7766 100.351 18.826 100.351 26.3874C100.351 33.9491 106.096 39.9981 113.963 39.9981ZM147.514 39.4246H156.985L145.185 25.136L154.708 13.3504H145.443L137.887 22.6849V0.313209H130.072V39.4246H137.887V27.7954L147.514 39.4246Z"
                  fill="white"
                />
              </svg>
            </div>
            <div
              style={{
                width: "45%",
                height: "100px",
                border: selectedIndex === 1 ? (isDarkMode ? "2px solid #1AC081" : "2px solid #0065FF") : "none",
                backgroundColor: isDarkMode ? (selectedIndex === 1 ? "#1e293b" : "#334155") : "#EFF6FF",
                borderRadius: "15px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                boxShadow: selectedIndex === 1 ? (isDarkMode ? "0 0 0 2px #60A5FA33" : "0 0 0 2px #0065FF33") : undefined,
                transition: "border 0.2s, box-shadow 0.2s"
              }}
              onClick={() => setSelectedIndex(1)}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="148"
                height="48"
                viewBox="0 0 148 48"
                fill="none"
              >
                <path
                  d="M9.33133 0.00354838H129.561C130.946 0.00354838 132.168 0.574714 132.861 1.67448L145.048 21.4418C145.985 22.9904 145.824 24.8635 144.477 26.4138L127.319 46.1812C126.382 47.2402 125.16 47.8929 123.771 47.8929H3.90385C1.50051 47.8929 -0.253665 46.018 0.0301249 43.6535L4.55834 4.23941C4.84568 1.8359 6.92267 0 9.32779 0H9.32956L9.33133 0.00354838Z"
                  fill="#00C0C9"
                />
                <path
                  d="M71.2824 13.3552L65.0426 27.5599L61.8003 13.3552H55.3955L61.1014 33.9225L57.7775 40.6559H64.099L77.5222 13.3552H71.2806H71.2824ZM10.8564 40.6559H16.6032L17.5468 32.899C18.4496 33.5961 20.1328 34.3766 22.2666 34.3766C28.9179 34.3766 32.9814 28.5053 32.9814 22.1036C32.9814 16.6438 30.3954 12.8266 25.5514 12.8266C23.251 12.8266 21.158 13.5645 19.5581 14.8806L19.7621 13.3623H14.1803L10.8564 40.663V40.6577V40.6559ZM18.0399 28.8725L19.3134 18.7742C20.5443 17.7897 21.9402 17.3782 23.1711 17.419C25.633 17.458 26.9881 19.4305 26.9881 22.5098C26.9881 26.492 24.8952 29.8995 21.3638 29.8995C20.2552 29.8995 18.9835 29.5306 18.0399 28.8725ZM34.09 28.3403C34.0474 31.6645 36.7594 34.3766 40.9027 34.3766C43.8186 34.3766 45.9506 33.1456 47.1815 31.7904L46.935 33.8835H52.5168L53.8719 22.7599C54.5299 17.2593 52.7225 12.784 45.6615 12.784C42.7881 12.784 39.2993 13.4421 37.4103 14.6731L36.8338 19.2708C38.3539 18.4478 41.3089 17.4474 44.0173 17.4474C47.2596 17.4474 48.4107 19.0651 48.2865 20.791H44.8385C39.8296 20.791 34.1237 22.7191 34.0829 28.3439H34.0882L34.09 28.3403ZM39.8793 27.8862C39.8793 25.669 42.4653 24.8477 45.1311 24.8477H47.8396L47.4281 28.1718C46.2787 29.0747 44.2266 30.0184 42.5008 30.0184C40.9417 30.0184 39.8739 29.1563 39.8739 27.8827H39.8757L39.8793 27.8862ZM110.353 24.4787C110.272 29.6104 114.007 34.3713 121.641 34.3713C124.349 34.3713 126.65 33.8374 128.7 32.5638L129.112 27.7195C127.43 28.7465 124.883 29.4436 122.668 29.4436C119.752 29.4436 117.125 28.1701 116.389 25.2149H130.593C130.797 24.681 130.962 23.4074 130.962 22.1763C130.962 16.7591 127.964 12.8159 121.806 12.8159C115.648 12.8159 110.435 16.47 110.353 24.4734V24.477V24.4787ZM116.428 21.7276C117.004 19.0189 118.971 17.4154 121.394 17.4154C123.817 17.4154 125.13 18.7706 125.13 20.9471C125.13 21.1936 125.13 21.481 125.091 21.7276H116.43H116.428ZM82.2012 33.8799L84.0902 18.8558C85.3637 17.9937 86.7986 17.2966 88.0331 17.2966C89.6329 17.2966 90.4134 18.4886 90.1686 20.5391L88.5262 33.8817H94.3155L96.1229 19.3081L96.1619 18.8966C97.4354 18.0345 98.9129 17.2966 100.144 17.2966C101.744 17.2966 102.524 18.4886 102.279 20.5391L100.637 33.8817H106.426L108.234 19.3081C108.727 15.2443 106.632 12.7822 102.898 12.7822C100.312 12.7822 97.5613 14.2598 95.7149 15.615C94.9345 13.8075 93.2105 12.7822 90.7876 12.7822C88.3647 12.7822 86.0253 13.9742 84.1788 15.2053L84.4254 13.3587H79.0086L76.4225 33.8853H82.2118H82.2047L82.2012 33.8799Z"
                  fill="white"
                />
                {/* Removed invalid <script xmlns="" /> */}
              </svg>
            </div>
          </div>

          {/* Xizmatlarga o'tish tugmasi */}
          <button
            onClick={handlePayment}
            disabled={!(isAgreed && selectedIndex !== null)}
            className={`w-full py-3 px-4 rounded-lg font-medium transition-all duration-200 ${
              isAgreed && selectedIndex !== null
                ? "bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                : "bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
            }`}
          >
            To'lovga o'tish
          </button>
        </div>
      </div>
      
      {/* Success Message */}
      {isSuccess && (
        <div className="absolute inset-0 bg-white bg-opacity-95 flex items-center justify-center rounded-xl">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Muvaffaqiyatli!</h3>
            <p className="text-gray-600">Buyurtma yaratildi</p>
          </div>
        </div>
      )}
      
      <RatingModal
        isOpen={showRating}
        onClose={() => setShowRating(false)}
        onSubmit={handleRatingSubmit}
        serviceName="Oferta xizmati"
      />
    </div>
  );
};

export default OfferTermsModal;

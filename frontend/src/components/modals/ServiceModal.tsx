import React, { useState } from "react";
import { useNotifications } from "../../contexts/NotificationsContext";
import { X } from "lucide-react";
import { createContract } from "../../api/contracts";
import ContractConfirm from "./ContractConfirm";
import RatingModal from "./RatingModal";
import { createRating } from "../../api/rating";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPayment?: () => void;
  onOffer: () => void;
  id?: string;
}

const ServiceModal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  onOffer,
  id,
}) => {
  // Avval doim 1-paket uchun shartnoma yaratilardi (service_package_id: 1) — endi tanlangan tarif
  const packageId = Number(id) || 1;
  const [step, setStep] = useState<"choose" | "confirm">("choose");
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<null | { success: boolean; message: string }>(null);
  const [showRating, setShowRating] = useState(false);
  const { refresh: refreshNotifications } = useNotifications();

  if (!isOpen && !pending && !result && !showRating) return null;
  function onContract() {
    setPending(true);
    createContract(packageId)
      .then(() => {
        setStep("choose");
        setPending(false);
        setResult({ success: true, message: "Shartnoma muvaffaqiyatli yaratildi! Shartnomani shaxsiy kabinetdan olishingiz mumkin." });
        // 2 soniyadan keyin rating ko'rsatish
        setTimeout(() => {
          setResult(null);
          setShowRating(true);
        }, 2000);
        refreshNotifications();
      })
      .catch(() => {
        setPending(false);
        setResult({ success: false, message: "Xatolik yuz berdi. Qayta urinib ko‘ring." });
      });
  }

  function handleResultClose() {
    setResult(null);
    setStep("choose");
    onClose();
  }

  const handleRatingSubmit = async (rating: number, comment: string) => {
    try {
      await createRating({
        service: 1, // Service ID
        value: rating,
        comment: comment || "Xizmat yakunlandi"
      });
      setShowRating(false);
      onClose();
    } catch (error) {
      console.error('Rating submission error:', error);
      setShowRating(false);
      onClose();
    }
  };

  return (
    <>
      {(pending || result) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          {pending && (
            <div className="bg-white rounded-xl shadow-xl px-8 py-6 text-center">
              <span className="block text-lg font-semibold mb-2">Shartnoma yaratilish jarayonida...</span>
              <span className="text-gray-500 text-sm">Iltimos, kuting.</span>
            </div>
          )}
          {result && (
            <div className="bg-white rounded-xl shadow-xl px-8 py-6 text-center">
              <span className={`block text-lg font-semibold mb-2 ${result.success ? "text-green-700" : "text-red-600"}`}>
                {result.message}
              </span>
              <button
                onClick={handleResultClose}
                className="mt-4 px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
              >
                Yopish
              </button>
            </div>
          )}
        </div>
      )}
      {!pending && !result && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 dark:bg-black dark:bg-opacity-60 bg-gray-600 bg-opacity-50">
          <div
            className="relative w-full max-w-2xl transform transition-all duration-300 scale-100 opacity-100 dark:bg-gray-900 dark:text-white bg-white text-gray-900 rounded-xl shadow-2xl"
            style={{ animation: "modalFadeIn 0.3s ease-out" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 pb-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold">{step === "confirm" ? "Shartnoma tuzish" : "Xizmat parametlari"}</h2>
              <button
                onClick={() => {
                  setStep("choose");
                  onClose();
                }}
                className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200 dark:text-gray-300 dark:hover:text-white text-gray-500 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>

            {step === "confirm" ? (
              <ContractConfirm packageId={packageId} pending={pending} onBack={() => setStep("choose")} onConfirm={onContract} />
            ) : (
            <>
            {/* Body */}
            <div className="p-6 space-y-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-green-400 rounded-full mt-2"></div>
                  <p className="flex-1">
                    Oferta orqali xizmatda foydalanishda siz to'g'ridan to'g'ri
                    shartnoma tuzmasdan click yoki payme orqali to'lov qilish orqali
                    xizmatlardan foydalana olasiz.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-green-400 rounded-full mt-2"></div>
                  <p className="flex-1">
                    Shartnoma orqali xizmatdan foydalanishda ikki tomonlama
                    shartnoma imzolanadi va sizga yuborilgan to'lov rekvizitlari
                    orqali bank orqali to'lovni amalga oshirasiz va to'lov
                    tasdiqlangandan so'ng bizning xizmatlardan foydanala olasiz.
                  </p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between space-x-3 p-6 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={onOffer}
                className="px-4 py-2 w-1/2 text-sm font-medium rounded-lg border transition-colors duration-200 border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                Oferta orqali xizmatdan foydalanish
              </button>
              <button
                onClick={() => setStep("confirm")}
                className="px-4 py-2 w-1/2 text-sm font-medium text-white rounded-lg transition-colors duration-200 cursor-pointer dark:bg-blue-600 dark:hover:bg-blue-700 bg-blue-600 hover:bg-blue-700"
                disabled={pending}
              >
                Shartnoma orqali xizmatdan foydalanish
              </button>
            </div>
            </>
            )}
          </div>
        </div>
      )}
      
      <RatingModal
        isOpen={showRating}
        onClose={() => {
          setShowRating(false);
          onClose();
        }}
        onSubmit={handleRatingSubmit}
        serviceName="Shartnoma xizmati"
      />
    </>
  );
};

export default ServiceModal;

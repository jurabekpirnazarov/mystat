import React from "react";
import { X } from "lucide-react";

interface Feature {
  name: string;
  included: boolean;
  value?: string;
}

interface Plan {
  id: string;
  name: string;
  price: string;
  originalPrice?: string;
  period: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  gradient: string;
  popular?: boolean;
  features: Feature[];
  detailedFeatures: {
    category: string;
    items: Feature[];
  }[];
}

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPayment: () => void;
  selectedPlan: Plan | null;
  setOpen: (value: React.SetStateAction<boolean>) => void;
}

const TariffDetailModal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  onPayment,
  selectedPlan,
}) => {
  const handleCancel = () => {
    onClose();
  };

  if (!isOpen) return null;
  console.log(selectedPlan);

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 dark:bg-black dark:bg-opacity-60 bg-gray-600 bg-opacity-80`}
    >
      <div
        className={`relative w-full max-w-md transform transition-all duration-300 scale-100 opacity-100 dark:bg-gray-900 dark:text-white bg-white text-gray-900 rounded-xl shadow-2xl`}
        style={{ animation: "modalFadeIn 0.3s ease-out" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold">Xizmat parametlari</h2>
          <button
            onClick={onClose}
            className={`p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200 dark:text-gray-300 dark:hover:text-white text-gray-500 hover:text-gray-70`}
          >
            <X size={20} />
          </button>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
          {selectedPlan?.detailedFeatures.map((item) => (
            <div
              key={item.category}
              className={`rounded-lg border p-5 transition-all duration-200 hover:shadow-lg dark:border-gray-700 dark:bg-gray-800 border-gray-200 bg-gray-50 hover:border-blue-300 dark:hover:border-blue-500`}
            >
              <div className="flex items-start gap-3 mb-3">
                <div
                  className={`flex-shrink-0 p-2 dark:bg-blue-900 dark:text-blue-300 bg-blue-100 text-blue-600 rounded-lg`}
                >
                  {selectedPlan?.icon}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-2 leading-tight">
                    {selectedPlan?.description}
                  </h3>
                </div>
              </div>

              <div className="space-y-2">
                {item.items.map((subItem, index) => (
                  <div
                    key={index}
                    className={`flex items-start gap-2 text-sm p-2 rounded dark:bg-gray-700 bg-white`}
                  >
                    <div
                      className={`w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0 dark:bg-blue-400 bg-blue-50`}
                    ></div>
                    {subItem.value ? (
                      <span className="leading-relaxed">
                        {subItem.name} - {subItem.value}
                      </span>
                    ) : (
                      <span className="leading-relaxed">{subItem.name}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleCancel}
            className={`px-4 py-2 text-sm font-medium rounded-lg border transition-colors duration-200 border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800`}
          >
            Bekor qilish
          </button>
          <button
            onClick={onPayment}
            className={`px-4 py-2 text-sm font-medium rounded-lg border transition-colors bg-blue-500 text-white duration-200 border-gray-300 hover:bg-blue-600 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800`}
          >
            Xizmatdan foydalanish
          </button>
        </div>
      </div>
    </div>
  );
};

export default TariffDetailModal;

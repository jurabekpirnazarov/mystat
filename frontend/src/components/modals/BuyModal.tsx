import React from "react";
import { X, CreditCard, Package } from "lucide-react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPayment: () => void;
}

const PaymentModal: React.FC<ModalProps> = ({ isOpen, onClose, onPayment }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-500 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 text-white hover:text-gray-200 transition-colors"
          >
            <X size={24} />
          </button>
          <div className="flex items-center gap-3">
            <Package className="text-white" size={28} />
            <h2 className="text-2xl font-bold">Xizmat tavsifi</h2>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-800 mb-2">
              Xizmat ma'lumotlari
            </h3>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex justify-between gap-3">
                <span>Xizmat nomi:</span>
                <span className="font-medium flex-1 text-end">
                  Korxonalar va tashkilotlarning yagona davlat registri
                  ma'lumotlari
                </span>
              </div>
              <div className="flex justify-between">
                <span>Tarif:</span>
                <span className="font-medium">1-tarif</span>
              </div>
              <div className="flex justify-between">
                <span>Narxi:</span>
                <span className="font-medium">150,000 so'm</span>
              </div>
              <div className="flex justify-between">
                <span>Xizmat ko'rsatish davomiyligi:</span>
                <span className="font-medium">30 kun</span>
              </div>
              <hr className="my-2" />
              <div className="flex justify-between font-semibold text-gray-800">
                <span>Jami:</span>
                <span>150,000 so'm</span>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
            <div className="flex items-start">
              <CreditCard className="text-blue-400 mr-2 mt-0.5" size={16} />
              <div className="text-sm">
                <p className="text-blue-800 font-medium">To'lov ma'lumoti</p>
                <p className="text-blue-600 mt-1">
                  To'lovni amalga oshirish uchun xavfsiz to'lov tizimiga
                  yo'naltirilasiz.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium"
          >
            Bekor qilish
          </button>
          <button
            onClick={onPayment}
            className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg hover:from-blue-700 hover:to-blue-600 font-medium shadow-lg"
          >
            To'lovga o'tish
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;

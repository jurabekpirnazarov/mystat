import React, { useState, useEffect } from 'react';
import { CheckCircle, X } from 'lucide-react';

interface NotificationModalProps {
  isVisible: boolean;
  onClose: () => void;
}

const NotificationModal: React.FC<NotificationModalProps> = ({ isVisible, onClose }) => {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (!isVisible) return;

    // Start the countdown
    const duration = 10000; // 10 seconds
    const interval = 50; // Update every 50ms for smooth animation
    const decrement = (interval / duration) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev <= 0) {
          clearInterval(timer);
          onClose();
          return 0;
        }
        return prev - decrement;
      });
    }, interval);

    // Auto close after 10 seconds
    const autoCloseTimer = setTimeout(() => {
      onClose();
    }, duration);

    return () => {
      clearInterval(timer);
      clearTimeout(autoCloseTimer);
      setProgress(100);
    };
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  return (
    <div className="fixed top-6 right-6 z-50 animate-in slide-in-from-right duration-300">
      <div className="bg-white rounded-lg shadow-2xl border border-gray-200 max-w-sm w-full overflow-hidden">
        {/* Progress bar */}
        <div className="h-1 bg-gray-200">
          <div 
            className="h-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all duration-75 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
        
        {/* Modal content */}
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircle className="h-6 w-6 text-green-500" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-semibold text-gray-900">
                  Muvaffaqiyatli
                </h3>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          <div className="mt-2">
            <p className="text-sm text-gray-700 leading-relaxed">
              Sizning shartnoma uchun bergan arizangiz qabul qilindi
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationModal;
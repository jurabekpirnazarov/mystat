import React, { useState, useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface NotificationModalProps {
  isVisible: boolean;
  onClose: () => void;
  duration?: number;
}

const NotificationModal: React.FC<NotificationModalProps> = ({
  isVisible,
  onClose,
  duration = 10000, // 10 seconds by default
}) => {
  const [progress, setProgress] = useState(100);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setIsAnimating(true);
      setProgress(100);

      const interval = setInterval(() => {
        setProgress((prev) => {
          const newProgress = prev - (100 / (duration / 100));
          if (newProgress <= 0) {
            clearInterval(interval);
            handleClose();
            return 0;
          }
          return newProgress;
        });
      }, 100);

      return () => clearInterval(interval);
    } else {
      setIsAnimating(false);
    }
  }, [isVisible, duration]);

  const handleClose = () => {
    setIsAnimating(false);
    setTimeout(() => {
      onClose();
      setProgress(100);
    }, 300);
  };

  if (!isVisible && !isAnimating) return null;

  return (
    <div className={`fixed bottom-4 right-4 z-50 transition-all duration-300 ease-in-out ${
      isVisible && isAnimating 
        ? 'translate-x-0 opacity-100' 
        : 'translate-x-full opacity-0'
    }`}>
      <div className="bg-white rounded-lg shadow-2xl border-l-4 border-amber-400 min-w-[320px] max-w-[400px] overflow-hidden">
        {/* Progress bar */}
        <div className="w-full h-1 bg-gray-200">
          <div 
            className="h-full bg-gradient-to-r from-amber-400 to-amber-500 transition-all duration-100 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
        
        {/* Content */}
        <div className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <AlertTriangle className="w-6 h-6 text-amber-500" />
            </div>
            
            <div className="flex-1 min-w-0">
              <p className="text-gray-800 font-medium text-sm leading-relaxed">
                Sizning shartnomangiz ko'rib chiqilmoqda
              </p>
            </div>
            
            <button
              onClick={handleClose}
              className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors duration-200 p-1 rounded-full hover:bg-gray-100"
              aria-label="Yopish"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationModal;
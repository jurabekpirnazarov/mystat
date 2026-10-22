import React from "react";
import { Star, Share2, FileText } from "lucide-react";
import { ServiceInfo } from "../types";

interface ServiceHeaderProps {
  serviceInfo: ServiceInfo;
  handleNavigate: () => void;
}

const ServiceHeader: React.FC<ServiceHeaderProps> = ({
  serviceInfo,
  handleNavigate,
}) => {
  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Star
        key={index}
        size={16}
        className={`${
          index < rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
        }`}
      />
    ));
  };

  return (
    <div className="bg-mg-primary px-8 py-6 text-white shadow-lg">
      <div className="flex items-start gap-4 mb-6">
        <div className="bg-white/20 p-4 rounded-xl shadow-lg backdrop-blur-sm">
          <FileText size={32} />
        </div>
        <div className="flex items-center gap-8 mb-6">
          <div className="text-center">
            <div className="text-2xl font-bold">
              {Math.floor(serviceInfo.rating)}
            </div>
            <div className="flex items-center gap-1 mb-1">
              {renderStars(Math.floor(serviceInfo.rating))}
            </div>
          </div>

          <div className="text-center">
            <div className="text-2xl font-bold">{serviceInfo.usage}</div>
            <div className="text-sm opacity-90">so'm</div>
          </div>

          <div className="text-center">
            <div className="text-2xl font-bold">{serviceInfo.totalUsage}</div>
            <div className="text-sm opacity-90">marotaba foydalanilgan</div>
          </div>
        </div>
      </div>

      {/* Stats */}

      {/* Actions */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleNavigate}
          className="bg-white text-blue-600 hover:bg-blue-50 px-8 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105"
        >
          Xizmatdan foydalanish
        </button>
        <button className="bg-white/20 hover:bg-white/30 p-3 rounded-xl transition-all duration-200 backdrop-blur-sm hover:scale-110">
          <Share2 size={20} />
        </button>
      </div>
    </div>
  );
};

export default ServiceHeader;

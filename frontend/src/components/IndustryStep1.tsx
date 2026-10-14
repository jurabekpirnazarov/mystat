import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Star, 
  Clock, 
  Users, 
  ChevronDown, 
  ChevronUp, 
  Heart, 
  Share2, 
  Phone, 
  MapPin, 
  Info,
  ArrowLeft,
  FileText,
  Building,
  MessageCircle,
  User,
  Shield,
  Download,
  ArrowRight
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getServiceInfo } from '../api/serviceInfo';
import type { ServiceInfoData, ServiceReview } from '../api/serviceInfo';

interface ExpandableItemProps {
  icon: React.ReactNode;
  title: string;
  content: string;
  isOpen: boolean;
  onToggle: () => void;
}

const ExpandableItem: React.FC<ExpandableItemProps> = ({ icon, title, content, isOpen, onToggle }) => (
  <div className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-500 mb-4 overflow-hidden transform hover:scale-[1.02]">
    <button
      onClick={onToggle}
      className="w-full p-6 flex items-center justify-between hover:bg-gradient-to-r hover:from-gray-50 hover:to-blue-50 transition-all duration-400"
    >
      <div className="flex items-center gap-4">
        <div className="p-2 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg text-blue-600 transition-all duration-300 hover:scale-110 hover:rotate-3">
          {icon}
        </div>
        <span className="text-gray-800 font-medium text-left transition-colors duration-300 hover:text-blue-700">{title}</span>
      </div>
      <div className="text-gray-400 transform transition-all duration-500 hover:text-blue-500">
        {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
      </div>
    </button>
    <div className={`overflow-hidden transition-all duration-700 ease-in-out ${
      isOpen ? 'max-h-40 opacity-100 py-2' : 'max-h-0 opacity-0 py-0'
    }`}>
      <div className="px-6 pb-6 text-gray-600 bg-gradient-to-r from-gray-50 to-blue-50 transform transition-all duration-500">
        {content}
      </div>
    </div>
  </div>
);

const StarRating: React.FC<{ rating: number; size?: number }> = ({ rating, size = 20 }) => (
  <div className="flex gap-1">
    {[1, 2, 3, 4, 5].map((star) => (
      <Star
        key={star}
        size={size}
        className={`transition-colors duration-200 ${
          star <= rating
            ? 'text-yellow-400 fill-yellow-400'
            : 'text-gray-300'
        }`}
      />
    ))}
  </div>
);

interface BookStep1Props {
  onNext: () => void;
  serviceId?: number | null;
}

const IndustryStep1: React.FC<BookStep1Props> = ({ onNext, serviceId }) => {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [liked, setLiked] = useState(false);
  const [serviceData, setServiceData] = useState<ServiceInfoData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchServiceData = async () => {
      if (!serviceId) {
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        const data = await getServiceInfo(serviceId);
        setServiceData(data);
      } catch (error) {
        console.error('Service data loading error:', error);
        toast.error('Xizmat ma\'lumotlarini yuklashda xatolik yuz berdi');
      } finally {
        setLoading(false);
      }
    };

    fetchServiceData();
  }, [serviceId]);
  const [termsAccepted, setTermsAccepted] = useState(false);

  const toggleItem = (id: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };

  const ratingDistribution = serviceData?.rating_counts ? 
    Object.entries(serviceData.rating_counts)
      .map(([stars, count]: [string, number]) => ({
        stars: parseInt(stars),
        count: count,
        percentage: serviceData.ratings_total > 0 ? Math.round((count / serviceData.ratings_total) * 100) : 0
      }))
      .sort((a, b) => b.stars - a.stars) :
    [
      { stars: 5, count: 0, percentage: 0 },
      { stars: 4, count: 0, percentage: 0 },
      { stars: 3, count: 0, percentage: 0 },
      { stars: 2, count: 0, percentage: 0 },
      { stars: 1, count: 0, percentage: 0 },
    ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Xizmat ma'lumotlari yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  if (!serviceData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Xizmat ma'lumotlari topilmadi</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-black bg-opacity-10"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-l from-white opacity-10 rounded-full -translate-y-48 translate-x-48"></div>
        
        <div className="relative max-w-6xl mx-auto px-6 py-12">
          <Link 
            to="/services"
            className="inline-flex items-center gap-2 px-4 py-2 mb-6 bg-white bg-opacity-20 backdrop-blur-sm rounded-lg text-white hover:bg-opacity-30 transition-all duration-300 hover:scale-105"
          >
            <ArrowLeft size={20} />
            Xizmatlarga qaytish
          </Link>

          <div className="flex items-center gap-4 mb-8">
            <div className="p-3 bg-white bg-opacity-20 backdrop-blur-sm rounded-xl">
              <Building className="text-white" size={28} />
            </div>
            <h1 className="text-3xl font-bold">{serviceData.name_uz}</h1>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-2xl p-6 hover:bg-opacity-30 transition-all duration-300">
              <div className="flex items-center gap-3 mb-2">
                <div className="transform transition-all duration-500 hover:scale-110">
                  <StarRating rating={Math.round(serviceData.average_rating)} size={24} />
                </div>
                <span className="text-3xl font-bold transform transition-all duration-300 hover:scale-105">
                  {serviceData.average_rating.toFixed(2)}
                </span>
              </div>
              <p className="text-blue-100 transition-colors duration-300 hover:text-white">Mijozlar bahosi</p>
            </div>
            
            <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-2xl p-6 hover:bg-opacity-30 transition-all duration-400 hover:transform hover:scale-105">
              <div className="flex items-center gap-3 mb-2">
                <Clock className="text-yellow-300 transition-all duration-300 hover:rotate-12" size={24} />
                <span className="text-3xl font-bold transform transition-all duration-300 hover:scale-105">
                  {serviceData.duration === 'to_week' ? '1 hafta' : serviceData.duration}
                </span>
              </div>
              <p className="text-blue-100 transition-colors duration-300 hover:text-white">Bajarish muddati</p>
            </div>
            
            <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-2xl p-6 hover:bg-opacity-30 transition-all duration-500 hover:transform hover:scale-105">
              <div className="flex items-center gap-3 mb-2">
                <Users className="text-green-300 transition-all duration-300 hover:scale-110" size={24} />
                <span className="text-3xl font-bold transform transition-all duration-300 hover:scale-105">
                  {serviceData.orders}
                </span>
              </div>
              <p className="text-blue-100 transition-colors duration-300 hover:text-white">Buyurtma soni</p>
            </div>
          </div>
          
          <div className="flex gap-4 mt-8">
            <button 
              onClick={() => setLiked(!liked)}
              className="bg-white bg-opacity-20 backdrop-blur-sm text-white px-6 py-3 rounded-xl hover:bg-opacity-30 transition-all duration-400 flex items-center gap-2 hover:scale-105 transform hover:-translate-y-1"
            >
              <Heart className={`transition-all duration-300 ${liked ? "fill-red-400 text-red-400 scale-110" : "hover:scale-110"}`} size={20} />
              Saralangan
            </button>
            <button className="bg-white bg-opacity-20 backdrop-blur-sm text-white px-6 py-3 rounded-xl hover:bg-opacity-30 transition-all duration-400 flex items-center gap-2 hover:scale-105 transform hover:-translate-y-1">
              <Share2 className="transition-all duration-300 hover:rotate-12" size={20} />
              Ulashish
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid lg:grid-cols-2 gap-12">
          {/* Left Column */}
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
              <Info className="text-blue-600" size={24} />
              Xizmat ma'lumotlari
            </h2>
            
            <div className="space-y-4">
              <ExpandableItem
                icon={<FileText size={20} />}
                title="Xizmat turlari va yo'nalishlari"
                content="Biz yuqori sifatli xizmatlar taqdim etamiz: konsalting, texnik yordam, hujjat rasmiylashtirish va boshqa professional xizmatlar."
                isOpen={expandedItems.has('services')}
                onToggle={() => toggleItem('services')}
              />
              
              <ExpandableItem
                icon={<Clock size={20} />}
                title="Ish vaqti va jadval"
                content="Dushanba-Juma: 9:00-18:00, Shanba: 9:00-14:00. Tez xizmat ko'rsatish va professional yondashuv kafolatlanadi."
                isOpen={expandedItems.has('schedule')}
                onToggle={() => toggleItem('schedule')}
              />
              
              <ExpandableItem
                icon={<Phone size={20} />}
                title="Bog'lanish"
                content="+998 (90) 123-45-67 | info@premium-service.uz | Telegram: @premium_service_bot"
                isOpen={expandedItems.has('contact')}
                onToggle={() => toggleItem('contact')}
              />
              
              <ExpandableItem
                icon={<MapPin size={20} />}
                title="Manzil"
                content="Toshkent shahri, Yunusobod tumani, Amir Temur shoh ko'chasi, 108-uy. Metro: Yunus Rajabiy bekati yaqinida."
                isOpen={expandedItems.has('location')}
                onToggle={() => toggleItem('location')}
              />
            </div>
            
            {/* Terms and Conditions Section */}
            <div className="mt-8">
              <div className="bg-white rounded-xl shadow-sm border-2 border-blue-100 p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-2 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg text-blue-600">
                    <Shield size={20} />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800">Oferta shartlari bilan tanishish</h3>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <p className="text-gray-700 text-sm leading-relaxed">
                    Xizmat ko'rsatish shartlari, to'lov tartibi, mijoz huquqlari va majburiyatlari haqida to'liq ma'lumot. 
                    Barcha xizmatlar O'zbekiston Respublikasi qonunlariga muvofiq amalga oshiriladi. 
                    Ma'lumotlar xavfsizligi va mijozlar huquqlari himoyasi kafolatlanadi.
                  </p>
                </div>
                
                <div className="flex items-center justify-between mb-4">
                  <button className="flex items-center gap-2 text-blue-600 hover:text-blue-700 transition-colors duration-200 font-medium">
                    <Download size={16} />
                    Oferta shartlarini yuklash
                  </button>
                </div>
                
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="terms-checkbox"
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                  />
                  <label htmlFor="terms-checkbox" className="text-sm text-gray-700 cursor-pointer">
                    Oferta shartlari bilan tanishdim va roziman
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Reviews */}
          <div>
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                <MessageCircle className="text-blue-600" size={24} />
                Mijozlar fikrlari
              </h2>
              
              <div className="mb-8">
                <div className="flex items-center gap-4 mb-6">
                  <span className="text-5xl font-bold text-gray-800">
                    {serviceData.average_rating.toFixed(2)}
                  </span>
                  <div>
                    <StarRating rating={Math.round(serviceData.average_rating)} size={24} />
                    <p className="text-gray-600 mt-1">
                      {serviceData.ratings_total} ta baholash
                    </p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  {ratingDistribution.map((item) => (
                    <div key={item.stars} className="flex items-center gap-3 group hover:bg-gray-50 rounded-lg p-2 transition-all duration-300">
                      <span className="text-sm text-gray-600 w-2">{item.stars}</span>
                      <Star className="text-yellow-400 fill-yellow-400 transition-all duration-300 group-hover:scale-110" size={16} />
                      <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-yellow-400 to-orange-400 h-2 rounded-full transition-all duration-1000 group-hover:shadow-lg"
                          style={{ width: `${item.percentage}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-600 w-8 transition-colors duration-300 group-hover:text-gray-800">{item.count}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Individual Reviews */}
              <div className="space-y-6">
                {serviceData.reviews && serviceData.reviews.length > 0 ? (
                  serviceData.reviews.map((review: ServiceReview, index: number) => (
                    <div key={index} className="border-l-4 border-blue-400 pl-4 bg-gradient-to-r from-blue-50 to-transparent p-4 rounded-r-lg transition-all duration-400 hover:shadow-md hover:border-l-8 hover:pl-6 transform hover:translate-x-2">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 hover:rotate-12">
                          <User className="text-white" size={16} />
                        </div>
                        <span className="font-semibold text-gray-800 transition-colors duration-300 hover:text-blue-700">
                          {review.user?.display_name || review.user?.first_name || review.user?.username || 'Anonim'}
                        </span>
                        <div className="transition-all duration-300 hover:scale-110">
                          <StarRating rating={review.value} size={14} />
                        </div>
                      </div>
                      <p className="text-gray-700 transition-colors duration-300 hover:text-gray-900">
                        {review.comment}
                      </p>
                      <span className="text-xs text-gray-500 mt-2 block">
                        {review.created_at || 'Bugun'}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <MessageCircle className="text-gray-400 mx-auto mb-4" size={48} />
                    <p className="text-gray-500">Hozircha hech qanday sharh yo'q</p>
                    <p className="text-sm text-gray-400 mt-1">Birinchi bo'lib fikr bildiring!</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Next Step Button */}
        <div className="mt-12 text-center">
          <button
            disabled={!termsAccepted}
            onClick={termsAccepted ? onNext : undefined}
            className={`px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-500 flex items-center gap-3 mx-auto transform ${
              termsAccepted
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 hover:scale-105 shadow-lg hover:shadow-xl hover:-translate-y-1'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            Keyingi qadamga o'tish
            <ArrowRight className={`transition-all duration-300 ${termsAccepted ? 'group-hover:translate-x-1' : ''}`} size={20} />
          </button>
          {!termsAccepted && (
            <p className="text-sm text-gray-500 mt-2">
              Davom etish uchun oferta shartlari bilan tanishib chiqing
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default IndustryStep1;
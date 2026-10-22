import React, { useState, useEffect } from 'react';
import { durationLabel } from '../utils/format';
import {
  Star,
  Clock,
  Users,
  ChevronDown,
  ChevronUp,
  Heart,
  Share2,
  Info,
  FileText,
  Building,
  MessageCircle,
  Shield,
  ArrowRight,
  ArrowLeft,
  Download
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { getServiceInfo, ServiceInfoData, ServiceReview } from '../api/serviceInfo';
import toast from 'react-hot-toast';

/** Mijozlar fikrlari: dastlab faqat 2 tasi, qolgani tugma bilan */
const REVIEWS_PREVIEW = 2;

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
      className="w-full p-6 flex items-center justify-between hover:bg-mg-info/50 transition-all duration-400"
    >
      <div className="flex items-center gap-4">
        <div className="p-2 bg-mg-info rounded-lg text-blue-600 transition-all duration-300 hover:scale-110 hover:rotate-3">
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
      <div className="px-6 pb-6 text-gray-600 bg-mg-info/60 transform transition-all duration-500">
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
  serviceId?: number | null; // Optional service ID from API
}

const BookStep1: React.FC<BookStep1Props> = ({ onNext, serviceId }) => {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [liked, setLiked] = useState(false);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [serviceData, setServiceData] = useState<ServiceInfoData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchServiceInfo = async () => {
      if (!serviceId) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const data = await getServiceInfo(serviceId);
        setServiceData(data);
      } catch (error) {
        console.error('Failed to fetch service info:', error);
        toast.error('Xizmat ma\'lumotlarini yuklashda xatolik yuz berdi');
      } finally {
        setIsLoading(false);
      }
    };

    fetchServiceInfo();
  }, [serviceId]);

  const toggleItem = (id: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-mg-info/60 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Xizmat ma'lumotlari yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  if (!serviceData) {
    return (
      <div className="min-h-screen bg-mg-info/60 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Xizmat ma'lumotlari topilmadi</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Qayta urinish
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-mg-info/60 ">
      {/* Header */}
      <div className="bg-mg-primary text-white relative overflow-hidden">
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
                  {serviceData.average_rating.toFixed(1)}
                </span>
              </div>
              <p className="text-blue-100 transition-colors duration-300 hover:text-white">Mijozlar bahosi</p>
            </div>

            <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-2xl p-6 hover:bg-opacity-30 transition-all duration-400 hover:transform hover:scale-105">
              <div className="flex items-center gap-3 mb-2">
                <Clock className="text-yellow-300 transition-all duration-300 hover:rotate-12" size={24} />
                <span className="text-3xl font-bold transform transition-all duration-300 hover:scale-105">
                  {durationLabel(serviceData.duration)}
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
              <div className="mt-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  serviceData.is_free
                    ? 'bg-green-100 bg-opacity-80 text-green-700'
                    : 'bg-yellow-100 bg-opacity-80 text-yellow-700'
                }`}>
                  {serviceData.is_free ? 'Bepul' : 'Pullik'}
                </span>
              </div>
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

            {/* Service Status */}
            {/* <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-white rounded-xl shadow-sm p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-3 h-3 rounded-full ${serviceData.is_active ? 'bg-green-400' : 'bg-red-400'}`}></div>
                  <span className="text-sm font-medium text-gray-600">Holat</span>
                </div>
                <span className={`text-lg font-semibold ${serviceData.is_active ? 'text-green-600' : 'text-red-600'}`}>
                  {serviceData.is_active ? 'Faol' : 'Nofaol'}
                </span>
              </div>
              <div className="bg-white rounded-xl shadow-sm p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Heart className={`w-4 h-4 ${serviceData.is_popular ? 'text-red-400 fill-red-400' : 'text-gray-400'}`} />
                  <span className="text-sm font-medium text-gray-600">Mashhurlik</span>
                </div>
                <span className={`text-lg font-semibold ${serviceData.is_popular ? 'text-red-600' : 'text-gray-600'}`}>
                  {serviceData.is_popular ? 'Mashhur' : 'Oddiy'}
                </span>
              </div>
            </div> */}

            {/* Service Description */}
            <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Tavsif</h3>
              <div
                className="text-gray-600 prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: serviceData.description_uz || 'Tavsif mavjud emas' }}
              />
            </div>

            {/* User's Current Rating */}
            {serviceData.user_rating && (
              <div className="bg-green-50 rounded-xl shadow-sm p-6 mb-6 border border-green-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <Star className="text-yellow-400 fill-yellow-400" size={20} />
                  Sizning bahongiz
                </h3>
                <div className="flex items-center gap-3">
                  <StarRating rating={serviceData.user_rating} size={24} />
                  <span className="text-2xl font-bold text-gray-800">{serviceData.user_rating}/5</span>
                  <span className="text-sm text-gray-600">Siz bu xizmatni baholagansiz</span>
                </div>
              </div>
            )}

            {/* Service Items */}
            <div className="space-y-4">
              {serviceData.items && serviceData.items.length > 0 && (
                <>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">Xizmat turlari</h3>
                  {serviceData.items.map((item) => (
                    <ExpandableItem
                      key={item.id}
                      icon={<FileText size={20} />}
                      title={item.name_uz}
                      content={item.name_ru} // Fallback to Russian name as description
                      isOpen={expandedItems.has(`item-${item.id}`)}
                      onToggle={() => toggleItem(`item-${item.id}`)}
                    />
                  ))}
                </>
              )}

              <ExpandableItem
                icon={<Building size={20} />}
                title="Tashkilot haqida"
                content={`${serviceData.organization.name} tomonidan taqdim etiladi`}
                isOpen={expandedItems.has('organization')}
                onToggle={() => toggleItem('organization')}
              />
            </div>

            {/* Terms and Conditions Section */}
            <div className="mt-8">
              <div className="bg-white rounded-xl shadow-sm border-2 border-blue-100 p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-2 bg-mg-info rounded-lg text-blue-600">
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
                  <span className="text-5xl font-bold text-gray-800">{serviceData.average_rating.toFixed(1)}</span>
                  <div>
                    <StarRating rating={Math.round(serviceData.average_rating)} size={24} />
                    <p className="text-gray-600 mt-1">{serviceData.ratings_total} ta baholash</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {[5, 4, 3, 2, 1].map((star) => {
                    const count = serviceData.rating_counts[star.toString() as keyof typeof serviceData.rating_counts] || 0;
                    const percentage = serviceData.ratings_total > 0 ? (count / serviceData.ratings_total) * 100 : 0;

                    return (
                      <div key={star} className="flex items-center gap-3 group hover:bg-gray-50 rounded-lg p-2 transition-all duration-300">
                        <span className="text-sm text-gray-600 w-2">{star}</span>
                        <Star className="text-yellow-400 fill-yellow-400 transition-all duration-300 group-hover:scale-110" size={16} />
                        <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-amber-400 h-2 rounded-full transition-all duration-1000 group-hover:shadow-lg"
                            style={{ width: `${percentage.toFixed(1)}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-600 w-8 transition-colors duration-300 group-hover:text-gray-800">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Individual Reviews */}
              <div className="space-y-6">
                {serviceData.reviews && serviceData.reviews.length > 0 ? (
                  (showAllReviews ? serviceData.reviews : serviceData.reviews.slice(0, REVIEWS_PREVIEW)).map((review: ServiceReview, index: number) => (
                    <div key={review.id || index} className="border-l-4 border-blue-400 pl-4 bg-gradient-to-r from-blue-50 to-transparent p-4 rounded-r-lg transition-all duration-400 hover:shadow-md hover:border-l-8 hover:pl-6 transform hover:translate-x-2">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-mg-primary-light rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 hover:rotate-12">
                            <span className="text-white font-semibold text-sm">
                              {review.user?.display_name?.charAt(0) || review.user?.first_name?.charAt(0) || 'A'}
                            </span>
                          </div>
                          <div>
                            <div className="font-semibold text-gray-800 transition-colors duration-300 hover:text-blue-700">
                              {review.user?.display_name || `${review.user?.first_name} ${review.user?.last_name}` || 'Anonim foydalanuvchi'}
                            </div>
                            <div className="text-xs text-gray-500">@{review.user?.username || 'anonim'}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="transition-all duration-300 hover:scale-110">
                            <StarRating rating={review.value || 5} size={16} />
                          </div>
                          <span className="text-sm font-medium text-gray-600">{review.value}/5</span>
                        </div>
                      </div>
                      <div className="mb-3">
                        <p className="text-gray-700 transition-colors duration-300 hover:text-gray-900 leading-relaxed">
                          {review.comment || 'Sharh qoldirilmagan'}
                        </p>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">{review.created_humanized || review.created_at}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full">
                            ID: {review.id}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <MessageCircle className="text-gray-400 mx-auto mb-4" size={48} />
                    <p className="text-gray-500">Hozircha hech qanday sharh yo'q</p>
                    <p className="text-sm text-gray-400 mt-1">Birinchi bo'lib fikr bildiring!</p>
                  </div>
                )}
                {serviceData.reviews && serviceData.reviews.length > REVIEWS_PREVIEW && (
                  <button
                    type="button"
                    onClick={() => setShowAllReviews((v) => !v)}
                    aria-expanded={showAllReviews}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-mg-border bg-white px-4 py-3 text-sm font-semibold text-mg-primary transition hover:bg-mg-info"
                  >
                    {showAllReviews ? "Kamroq ko'rsatish" : `Barcha fikrlarni ko'rish (${serviceData.reviews.length})`}
                    <ChevronDown className={`h-4 w-4 transition-transform ${showAllReviews ? 'rotate-180' : ''}`} aria-hidden="true" />
                  </button>
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
                ? 'bg-mg-primary text-white hover:bg-mg-primary-dark hover:scale-105 shadow-lg hover:shadow-xl hover:-translate-y-1'
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

export default BookStep1;
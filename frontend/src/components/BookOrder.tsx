import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, MapPin, User, CreditCard, Map } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { CartItem, Book } from '../types';
import { payment_for_book } from '../api/apiUrls';
import { postRequest } from '../api/request';

interface BookOrderProps {
  cart: CartItem[];
  books: Book[];
  onClose: () => void;
  totalPrice: number;
  formatPrice: (price: number) => string;
  orderResponse?: {
    id: number;
    total_price: string;
  };
}

const BookOrder: React.FC<BookOrderProps> = ({
  cart,
  books,
  onClose,
  totalPrice,
  formatPrice,
  orderResponse
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedPaymentProvider, setSelectedPaymentProvider] = useState<'click' | 'payme'>('click');
  const [address, setAddress] = useState('');
  const [customerName, setCustomerName] = useState(user?.name || '');
  const [isMapSelected, setIsMapSelected] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'success' | 'failed' | null>(null);
  const [, setPaymentUrl] = useState<string | null>(null);
  useEffect(() => {
    if (user?.name) {
      setCustomerName(user.name);
    }
  }, [user]);

  useEffect(() => {
    const storedLocation = localStorage.getItem('selectedStore');
    if (storedLocation) {
      try {
        const store = JSON.parse(storedLocation);
        console.log('Stored location:', store);
        setAddress(store.name); // name maydonini address sifatida ishlatamiz
        setIsMapSelected(true);
        localStorage.removeItem('selectedStore');
      } catch (err) {
        console.error('Error parsing stored location:', err);
      }
    }
  }, []);

  const isFormValid = () => {
    const hasAddress = Boolean(address?.trim());
    console.log('Form validation:', {
      hasAddress,
      selectedPaymentProvider,
      isMapSelected,
      address
    });
    return hasAddress && selectedPaymentProvider && isMapSelected;
  };

  const handlePayment = useCallback(async () => {
    if (!orderResponse) {
      alert('Buyurtma ma\'lumotlari topilmadi');
      return;
    }

    try {
      console.log(`To'lov ${selectedPaymentProvider} orqali amalga oshirilmoqda...`);

      const paymentPayload = {
        order_id: orderResponse.id,
        provider: selectedPaymentProvider,
        total_amount: orderResponse.total_price,
      };

      type PaymentResponse = {
        payment_url: string;
      };

      const response = await postRequest(payment_for_book, paymentPayload) as PaymentResponse;

      if (response?.payment_url) {
        setPaymentStatus('pending');
        setPaymentUrl(response.payment_url);

        // To'lov sahifasini ochish
        const paymentWindow = window.open(response.payment_url, '_blank');

        if (paymentWindow) {
          const checkWindow = setInterval(() => {
            if (paymentWindow.closed) {
              clearInterval(checkWindow);
              setPaymentStatus(null);
            }
          }, 1000);
        }
      } else {
        setPaymentStatus('failed');
        alert('To\'lov URL olinmadi. Iltimos qaytadan urinib ko\'ring.');
      }
    } catch (error) {
      console.error('To\'lov jarayonida xatolik:', error);
      setPaymentStatus('failed');
      alert('To\'lov jarayonida xatolik yuz berdi. Iltimos qaytadan urinib ko\'ring.');
    }
  }, [orderResponse, selectedPaymentProvider]);

  const handleSubmit = () => {
    if (!isFormValid()) {
      if (!address?.trim()) {
        alert("Iltimos, yetkazib berish manzilini kiriting");
      }
      if (!selectedPaymentProvider) {
        alert("Iltimos, to'lov turini tanlang");
      }
      if (!isMapSelected) {
        alert("Iltimos, xaritadan manzil tanlang");
      }
      return;
    }
    handlePayment();
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 my-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 relative">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-white">Buyurtma rasmiylashtirish</h1>
              <button
                onClick={onClose}
                className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
              >
                <X className="w-5 h-5" />
                <span className="text-sm font-medium">Orqaga</span>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-8">
            {/* Customer Info */}
              <div className="space-y-4">
              <div className="flex items-center gap-2 text-gray-700">
                <User className="w-5 h-5" />
                <h2 className="text-lg font-semibold">Buyurtmachi</h2>
              </div>
              <div className="bg-gray-50 px-4 py-3 rounded-lg">
                <p className="text-gray-900 font-medium">{customerName}</p>
                <p className="text-sm text-gray-500 mt-1">Avtorizatsiya qilingan foydalanuvchi</p>
              </div>
            </div>            {/* Delivery Address */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-gray-700">
                <MapPin className="w-5 h-5" />
                <h2 className="text-lg font-semibold">Yetkazib berish manzili</h2>
              </div>
                <div className="space-y-3">
                  <div className="relative">
                    <textarea
                      value={address}
                      onChange={(e) => !isMapSelected && setAddress(e.target.value)}
                      placeholder="To'liq manzilingizni kiriting"
                      rows={3}
                      readOnly={isMapSelected}
                      className={`w-full px-4 py-2 border rounded-lg outline-none transition-all resize-none ${
                        isMapSelected 
                          ? 'bg-gray-100 border-gray-300 cursor-not-allowed text-gray-700' 
                          : 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                      }`}
                    />
                    {isMapSelected && (
                      <div className="absolute top-0 right-0 p-2">
                        <span className="inline-flex items-center px-2 py-1 text-xs font-medium text-green-700 bg-green-100 rounded">
                          Xaritadan tanlangan
                        </span>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => navigate('/book-order/map')}
                    className={`w-full flex items-center justify-center gap-2 py-2 px-4 font-medium rounded-lg transition-colors ${
                      isMapSelected
                        ? 'bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    }`}
                  >
                    <Map className="w-5 h-5" />
                    {isMapSelected ? 'Boshqa manzilni tanlash' : 'Xaritadan tanlash'}
                  </button>
                </div>            </div>

            {/* Order Items */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
                Buyurtma tarkibi
                <span className="text-sm font-normal text-gray-500">({cart.length} ta mahsulot)</span>
              </h2>
              <div className="divide-y divide-gray-100">
                {cart.map((item) => {
                  const book = books.find((b) => b.id === item.bookId);
                  if (!book) return null;
                  return (
                    <div key={item.bookId} className="flex items-start gap-4 py-4 first:pt-0 last:pb-0">
                      <div className="w-24 h-32 flex-shrink-0 overflow-hidden rounded-lg border border-gray-200">
                        <img
                          src={book.image_url || "https://via.placeholder.com/200x300"}
                          alt={book.name}
                          className="h-full w-full object-cover object-center"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = "https://via.placeholder.com/200x300?text=Rasm+mavjud+emas";
                          }}
                        />
                      </div>
                      <div className="flex-1 space-y-2">
                        <h3 className="font-medium text-gray-900">{book.name}</h3>
                        <p className="text-sm text-gray-500">{item.category === 'bosma' ? 'Bosma nashr' : 'Diskdagi nashr'}</p>
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <p className="text-sm text-gray-500">Soni: {item.quantity} dona</p>
                            <p className="text-blue-600 font-medium">{formatPrice(book.price || 0)} so'm</p>
                          </div>
                          <p className="text-lg font-semibold text-gray-900">
                            {formatPrice((book.price || 0) * item.quantity)} so'm
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              {/* Order Summary */}
              <div className="mt-6 space-y-3 bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between text-gray-600">
                  <span>Mahsulotlar ({cart.reduce((acc, item) => acc + item.quantity, 0)} dona)</span>
                  <span>{formatPrice(totalPrice)} so'm</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Yetkazib berish</span>
                  <span className="text-green-600">Bepul</span>
                </div>
                <div className="border-t border-gray-200 pt-3 flex justify-between text-lg font-semibold">
                  <span>Jami</span>
                  <span className="text-blue-600">{formatPrice(totalPrice)} so'm</span>
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-gray-700">
                <CreditCard className="w-5 h-5" />
                <h2 className="text-lg font-semibold">To'lov usuli</h2>
              </div>

              <div className="space-y-3">
                {/* Click */}
                <label className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                  <input
                    type="radio"
                    name="paymentProvider"
                    value="click"
                    checked={selectedPaymentProvider === "click"}
                    onChange={(e) => setSelectedPaymentProvider(e.target.value as 'click' | 'payme')}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <div className="ml-3 flex items-center space-x-3">
                    <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-sm">C</span>
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">Click</div>
                      <div className="text-sm text-gray-500">Tezkor va xavfsiz to'lov</div>
                    </div>
                  </div>
                </label>

                {/* Payme */}
                <label className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                  <input
                    type="radio"
                    name="paymentProvider"
                    value="payme"
                    checked={selectedPaymentProvider === "payme"}
                    onChange={(e) => setSelectedPaymentProvider(e.target.value as 'click' | 'payme')}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <div className="ml-3 flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-sm">P</span>
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">Payme</div>
                      <div className="text-sm text-gray-500">Ishonchli to'lov tizimi</div>
                    </div>
                  </div>
                </label>
              </div>
            </div>

            {/* Total and Actions */}
            <div className="border-t pt-6">
              <div className="flex justify-between items-center mb-6">
                <span className="text-lg font-semibold text-gray-900">Jami summa:</span>
                <span className="text-2xl font-bold text-blue-600">{formatPrice(totalPrice)} so'm</span>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={onClose}
                  className="flex-1 py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium rounded-lg transition-colors"
                >
                  Bekor qilish
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!isFormValid() || paymentStatus === 'pending'}
                  className={`flex-1 py-3 px-4 font-medium rounded-lg transition-colors ${isFormValid() && paymentStatus !== 'pending'
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-gray-200 text-gray-500 cursor-not-allowed'}
                    ${paymentStatus === 'pending' ? 'animate-pulse' : ''}`}
                >
                  {paymentStatus === 'pending' 
                    ? "To'lov amalga oshirilmoqda..."
                    : isFormValid()
                      ? "To'lovga o'tish"
                      : "Manzil va to'lov turini tanlang"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookOrder;
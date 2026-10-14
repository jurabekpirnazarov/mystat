import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { getOrganizationInfo, OrganizationData } from '../api/organizationInfo';
import toast, { Toaster } from 'react-hot-toast';
import { asApiError } from '../api/errors';

interface OrgInfoStep2Props {
  onNext: (orgData: OrganizationData) => void;
  onPrevious: () => void;
}

const OrgInfoStep2: React.FC<OrgInfoStep2Props> = ({ onNext, onPrevious }) => {
  const [stirNumber, setStirNumber] = useState('');
  const [remainingAttempts, setRemainingAttempts] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Only allow digits and limit to 9 characters
    if (/^\d*$/.test(value) && value.length <= 9) {
      setStirNumber(value);
    }
  };

  const handleSearch = async () => {
    if (stirNumber.length === 9 && remainingAttempts > 0 && !loading) {
      setLoading(true);
      setError(null);
      try {
        const response = await getOrganizationInfo(stirNumber);
        
        if (response.service_response) {
          setRemainingAttempts(prev => prev - 1);
          onNext(response.service_response); // Pass organization data to next step
        } else {
          setError('Tashkilot ma\'lumoti topilmadi');
        }
      } catch (caught) {
        const err = asApiError(caught);
        console.error('API Error:', err);
        setRemainingAttempts(prev => prev - 1);
        
        if (err.response?.status === 404) {
          toast.error('Ushbu STIR bo\'yicha ma\'lumot topilmadi', {
            position: 'bottom-right',
            duration: 4000,
            style: {
              background: '#FEE2E2',
              color: '#DC2626',
              padding: '16px',
              borderRadius: '8px',
              fontSize: '14px'
            }
          });
        } else {
          toast.error('Xatolik yuz berdi', {
            position: 'bottom-right',
            duration: 4000,
            style: {
              background: '#FEE2E2',
              color: '#DC2626',
              padding: '16px',
              borderRadius: '8px',
              fontSize: '14px'
            }
          });
        }
        setError('Ma\'lumot olishda xatolik yuz berdi');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // Create array of 9 positions for underlines
  const inputPositions = Array.from({ length: 9 }, (_, i) => i);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center pt-20 p-4">
      <Toaster />
      <div className="w-full max-w-4xl mb-6 px-4">
        <button
          onClick={onPrevious}
          className="flex items-center px-4 py-2 bg-white text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors duration-200"
        >
          <svg
            className="w-5 h-5 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Orqaga
        </button>
      </div>
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-xl font-semibold text-gray-900 mb-3 leading-tight">
            Korxona va tashkilotlar haqida ma'lumot olish
          </h1>
          <p className="text-sm text-gray-500 leading-relaxed">
            Ushbu ma'lumotlar ro'yxatdan o'tkazuvchi va vakolatli organlar ma'lumoti 
            asosida shakllantirilgan.
          </p>
        </div>

        {/* Search Section */}
        <div className="space-y-4 mb-6">
          <div className="relative mb-8">
            <input
              type="text"
              value={stirNumber}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              placeholder="STIR raqamini kiriting..."
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900 placeholder-gray-400 text-center text-lg tracking-widest"
              maxLength={9}
              inputMode="numeric"
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <Search className="h-5 w-5 text-gray-400 flex-shrink-0" />
            </div>
            
            {/* Animated underlines */}
            <div className="flex justify-center mt-3 space-x-2">
              {inputPositions.map((position) => (
                <div
                  key={position}
                  className={`h-0.5 w-6 transition-all duration-300 ease-in-out ${
                    position < stirNumber.length
                      ? 'bg-blue-500 scale-x-100'
                      : 'bg-gray-200 scale-x-75'
                  }`}
                />
              ))}
            </div>
          </div>
          
          <div className="text-right">
            <span className="text-sm text-blue-600">
              Qolgan: {remainingAttempts} urinish
            </span>
          </div>

          <button
            onClick={handleSearch}
            disabled={stirNumber.length !== 9 || remainingAttempts === 0 || loading}
            className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 relative"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                <span>Yuklanmoqda...</span>
              </div>
            ) : (
              'Qidiruv'
            )}
          </button>
        </div>

        {/* Footer */}
        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600 text-center">
              {error}
            </p>
          </div>
        )}
        
        {remainingAttempts === 0 && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600 text-center">
              Urinishlar tugadi. Keyinroq qayta urinib ko'ring.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrgInfoStep2;
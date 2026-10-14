import React, { useState, useEffect } from 'react';
import ReportMonthCalendar from '../components/reports/ReportMonthCalendar';
import { Search } from 'lucide-react';
import BookStep1 from '../components/BookStep1';
import ReportsCalendarDetail from './ReportsCalendarDetail';
import { getReportsByStir } from '../api/reports';
import { reports_calendar } from '../api/apiUrls';
import { ReportData, ReportCalendarResponse } from '../types/report';
import { useServiceId } from '../utils/useServiceId';
import toast, { Toaster } from 'react-hot-toast';
import RatingModal from '../components/modals/RatingModal';

const ReportCalendar: React.FC = () => {
  const { serviceId } = useServiceId(); // get real ID from API

  // Component unmount bo'lganda localStorage'ni tozalash
  useEffect(() => {
    return () => {
      localStorage.removeItem("reportcalendar_currentStep");
    };
  }, []);
  
  // Step management (persisted in localStorage)
  const getInitialStep = () => {
    const saved = localStorage.getItem("reportcalendar_currentStep");
    if (saved === "2" || saved === "3") return Number(saved) as 2 | 3;
    return 1;
  };

  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(getInitialStep());
  const [stirNumber, setStirNumber] = useState('');
  const [reports, setReports] = useState<ReportData[]>([]);
  const [companyName, setCompanyName] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showRatingModal, setShowRatingModal] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Only allow digits and limit to 9 characters
    if (/^\d*$/.test(value) && value.length <= 9) {
      setStirNumber(value);
      setError(null);
    }
  };

  const handleSearch = async () => {
    if (stirNumber.length === 9 && !loading) {
      setLoading(true);
      setError(null);
      try {
        console.log('Sending request for STIR:', stirNumber);
        console.log('API URL:', `${import.meta.env.VITE_API_URL}${reports_calendar}`);
        
        const response = await getReportsByStir(stirNumber) as unknown as ReportCalendarResponse;
        console.log('Full API Response:', response);
        
        if (response && response.data && Array.isArray(response.data)) {
          console.log('Response data array with length:', response.data.length);
          if (response.data.length > 0) {
            console.log('First item:', response.data[0]);
            setReports(response.data);
            setCompanyName(response.org_name || 'Noma\'lum korxona');
            goToNextStep();
            // Show rating after viewing reports for 3 seconds
            setTimeout(() => {
              setShowRatingModal(true);
            }, 3000);
          } else {
            setError('Ushbu STIR uchun hisobotlar topilmadi');
          }
        } else {
          console.error('Invalid response format:', response);
          setError('Noto\'g\'ri ma\'lumot formati');
        }
      } catch (err: any) {
        console.error('API Error:', err);
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

  // Keep localStorage in sync if currentStep changes elsewhere
  useEffect(() => {
    localStorage.setItem("reportcalendar_currentStep", String(currentStep));
  }, [currentStep]);

  // Step navigation functions
  const goToNextStep = () => {
    if (currentStep < 3) {
      setCurrentStep((prev) => {
        const next = (prev + 1) as 1 | 2 | 3;
        localStorage.setItem("reportcalendar_currentStep", String(next));
        return next;
      });
    }
  };

  const goToPreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => {
        const prevStep = (prev - 1) as 1 | 2 | 3;
        localStorage.setItem("reportcalendar_currentStep", String(prevStep));
        return prevStep;
      });
    }
  };

  // Create array of 9 positions for underlines
  const inputPositions = Array.from({ length: 9 }, (_, i) => i);

  // Step Progress Bar
  const renderStepProgress = () => (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
      <div className="relative">
        <div className="absolute left-0 top-2/4 h-0.5 w-full bg-gray-200">
          <div
            className="absolute h-full bg-blue-600 transition-all duration-500"
            style={{ width: `${((currentStep - 1) / 2) * 100}%` }}
          />
        </div>
        <div className="relative flex justify-between">
          <div className="flex flex-col items-center">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-full border-2 bg-white transition-all ${
                currentStep === 1
                  ? "border-blue-600 text-blue-600"
                  : currentStep > 1
                  ? "border-blue-600 bg-blue-600"
                  : "border-gray-300 text-gray-900"
              }`}
            >
              <span className="text-sm font-semibold">1</span>
            </div>
            <span
              className={`mt-2 text-sm font-medium ${
                currentStep === 1
                  ? "text-blue-600"
                  : currentStep > 1
                  ? "text-gray-900"
                  : "text-gray-400"
              }`}
            >
              Xizmat haqida
            </span>
          </div>

          <div className="flex flex-col items-center">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-full border-2 bg-white transition-all ${
                currentStep === 2
                  ? "border-blue-600 text-blue-600"
                  : currentStep > 2
                  ? "border-blue-600 bg-blue-600"
                  : "border-gray-300 text-gray-900"
              }`}
            >
              <span className="text-sm font-semibold">2</span>
            </div>
            <span
              className={`mt-2 text-sm font-medium ${
                currentStep === 2
                  ? "text-blue-600"
                  : currentStep > 2
                  ? "text-gray-900"
                  : "text-gray-400"
              }`}
            >
              STIR kiritish
            </span>
          </div>

          <div className="flex flex-col items-center">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-full border-2 bg-white transition-all ${
                currentStep === 3
                  ? "border-blue-600 text-blue-600"
                  : currentStep > 3
                  ? "border-blue-600 bg-blue-600 text-white"
                  : "border-gray-300 text-gray-900"
              }`}
            >
              <span className="text-sm font-semibold">3</span>
            </div>
            <span
              className={`mt-2 text-sm font-medium ${
                currentStep === 3
                  ? "text-blue-600"
                  : currentStep > 3
                  ? "text-gray-900"
                  : "text-gray-400"
              }`}
            >
              Hisobotlar
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  // Step 1 Component - Service Information
  const renderStep1 = () => <BookStep1 onNext={goToNextStep} serviceId={serviceId} />;

  // Step 2 Component - STIR Input
  const renderStep2 = () => (
    <div>
      <div className="fixed left-8 top-28 z-10">
        <button
          onClick={goToPreviousStep}
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

      <div className="bg-gray-50 flex items-center justify-center p-4 mt-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-xl font-semibold text-gray-900 mb-3 leading-tight">
              Hisobot shakllari
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
            
            {/* <div className="text-right">
              <span className="text-sm text-blue-600">
                Qolgan: {remainingAttempts} urinish
              </span>
            </div> */}

            <button
              onClick={handleSearch}
              disabled={stirNumber.length !== 9 || loading}
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
        </div>
      </div>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
        <ReportMonthCalendar />
      </div>
    </div>
  );

  // Step 3 Component - Reports Detail
  const renderStep3 = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Ma'lumotlar yuklanmoqda...</p>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="text-lg font-medium text-red-600 mb-2">{error}</div>
            <button
              onClick={goToPreviousStep}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Qayta urinib ko'rish
            </button>
          </div>
        </div>
      );
    }

    if (!reports || reports.length === 0) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="text-lg font-medium text-gray-900 mb-2">
              Ma'lumot topilmadi
            </div>
            <p className="text-gray-600 mb-4">
              Ushbu STIR uchun hisobotlar mavjud emas
            </p>
            <button
              onClick={goToPreviousStep}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Orqaga
            </button>
          </div>
        </div>
      );
    }

    return (
      <div>
        <div className="fixed left-8 top-28 z-10">
          <button
            onClick={goToPreviousStep}
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
        <ReportsCalendarDetail 
          reports={reports}
          companyInfo={{
            stir: stirNumber,
            companyName: companyName || 'Noma\'lum korxona'
          }}
        />
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      <Toaster />
      {renderStepProgress()}

      {currentStep === 1 && renderStep1()}
      {currentStep === 2 && renderStep2()}
      {currentStep === 3 && renderStep3()}
      
      <RatingModal
        isOpen={showRatingModal}
        onClose={() => setShowRatingModal(false)}
        onSubmit={async (rating: number, comment: string) => {
          try {
            const { createRating } = await import('../api/rating');
            await createRating({
              service: serviceId || 11, // Report Calendar service ID
              value: rating,
              comment: comment || "Hisobotlar taqvimi xizmati"
            });
            setShowRatingModal(false);
          } catch (error) {
            console.error('Rating submission error:', error);
            setShowRatingModal(false);
          }
        }}
        serviceName="Hisobotlar taqvimi"
      />
    </div>
  );
};

export default ReportCalendar;
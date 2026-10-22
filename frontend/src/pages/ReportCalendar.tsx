import React, { useState } from 'react';
import ReportMonthCalendar from '../components/reports/ReportMonthCalendar';
import { Search } from 'lucide-react';
import ReportsCalendarDetail from './ReportsCalendarDetail';
import { getReportsByStir } from '../api/reports';
import { ReportData, ReportCalendarResponse } from '../types/report';
import toast, { Toaster } from 'react-hot-toast';
import { asApiError } from '../api/errors';

const ReportCalendar: React.FC = () => {
  // Taqvim to'g'ridan-to'g'ri ochiladi: 2 — STIR kiritish, 3 — hisobotlar (xizmat haqida / oferta bosqichi yo'q)
  const [currentStep, setCurrentStep] = useState<2 | 3>(2);
  const [stirNumber, setStirNumber] = useState('');
  const [reports, setReports] = useState<ReportData[]>([]);
  const [companyName, setCompanyName] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        
        const response = await getReportsByStir(stirNumber) as unknown as ReportCalendarResponse;
        
        if (response && response.data && Array.isArray(response.data)) {
          if (response.data.length > 0) {
            setReports(response.data);
            setCompanyName(response.org_name || 'Noma\'lum korxona');
            goToNextStep();
          } else {
            setError('Ushbu STIR uchun hisobotlar topilmadi');
          }
        } else {
          console.error('Invalid response format:', response);
          setError('Noto\'g\'ri ma\'lumot formati');
        }
      } catch (caught) {
        const err = asApiError(caught);
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

  const goToNextStep = () => setCurrentStep(3);
  const goToPreviousStep = () => setCurrentStep(2);

  // Create array of 9 positions for underlines
  const inputPositions = Array.from({ length: 9 }, (_, i) => i);

  // Bosqichlar: 1 — STIR kiritish, 2 — hisobotlar
  const renderStepProgress = () => (
    <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
      <ol className="flex items-center gap-3" aria-label="Bosqichlar">
        {[{ n: 1, step: 2, label: 'STIR kiritish' }, { n: 2, step: 3, label: 'Hisobotlar' }].map((it, i) => {
          const active = currentStep === it.step;
          const done = currentStep > it.step;
          return (
            <li key={it.n} className="flex flex-1 items-center gap-3" aria-current={active ? 'step' : undefined}>
              <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 text-sm font-semibold ${
                active ? 'border-mg-primary text-mg-primary bg-white' : done ? 'border-mg-primary bg-mg-primary text-white' : 'border-gray-300 text-gray-500 bg-white'
              }`}>{it.n}</span>
              <span className={`text-sm font-medium ${active ? 'text-mg-primary' : done ? 'text-gray-900' : 'text-gray-400'}`}>{it.label}</span>
              {i === 0 && <span className="h-0.5 flex-1 bg-gray-200"><span className={`block h-full bg-mg-primary transition-all duration-500 ${currentStep === 3 ? 'w-full' : 'w-0'}`} /></span>}
            </li>
          );
        })}
      </ol>
    </div>
  );

  // Step 2 Component - STIR Input
  const renderStep2 = () => (
    <div>
      <div className="flex items-center justify-center p-4 mt-4">
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
      <div className="w-full mt-10">
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
    <div className="">
      <Toaster />
      {renderStepProgress()}

            {currentStep === 2 && renderStep2()}
      {currentStep === 3 && renderStep3()}
      
    </div>
  );
};

export default ReportCalendar;
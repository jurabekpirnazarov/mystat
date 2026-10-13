import React, { useState, useEffect } from 'react';
import { TrendingUp, BarChart3, Table, Calendar, Calculator } from 'lucide-react';
import BookStep1 from '../components/BookStep1';
import { getCpiData, getYearsMonths } from '../api/reports';
import { CpiDataItem } from '../types';
import { useServiceId } from '../utils/useServiceId';
import RatingModal from '../components/modals/RatingModal';

interface CalculatorState {
  fromYear: string;
  fromMonth: string;
  toYear: string;
  toMonth: string;
}

const CpiCalculator: React.FC = () => {
  const { serviceId } = useServiceId(); // get real ID from API
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);

  const handleRatingSubmit = async (rating: number, comment: string) => {
    try {
      const { createRating } = await import('../api/rating');
      await createRating({
        service: serviceId || 7, // CPI Calculator service ID
        value: rating,
        comment: comment || "CPI kalkulyator xizmati"
      });
      setIsRatingModalOpen(false);
    } catch (error) {
      console.error('Rating submission error:', error);
      setIsRatingModalOpen(false);
    }
  };

  // Component unmount bo'lganda localStorage'ni tozalash
  useEffect(() => {
    return () => {
      localStorage.removeItem("cpicalc_currentStep");
    };
  }, []);
  
  // Step management (persisted in localStorage)
  const getInitialStep = () => {
    const saved = localStorage.getItem("cpicalc_currentStep");
    if (saved === "2" || saved === "3") return Number(saved) as 2 | 3;
    return 1;
  };

  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(getInitialStep());

  // Step navigation functions
  const goToNextStep = () => {
    if (currentStep < 3) {
      setCurrentStep((prev) => {
        const next = (prev + 1) as 1 | 2 | 3;
        localStorage.setItem("cpicalc_currentStep", String(next));
        return next;
      });
    }
  };

  const goToPreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => {
        const prevStep = (prev - 1) as 1 | 2 | 3;
        localStorage.setItem("cpicalc_currentStep", String(prevStep));
        return prevStep;
      });
    }
  };

  // Keep localStorage in sync if currentStep changes elsewhere
  useEffect(() => {
    localStorage.setItem("cpicalc_currentStep", String(currentStep));
  }, [currentStep]);

  // Load available years from API
  useEffect(() => {
    const loadYears = async () => {
      try {
        setYearsLoading(true);
        const response = await getYearsMonths();
        setAvailableYears(response.years.sort((a, b) => b - a)); // Sort in descending order
      } catch (error) {
        console.error('Error loading years:', error);
        // Keep fallback years if API fails
      } finally {
        setYearsLoading(false);
      }
    };

    loadYears();
  }, []);

  const [state, setState] = useState<CalculatorState>({
    fromYear: '',
    fromMonth: '',
    toYear: '',
    toMonth: '',
  });

  // CPI data state
  const [cpiData, setCpiData] = useState<CpiDataItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [calculationResult, setCalculationResult] = useState<{
    totalInflation: number;
    averageInflation: number;
    fromValue: number;
    toValue: number;
  } | null>(null);
  const [activeTab, setActiveTab] = useState<'summary' | 'chart' | 'table'>('summary');
  
  // Years from API
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [yearsLoading, setYearsLoading] = useState(false);

  const currentYear = new Date().getFullYear();
  const years = availableYears.length > 0 ? availableYears : Array.from({ length: 10 }, (_, i) => currentYear - i);
  const months = [
    { value: '01', label: 'Yanvar' },
    { value: '02', label: 'Fevral' },
    { value: '03', label: 'Mart' },
    { value: '04', label: 'Aprel' },
    { value: '05', label: 'May' },
    { value: '06', label: 'Iyun' },
    { value: '07', label: 'Iyul' },
    { value: '08', label: 'Avgust' },
    { value: '09', label: 'Sentabr' },
    { value: '10', label: 'Oktabr' },
    { value: '11', label: 'Noyabr' },
    { value: '12', label: 'Dekabr' }
  ];

  const handleCalculate = async () => {
    if (!state.fromYear || !state.fromMonth || !state.toYear || !state.toMonth) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch CPI data from API
      const response = await getCpiData({
        start_year: state.fromYear,
        start_month: state.fromMonth,
        end_year: state.toYear,
        end_month: state.toMonth
      });

      setCpiData(response.result);

      // Calculate inflation metrics
      if (response.result.length > 0) {
        const fromValue = parseFloat(response.result[0].values);
        const toValue = parseFloat(response.result[response.result.length - 1].values);
        
        // Calculate total inflation rate
        const totalInflation = ((toValue - fromValue) / fromValue) * 100;
        
        // Calculate average monthly inflation
        const monthCount = response.result.length;
        const averageInflation = totalInflation / monthCount;

        setCalculationResult({
          totalInflation: Number(totalInflation.toFixed(2)),
          averageInflation: Number(averageInflation.toFixed(2)),
          fromValue,
          toValue
        });
      }

      // Move to step 3
      goToNextStep();
    } catch (err) {
      console.error('Error calculating CPI:', err);
      setError('Hisoblashda xatolik yuz berdi. Iltimos, qayta urinib ko\'ring.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof CalculatorState, value: string) => {
    setState(prev => ({ ...prev, [field]: value }));
  };

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
              Hisoblash
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
              Natija
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  // Step 2 Component - Calculator
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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-cyan-500 to-blue-600 px-8 py-6">
            <div className="flex items-center space-x-3">
              <Calendar className="text-white" size={24} />
              <h2 className="text-2xl font-bold text-white">Vaqt oralig'i</h2>
            </div>
            <p className="text-cyan-100 mt-1">Hisoblash uchun vaqt oralig'ini tanlang</p>
          </div>

          <div className="p-8">
            <div className="grid md:grid-cols-2 gap-8">
              {/* From Date */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <label className="text-lg font-semibold text-gray-900">Dan:</label>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Yil:</label>
                    <select
                      value={state.fromYear}
                      onChange={(e) => handleInputChange('fromYear', e.target.value)}
                      disabled={yearsLoading}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    >
                      <option value="">{yearsLoading ? 'Yillar yuklanmoqda...' : 'Yilni tanlang'}</option>
                      {years.map(year => (
                        <option key={year} value={year.toString()}>{year}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Oy:</label>
                    <select
                      value={state.fromMonth}
                      onChange={(e) => handleInputChange('fromMonth', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                    >
                      <option value="">Oyni tanlang</option>
                      {months.map(month => (
                        <option key={month.value} value={month.value}>{month.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* To Date */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <label className="text-lg font-semibold text-gray-900">Gacha:</label>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Yil:</label>
                    <select
                      value={state.toYear}
                      onChange={(e) => handleInputChange('toYear', e.target.value)}
                      disabled={yearsLoading}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    >
                      <option value="">{yearsLoading ? 'Yillar yuklanmoqda...' : 'Yilni tanlang'}</option>
                      {years.map(year => (
                        <option key={year} value={year.toString()}>{year}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Oy:</label>
                    <select
                      value={state.toMonth}
                      onChange={(e) => handleInputChange('toMonth', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                    >
                      <option value="">Oyni tanlang</option>
                      {months.map(month => (
                        <option key={month.value} value={month.value}>{month.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 text-center">
              {error && (
                <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                  {error}
                </div>
              )}
              <button
                onClick={handleCalculate}
                disabled={!state.fromYear || !state.fromMonth || !state.toYear || !state.toMonth || loading}
                className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200 transform hover:scale-105 flex items-center justify-center mx-auto"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Hisoblayapti...
                  </>
                ) : (
                  'Hisoblash'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Step 1 Component - Service Information
  const renderStep1 = () => <BookStep1 onNext={goToNextStep} serviceId={serviceId} />;

  // Step 3 Component - Results Display
  const renderStep3 = () => (
    <div>
      <RatingModal
        isOpen={isRatingModalOpen}
        onClose={() => setIsRatingModalOpen(false)}
        onSubmit={handleRatingSubmit}
        serviceName="CPI kalkulyator"
      />
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
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-green-500 to-blue-600 px-8 py-6">
            <h2 className="text-2xl font-bold text-white">Hisoblash natijalari</h2>
            <p className="text-green-100 mt-1">
              {state.fromMonth}/{state.fromYear} dan {state.toMonth}/{state.toYear} gacha
            </p>
          </div>

          <div className="p-8">
            {calculationResult && (
              <>
                {/* Tab Navigation */}
                <div className="flex space-x-1 mb-6 bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
                  <button
                    onClick={() => setActiveTab('summary')}
                    className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                      activeTab === 'summary'
                        ? 'bg-white dark:bg-gray-600 text-green-700 dark:text-green-300 shadow-sm'
                        : 'text-gray-600 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400'
                    }`}
                  >
                    <Calculator className="w-4 h-4 inline mr-2" />
                    Xulosa
                  </button>
                  <button
                    onClick={() => setActiveTab('chart')}
                    className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                      activeTab === 'chart'
                        ? 'bg-white dark:bg-gray-600 text-green-700 dark:text-green-300 shadow-sm'
                        : 'text-gray-600 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400'
                    }`}
                  >
                    <TrendingUp className="w-4 h-4 inline mr-2" />
                    Grafik
                  </button>
                  <button
                    onClick={() => setActiveTab('table')}
                    className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                      activeTab === 'table'
                        ? 'bg-white dark:bg-gray-600 text-green-700 dark:text-green-300 shadow-sm'
                        : 'text-gray-600 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400'
                    }`}
                  >
                    <Table className="w-4 h-4 inline mr-2" />
                    Jadval
                  </button>
                </div>

                {/* Tab Content */}
                {activeTab === 'summary' && (
                  <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-6 rounded-lg border border-blue-200">
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        <h3 className="font-semibold text-blue-900">Boshlang'ich indeks</h3>
                      </div>
                      <p className="text-2xl font-bold text-blue-700 mt-2">
                        {calculationResult.fromValue.toFixed(2)}
                      </p>
                    </div>

                    <div className="bg-gradient-to-r from-green-50 to-green-100 p-6 rounded-lg border border-green-200">
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <h3 className="font-semibold text-green-900">Yakuniy indeks</h3>
                      </div>
                      <p className="text-2xl font-bold text-green-700 mt-2">
                        {calculationResult.toValue.toFixed(2)}
                      </p>
                    </div>

                    <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-6 rounded-lg border border-purple-200">
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                        <h3 className="font-semibold text-purple-900">Umumiy inflyatsiya</h3>
                      </div>
                      <p className="text-2xl font-bold text-purple-700 mt-2">
                        {calculationResult.totalInflation > 0 ? '+' : ''}{calculationResult.totalInflation}%
                      </p>
                    </div>

                    <div className="bg-gradient-to-r from-orange-50 to-orange-100 p-6 rounded-lg border border-orange-200">
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                        <h3 className="font-semibold text-orange-900">O'rtacha oylik</h3>
                      </div>
                      <p className="text-2xl font-bold text-orange-700 mt-2">
                        {calculationResult.averageInflation > 0 ? '+' : ''}{calculationResult.averageInflation}%
                      </p>
                    </div>
                  </div>
                )}

                {activeTab === 'chart' && cpiData.length > 0 && (
                  <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 mb-8">
                    <h4 className="text-lg font-semibold mb-4 flex items-center text-gray-900 dark:text-gray-100">
                      <BarChart3 className="w-5 h-5 mr-2" />
                      CPI Inflyatsiya grafigi
                    </h4>
                    
                    <div className="w-full h-96 bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                      <svg
                        width="100%"
                        height="100%"
                        viewBox="0 0 800 350"
                        className="overflow-visible text-gray-600 dark:text-gray-300"
                      >
                        {/* Chart axes */}
                        <line x1="80" y1="280" x2="720" y2="280" stroke="currentColor" strokeWidth="2" />
                        <line x1="80" y1="40" x2="80" y2="280" stroke="currentColor" strokeWidth="2" />
                        
                        {/* Dynamic Y-axis grid and labels */}
                        {(() => {
                          const minValue = Math.min(...cpiData.map(d => parseFloat(d.values || '0')));
                          const maxValue = Math.max(...cpiData.map(d => parseFloat(d.values || '0')));
                          const range = maxValue - minValue;
                          const step = range / 5;
                          const gridValues = Array.from({length: 6}, (_, i) => minValue + (step * i));
                          
                          return gridValues.map((value, i) => (
                            <g key={i}>
                              {/* Grid lines */}
                              <line
                                x1="80"
                                y1={280 - ((value - minValue) / range) * 220}
                                x2="720"
                                y2={280 - ((value - minValue) / range) * 220}
                                stroke="currentColor"
                                strokeWidth="0.5"
                                opacity="0.3"
                              />
                              {/* Y-axis labels */}
                              <text
                                x="70"
                                y={280 - ((value - minValue) / range) * 220 + 5}
                                textAnchor="end"
                                fontSize="11"
                                fill="currentColor"
                              >
                                {value.toFixed(1)}
                              </text>
                            </g>
                          ));
                        })()}
                        
                        {/* Chart data points and lines */}
                        {cpiData.map((item, index) => {
                          const x = 80 + (index * (640 / (cpiData.length - 1)));
                          const minValue = Math.min(...cpiData.map(d => parseFloat(d.values || '0')));
                          const maxValue = Math.max(...cpiData.map(d => parseFloat(d.values || '0')));
                          const range = maxValue - minValue;
                          const normalizedValue = (parseFloat(item.values || '0') - minValue) / range;
                          const y = 280 - (normalizedValue * 220);
                          
                          // Smart label display logic
                          const shouldShowLabel = (() => {
                            if (cpiData.length <= 12) return true; // Show all if 12 or fewer points
                            if (cpiData.length <= 24) return index % 2 === 0; // Show every 2nd if <= 24 points
                            if (cpiData.length <= 48) return index % 4 === 0; // Show every 4th if <= 48 points
                            if (cpiData.length <= 96) return index % 8 === 0; // Show every 8th if <= 96 points
                            return index % 12 === 0 || index === cpiData.length - 1; // Show every 12th for very long periods
                          })();
                          
                          const date = new Date(item.year);
                          const isYearStart = date.getMonth() === 0;
                          
                          return (
                            <g key={item.id}>
                              <circle
                                cx={x}
                                cy={y}
                                r={isYearStart ? "4" : "3"}
                                fill={isYearStart ? "rgb(59, 130, 246)" : "rgb(34, 197, 94)"}
                                className="hover:r-6 transition-all cursor-pointer"
                                stroke={isYearStart ? "rgb(29, 78, 216)" : "rgb(22, 163, 74)"}
                                strokeWidth="1"
                              />
                              
                              {/* Smart X-axis labels */}
                              {shouldShowLabel && (
                                <>
                                  <text
                                    x={x}
                                    y="300"
                                    textAnchor="middle"
                                    fontSize="10"
                                    fill="currentColor"
                                    transform={cpiData.length > 48 ? `rotate(-45 ${x} 300)` : ''}
                                  >
                                    {cpiData.length > 24 
                                      ? date.toLocaleDateString('uz-UZ', { year: 'numeric' })
                                      : date.toLocaleDateString('uz-UZ', { month: 'short', year: '2-digit' })
                                    }
                                  </text>
                                  {/* Value label on hover or key points */}
                                  {(isYearStart || index === 0 || index === cpiData.length - 1) && (
                                    <text
                                      x={x}
                                      y={y - 8}
                                      textAnchor="middle"
                                      fontSize="9"
                                      fill="currentColor"
                                      fontWeight="bold"
                                      opacity="0.8"
                                    >
                                      {item.values}
                                    </text>
                                  )}
                                </>
                              )}
                              
                              {/* Connection lines */}
                              {index > 0 && (
                                <line
                                  x1={80 + ((index - 1) * (640 / (cpiData.length - 1)))}
                                  y1={280 - (((parseFloat(cpiData[index - 1].values || '0') - minValue) / range) * 220)}
                                  x2={x}
                                  y2={y}
                                  stroke="rgb(34, 197, 94)"
                                  strokeWidth="2"
                                />
                              )}
                            </g>
                          );
                        })}
                        
                        {/* Chart title and info */}
                        <text
                          x="400"
                          y="25"
                          textAnchor="middle"
                          fontSize="16"
                          fontWeight="bold"
                          fill="currentColor"
                        >
                          CPI Qiymatlari Grafigi
                        </text>
                        
                        {/* Legend */}
                        <g transform="translate(580, 50)">
                          <circle cx="10" cy="10" r="3" fill="rgb(34, 197, 94)" />
                          <text x="18" y="14" fontSize="10" fill="currentColor">Oylik ma'lumot</text>
                          <circle cx="10" cy="25" r="4" fill="rgb(59, 130, 246)" stroke="rgb(29, 78, 216)" strokeWidth="1" />
                          <text x="18" y="29" fontSize="10" fill="currentColor">Yil boshi</text>
                        </g>
                      </svg>
                    </div>
                  </div>
                )}

                {activeTab === 'table' && cpiData.length > 0 && (
                  <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden mb-8">
                    <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                      <h4 className="text-lg font-semibold flex items-center text-gray-900 dark:text-gray-100">
                        <Table className="w-5 h-5 mr-2" />
                        CPI ma'lumotlari jadvali
                      </h4>
                    </div>
                    
                    <div className="overflow-x-auto max-h-96">
                      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
                        <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              Davr
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              CPI qiymati
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              Oldingi oyga nisbatan (%)
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              Yil boshiga nisbatan (%)
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-600">
                          {cpiData.map((item, index) => {
                            const currentValue = parseFloat(item.values || '0');
                            const prevValue = index > 0 ? parseFloat(cpiData[index - 1].values || '0') : currentValue;
                            const firstValue = parseFloat(cpiData[0].values || '0');
                            
                            const monthChange = index > 0 ? ((currentValue - prevValue) / prevValue) * 100 : 0;
                            const yearChange = ((currentValue - firstValue) / firstValue) * 100;
                            
                            return (
                              <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                                  {new Date(item.year).toLocaleDateString('uz-UZ', { month: 'long', year: 'numeric' })}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                                  <span className="font-semibold">{currentValue.toFixed(2)}</span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                  {index > 0 ? (
                                    <span className={`font-medium ${
                                      monthChange >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                                    }`}>
                                      {monthChange >= 0 ? '+' : ''}{monthChange.toFixed(2)}%
                                    </span>
                                  ) : (
                                    <span className="text-gray-400">—</span>
                                  )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                  <span className={`font-medium ${
                                    yearChange >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400'
                                  }`}>
                                    {yearChange >= 0 ? '+' : ''}{yearChange.toFixed(2)}%
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </>
            )}

            {cpiData.length > 0 && (
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Oylik ma'lumotlar</h3>
                <div className="max-h-96 overflow-y-auto">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {cpiData.map((item) => {
                      const date = new Date(item.year);
                      const monthName = months[date.getMonth()].label;
                      const year = date.getFullYear();
                      
                      return (
                        <div key={item.id} className="bg-white p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-gray-600">
                              {monthName} {year}
                            </span>
                            <span className="text-lg font-bold text-blue-600">
                              {item.values}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            <div className="mt-8 flex justify-center space-x-4">
              <button
                onClick={() => setIsRatingModalOpen(true)}
                className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors duration-200"
              >
                Baholash
              </button>
              <button
                onClick={() => {
                  setCurrentStep(1);
                  localStorage.setItem("cpicalc_currentStep", "1");
                  setState({
                    fromYear: '',
                    fromMonth: '',
                    toYear: '',
                    toMonth: '',
                  });
                  setCpiData([]);
                  setCalculationResult(null);
                  setError(null);
                }}
                className="px-6 py-2 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700 transition-colors duration-200"
              >
                Yangi hisoblash
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      {renderStepProgress()}

      {currentStep === 1 && renderStep1()}
      {currentStep === 2 && renderStep2()}
      {currentStep === 3 && renderStep3()}
    </div>
  );
};

export default CpiCalculator;
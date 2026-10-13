import React, { useState, useEffect } from 'react';
import BookStep1 from '../components/BookStep1';
import RatingModal from '../components/modals/RatingModal';
import ClassificationBrowser from '../components/classifications/ClassificationBrowser';
import { useServiceId } from '../utils/useServiceId';

// Main Component
const StatisticalClassifications: React.FC = () => {
  const { serviceId } = useServiceId(); // get real ID from API
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);

  const handleRatingSubmit = async (rating: number, comment: string) => {
    try {
      const { createRating } = await import('../api/rating');
      await createRating({
        service: serviceId || 8, // Statistical Classifications service ID
        value: rating,
        comment: comment || "Statistik klassifikatsiya xizmati"
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
      localStorage.removeItem("statclass_currentStep");
    };
  }, []);
  
  // Step management (persisted in localStorage)
  const getInitialStep = () => {
    const saved = localStorage.getItem("statclass_currentStep");
    if (saved === "2") return Number(saved) as 1 | 2;
    return 1;
  };

  const [currentStep, setCurrentStep] = useState<1 | 2>(getInitialStep());
  // Step navigation functions
  const goToNextStep = () => {
    if (currentStep < 2) {
      setCurrentStep((prev) => {
        const next = (prev + 1) as 1 | 2;
        localStorage.setItem("statclass_currentStep", String(next));
        return next;
      });
    }
  };

  const goToPreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => {
        const prevStep = (prev - 1) as 1 | 2;
        localStorage.setItem("statclass_currentStep", String(prevStep));
        return prevStep;
      });
    }
  };

  // Keep localStorage in sync if currentStep changes elsewhere
  useEffect(() => {
    localStorage.setItem("statclass_currentStep", String(currentStep));
  }, [currentStep]);

  // Step Progress Bar
  const renderStepProgress = () => (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
      <div className="relative">
        <div className="absolute left-0 top-2/4 h-0.5 w-full bg-gray-200">
          <div
            className="absolute h-full bg-blue-600 transition-all duration-500"
            style={{ width: `${((currentStep - 1) / 1) * 100}%` }}
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
              Malumotlar
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  // Step 1 Component - Service Information
  const renderStep1 = () => <BookStep1 onNext={goToNextStep} serviceId={serviceId} />;

  // Step 2 Component - Classifications Content
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-800 mb-2">
            Statistik klassifikatsiyalar
          </h1>
          <p className="text-slate-600 text-lg">
            Statistika sohasida qo'llaniladigan statistik tasniflagichlardan foydalanish bo'yicha qo'llanma
          </p>
        </div>

        <ClassificationBrowser />

        <div className="mt-8 flex flex-col items-center space-y-4">
          <button
            onClick={() => setIsRatingModalOpen(true)}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium rounded-lg transition-all duration-300 shadow-md hover:shadow-lg"
          >
            Xizmatni baholash
          </button>
        </div>

      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      <RatingModal
        isOpen={isRatingModalOpen}
        onClose={() => setIsRatingModalOpen(false)}
        onSubmit={handleRatingSubmit}
        serviceName="Statistik klassifikatorlar"
      />
      {renderStepProgress()}
      {currentStep === 1 && renderStep1()}
      {currentStep === 2 && renderStep2()}
    </div>
  );
};

export default StatisticalClassifications;
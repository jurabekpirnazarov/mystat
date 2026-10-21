import React, { useState, useEffect } from 'react';
import OrgDetail from '../components/OrgDetail';
import BookStep1 from '../components/BookStep1';
import OrgInfoStep2 from '../components/OrgInfoStep2';
import { OrganizationData } from '../api/organizationInfo';
import { useServiceId } from '../utils/useServiceId';
import RatingModal from '../components/modals/RatingModal';

// KORXONA_SCORING.md KR-36: korxona bali kartochkasi — lazy (Q-02 chunk'ini kattalashtirmaslik uchun)
const CompanyScoreCard = React.lazy(() => import('../components/company-score/CompanyScoreCard'));

const OrgInfoPage: React.FC = () => {
  const { serviceId } = useServiceId(); // get real ID from API

  // Component unmount bo'lganda localStorage'ni tozalash
  useEffect(() => {
    return () => {
      localStorage.removeItem("orginfo_currentStep");
    };
  }, []);
  
  // Step management (persisted in localStorage)
  const getInitialStep = () => {
    const saved = localStorage.getItem("orginfo_currentStep");
    if (saved === "2" || saved === "3") return Number(saved) as 2 | 3;
    return 1;
  };

  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(getInitialStep());
  const [organizationData, setOrganizationData] = useState<OrganizationData | null>(null);
  const [showRatingModal, setShowRatingModal] = useState(false);

  // Handle organization data from step 2
  const handleOrganizationData = (data: OrganizationData) => {
    setOrganizationData(data);
    goToNextStep();
  };

  // Step navigation functions
  const goToNextStep = () => {
    if (currentStep < 3) {
      setCurrentStep((prev) => {
        const next = (prev + 1) as 1 | 2 | 3;
        localStorage.setItem("orginfo_currentStep", String(next));
        return next;
      });
    }
  };

  const goToPreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => {
        const prev_step = (prev - 1) as 1 | 2 | 3;
        localStorage.setItem("orginfo_currentStep", String(prev_step));
        return prev_step;
      });
    }
  };

  // Keep localStorage in sync if currentStep changes elsewhere
  useEffect(() => {
    localStorage.setItem("orginfo_currentStep", String(currentStep));
  }, [currentStep]);

  // Step Progress Bar
  const renderStepProgress = () => (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
      <div className="flex items-center justify-between">
        {[1, 2, 3].map((step) => (
          <div key={step} className="flex items-center">
            <div
              className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                step === currentStep
                  ? "border-blue-600 bg-blue-600 text-white"
                  : step < currentStep
                  ? "border-blue-600 bg-white text-blue-600"
                  : "border-gray-300 bg-white text-gray-300"
              }`}
            >
              <span className="text-sm font-medium">{step}</span>
            </div>
            <span
              className={`ml-4 text-sm font-medium ${
                step === currentStep
                  ? "text-blue-600"
                  : step < currentStep
                  ? "text-gray-900"
                  : "text-gray-400"
              }`}
            >
              {step === 1 ? "Xizmat haqida" : step === 2 ? "Ma'lumotlar" : "Natija"}
            </span>
            {step < 3 && (
              <div className="ml-4 flex-1 border-t-2 border-gray-200"></div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="">
      {renderStepProgress()}

      {currentStep === 1 && <BookStep1 onNext={goToNextStep} serviceId={serviceId} />}
      {currentStep === 2 && <OrgInfoStep2 onNext={handleOrganizationData} onPrevious={goToPreviousStep} />}
      {currentStep === 3 && (
        <>
          <OrgDetail organizationData={organizationData} onBack={goToPreviousStep} />
          {organizationData?.tin && (
            <div className="max-w-4xl mx-auto mt-4 px-4">
              <React.Suspense fallback={<div className="h-48 animate-pulse rounded-xl bg-gray-100" />}>
                <CompanyScoreCard stir={organizationData.tin} />
              </React.Suspense>
            </div>
          )}
          <div className="flex justify-center mt-4 mb-5">
            <button
              onClick={() => setShowRatingModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              Xizmatni baholash
            </button>
          </div>
        </>
      )}

      <RatingModal
        isOpen={showRatingModal}
        onClose={() => setShowRatingModal(false)}
        onSubmit={async (rating: number, comment: string) => {
          try {
            const { createRating } = await import('../api/rating');
            await createRating({
              service: serviceId || 10, // OrgInfo service ID
              value: rating,
              comment: comment || "Korxona ma'lumotlari xizmati"
            });
            setShowRatingModal(false);
          } catch (error) {
            console.error('Rating submission error:', error);
            setShowRatingModal(false);
          }
        }}
        serviceName="Tashkilot ma'lumotlarini ko'rish"
      />
    </div>
  );
};

export default OrgInfoPage;
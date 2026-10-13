import React, { useState, useEffect, useMemo } from 'react';
import { Search, FileText, Calendar, X, Download, File } from 'lucide-react';
import BookStep1 from '../components/BookStep1';
import RatingModal from '../components/modals/RatingModal';
import { getStatisticalClassifications, StatisticalClassificationItem } from '../api/statisticalClassifications';
import { useServiceId } from '../utils/useServiceId';

// Download Modal Component
interface DownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  classificationName: string;
  classificationItem?: StatisticalClassificationItem | null;
}

const DownloadModal: React.FC<DownloadModalProps> = ({ isOpen, onClose, classificationName, classificationItem }) => {
  if (!isOpen) return null;

  const handleDownload = (fileType: string) => {
    if (classificationItem?.file) {
      // Agar API dan fayl URL berilgan bo'lsa, uni yuklab olish
      window.open(classificationItem.file, '_blank');
    } else {
      // Bu yerda haqiqiy fayl yuklab olish logikasi bo'ladi
      console.log(`Downloading ${fileType} for: ${classificationName}`);
      // Misol uchun:
      // window.open(`/api/download/${fileType}/${classificationId}`, '_blank');
      alert('Fayl mavjud emas yoki yuklab olish xizmat hozirda ishlamaydi');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">Faylni yuklab olish</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="mb-4">
            <h3 className="font-medium text-gray-800 mb-2">Tasniflagich:</h3>
            <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
              {classificationName}
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="font-medium text-gray-800">Mavjud formatlar:</h4>
            
            {classificationItem?.file ? (
              <button
                onClick={() => handleDownload('file')}
                className="w-full flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-all duration-200 group"
              >
                <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                  <FileText className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-medium text-gray-800">Fayl yuklab olish</p>
                  <p className="text-sm text-gray-500">Rasmiy fayl</p>
                </div>
                <Download className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
              </button>
            ) : (
              <>
                <button
                  onClick={() => handleDownload('pdf')}
                  className="w-full flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-all duration-200 group"
                >
                  <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center group-hover:bg-red-200 transition-colors">
                    <FileText className="w-5 h-5 text-red-600" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-medium text-gray-800">PDF format</p>
                    <p className="text-sm text-gray-500">Portable Document Format</p>
                  </div>
                  <Download className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
                </button>

                <button
                  onClick={() => handleDownload('excel')}
                  className="w-full flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-green-50 hover:border-green-300 transition-all duration-200 group"
                >
                  <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition-colors">
                    <File className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-medium text-gray-800">Excel format</p>
                    <p className="text-sm text-gray-500">Microsoft Excel fayli</p>
                  </div>
                  <Download className="w-5 h-5 text-gray-400 group-hover:text-green-600 transition-colors" />
                </button>

                <button
                  onClick={() => handleDownload('word')}
                  className="w-full flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-all duration-200 group"
                >
                  <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                    <FileText className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-medium text-gray-800">Word format</p>
                    <p className="text-sm text-gray-500">Microsoft Word hujjati</p>
                  </div>
                  <Download className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            Bekor qilish
          </button>
        </div>
      </div>
    </div>
  );
};

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
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedClassification, setSelectedClassification] = useState<string>('');
  const [selectedClassificationItem, setSelectedClassificationItem] = useState<StatisticalClassificationItem | null>(null);
  
  // API state
  const [classifications, setClassifications] = useState<StatisticalClassificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch classifications from API
  useEffect(() => {
    const fetchClassifications = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await getStatisticalClassifications();
        setClassifications(response.results);
      } catch (err) {
        setError('Ma\'lumotlarni yuklashda xato yuz berdi');
        console.error('Error fetching classifications:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchClassifications();
  }, []);

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

  const filteredData = useMemo(() => {
    return classifications.filter((item: StatisticalClassificationItem) =>
      item.name_uz.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.analog_uz.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.confirm_document.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, classifications]);

  const handleClassificationClick = (item: StatisticalClassificationItem) => {
    setSelectedClassification(item.name_uz);
    setSelectedClassificationItem(item);
    setIsModalOpen(true);
  };

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

        <div className="bg-white rounded-xl shadow-lg p-6 mb-8 border border-slate-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Tasniflagichlarni qidirish..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-slate-200">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span className="text-slate-600">Ma'lumotlar yuklanmoqda...</span>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="text-red-600 mb-2">⚠️</div>
                <p className="text-red-600">{error}</p>
                <button 
                  onClick={() => window.location.reload()} 
                  className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Qayta urinish
                </button>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-blue-600/90 text-white">
                    <th className="px-4 py-4 text-left font-semibold w-16">T/R</th>
                    <th className="px-4 py-4 text-left font-semibold w-80">TASNIFLAGILAR</th>
                    <th className="px-4 py-4 text-left font-semibold w-60">XALQARO ANALOGLARI</th>
                    <th className="px-4 py-4 text-left font-semibold w-48">HUJAT</th>
                    <th className="px-4 py-4 text-left font-semibold w-32 min-w-[120px]">SANA</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((item: StatisticalClassificationItem, index: number) => (
                    <tr 
                      key={item.id}
                      className={`border-b border-slate-200 hover:bg-slate-50 transition-colors duration-150 ${
                        index % 2 === 0 ? 'bg-white' : 'bg-slate-25'
                      }`}
                    >
                      <td className="px-4 py-6">
                        <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">
                          {index + 1}
                        </div>
                      </td>
                      <td className="px-4 py-6">
                        <p 
                          className="font-medium text-slate-800 cursor-pointer hover:text-blue-600"
                          onClick={() => handleClassificationClick(item)}
                        >
                          {item.name_uz}
                        </p>
                      </td>
                      <td className="px-4 py-6">
                        <p className="text-slate-600 text-sm">
                          {item.analog_uz}
                        </p>
                      </td>
                      <td className="px-4 py-6">
                        <p className="text-slate-600 text-sm">
                          {item.confirm_document}
                        </p>
                      </td>
                      <td className="px-4 py-6 w-32 min-w-[120px]">
                        <div className="flex items-center space-x-2 whitespace-nowrap">
                          <Calendar className="w-4 h-4 text-slate-400 flex-shrink-0" />
                          <span className="text-slate-700 font-medium text-sm">
                            {new Date(item.date).toLocaleDateString('uz-UZ')}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="mt-8 flex flex-col items-center space-y-4">
          <button
            onClick={() => setIsRatingModalOpen(true)}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium rounded-lg transition-all duration-300 shadow-md hover:shadow-lg"
          >
            Xizmatni baholash
          </button>
          <p className="text-slate-500">
            Jami tasniflagichlar: <span className="font-semibold text-slate-700">{filteredData.length}</span>
          </p>
        </div>

        <DownloadModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          classificationName={selectedClassification}
          classificationItem={selectedClassificationItem}
        />
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
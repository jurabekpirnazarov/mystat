import React, { useState, useEffect } from 'react';
import { FileText, Download, Search, ChevronDown, ChevronUp, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getRequest } from '../api/request';
import { interactive_services } from '../api/apiUrls';

interface Reglament {
  id: number;
  name_uz: string;
  description_uz: string;
  reglament: string;
  category_name: string;
  slug: string;
  is_active: boolean;
}

interface ApiResponse {
  count: number;
  page_count: number;
  next: string | null;
  previous: string | null;
  results: Reglament[];
}

const Reglaments: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [reglaments, setReglaments] = useState<Reglament[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Fetch data from API
  useEffect(() => {
    const fetchReglaments = async () => {
      try {
        setLoading(true);
        const response = await getRequest(interactive_services) as ApiResponse;
        if (response && response.results) {
          // Filter only active services (reglament mavjudligini tekshirmaydi)
          const activeServices = response.results.filter(
            (service: Reglament) => service.is_active
          );
          setReglaments(activeServices);
        }
      } catch (err) {
        setError('Ma\'lumotlarni yuklashda xato yuz berdi');
        console.error('Error fetching reglaments:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchReglaments();
  }, []);

  const categories = ['all', ...new Set(reglaments.map(r => r.category_name))];

  const filteredReglaments = reglaments.filter(reglament => {
    const matchesSearch = 
      reglament.name_uz.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (reglament.description_uz && reglament.description_uz.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'all' || reglament.category_name === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const handleDownload = (reglament: string) => {
    if (reglament && reglament.trim() !== '') {
      // Extract URL from HTML content
      const parser = new DOMParser();
      const doc = parser.parseFromString(reglament, 'text/html');
      const link = doc.querySelector('a');
      if (link && link.href) {
        window.open(link.href, '_blank');
      } else {
        alert('Fayl URL topilmadi');
      }
    } else {
      // Reglament mavjud bo'lmagan holat
      alert('Reglament fayli hozircha mavjud emas');
    }
  };

  const handleNavigateToService = (slug: string) => {
    navigate(`/${slug}`);
  };

  return (
    <div className="py-2">
      <div className="w-full">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Xizmatlar reglamenti
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Statistik va tahliliy ma'lumotlarni taqdim etish bo'yicha xizmatlar reglamentlari
          </p>
        </div>

        {/* Search and Filter */}
        <div className="mb-8 max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Search Input */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Reglamentlarni qidirish..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="block w-full py-2 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category === 'all' ? 'Barcha bo\'limlar' : category}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Reglaments List */}
        <div className="max-w-4xl mx-auto space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span className="text-gray-600">Ma'lumotlar yuklanmoqda...</span>
              </div>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="text-red-600 mb-2">⚠️</div>
              <p className="text-red-600">{error}</p>
              <button 
                onClick={() => window.location.reload()} 
                className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Qayta urinish
              </button>
            </div>
          ) : filteredReglaments.length > 0 ? (
            filteredReglaments.map((reglament) => (
              <div
                key={reglament.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden transition-all duration-200 hover:shadow-md"
              >
                <div
                  className="p-6 cursor-pointer"
                  onClick={() => setExpandedId(expandedId === reglament.id ? null : reglament.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <div className="mt-1">
                        <FileText className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">
                          {reglament.name_uz}
                        </h3>
                        {/* <p className="text-sm text-gray-500 mt-1">
                          Kategoriya: {reglament.category_name}
                        </p> */}
                      </div>
                    </div>
                    <button
                      className="flex items-center justify-center h-6 w-6 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none"
                    >
                      {expandedId === reglament.id ? (
                        <ChevronUp className="h-5 w-5" />
                      ) : (
                        <ChevronDown className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>

                {expandedId === reglament.id && (
                  <div className="px-6 pb-6 border-t border-gray-100">
                    <div className="mt-4">
                      <div className="text-gray-600 mb-4">
                        {reglament.description_uz ? (
                          <div dangerouslySetInnerHTML={{ __html: reglament.description_uz }} />
                        ) : (
                          <p>Tavsif mavjud emas</p>
                        )}
                      </div>
                      <div className="flex justify-between items-center gap-4">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                          {reglament.category_name}
                        </span>
                        <div className="flex gap-3">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleNavigateToService(reglament.slug);
                            }}
                            className="inline-flex items-center px-4 py-2 border border-blue-600 text-sm font-medium rounded-md text-blue-600 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                          >
                            <ArrowRight className="h-4 w-4 mr-2" />
                            Xizmatga o'tish
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownload(reglament.reglament);
                            }}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Reglamentni yuklash
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Reglamentlar topilmadi</h3>
              <p className="mt-1 text-sm text-gray-500">
                Qidiruv so'rovi bo'yicha hech qanday reglament topilmadi.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Reglaments;
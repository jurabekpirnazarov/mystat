import React, { useState } from 'react';
import { Building2, Hash, LayoutGrid, Table, Search, Filter } from 'lucide-react';
import { ReportData } from '../types/report';
import ReportsTable from '../components/reports/ReportsTable';
import ReportCard from '../components/reports/ReportCard';
import CompanyScoreBadge from '../components/company-score/CompanyScoreBadge';
import { useCompanyScores } from '../api/companyScores';

interface ReportsCalendarDetailProps {
  reports: ReportData[];
  companyInfo: {
    stir: string;
    companyName: string;
  };
}

const ReportsCalendarDetail: React.FC<ReportsCalendarDetailProps> = ({ reports, companyInfo }) => {
  // KORXONA_SCORING.md KR-35 ("Qamrov qoidasi"): topilgan korxona bali
  const scores = useCompanyScores(companyInfo?.stir ? [companyInfo.stir] : []);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');

  const filteredReports = reports.filter(report => {
    const matchesSearch = report.type_uz.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.formsname_uz.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === 'all' || report.report_type === selectedType;
    return matchesSearch && matchesType;
  });

  // Extract unique report types for filter
  const reportTypes = ['all', ...new Set(reports.map(report => report.report_type))];
  
  // Function to get display name for report type
  const getReportTypeDisplayName = (type: string) => {
    switch(type) {
      case 'quarterly': return 'Choraklik hisobotlar';
      case 'yearly': return 'Yillik hisobotlar';
      case 'monthly': return 'Oylik hisobotlar';
      case 'all': return 'Barcha turlar';
      default: return type;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 mb-8">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg mb-6">
              <Building2 className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Hisobot shaklari
            </h1>
            <p className="text-lg text-gray-600 mb-6">
              Davlat statistika hisobotlari va taqdim etish muddatlari
            </p>
            
            {/* Company Info */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="flex items-center space-x-3">
                  <Hash className="h-5 w-5 text-blue-600" />
                  <div className="text-left">
                    <p className="text-sm font-medium text-gray-600">STIR:</p>
                    <p className="text-lg font-bold text-gray-900 flex items-center gap-2">{companyInfo.stir} <CompanyScoreBadge score={scores[companyInfo.stir]} /></p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Building2 className="h-5 w-5 text-blue-600" />
                  <div className="text-left">
                    <p className="text-sm font-medium text-gray-600">Tashkilot nomi:</p>
                    <p className="text-sm font-semibold text-gray-900 leading-tight">{companyInfo.companyName}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Controls Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            {/* Search */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Hisobot nomi yoki turini qidiring..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Filter */}
              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4 text-gray-500" />
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">Barcha turlar</option>
                  {reportTypes.slice(1).map(type => (
                    <option key={type} value={type}>{getReportTypeDisplayName(type)}</option>
                  ))}
                </select>
              </div>

              {/* View Toggle */}
              <div className="flex items-center bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('table')}
                  className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
                    viewMode === 'table' 
                      ? 'bg-white text-blue-600 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Table className="h-4 w-4" />
                  <span>Jadval</span>
                </button>
                <button
                  onClick={() => setViewMode('cards')}
                  className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
                    viewMode === 'cards' 
                      ? 'bg-white text-blue-600 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <LayoutGrid className="h-4 w-4" />
                  <span>Kartalar</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-sm text-gray-600">
            Jami <span className="font-semibold text-gray-900">{filteredReports.length}</span> ta hisobot topildi
          </p>
        </div>

        {/* Content Section */}
        {filteredReports.length > 0 ? (
          viewMode === 'table' ? (
            <ReportsTable reports={filteredReports} />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredReports.map((report, index) => (
                <ReportCard key={report.id} report={report} index={index} />
              ))}
            </div>
          )
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="h-6 w-6 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Hech qanday hisobot topilmadi
            </h3>
            <p className="text-gray-600">
              Qidiruv so'zingizni o'zgartiring yoki filterni tekshiring
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportsCalendarDetail;
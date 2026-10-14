import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Calendar, FileText, ChevronDown } from 'lucide-react';
import { getRequest } from '../api/request';
import { calendar } from '../api/apiUrls';

interface Report {
  id: string;
  date: string;
  title: string;
  type: 'monthly' | 'quarterly' | 'weekly' | 'annual';
}

// API Response interfaces
interface ApiReport {
  id: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  type: string;
  srok: string;
  formsname: string;
  type_uz: string;
  srok_uz: string;
  formsname_uz: string;
  deadline: string;
  report_type: string;
}

interface CalendarApiResponse {
  data: ApiReport[];
  meta: {
    month_count: number;
    has_reports_days: number[];
  };
}

interface ReportsCalendarProps {
  reports?: Report[];
}

const CalendarReport: React.FC<ReportsCalendarProps> = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [apiReports, setApiReports] = useState<ApiReport[]>([]);
  const [hasReportsDays, setHasReportsDays] = useState<number[]>([]);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [selectedDayReports, setSelectedDayReports] = useState<ApiReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDayLoading, setIsDayLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedReports, setExpandedReports] = useState<Set<string>>(new Set());

  // Fetch reports for specific day
  const fetchDayReports = useCallback(async (day: number) => {
    try {
      setIsDayLoading(true);
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;
      const dayApiUrl = `${calendar}?year=${year}&month=${month}&day=${day}`;
      
      const response = await getRequest(dayApiUrl);
      
      if (response && typeof response === 'object' && 'data' in response) {
        const dayResponse = response as CalendarApiResponse;
        setSelectedDayReports(dayResponse.data);
      }
    } catch (err) {
      console.error('❌ Error fetching day reports:', err);
      setSelectedDayReports([]);
    } finally {
      setIsDayLoading(false);
    }
  }, [currentDate]);

  // Retry function for error cases
  const retryFetch = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;
    const apiUrl = `${calendar}?year=${year}&month=${month}`;
    
    getRequest(apiUrl)
      .then(response => {
        if (response && typeof response === 'object' && 'data' in response && 'meta' in response) {
          const calendarResponse = response as CalendarApiResponse;
          setApiReports(calendarResponse.data);
          setHasReportsDays(calendarResponse.meta.has_reports_days);
          setError(null);
        }
      })
      .catch(() => {
        setError('Ma\'lumotlarni yuklashda xato yuz berdi');
      });
  };

  const months = [
    'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun',
    'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'
  ];

  const weekDays = ['Ya', 'Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh'];

  // Fetch calendar data from API
  const fetchCalendarData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Hamma oylar uchun year va month parametrlarini yuborish
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1; // API expects 1-12
      const apiUrl = `${calendar}?year=${year}&month=${month}`;
      
      const response = await getRequest(apiUrl);
      
      if (response && typeof response === 'object' && 'data' in response && 'meta' in response) {
        const calendarResponse = response as CalendarApiResponse;
        setApiReports(calendarResponse.data);
        setHasReportsDays(calendarResponse.meta.has_reports_days);
      } else {
        console.warn('⚠️ Unexpected API response format');
      }
    } catch (err) {
      setError('Ma\'lumotlarni yuklashda xato yuz berdi');
      console.error('❌ Error fetching calendar data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch data on component mount and when month changes
  useEffect(() => {
    fetchCalendarData();
    // Reset selected day when month changes
    setSelectedDay(null);
    setSelectedDayReports([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentDate]);

  // Remove auto-selection - let user manually select days
  // useEffect removed to show all month reports by default

  // Toggle accordion for reports
  const toggleReportExpansion = (reportId: string) => {
    setExpandedReports(prev => {
      const newSet = new Set(prev);
      if (newSet.has(reportId)) {
        newSet.delete(reportId);
      } else {
        newSet.add(reportId);
      }
      return newSet;
    });
  };

  const getTypeLabel = (type: string) => {
    const labels = {
      monthly: 'Oylik',
      quarterly: 'Choraklik',
      weekly: 'Haftalik',
      yearly: 'Yillik',
      annual: 'Yillik'
    };
    return labels[type as keyof typeof labels] || 'Boshqa';
  };



  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const hasReport = (day: number) => {
    return hasReportsDays.includes(day);
  };

  const getReportsForDay = (day: number) => {
    if (!hasReportsDays.includes(day)) return [];
    
    return apiReports.filter(report => {
      const reportDate = new Date(report.deadline);
      return reportDate.getDate() === day && 
             reportDate.getMonth() === currentDate.getMonth() && 
             reportDate.getFullYear() === currentDate.getFullYear();
    });
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days = [];

    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(
        <div key={`empty-${i}`} className="h-16 border border-gray-100"></div>
      );
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dayReports = getReportsForDay(day);
      const hasReportOnDay = hasReport(day);
      const isToday = new Date().getDate() === day && 
                     new Date().getMonth() === currentDate.getMonth() && 
                     new Date().getFullYear() === currentDate.getFullYear();

      days.push(
        <div
          key={day}
          onClick={() => {
            if (hasReportOnDay) {
              setSelectedDay(day);
              fetchDayReports(day);
            }
          }}
          className={`h-16 border border-gray-100 flex items-center justify-center text-base font-medium transition-all duration-200 hover:bg-gray-50 relative group ${
            isToday ? 'bg-blue-50 text-blue-600 ring-2 ring-blue-300' : ''
          } ${
            hasReportOnDay ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 shadow-md cursor-pointer' : 'text-gray-700'
          } ${
            selectedDay === day ? 'ring-4 ring-yellow-400 ring-opacity-50' : ''
          }`}
          title={hasReportOnDay ? `${dayReports.length} ta hisobot` : ''}
        >
          {day}
          {hasReportOnDay && (
            <>
              <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-white/90 rounded-full"></div>
              <div className="absolute bottom-0 left-0 right-0 bg-white/20 h-0.5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </>
          )}
        </div>
      );
    }

    return days;
  };

  const getUpcomingReports = () => {
    // Agar biror kun tanlangan bo'lsa, o'sha kunning hisobotlarini ko'rsatish
    if (selectedDay && selectedDayReports.length > 0) {
      return selectedDayReports;
    }
    
    // Default holatda - API'dan kelgan barcha hisobotlarni ko'rsatish (oy bo'yicha filter qilmasdan)
    
    
    // API'dan kelgan barcha hisobotlarni sanaga qarab tartiblab qaytarish
    return apiReports
      .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
          <Calendar className="w-6 h-6 text-white" />
        </div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
          Hisobotlar taqvimi
        </h1>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Calendar */}
        <div className="lg:col-span-1">
          <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
            {/* Calendar Header */}
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => navigateMonth('prev')}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <h2 className="text-xl font-semibold">
                  {months[currentDate.getMonth()]} {currentDate.getFullYear()}
                </h2>
                <button
                  onClick={() => navigateMonth('next')}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Week Days */}
            <div className="grid grid-cols-7 bg-gray-50">
              {weekDays.map((day) => (
                <div key={day} className="p-4 text-center text-base font-semibold text-gray-700 border-r border-gray-200 last:border-r-0">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7">
              {renderCalendar()}
            </div>
          </div>
        </div>

        {/* Upcoming Reports */}
        <div className="lg:col-span-1">
          <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden h-fit">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6">
              <div className="flex items-center gap-3">
                <FileText className="w-6 h-6 text-white" />
                <h3 className="text-xl font-bold">
                  {selectedDay ? `${selectedDay}-kun hisobotlari` : 'Keyingi hisobotlar'}
                </h3>
                {selectedDay && (
                  <button
                    onClick={() => {
                      setSelectedDay(null);
                      setSelectedDayReports([]);
                    }}
                    className="text-white/80 hover:text-white ml-auto text-lg"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>                        
            {/* Reports Container with Scroll */}
            <div className="p-6">
              <div className="max-h-[500px] overflow-y-auto space-y-4 pr-3 scrollbar-thin scrollbar-thumb-blue-200 scrollbar-track-gray-100">
              {(isLoading || isDayLoading) ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                  <span className="ml-2 text-sm text-gray-600">
                    {isDayLoading ? 'Kun ma\'lumotlari yuklanmoqda...' : 'Yuklanmoqda...'}
                  </span>
                </div>
              ) : error ? (
                <div className="text-center py-8 text-red-500">
                  <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">{error}</p>
                  <button 
                    onClick={retryFetch}
                    className="mt-2 text-xs text-blue-600 hover:text-blue-700"
                  >
                    Qayta urinish
                  </button>
                </div>
              ) : (
                getUpcomingReports().map((report) => {
                  const isExpanded = expandedReports.has(report.id);
                  const formName = report.formsname_uz || report.formsname;
                  const description = report.srok_uz || report.srok;
                  
                  return (
                    <div key={report.id} className="group">
                      <div className="bg-white rounded-xl border border-gray-200 hover:shadow-lg hover:border-blue-300 transition-all duration-300 overflow-hidden">
                        {/* Header - Always Visible */}
                        <div 
                          className="p-5 cursor-pointer hover:bg-gray-50"
                          onClick={() => toggleReportExpansion(report.id)}
                        >
                          <div className="flex items-start gap-4">
                            <div className="flex-shrink-0">
                              <div className="bg-gradient-to-br from-blue-500 to-indigo-500 text-white rounded-lg p-3 text-center min-w-[70px] shadow-lg">
                                <div className="text-xl font-bold">
                                  {new Date(report.deadline).getDate()}
                                </div>
                                {/* <div className="text-xs opacity-90 font-medium">
                                  {['Yan', 'Fev', 'Mar', 'Apr', 'May', 'Iyn', 'Iyl', 'Avg', 'Sen', 'Okt', 'Noy', 'Dek'][new Date(report.deadline).getMonth()]}
                                </div> */}
                              </div>
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between mb-3">
                                <h4 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors leading-tight">
                                  {report.type_uz || report.type}
                                </h4>
                                <div className="flex items-center gap-2">
                                  <ChevronDown 
                                    className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                                  />
                                </div>
                              </div>
                              
                              <div className="inline-flex items-center text-sm font-semibold text-indigo-700 bg-indigo-100 px-4 py-2 rounded-full">
                                {getTypeLabel(report.report_type)}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Expandable Content */}
                        <div className={`transition-all duration-300 ease-in-out ${
                          isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                        } overflow-hidden`}>
                          <div className="px-5 pb-5 space-y-4">
                            <div className="bg-gray-50 rounded-lg p-4">
                              <span className="font-semibold text-gray-800 block mb-2 text-sm">Forma nomi:</span>
                              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                                {formName}
                              </p>
                            </div>
                            
                            <div className="bg-blue-50 rounded-lg p-4">
                              <span className="font-semibold text-gray-800 block mb-2 text-sm">Tavsif:</span>
                              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                                {description}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              
              {getUpcomingReports().length === 0 && !isLoading && !isDayLoading && (
                <div className="text-center py-12">
                  <div className="bg-gray-100 rounded-xl p-8">
                    <FileText className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-600 font-medium text-lg mb-2">
                      {selectedDay ? `${selectedDay}-kun uchun hisobotlar yo'q` : 'Keyingi hisobotlar yo\'q'}
                    </p>
                    <p className="text-gray-500 text-sm">Hozircha ma'lumotlar mavjud emas</p>
                  </div>
                </div>
              )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarReport;
import { useState, useEffect } from "react";
import { BarChart3, TrendingUp, Users, Calendar, Download, Loader2, AlertCircle } from "lucide-react";
import TrendAreaChart from "../components/charts/TrendAreaChart";
import { getRequest } from "../api/request";
import { platform_stat_api } from "../api/apiUrls";
import { asApiError } from '../api/errors';

interface PlatformStats {
  success: boolean;
  last_updated?: string;
  service_stats: { label: string; info: { physical: number; legal: number; all: number } }[];
  user_stats: {
    daily: { label: string; value: number; desc: string };
    weekly: { label: string; value: number; desc: string };
    monthly: { label: string; value: number; desc: string };
    yearly: { label: string; value: number; desc: string };
    main: { total: number; active: number; new: number; growth: string };
    chart_data: { labels: string[]; values: number[] };
  };
}
interface ServiceStatRow {
  name: string;
  individual: number;
  legal: number;
  total: number;
}

const Statistics = () => {
  const [timeFilter, setTimeFilter] = useState("monthly");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statsData, setStatsData] = useState<PlatformStats | null>(null);

  // Fetch platform statistics
  useEffect(() => {
    const fetchPlatformStats = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const apiUrl = `${platform_stat_api}?stat_type=${timeFilter}`;
        const response = await getRequest<PlatformStats>(apiUrl);
        setStatsData(response);
      } catch (caught) {
        const err = asApiError(caught);
        console.error('Error fetching platform stats:', err);
        setError('Ma\'lumotlarni yuklashda xatolik yuz berdi. Iltimos, qaytadan urinib ko\'ring.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlatformStats();
  }, [timeFilter]);

  // Helper functions to get data from API
  const getServicesStats = () => {
    if (statsData?.service_stats) {
      return statsData.service_stats.map((service) => ({
        name: service.label,
        individual: service.info.physical,
        legal: service.info.legal,
        total: service.info.all
      }));
    }
    return [];
  };

  const getUserStats = () => {
    if (statsData?.user_stats) {
      return {
        daily: statsData.user_stats.daily.value,
        weekly: statsData.user_stats.weekly.value,
        monthly: statsData.user_stats.monthly.value,
        yearly: statsData.user_stats.yearly.value,
        total_users: statsData.user_stats.main.total,
        active_users: statsData.user_stats.main.active,
        new_registrations: statsData.user_stats.main.new,
        growth_rate: statsData.user_stats.main.growth
      };
    }
    return {
      daily: 0,
      weekly: 0,
      monthly: 0,
      yearly: 0,
      total_users: 0,
      active_users: 0,
      new_registrations: 0,
      growth_rate: "0%"
    };
  };

  // Data for charts
  const servicesStats = getServicesStats();
  const userStats = getUserStats();

  const labels = statsData?.user_stats?.chart_data?.labels || [];
  const values = statsData?.user_stats?.chart_data?.values || [];

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
              <p className="text-lg text-gray-600 dark:text-gray-300">Statistik ma'lumotlar yuklanmoqda...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
              <p className="text-lg text-gray-600 dark:text-gray-300 mb-4">{error}</p>
              <button 
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Qaytadan yuklash
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
              Statistika
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Platform faoliyati va foydalanuvchilar to'liq statistikasi
            </p>
            {statsData?.last_updated && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                So'nggi yangilanish: {new Date(statsData.last_updated).toLocaleString('uz-UZ')}
              </p>
            )}
          </div>

          <div className="flex items-center space-x-4 mt-4 md:mt-0">
            <select
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value)}
              className="px-4 py-2 bg-white dark:bg-gray-800 border dark:text-white border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="daily">Kunlik</option>
              <option value="weekly">Haftalik</option>
              <option value="monthly">Oylik</option>
              <option value="yearly">Yillik</option>
            </select>

            <button 
              onClick={() => window.location.reload()}
              disabled={isLoading}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              <span>Export</span>
            </button>
          </div>
        </div>

        {/* Service Usage Statistics */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-8 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Foydalanilgan Xizmatlar Statistikasi
              </h2>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-blue-500 rounded"></div>
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  Jismoniy shaxslar
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-green-500 rounded"></div>
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  Yuridik shaxslar
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {servicesStats.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-400">
                  Xizmatlar statistikasi mavjud emas
                </p>
              </div>
            ) : (
              servicesStats.map((service: ServiceStatRow, index: number) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-900 dark:text-white">
                      {service.name}
                    </span>
                    <span className="text-sm text-gray-500">
                      {service.total} ta
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                    <div className="flex h-3 rounded-full overflow-hidden">
                      <div
                        className="bg-blue-500 h-full"
                        style={{
                          width: `${(service.individual / service.total) * 100}%`,
                        }}
                      ></div>
                      <div
                        className="bg-green-500 h-full"
                        style={{
                          width: `${(service.legal / service.total) * 100}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600 dark:text-gray-300">
                    <span>Jismoniy: {service.individual}</span>
                    <span>Yuridik: {service.legal}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* User Growth Statistics */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Foydalanuvchilar Soni Statistikasi
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Line Chart Area */}
            <div className="pt-10">
              <div className="h-64 flex items-end justify-between space-x-2">
                {labels.length === 0 || values.length === 0 ? (
                  <div className="w-full h-full flex items-center justify-center">
                    <p className="text-gray-500 dark:text-gray-400">
                      Grafik ma'lumotlari mavjud emas
                    </p>
                  </div>
                ) : (
                  <TrendAreaChart labels={labels} dataPoints={values} label="yangi foydalanuvchilar" />
                )}
              </div>
            </div>

            {/* Stats Cards */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Calendar className="w-5 h-5 text-blue-600" />
                    <span className="text-sm font-medium text-blue-600">
                      Kunlik
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {userStats.daily?.toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    o'rtacha
                  </p>
                </div>

                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <TrendingUp className="w-5 h-5 text-green-700" />
                    <span className="text-sm font-medium text-green-700">
                      Haftalik
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {userStats.weekly?.toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    o'rtacha
                  </p>
                </div>

                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <BarChart3 className="w-5 h-5 text-purple-600" />
                    <span className="text-sm font-medium text-purple-600">
                      Oylik
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {userStats.monthly?.toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    o'rtacha
                  </p>
                </div>

                <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Users className="w-5 h-5 text-orange-600" />
                    <span className="text-sm font-medium text-orange-600">
                      Yillik
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {userStats.yearly?.toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    prognoz
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                  Asosiy Ko'rsatkichlar
                </h4>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                  <li>• Jami foydalanuvchilar: {userStats.total_users?.toLocaleString()}</li>
                  <li>• Faol foydalanuvchilar: {userStats.active_users?.toLocaleString()}</li>
                  <li>• Yangi ro'yxatdan o'tganlar: {userStats.new_registrations?.toLocaleString()}</li>
                  <li>• O'sish sur'ati: {userStats.growth_rate}</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
      
    </div>
  );
};

export default Statistics;

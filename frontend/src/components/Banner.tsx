import {
  TrendingUp,
  Users,
  ArrowUpRight,
  ArrowDownRight,
  FileText,
  Activity,
} from "lucide-react";
import { useState, useEffect } from 'react';
import { banner_stat } from "../api/apiUrls";
import { getRequest } from "../api/request";

interface BannerStats {
  users_count: number;
  service_count: number;
  todays_services: number;
  current_year_services: number;
}

const Banner = () => {
  const [bannerData, setBannerData] = useState<BannerStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBannerStats = async () => {
      try {
        setIsLoading(true);
        setError(null); // Reset error state before new request
        const response = await getRequest(banner_stat) as BannerStats;
        
        if (!response) {
          throw new Error('No response data received');
        }

        // Log the actual data structure

        // Verify each required field exists and is a number
        const validatedData: BannerStats = {
          users_count: Number(response.users_count) || 0,
          service_count: Number(response.service_count) || 0,
          todays_services: Number(response.todays_services) || 0,
          current_year_services: Number(response.current_year_services) || 0
        };

        setBannerData(validatedData);
      } catch (error) {
        const typedError = error as Error & { 
          response?: { 
            data?: { detail?: string },
            status?: number 
          } 
        };
        const errorMessage = typedError.response?.data?.detail || 
                           typedError.message || 
                           "Ma'lumotlarni yuklashda xatolik yuz berdi";
        setError(errorMessage);
        console.error("Error fetching banner stats:", {
          message: typedError.message,
          response: typedError.response?.data,
          status: typedError.response?.status
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchBannerStats();
  }, []);

  const stats = [
    {
      title: "Foydalanuvchilar soni",
      value: bannerData ? bannerData.users_count.toLocaleString() : "...",
      change: "+12.5%",
      trend: "up",
      icon: Users,
      color: "blue",
    },
    {
      title: "Xizmatlar soni",
      value: bannerData ? bannerData.service_count.toLocaleString() : "...",
      change: "+8.2%",
      trend: "up",
      icon: FileText,
      color: "green",
    },
    {
      title: "1 kunlik ko'rsatilgan xizmatlar soni",
      value: bannerData ? bannerData.todays_services.toLocaleString() : "...",
      change: isLoading ? "Yuklanmoqda..." : error ? "Xatolik" : "so'rov",
      trend: "up",
      icon: TrendingUp,
      color: "purple",
    },
    {
      title: "Yil boshidan ko'rsatilgan xizmatlar soni",
      value: bannerData ? bannerData.current_year_services.toLocaleString() : "...",
      change: "+0.3%",
      trend: "up",
      icon: Activity,
      color: "orange",
    },
  ];
  // Removed unused features array

  return (
    <div className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 dark:from-blue-800 dark:via-blue-900 dark:to-gray-900 overflow-hidden">
      <div className="absolute inset-0 bg-black opacity-10"></div>
      <div className="absolute inset-0">
        <div className="absolute top-10 left-10 w-32 h-32 bg-white/10 rounded-full blur-xl"></div>
        <div className="absolute bottom-10 right-10 w-40 h-40 bg-blue-300/20 rounded-full blur-xl"></div>
        <div className="absolute top-1/2 left-1/3 w-24 h-24 bg-blue-400/15 rounded-full blur-lg"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
            Interaktiv xizmatlar platformasi
            {/* <span className="block text-blue-200 text-3xl md:text-5xl mt-2">
              Biznes Consulting Platformasi
            </span> */}
          </h1>

          <p className="text-xl md:text-2xl text-blue-100 mb-12 max-w-3xl mx-auto leading-relaxed">
            Professional biznes konsalting xizmatlari, statistik tahlillar va
            yuridik-jismoniy shaxslar uchun innovatsion yechimlar
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-16">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              const colorClasses = {
                blue: "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
                green:
                  "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
                purple:
                  "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-4000",
                orange:
                  "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
              };

              return (
                <div
                  key={index}
                  className="bg-white/10 dark:bg-gray-800  dark:border-gray-600 backdrop-blur-md dark:backdrop-blur-none rounded-xl p-6 hover:bg-white/20 transition-all duration-300 transform hover:scale-105"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div
                      className={`p-3 rounded-lg ${
                        colorClasses[stat.color as keyof typeof colorClasses]
                      }`}
                    >
                      <Icon className="w-6 h-6" />
                    </div>
                    <div
                      className={`flex items-center space-x-1 text-sm ${
                        stat.trend === "up"
                          ? "text-white font-bold"
                          : "text-white font-bold"
                      }`}
                    >
                      {stat.trend === "up" ? (
                        <ArrowUpRight className="w-4 h-4" />
                      ) : (
                        <ArrowDownRight className="w-4 h-4" />
                      )}
                      <span>{stat.change}</span>
                    </div>
                  </div>

                  <p className="text-2xl font-bold text-white dark:text-white mb-1">
                    {stat.value}
                  </p>
                  <p className="text-gray-300 dark:text-gray-400 text-sm">
                    {stat.title}
                  </p>
                </div>
              );
            })}
          </div>

          {/* <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="bg-white/10 backdrop-blur-md rounded-xl p-6 hover:bg-white/20 transition-all duration-300 transform hover:scale-105"
                >
                  <Icon className="w-8 h-8 text-blue-200 mx-auto mb-3" />
                  <p className="text-white font-medium text-sm md:text-base">
                    {feature.label}
                  </p>
                </div>
              );
            })}
          </div> */}
        </div>
      </div>
    </div>
  );
};

export default Banner;

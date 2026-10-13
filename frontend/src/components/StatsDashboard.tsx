import { Users, TrendingUp, FileText, Activity, BarChart3 } from "lucide-react";

const StatsDashboard = () => {
  const stats = [
    {
      title: "Foydalanuvchilar Oqimi",
      value: "24,567",
      change: "+12.5%",
      trend: "up",
      icon: Users,
      color: "blue",
    },
    {
      title: "Foydalanilgan Xizmatlar",
      value: "8,342",
      change: "+8.2%",
      trend: "up",
      icon: FileText,
      color: "green",
    },
    {
      title: "Eng Ko'p Foydalanilgan",
      value: "Soliq Ma'lumotlari",
      change: "3,456 so'rov",
      trend: "up",
      icon: TrendingUp,
      color: "purple",
    },
    {
      title: "Tizim Ishlashi",
      value: "99.8%",
      change: "+0.3%",
      trend: "up",
      icon: Activity,
      color: "orange",
    },
  ];

  const chartData = [
    { name: "Yan", value: 4000 },
    { name: "Fev", value: 3000 },
    { name: "Mar", value: 5000 },
    { name: "Apr", value: 4500 },
    { name: "May", value: 6000 },
    { name: "Iyun", value: 5500 },
    { name: "Iyul", value: 4000 },
    { name: "Avg", value: 3000 },
    { name: "Sep", value: 5000 },
    { name: "Okt", value: 4500 },
    { name: "Nov", value: 6000 },
    { name: "Dek", value: 5500 },
  ];

  return (
    <section className="py-16">
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
          Xizmatlar Statistikasi
        </h2>
        <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          Platform faoliyati va foydalanuvchilar statistikasi
        </p>
      </div>

      {/* Stats Cards */}
      {/* <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          const colorClasses = {
            blue: "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
            green:
              "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400",
            purple:
              "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400",
            orange:
              "bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400",
          };

          return (
            <div
              key={index}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md hover:shadow-lg transition-all duration-300 border border-gray-200 dark:border-gray-700"
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
                    stat.trend === "up" ? "text-green-600" : "text-red-600"
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

              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                {stat.value}
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                {stat.title}
              </p>
            </div>
          );
        })}
      </div> */}

      {/* Chart Visualization */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-md border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            Oylik Foydalanuvchilar Statistikasi
          </h3>
          <BarChart3 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
        </div>

        <div className="grid grid-cols-12 gap-14 h-64">
          {chartData.map((item, index) => (
            <div
              key={index}
              className="flex flex-col items-center justify-end space-y-2"
            >
              <div
                className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-md transition-all duration-1000 hover:from-blue-600 hover:to-blue-500"
                style={{
                  height: `${(item.value / 6000) * 100}%`,
                  minHeight: "10px",
                }}
              ></div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {item.name}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {item.value.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsDashboard;

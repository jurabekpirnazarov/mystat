import {
  Smartphone,
  Globe,
  Shield,
  Clock,
  Users,
  CheckCircle,
  Zap,
  Award,
} from "lucide-react";

const UsageCapabilities = () => {
  const capabilities = [
    {
      title: "Mobil Ilovalar",
      description:
        "Android va iOS qurilmalari uchun maxsus ilovalar orqali barcha xizmatlardan foydalaning",
      icon: Smartphone,
      features: ["24/7 dostuplik", "Offline rejim", "Push bildirishnomalar"],
    },
    {
      title: "Veb Platform",
      description:
        "Zamonaviy brauzerlar orqali to'liq funksional veb interfeys",
      icon: Globe,
      features: ["Responsive dizayn", "Tez yuklash", "Barcha qurilmalarda"],
    },
    {
      title: "Xavfsizlik",
      description: "Eng yuqori xavfsizlik standartlari va ma'lumotlar himoyasi",
      icon: Shield,
      features: ["SSL shifrlash", "2FA autentifikatsiya", "ISO sertifikati"],
    },
    {
      title: "Tezkor Xizmat",
      description: "Barcha so'rovlar va arizalar tezkor ko'rib chiqiladi",
      icon: Clock,
      features: ["24 soat ichida", "Avtomatik jarayon", "SMS xabarnomalar"],
    },
    {
      title: "Professional Yordam",
      description: "Malakali mutaxassislardan professional maslahatlar",
      icon: Users,
      features: [
        "Video konsultatsiya",
        "Chat yordam",
        "Telefon qo'llab-quvvatlash",
      ],
    },
    {
      title: "Sertifikatlangan Xizmatlar",
      description:
        "Barcha xizmatlar davlat standartlari asosida taqdim etiladi",
      icon: Award,
      features: ["Davlat sertifikati", "Yuridik kuch", "Rasmiy hujjatlar"],
    },
  ];

  return (
    <section className="py-16">
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
          Saytdan Foydalanish Imkoniyatlari
        </h2>
        <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          Zamonaviy texnologiyalar va qulay interfeys orqali professional
          xizmatlar
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {capabilities.map((capability, index) => {
          const Icon = capability.icon;
          return (
            <div
              key={index}
              className="group bg-white dark:bg-gray-800 rounded-xl p-8 shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-200 dark:border-gray-700 overflow-hidden relative"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

              <div className="relative z-10 flex flex-col h-full">
                <div className="flex-1">
                  <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl mb-6 group-hover:from-blue-600 group-hover:to-purple-600 transition-all duration-300 shadow-lg">
                    <Icon className="w-8 h-8 text-white" />
                  </div>

                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200">
                    {capability.title}
                  </h3>

                  <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
                    {capability.description}
                  </p>

                  <div className="space-y-2">
                    {capability.features.map((feature, featureIndex) => (
                      <div
                        key={featureIndex}
                        className="flex items-center space-x-2"
                      >
                        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                        <span className="text-sm text-gray-600 dark:text-gray-300">
                          {feature}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <button className="w-full flex items-center justify-center space-x-2 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-purple-600 text-white font-medium rounded-lg transition-all duration-300 transform group-hover:scale-105 shadow-md hover:shadow-lg">
                    <Zap className="w-4 h-4" />
                    <span>Batafsil ma'lumot</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default UsageCapabilities;

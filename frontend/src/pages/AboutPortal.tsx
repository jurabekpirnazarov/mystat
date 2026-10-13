import { useState } from "react";
import {
  PlayCircle,
  FileText,
  CreditCard,
  FileCheck,
  Download,
  ExternalLink,
} from "lucide-react";

const AboutPortal = () => {
  const [activeTab, setActiveTab] = useState("guide");

  const tabs = [
    { id: "guide", label: "Foydalanish Qo'llanmasi", icon: FileText },
    { id: "payment", label: "To'lov Tizimlari", icon: CreditCard },
    { id: "contract", label: "Shartnoma Tuzish", icon: FileCheck },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Portal Haqida
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Milliy Statistika Qo'mitasi Biznes Konsalting platformasi haqida
            to'liq ma'lumot
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap justify-center mb-8 bg-white dark:bg-gray-800 rounded-xl p-2 shadow-md">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                  activeTab === tab.id
                    ? "bg-blue-600 text-white shadow-md"
                    : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md">
          {activeTab === "guide" && (
            <div className="p-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                Foydalanish Qo'llanmasi
              </h2>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Video Qo'llanma
                  </h3>
                  <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-8 text-center">
                    <PlayCircle className="w-20 h-20 text-blue-600 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-300 mb-4">
                      Platformadan foydalanish bo'yicha video qo'llanma
                    </p>
                    <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors duration-200">
                      Video Ko'rish
                    </button>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    PDF Qo'llanma
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <FileText className="w-8 h-8 text-red-500" />
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            Foydalanuvchi qo'llanmasi
                          </p>
                          <p className="text-sm text-gray-500">PDF • 2.5 MB</p>
                        </div>
                      </div>
                      <button className="flex items-center space-x-2 text-blue-600 hover:text-blue-700">
                        <Download className="w-5 h-5" />
                        <span>Yuklab olish</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "payment" && (
            <div className="p-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                To'lov Tizimlari
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="text-center">
                  <div className="bg-orange-100 dark:bg-orange-900/30 rounded-lg p-8 mb-4">
                    <div className="text-4xl font-bold text-orange-600 mb-2">
                      CLICK
                    </div>
                    <p className="text-gray-600 dark:text-gray-300">
                      Tez va xavfsiz to'lov tizimi
                    </p>
                  </div>
                  <ul className="text-left space-y-2 text-gray-600 dark:text-gray-300">
                    <li>• Barcha bank kartalari qo'llab-quvvatlanadi</li>
                    <li>• 24/7 xizmat ko'rsatadi</li>
                    <li>• Minimal komissiya</li>
                    <li>• SMS tasdiqlash</li>
                  </ul>
                </div>

                <div className="text-center">
                  <div className="bg-blue-100 dark:bg-blue-900/30 rounded-lg p-8 mb-4">
                    <div className="text-4xl font-bold text-blue-600 mb-2">
                      Payme
                    </div>
                    <p className="text-gray-600 dark:text-gray-300">
                      Ishonchli to'lov platformasi
                    </p>
                  </div>
                  <ul className="text-left space-y-2 text-gray-600 dark:text-gray-300">
                    <li>• Mobil to'lovlar</li>
                    <li>• Onlayn hisobot</li>
                    <li>• Avtomatik to'lov</li>
                    <li>• Bonusli dastur</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {activeTab === "contract" && (
            <div className="p-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                Shartnoma Tuzish
              </h2>

              <div className="prose dark:prose-invert max-w-none">
                <h3 className="text-gray-900 dark:text-white">
                  Shartnoma Shartlari
                </h3>
                <p className="text-gray-900 dark:text-white">
                  Milliy Statistika Qo'mitasi bilan hamkorlik shartnomalari
                  quyidagi asosiy shartlarni o'z ichiga oladi:
                </p>

                <ul className="text-gray-900 dark:text-white">
                  <li>Xizmat ko'rsatish muddatlari va sifati</li>
                  <li>To'lov shartlari va miqdorlari</li>
                  <li>Tomonlarning huquq va majburiyatlari</li>
                  <li>Ma'lumotlar maxfiyligi va himoyasi</li>
                  <li>Shartnomani bekor qilish shartlari</li>
                </ul>

                <h3 className="text-gray-900 dark:text-white">
                  Shartnoma Turlari
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 not-prose">
                  <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      Konsalting Shartnomasi
                    </h4>
                    <p className="text-gray-600 dark:text-gray-300 mb-4">
                      Professional maslahat xizmatlari uchun
                    </p>
                    <button className="flex items-center space-x-2 text-blue-600 hover:text-blue-700">
                      <ExternalLink className="w-4 h-4" />
                      <span>Namuna ko'rish</span>
                    </button>
                  </div>

                  <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      Xizmat Shartnomasi
                    </h4>
                    <p className="text-gray-600 dark:text-gray-300 mb-4">
                      Davomiy xizmatlar uchun
                    </p>
                    <button className="flex items-center space-x-2 text-blue-600 hover:text-blue-700">
                      <ExternalLink className="w-4 h-4" />
                      <span>Namuna ko'rish</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AboutPortal;

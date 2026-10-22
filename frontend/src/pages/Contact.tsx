import { useState } from "react";
import {
  Phone,
  Mail,
  MapPin,
  Clock,
  Send,
  User,
  MessageSquare,
  Building,
  Globe,
} from "lucide-react";
import ContactModal from "../components/ContactModal";

const Contact = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const contactInfo = [
    {
      icon: Phone,
      title: "Telefon Raqamlar",
      items: [
        "+998 71 233-45-67 (Asosiy)",
        "+998 71 233-45-68 (Konsalting)",
        "+998 71 233-45-69 (Texnik yordam)",
      ],
    },
    {
      icon: Mail,
      title: "Email Manzillar",
      items: ["info@stat.uz", "consulting@stat.uz", "support@stat.uz"],
    },
    {
      icon: MapPin,
      title: "Manzil",
      items: [
        "Toshkent shahar, Yunusobod tumani",
        "Abdulla Qodiriy ko'chasi, 5-uy",
        "100128, O'zbekiston",
      ],
    },
    {
      icon: Clock,
      title: "Ish Vaqti",
      items: [
        "Dushanba - Juma: 09:00 - 18:00",
        "Shanba: 09:00 - 14:00",
        "Yakshanba: Dam olish kuni",
      ],
    },
  ];

  const departments = [
    {
      name: "Biznes Konsalting ",
      phone: "+998 71 233-45-68",
      email: "consulting@stat.uz",
      head: "Aliyev Sardor Akramovich",
      description: "Biznes strategiya va rivojlantirish masalalari",
    },
    {
      name: "Statistik Ma'lumotlar",
      phone: "+998 71 233-45-70",
      email: "data@stat.uz",
      head: "Karimova Gulnoza Ilhomovna",
      description: "Statistik hisobotlar va tahlillar",
    },
    {
      name: "Texnik Qo'llab-quvvatlash",
      phone: "+998 71 233-45-69",
      email: "support@stat.uz",
      head: "Rahmatov Jasur Bakhtiyorovich",
      description: "Platforma va texnik masalalar",
    },
    {
      name: "Yuridik Xizmatlar",
      phone: "+998 71 233-45-71",
      email: "legal@stat.uz",
      head: "Nazarov Otabek Rustamovich",
      description: "Hujjat rasmiylashtirish va yuridik maslahatlar",
    },
  ];

  return (
    <div className="py-2">
      <div className="w-full">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Aloqa
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Milliy Statistika Qo'mitasi bilan bog'lanish va professional yordam
            olish
          </p>
        </div>

        {/* Quick Contact */}
        <div className="bg-mg-primary rounded-xl p-8 mb-12 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">
            Tezkor Murojaat
          </h2>
          <p className="text-blue-100 mb-6">
            Savollaringiz bo'lsa, bizga murojaat qiling. Mutaxassislarimiz sizga
            yordam berishga tayyor.
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center space-x-2 bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors duration-200 shadow-md"
          >
            <MessageSquare className="w-5 h-5" />
            <span>Murojaat Qilish</span>
          </button>
        </div>

        {/* Contact Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {contactInfo.map((info, index) => {
            const Icon = info.icon;
            return (
              <div
                key={index}
                className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md border border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <Icon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {info.title}
                  </h3>
                </div>
                <div className="space-y-2">
                  {info.items.map((item, itemIndex) => (
                    <p
                      key={itemIndex}
                      className="text-gray-600 dark:text-gray-300 text-sm"
                    >
                      {item}
                    </p>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Departments */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8 text-center">
            Bo'limlar va Xodimlar
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {departments.map((dept, index) => (
              <div
                key={index}
                className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow duration-300"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                      {dept.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {dept.description}
                    </p>
                  </div>
                  <Building className="w-6 h-6 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                </div>

                <div className="space-y-3 mb-4">
                  <div className="flex items-center space-x-3">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600 dark:text-gray-300">
                      {dept.head}
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600 dark:text-gray-300">
                      {dept.phone}
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600 dark:text-gray-300">
                      {dept.email}
                    </span>
                  </div>
                </div>

                <button className="w-full py-2 px-4 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors duration-200 text-sm font-medium">
                  Bog'lanish
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Map and Additional Info */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md border border-gray-200 dark:border-gray-700">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Joylashuv
            </h3>
            <div style={{ position: "relative", overflow: "hidden" }}>
              <a
                href="https://yandex.uz/maps/org/84692575269/?utm_medium=mapframe&utm_source=maps"
                style={{
                  color: "#eee",
                  fontSize: 12,
                  position: "absolute",
                  top: 0,
                }}
              >
                Государственный комитет по статистике Республики Узбекистан
              </a>
              <a
                href="https://yandex.uz/maps/10335/tashkent/category/statistical_organization/184105652/?utm_medium=mapframe&utm_source=maps"
                style={{
                  color: "#eee",
                  fontSize: 12,
                  position: "absolute",
                  top: 14,
                }}
              >
                Статистическая организация в Ташкенте
              </a>
              <a
                href="https://yandex.uz/maps/10335/tashkent/category/government_ministries_services/184105716/?utm_medium=mapframe&utm_source=maps"
                style={{
                  color: "#eee",
                  fontSize: 12,
                  position: "absolute",
                  top: 28,
                }}
              >
                Министерства, ведомства, государственные службы в Ташкенте
              </a>
              <iframe
                src="https://yandex.uz/map-widget/v1/org/84692575269/?ll=69.317951%2C41.324534&z=17"
                width={560}
                height={400}
                frameBorder={1}
                allowFullScreen={true}
                style={{ position: "relative" }}
              />
            </div>

            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>Transport:</strong> Metro "Pushkin" bekati yaqinida,
                avtobuslar: 83, 17, 60-yo'nalishlar
              </p>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md border border-gray-200 dark:border-gray-700">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Qo'shimcha Ma'lumotlar
            </h3>

            <div className="space-y-6">
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                  Online Xizmatlar
                </h4>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                  <li>• 24/7 onlayn qo'llab-quvvatlash</li>
                  <li>• Video-konsalting imkoniyati</li>
                  <li>• Mobil ilova orqali murojaat</li>
                  <li>• Telegram bot: @StatUzBot</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                  Ijtimoiy Tarmoqlar
                </h4>
                <div className="flex space-x-4">
                  <button className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors duration-200">
                    <Globe className="w-5 h-5" />
                  </button>
                  <button className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors duration-200">
                    <MessageSquare className="w-5 h-5" />
                  </button>
                  <button className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors duration-200">
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  <strong>Diqqat:</strong> Muhim hujjatlar va shartnomalar faqat
                  rasmiy ofisda imzolanadi. Oldindan vaqt belgilash tavsiya
                  etiladi.
                </p>
              </div>
            </div>
          </div>
        </div>

        <ContactModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      </div>
    </div>
  );
};

export default Contact;

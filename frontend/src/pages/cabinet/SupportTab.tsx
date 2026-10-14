import { FaTelegramPlane } from "react-icons/fa";

/** Q-01: PersonalCabinet.tsx dan ajratilgan bo'lim. */
export default function SupportTab() {
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        Qo'llab-quvvatlash
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              Telefon Qo'llab-quvvatlash
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-2">
              +998 71 233-45-67
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Dushanba - Juma: 09:00 - 18:00
            </p>
          </div>

          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              Email Yordam
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-2">
              support@stat.uz
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              24 soat ichida javob
            </p>
          </div>


          <div className="">
            <a
              href="https://t.me/MyStatUzRobot?start=MTA4c0c6e3b"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors w-fit"
            >
              <FaTelegramPlane className="w-5 h-5" />
              <span>Telegram sahifamizga o'tish</span>
            </a>
          </div>

        </div>



        <div>
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
              Tezkor Murojaat
            </h3>
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Mavzu
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Muammoning qisqacha tavsifi"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Xabar
                </label>
                <textarea
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Batafsil tavsif..."
                />
              </div>
              <button className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200">
                Yuborish
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

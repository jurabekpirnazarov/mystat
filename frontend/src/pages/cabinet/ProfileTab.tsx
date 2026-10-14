import type { UserProfile } from "../../types/api";
import type { useAuth } from "../../contexts/AuthContext";

interface Props {
  profileData: UserProfile | null;
  profileLoading: boolean;
  user: ReturnType<typeof useAuth>["user"];
}

/** Q-01: PersonalCabinet.tsx dan ajratilgan bo'lim. */
export default function ProfileTab({ profileData, profileLoading, user }: Props) {
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        Foydalanuvchi Ma'lumotlari
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            To'liq Ism
          </label>
          <input
            type="text"
            value={profileLoading ? "Yuklanmoqda..." : (
              profileData ?
                `${profileData.first_name || ""} ${profileData.last_name || ""}`.trim() || profileData.username || ""
                : user?.name || ""
            )}
            readOnly
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Email
          </label>
          <input
            type="email"
            value={profileLoading ? "Yuklanmoqda..." : (profileData?.email || profileData?.username || user?.email || "")}
            readOnly
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Foydalanuvchi Nomi
          </label>
          <input
            type="text"
            value={profileLoading ? "Yuklanmoqda..." : (profileData?.username || "")}
            readOnly
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Foydalanuvchi Turi
          </label>
          <input
            type="text"
            value={
              profileLoading ? "Yuklanmoqda..." : (
                profileData?.user_type === "individual" || user?.type === "individual"
                  ? "Jismoniy Shaxs"
                  : "Yuridik Shaxs"
              )
            }
            readOnly
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Telefon Raqami
          </label>
          <input
            type="text"
            value={profileLoading ? "Yuklanmoqda..." : (profileData?.phone || profileData?.phone_number || "")}
            readOnly
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Tug'ilgan Sana
          </label>
          <input
            type="text"
            value={profileLoading ? "Yuklanmoqda..." : (profileData?.birth_date || "")}
            readOnly
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Passport Raqami
          </label>
          <input
            type="text"
            value={profileLoading ? "Yuklanmoqda..." : (profileData?.passport_number || "")}
            readOnly
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Ro'yxatdan O'tgan Sana
          </label>
          <input
            type="text"
            value={profileLoading ? "Yuklanmoqda..." : (profileData?.date_joined || profileData?.created_at || user?.date || "")}
            readOnly
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>
      </div>

      <div className="mt-6 flex space-x-4">
        <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200">
          Ma'lumotlarni Yangilash
        </button>
        <button className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200">
          Parolni O'zgartirish
        </button>
      </div>
    </div>
  );
}

import React, { useState } from "react";
import {
  Clock,
  FolderOpen,
  User,
  FileText,
  Phone,
  Building,
  HelpCircle,
  Scale,
  Timer,
  Calendar,
} from "lucide-react";
import { ServiceInfo } from "../../types";
import ServiceHeader from "../ServiceHeader";
import Dropdown from "../Dropdown";

interface ContentProps {
  handleNavigate: () => void;
}
const ModalContent: React.FC<ContentProps> = ({ handleNavigate }) => {
  const [openDropdowns, setOpenDropdowns] = useState<Set<string>>(
    new Set(["natijalar"])
  );

  const serviceInfo: ServiceInfo = {
    title:
      "Obyektni qayta ixtisoslashtirilish va rekonstruksiya qilish uchun ruxsatnoma",
    rating: 3.55,
    reviews: "6 daqiqa",
    usage: "382 702",
    totalUsage: "45000",
  };

  const toggleDropdown = (id: string) => {
    const newOpenDropdowns = new Set(openDropdowns);
    if (newOpenDropdowns.has(id)) {
      newOpenDropdowns.delete(id);
    } else {
      newOpenDropdowns.add(id);
    }
    setOpenDropdowns(newOpenDropdowns);
  };

  const dropdownData = [
    {
      id: "tavsifi",
      label: "Xizmat tavsifi",
      icon: <Clock size={20} />,
      content: (
        <div className="text-gray-700 dark:text-gray-300">
          <p>Xizmat haqida batafsil ma'lumot bu yerda ko'rsatiladi.</p>
        </div>
      ),
    },
    {
      id: "narxi",
      label: "Xizmat narxi",
      icon: <FolderOpen size={20} />,
      content: (
        <div className="text-gray-700 dark:text-gray-300">
          <p>Xizmat narxi va to'lov usullari haqida ma'lumot.</p>
        </div>
      ),
    },
    {
      id: "hujjatlar",
      label: "Xizmatni olish uchun kerakli hujjatlar",
      icon: <FileText size={20} />,
      content: (
        <div className="text-gray-700 dark:text-gray-300">
          <p>Kerakli hujjatlar ro'yxati:</p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Pasport nusxasi</li>
            <li>Ariza</li>
            <li>Loyiha hujjatlari</li>
          </ul>
        </div>
      ),
    },
    {
      id: "foydalanuvchilar",
      label: "Xizmat foydalanuvchilari",
      icon: <User size={20} />,
      content: (
        <div className="text-gray-700 dark:text-gray-300">
          <p>Xizmatdan foydalana oladigan shaxslar haqida ma'lumot.</p>
        </div>
      ),
    },
    {
      id: "natijalar",
      label: "Natijani olish usullari",
      icon: <FileText size={20} />,
      content: (
        <div className="text-gray-700 dark:text-gray-300">
          <p className="mb-3">Elektron ko'rinishda</p>
          <div className="bg-gray-100 dark:bg-gray-600 p-3 rounded-lg">
            <p className="text-sm">
              Ruxsatnoma elektron shaklda beriladi va elektron hujjat sifatida
              qabul qilinadi.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: "rad-sabablar",
      label: "Rad etish sabablari",
      icon: <FileText size={20} />,
      content: (
        <div className="text-gray-700 dark:text-gray-300">
          <p>Arizani rad etishning asosiy sabablari ro'yxati.</p>
        </div>
      ),
    },
    {
      id: "aloqa",
      label: "Aloqa",
      icon: <Phone size={20} />,
      content: (
        <div className="text-gray-700 dark:text-gray-300">
          <p>Bog'lanish uchun telefon raqamlari va manzillar.</p>
        </div>
      ),
    },
    {
      id: "tashkilot",
      label: "Tashkilot",
      icon: <Building size={20} />,
      content: (
        <div className="text-gray-700 dark:text-gray-300">
          <p>Xizmatni taqdim etuvchi tashkilot haqida ma'lumot.</p>
        </div>
      ),
    },
    {
      id: "savol",
      label: "Bu qanday ishlaydi?",
      icon: <HelpCircle size={20} />,
      content: (
        <div className="text-gray-700 dark:text-gray-300">
          <p>Xizmat jarayoni haqida qo'shimcha tushuntirish.</p>
        </div>
      ),
    },
    {
      id: "huququiy-asos",
      label: "Xizmat ko'rsatishning huquqiy asosi",
      icon: <Scale size={20} />,
      content: (
        <div className="text-gray-700 dark:text-gray-300">
          <p>Xizmat ko'rsatishning qonuniy asoslari va me'yoriy hujjatlar.</p>
        </div>
      ),
    },
    {
      id: "muddat",
      label: "Xizmat ko'rsatish muddati",
      icon: <Timer size={20} />,
      content: (
        <div className="text-gray-700 dark:text-gray-300">
          <p>Xizmat ko'rsatish muddati va kutish vaqti haqida ma'lumot.</p>
        </div>
      ),
    },
    {
      id: "natija",
      label: "Xizmat ko'rsatish natijasi",
      icon: <Calendar size={20} />,
      content: (
        <div className="text-gray-700 dark:text-gray-300">
          <p>Xizmat yakunida olingan hujjat va natijalar haqida ma'lumot.</p>
        </div>
      ),
    },
  ];

  return (
    <div>
      <ServiceHeader
        handleNavigate={handleNavigate}
        serviceInfo={serviceInfo}
      />
      <div className="p-8 bg-gray-50 dark:bg-gray-900">
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1 space-y-6">
            {dropdownData
              .slice(0, Math.ceil(dropdownData.length / 2))
              .map((dropdown) => (
                <Dropdown
                  key={dropdown.id}
                  id={dropdown.id}
                  label={dropdown.label}
                  icon={dropdown.icon}
                  content={dropdown.content}
                  isOpen={openDropdowns.has(dropdown.id)}
                  onToggle={toggleDropdown}
                />
              ))}
          </div>
          <div className="flex-1 space-y-6">
            {dropdownData
              .slice(Math.ceil(dropdownData.length / 2))
              .map((dropdown) => (
                <Dropdown
                  key={dropdown.id}
                  id={dropdown.id}
                  label={dropdown.label}
                  icon={dropdown.icon}
                  content={dropdown.content}
                  isOpen={openDropdowns.has(dropdown.id)}
                  onToggle={toggleDropdown}
                />
              ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModalContent;

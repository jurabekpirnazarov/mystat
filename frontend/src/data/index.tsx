import {
  Calculator,
  Handshake,
  NotebookText,
  Factory,
  AudioLines,
  ScrollText,
  BookText,
  Star,
  Zap,
  Rocket,
  Crown,
  Globe2Icon,
} from "lucide-react";
import { Plan } from "../types";
export const services = [
  {
    id:1,
    title: "Nashrlarga elektron buyurtma berish",
    description: "",
    icon: Handshake,
    isSimple: true,
    tariff: {
      one: "",
      two: "",
      three: "+",
      four: "+",
    },
    category: "Soliq",
    price: "Tekin",
    popular: true,
  },
  {
    id:2,
    title: "Tashqi savdo statistik ma'lumotlar",
    description: "",
    icon: Globe2Icon,
    isSimple: true,
    tariff: {
      one: "",
      two: "",
      three: "+",
      four: "+",
    },
    category: "Soliq",
    price: "Tekin",
    popular: true,
  },
  {
    id:3,
    title:
      "Statistik ma'lumotlarni taqdim etish",
    // description: "respondentni individual xabardor qilish",
    icon: BookText,
    isSimple: false,
    tariff: [
      {
        name: "telefon orqali tushuntirish berish",
        list: [
          "1 tа hisobot bo‘yicha",
          "2 tа hisobot yoki so‘rovnoma bo‘yicha",
          "4 tа hisobot yoki so‘rovnoma bo‘yicha",
          "barcha hisobot yoki so‘rovnoma bo‘yicha",
        ],
      },
      {
        name: "Zoom platformasi orqali seminar o‘tkazish grafikka asosan) ",
        list: ["", "", "5 soat", "10 soat"],
      },
      {
        name: "Statistika organlari xodimlari tomonidan joylarda seminar o‘tkazish (grafikka asosan)",
        list: ["", "", "3 soat", "10 soat"],
      },
    ],
    category: "Hujjatlar",
    price: "50,000 so'm",
    popular: false,
  },
  {
    id:4,
    title: "Korxonalar va tashkilotlarning yagona davlat registridan ma’lumot taqdim etish",
    // description: "respondentni individual xabardor qilish",
    icon: Calculator,
    isSimple: false,
    tariff: [
      {
        name: "O‘zbekiston Respublikasining ijtimoiy-iqtisodiy holati bo‘yicha axborotnomasi",
        list: ["+", "+", "+", "+"],
      },
      {
        name: "Viloyatning ijtimoiy-iqtisodiy holati bo‘yicha axborotnomasi",
        list: ["", "+", "+", "+"],
      },
      {
        name: "Tuman va shaharlarning ijtimoiy-iqtisodiy holati bo‘yicha axborotnomasi ",
        list: ["", "", "+", "+"],
      },
    ],
    category: "Hujjatlar",
    price: "50,000 so'm",
    popular: false,
  },
  {
    id:5,
    title: "Korxona va tashkilotlar to'g'risida ma'lumot",
    // description:
    //   "so‘rovga asosan tarmoqlar bo‘yicha mavjud statistik ko‘rsatkichlar va uslubiyotlardan foydalangan holda tahliliy ma’lumotlar tayyorlash",
    icon: ScrollText,
    isSimple: true,
    tariff: {
      one: "",
      two: "1 yillik 10 ta ko‘rsatkich bo‘yicha",
      three: "5 yillik dinamik qator, 30 ta ko‘rsatkich",
      four: "10 yillik dinamik qator,50 ta ko‘rsatkich",
    },
    category: "Soliq",
    price: "Tekin",
    popular: true,
  },
  {
    id:6,
    title:
      "Sanoat mahsulotlari ishlab chiqaruvchilar",
    // description:
    //   "so‘rovga asosan KTYaDR bazasida yuridik shaxslar to‘g‘risidagi 16 turdagi ma’lumotlar taqdim etish",
    icon: AudioLines,
    isSimple: true,
    tariff: {
      one: "10 tа korxona to‘g‘risida ma’lumot ",
      two: "100 tа korxona to‘g‘risida ma’lumot ",
      three: "1000 tа korxona to‘g‘risida ma’lumot ",
      four: "10000 tа korxona to‘g‘risida ma’lumot ",
    },
    category: "Soliq",
    price: "Tekin",
    popular: true,
  },
  {
    id:7,
    title: "iste'mol narxlari indeksi kalkulyatori",
    // description: "tarmoq yo‘nalishlari bo‘yicha, elektron shaklda",
    icon: Factory,
    isSimple: true,
    tariff: {
      one: "1 tа byulleten",
      two: "3 tа byulleten",
      three: "5 tа byulleten",
      four: "7 tа byulleten",
    },
    category: "Soliq",
    price: "Tekin",
    popular: true,
  },
  {
    id:8,
    title: "Korxona va tashkilotlar KTUT kodini aniqlash",
    description: "elektron shaklda",
    icon: NotebookText,
    isSimple: true,
    tariff: {
      one: "1 tа byulleten",
      two: "3 tа byulleten",
      three: "5 tа byulleten",
      four: "barcha to‘plam",
    },
    category: "Soliq",
    price: "Tekin",
    popular: true,
  },
  {
    id:9,
    title:
      "Taqdim etiladigan hisobotlar ro'yhati",
    // description: "respondentni individual xabardor qilish",
    icon: Calculator,
    isSimple: false,
    tariff: [
      {
        name: "“Yozma eslatma” (elektron pochta manziliga)",
        list: [
          "1 tа elektron pochta manziliga",
          "2 tа elektron pochta manziliga",
          "3 tа elektron pochta manziliga",
          "5 tа elektron pochta manziliga",
        ],
      },
      {
        name: "“SMS xabarnoma” telefon raqamiga",
        list: [
          "1 tа elektron pochta manziliga",
          "2 tа elektron pochta manziliga",
          "3 tа elektron pochta manziliga",
          "5 tа elektron pochta manziliga",
        ],
      },
      {
        name: "“Telefon qo‘ng‘iroq eslatma” ovozli xabar orqali",
        list: [
          "1 tа elektron pochta manziliga",
          "2 tа elektron pochta manziliga",
          "3 tа elektron pochta manziliga",
          "5 tа elektron pochta manziliga",
        ],
      },
    ],
    category: "Hujjatlar",
    price: "Tekin",
    popular: false,
  },
];

export const tariffs = [
  {
    title: "Statistika ma’lumotlarini broshyura va fleshkada taqdim etish",
    description: "",
    icon: Handshake,
    isSimple: true,
    tariff: ["", "", "+", "+"],
    category: "Soliq",
    price: "Tekin",
    popular: true,
  },
  {
    title:
      "Statistika hisoboti shakllarini taqdim etish to‘g‘risida xabardor qilish ",
    description: "respondentni individual xabardor qilish",
    icon: Calculator,
    isSimple: false,
    tariff: [
      {
        name: "1-tarif",
        list: [
          {
            name: "“Yozma eslatma” (elektron pochta manziliga)",
            count: "1 tа elektron pochta manziliga",
          },
          {
            name: "“SMS xabarnoma” (telefon raqamiga)",
            count: "1 tа elektron pochta manziliga",
          },
          {
            name: "“Telefon qo‘ng‘iroq eslatma” (ovozli xabar orqali)",
            count: "1 tа elektron pochta manziliga",
          },
        ],
      },
      {
        name: "2-tarif",
        list: [
          {
            name: "“Yozma eslatma” (elektron pochta manziliga)",
            count: "2 tа elektron pochta manziliga",
          },
          {
            name: "“SMS xabarnoma” (telefon raqamiga)",
            count: "2 tа elektron pochta manziliga",
          },
          {
            name: "“Telefon qo‘ng‘iroq eslatma” (ovozli xabar orqali)",
            count: "2 tа elektron pochta manziliga",
          },
        ],
      },
      {
        name: "3-tarif",
        list: [
          {
            name: "“Yozma eslatma” (elektron pochta manziliga)",
            count: "3 tа elektron pochta manziliga",
          },
          
          {
            name: "“SMS xabarnoma” (telefon raqamiga)",
            count: "3 tа elektron pochta manziliga",
          },
          {
            name: "“Telefon qo‘ng‘iroq eslatma” (ovozli xabar orqali)",
            count: "3 tа elektron pochta manziliga",
          },
        ],
      },
      {
        name: "4-tarif",
        list: [
          {
            name: "“Yozma eslatma” (elektron pochta manziliga)",
            count: "5 tа elektron pochta manziliga",
          },
          {
            name: "“SMS xabarnoma” (telefon raqamiga)",
            count: "5 tа elektron pochta manziliga",
          },
          {
            name: "“Telefon qo‘ng‘iroq eslatma” (ovozli xabar orqali)",
            count: "5 tа elektron pochta manziliga",
          },
        ],
      },
    ],
    category: "Hujjatlar",
    price: "50,000 so'm",
    popular: false,
  },
  {
    title:
      "Statistika hisobot shakllarini to‘ldirish bo‘yicha maslahat (tushuntirish) xizmatlari: ",
    description: "respondentni individual xabardor qilish",
    icon: BookText,
    isSimple: false,
    tariff: [
      {
        name: "1-tarif",
        list: [
          {
            name: "Telefon orqali tushuntirish berish",
            count: "1 tа hisobot bo‘yicha",
          },
          {
            name: "Zoom platformasi orqali seminar o‘tkazish grafikka asosan) ",
            count: "",
          },
          {
            name: "Statistika organlari xodimlari tomonidan joylarda seminar o‘tkazish (grafikka asosan)",
            count: "",
          },
        ],
      },
      {
        name: "2-tarif",
        list: [
          {
            name: "Telefon orqali tushuntirish berish",
            count: "2 tа hisobot yoki so‘rovnoma bo‘yicha",
          },
          {
            name: "Zoom platformasi orqali seminar o‘tkazish grafikka asosan) ",
            count: "",
          },
          {
            name: "Statistika organlari xodimlari tomonidan joylarda seminar o‘tkazish (grafikka asosan)",
            count: "",
          },
        ],  
      },
      {
        name: "3-tarif",
        list: [
          {
            name: "Telefon orqali tushuntirish berish",
            count: "4 tа hisobot yoki so‘rovnoma bo‘yicha",
          },
          {
            name: "Zoom platformasi orqali seminar o‘tkazish grafikka asosan) ",
            count: "5 soat",
          },
          {
            name: "Statistika organlari xodimlari tomonidan joylarda seminar o‘tkazish (grafikka asosan)",
            count: "3 soat",
          },
        ],
      },
      {
        name: "4-tarif",
        list: [
          {
            name: "Telefon orqali tushuntirish berish",
            count: "barcha hisobot yoki so‘rovnoma bo‘yicha",
          },
          {
            name: "Zoom platformasi orqali seminar o‘tkazish grafikka asosan) ",
            count: "10 soat",
          },
          {
            name: "Statistika organlari xodimlari tomonidan joylarda seminar o‘tkazish (grafikka asosan)",
            count: "10 soat",
          },
        ],
      },
    ],
    category: "Hujjatlar",
    price: "50,000 so'm",
    popular: false,
  },
  {
    title: "Statistika ma’lumotlarini taqdim etish:",
    description: "respondentni individual xabardor qilish",
    icon: Calculator,
    isSimple: false,
    tariff: [
      {
        name: "1-tarif",
        list: [
          {
            name: "O‘zbekiston Respublikasining ijtimoiy-iqtisodiy holati bo‘yicha axborotnomasi",
            count: "+",
          },
          {
            name: "Viloyatning ijtimoiy-iqtisodiy holati bo‘yicha axborotnomasi",
            count: "",
          },
          {
            name: "Tuman va shaharlarning ijtimoiy-iqtisodiy holati bo‘yicha axborotnomasi",
            count: "",
          },
        ],
      },
      {
        name: "2-tarif",
        list: [
          {
            name: "O‘zbekiston Respublikasining ijtimoiy-iqtisodiy holati bo‘yicha axborotnomasi",
            count: "+",
          },
          {
            name: "Viloyatning ijtimoiy-iqtisodiy holati bo‘yicha axborotnomasi",
            count: "+",
          },
          {
            name: "Tuman va shaharlarning ijtimoiy-iqtisodiy holati bo‘yicha axborotnomasi",
            count: "",
          },
        ],
      },
      {
        name: "3-tarif",
        list: [
          {
            name: "O‘zbekiston Respublikasining ijtimoiy-iqtisodiy holati bo‘yicha axborotnomasi",
            count: "+",
          },
          {
            name: "Viloyatning ijtimoiy-iqtisodiy holati bo‘yicha axborotnomasi",
            count: "+",
          },
          {
            name: "Tuman va shaharlarning ijtimoiy-iqtisodiy holati bo‘yicha axborotnomasi",
            count: "+",
          },
        ],
      },
      {
        name: "4-tarif",
        list: [
          {
            name: "O‘zbekiston Respublikasining ijtimoiy-iqtisodiy holati bo‘yicha axborotnomasi",
            count: "+",
          },
          {
            name: "Viloyatning ijtimoiy-iqtisodiy holati bo‘yicha axborotnomasi",
            count: "+",
          },
          {
            name: "Tuman va shaharlarning ijtimoiy-iqtisodiy holati bo‘yicha axborotnomasi",
            count: "+",
          },
        ],
      },
    ],
    category: "Hujjatlar",
    price: "50,000 so'm",
    popular: false,
  },
  {
    title: "Statistik ko‘rsatkichlar asosida tahliliy ma’lumotlarni tayyorlash",
    description:
      "so‘rovga asosan tarmoqlar bo‘yicha mavjud statistik ko‘rsatkichlar va uslubiyotlardan foydalangan holda tahliliy ma’lumotlar tayyorlash",
    icon: ScrollText,
    isSimple: true,
    tariff: [
      "",
      "1 yillik 10 ta ko‘rsatkich bo‘yich",
      "5 yillik dinamik qator, 30 ta ko‘rsatkich",
      "10 yillik dinamik qator,50 ta ko‘rsatkich",
    ],
    category: "Soliq",
    price: "Tekin",
    popular: true,
  },
  {
    title:
      "Korxonalar va tashkilotlarning yagona davlat registri (KTYaDR) bo‘yicha ma’lumot taqdim etish",
    description:
      "so‘rovga asosan KTYaDR bazasida yuridik shaxslar to‘g‘risidagi 16 turdagi ma’lumotlar taqdim etish",
    icon: AudioLines,
    isSimple: true,
    tariff: [
      "10 tа korxona to‘g‘risida ma’lumot",
      "100 tа korxona to‘g‘risida ma’lumot",
      "1000 tа korxona to‘g‘risida ma’lumot",
      "10000 tа korxona to‘g‘risida ma’lumot",
    ],
    category: "Soliq",
    price: "Tekin",
    popular: true,
  },
  {
    title: "Statistik byulletenlarni taqdim etish",
    description: "tarmoq yo‘nalishlari bo‘yicha, elektron shaklda",
    icon: Factory,
    isSimple: true,
    tariff: [
      "1 tа byulleten",
      "3 tа byulleten",
      "5 tа byulleten",
      "7 tа byulleten",
    ],
    category: "Soliq",
    price: "Tekin",
    popular: true,
  },
  {
    title: "Statistik byulletenlarni taqdim etish",
    description: "elektron shaklda",
    icon: NotebookText,
    isSimple: true,
    tariff: [
      "1 tа byulleten",
      "3 tа byulleten",
      "5 tа byulleten",
      "7 tа byulleten",
    ],
    category: "Soliq",
    price: "Tekin",
    popular: true,
  },
];

export const plans: Plan[] = [
  {
    id: "start",
    name: "Start",
    price: "Bepul",
    period: "",
    description: "Boshlash uchun eng yaxshi variant",
    icon: <Star className="w-6 h-6" />,
    color: "text-green-400",
    gradient: "from-green-400 to-emerald-500",
    features: [
      { name: "Bir yillik obuna", included: true },
      { name: "Tezkor va interaktiv konsalting xizmatlari", included: true },
      { name: "Asosiy qo'llab-quvvatlash", included: true },
      { name: "API kirish", included: false },
      { name: "Kengaytirilgan analytics", included: false },
    ],
    detailedFeatures: [
      {
        category:
          "Statistika hisoboti shakllarini taqdim etish to‘g‘risida xabardor qilish",
        icon: Calculator,
        desc: "respondentni individual xabardor qilish",
        items: [
          {
            name: "“Yozma eslatma” (elektron pochta manziliga)",
            included: true,
            value: "1 tа elektron pochta manziliga",
          },
          {
            name: "“SMS xabarnoma” (telefon raqamiga)",
            included: true,
            value: "1 tа elektron pochta manziliga",
          },
          {
            name: "“Telefon qo‘ng‘iroq eslatma” (ovozli xabar orqali)",
            included: true,
            value: "1 tа elektron pochta manziliga",
          },
        ],
      },
      {
        category:
          "Statistika hisobot shakllarini to‘ldirish bo‘yicha maslahat (tushuntirish) xizmatlari: ",
        icon: BookText,
        desc: "respondentni individual xabardor qilish",
        items: [
          {
            name: "Telefon orqali tushuntirish berish",
            included: true,
            value: "1 tа hisobot bo‘yicha",
          },
          {
            name: "Zoom platformasi orqali seminar o‘tkazish grafikka asosan)",
            included: false,
          },
          {
            name: "Statistika organlari xodimlari tomonidan joylarda seminar o‘tkazish (grafikka asosan)",
            included: false,
          },
        ],
      },
      {
        category: "Statistika ma’lumotlarini taqdim etish:",
        icon: Calculator,
        desc: "respondentni individual xabardor qilish",
        items: [
          {
            name: "O‘zbekiston Respublikasining ijtimoiy-iqtisodiy holati bo‘yicha axborotnomasi",
            value: "",
            included: true,
          },
          {
            name: "Viloyatning ijtimoiy-iqtisodiy holati bo‘yicha axborotnomasi",
            included: false,
            value: "",
          },
          {
            name: "Tuman va shaharlarning ijtimoiy-iqtisodiy holati bo‘yicha axborotnomasi",
            included: false,
            value: "",
          },
        ],
      },
      {
        category:
          "Korxonalar va tashkilotlarning yagona davlat registri (KTYaDR) bo‘yicha ma’lumot taqdim etish",
        icon: AudioLines,
        desc: "so‘rovga asosan KTYaDR bazasida yuridik shaxslar to‘g‘risidagi 16 turdagi ma’lumotlar taqdim etish",
        items: [
          {
            name: "10 tа korxona to‘g‘risida ma’lumot",
            included: true,
          },
        ],
      },
      {
        category: "Statistik byulletenlarni taqdim etish",
        icon: Factory,
        desc: "tarmoq yo‘nalishlari bo‘yicha, elektron shaklda",
        items: [
          {
            name: "1 tа byulleten",
            included: true,
          },
        ],
      },
      {
        category: "Statistik byulletenlarni taqdim etish",
        icon: Factory,
        desc: "elektron shaklda",
        items: [
          {
            name: "1 tа byulleten",
            included: true,
          },
        ],
      },
    ],
  },
  {
    id: "plus",
    name: "Plus",
    price: "99,000",
    period: "/oy",
    description: "Kichik jamoa uchun mukammal",
    icon: <Zap className="w-6 h-6" />,
    color: "text-blue-400",
    gradient: "from-blue-400 to-cyan-500",
    features: [
      { name: "Bir yillik obuna", included: true },
      { name: "Tezkor va interaktiv konsalting xizmatlari", included: true },
      { name: "Tez qo'llab-quvvatlash", included: true },
      { name: "API kirish", included: true },
      { name: "Kengaytirilgan analytics", included: true },
    ],
    detailedFeatures: [
      {
        category:
          "Statistika hisoboti shakllarini taqdim etish to‘g‘risida xabardor qilish",
        icon: Calculator,
        desc: "respondentni individual xabardor qilish",
        items: [
          {
            name: "“Yozma eslatma” (elektron pochta manziliga)",
            included: true,
            value: "2 tа elektron pochta manziliga",
          },
          {
            name: "“SMS xabarnoma” (telefon raqamiga)",
            included: false,
            value: "2 tа elektron pochta manziliga",
          },
          {
            name: "“Telefon qo‘ng‘iroq eslatma” (ovozli xabar orqali)",
            included: true,
            value: "2 tа elektron pochta manziliga",
          },
        ],
      },
      {
        category:
          "Statistika hisobot shakllarini to‘ldirish bo‘yicha maslahat (tushuntirish) xizmatlari: ",
        icon: BookText,
        desc: "respondentni individual xabardor qilish",
        items: [
          {
            name: "Telefon orqali tushuntirish berish",
            included: true,
            value: "2 tа hisobot yoki so‘rovnoma bo‘yicha",
          },
          {
            name: "Zoom platformasi orqali seminar o‘tkazish grafikka asosan)",
            included: false,
          },
          {
            name: "Statistika organlari xodimlari tomonidan joylarda seminar o‘tkazish (grafikka asosan)",
            included: false,
          },
        ],
      },
      {
        category: "Statistika ma’lumotlarini taqdim etish:",
        icon: Calculator,
        desc: "respondentni individual xabardor qilish",
        items: [
          {
            name: "O‘zbekiston Respublikasining ijtimoiy-iqtisodiy holati bo‘yicha axborotnomasi",
            included: true,
          },
          {
            name: "Viloyatning ijtimoiy-iqtisodiy holati bo‘yicha axborotnomasi",
            included: true,
          },
          {
            name: "Tuman va shaharlarning ijtimoiy-iqtisodiy holati bo‘yicha axborotnomasi",
            included: false,
          },
        ],
      },
      {
        category:
          "Statistik ko‘rsatkichlar asosida tahliliy ma’lumotlarni tayyorlash",
        icon: ScrollText,
        desc: "so‘rovga asosan tarmoqlar bo‘yicha mavjud statistik ko‘rsatkichlar va uslubiyotlardan foydalangan holda tahliliy ma’lumotlar tayyorlash",
        items: [
          {
            name: "1 yillik 10 ta ko‘rsatkich bo‘yicha",
            value: "",
            included: true,
          },
        ],
      },
      {
        category:
          "Korxonalar va tashkilotlarning yagona davlat registri (KTYaDR) bo‘yicha ma’lumot taqdim etish",
        icon: AudioLines,
        desc: "so‘rovga asosan KTYaDR bazasida yuridik shaxslar to‘g‘risidagi 16 turdagi ma’lumotlar taqdim etish",
        items: [
          {
            name: "100 tа korxona to‘g‘risida ma’lumot",
            included: true,
          },
        ],
      },
      {
        category: "Statistik byulletenlarni taqdim etish",
        icon: Factory,
        desc: "tarmoq yo‘nalishlari bo‘yicha, elektron shaklda",
        items: [
          {
            name: "3 tа byulleten",
            included: true,
          },
        ],
      },
      {
        category: "Statistik byulletenlarni taqdim etish",
        icon: Factory,
        desc: "elektron shaklda",
        items: [
          {
            name: "3 tа byulleten",
            included: true,
          },
        ],
      },
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: "199,000",
    originalPrice: "249,000",
    period: "/oy",
    description: "Professional ishlar uchun",
    icon: <Rocket className="w-6 h-6" />,
    color: "text-purple-400",
    gradient: "from-purple-400 to-pink-500",
    popular: true,
    features: [
      { name: "Bir yillik obuna", included: true },
      { name: "Tezkor va interaktiv konsalting xizmatlari", included: true },
      { name: "Premium qo'llab-quvvatlash", included: true },
      { name: "Kengaytirilgan API", included: true },
      { name: "Custom integratsiya", included: true },
    ],
    detailedFeatures: [
      {
        category:
          "Statistika ma’lumotlarini broshyura va fleshkada taqdim etish",
        icon: Handshake,
        desc: "",
        items: [],
      },
      {
        category:
          "Statistika hisoboti shakllarini taqdim etish to‘g‘risida xabardor qilish",
        icon: Calculator,
        desc: "respondentni individual xabardor qilish",
        items: [
          {
            name: "“Yozma eslatma” (elektron pochta manziliga)",
            included: true,
            value: "3 tа elektron pochta manziliga",
          },
          {
            name: "“SMS xabarnoma” (telefon raqamiga)",
            included: false,
            value: "3 tа elektron pochta manziliga",
          },
          {
            name: "“Telefon qo‘ng‘iroq eslatma” (ovozli xabar orqali)",
            included: true,
            value: "3 tа elektron pochta manziliga",
          },
        ],
      },
      {
        category:
          "Statistika hisobot shakllarini to‘ldirish bo‘yicha maslahat (tushuntirish) xizmatlari: ",
        icon: BookText,
        desc: "respondentni individual xabardor qilish",
        items: [
          {
            name: "Telefon orqali tushuntirish berish",
            included: true,
            value: "4 tа hisobot yoki so‘rovnoma bo‘yicha",
          },
          {
            name: "Zoom platformasi orqali seminar o‘tkazish grafikka asosan)",
            value: "5 soat",
            included: true,
          },
          {
            name: "Statistika organlari xodimlari tomonidan joylarda seminar o‘tkazish (grafikka asosan)",
            value: "3 soat",
            included: true,
          },
        ],
      },
      {
        category: "Statistika ma’lumotlarini taqdim etish:",
        icon: Calculator,
        desc: "respondentni individual xabardor qilish",
        items: [
          {
            name: "O‘zbekiston Respublikasining ijtimoiy-iqtisodiy holati bo‘yicha axborotnomasi",
            included: true,
          },
          {
            name: "Viloyatning ijtimoiy-iqtisodiy holati bo‘yicha axborotnomasi",
            included: true,
          },
          {
            name: "Tuman va shaharlarning ijtimoiy-iqtisodiy holati bo‘yicha axborotnomasi",
            included: true,
          },
        ],
      },
      {
        category:
          "Statistik ko‘rsatkichlar asosida tahliliy ma’lumotlarni tayyorlash",
        icon: ScrollText,
        desc: "so‘rovga asosan tarmoqlar bo‘yicha mavjud statistik ko‘rsatkichlar va uslubiyotlardan foydalangan holda tahliliy ma’lumotlar tayyorlash",
        items: [
          {
            name: "5 yillik dinamik qator, 30 ta ko‘rsatkich",
            value: "",
            included: true,
          },
        ],
      },
      {
        category:
          "Korxonalar va tashkilotlarning yagona davlat registri (KTYaDR) bo‘yicha ma’lumot taqdim etish",
        icon: AudioLines,
        desc: "so‘rovga asosan KTYaDR bazasida yuridik shaxslar to‘g‘risidagi 16 turdagi ma’lumotlar taqdim etish",
        items: [
          {
            name: "1000 tа korxona to‘g‘risida ma’lumot",
            included: true,
          },
        ],
      },
      {
        category: "Statistik byulletenlarni taqdim etish",
        icon: Factory,
        desc: "tarmoq yo‘nalishlari bo‘yicha, elektron shaklda",
        items: [
          {
            name: "5 tа byulleten",
            included: true,
          },
        ],
      },
      {
        category: "Statistik byulletenlarni taqdim etish",
        icon: Factory,
        desc: "elektron shaklda",
        items: [
          {
            name: "5 tа byulleten",
            included: true,
          },
        ],
      },
    ],
  },
  {
    id: "premium",
    name: "Premium",
    price: "399,000",
    originalPrice: "499,000",
    period: "/oy",
    description: "Katta kompaniyalar uchun",
    icon: <Crown className="w-6 h-6" />,
    color: "text-yellow-400",
    gradient: "from-yellow-400 to-orange-500",
    features: [
      { name: "Bir yillik obuna", included: true },
      { name: "Tezkor va interaktiv konsalting xizmatlari", included: true },
      { name: "24/7 qo'llab-quvvatlash", included: true },
      { name: "Maxsus API", included: true },
      { name: "Shaxsiy menejer", included: true },
    ],
    detailedFeatures: [
      {
        category:
          "Statistika ma’lumotlarini broshyura va fleshkada taqdim etish",
        icon: Handshake,
        desc: "",
        items: [],
      },
      {
        category:
          "Statistika hisoboti shakllarini taqdim etish to‘g‘risida xabardor qilish",
        icon: Calculator,
        desc: "respondentni individual xabardor qilish",
        items: [
          {
            name: "“Yozma eslatma” (elektron pochta manziliga)",
            included: true,
            value: "5 tа elektron pochta manziliga",
          },
          {
            name: "“SMS xabarnoma” (telefon raqamiga)",
            included: false,
            value: "5 tа elektron pochta manziliga",
          },
          {
            name: "“Telefon qo‘ng‘iroq eslatma” (ovozli xabar orqali)",
            included: true,
            value: "5 tа elektron pochta manziliga",
          },
        ],
      },
      {
        category:
          "Statistika hisobot shakllarini to‘ldirish bo‘yicha maslahat (tushuntirish) xizmatlari: ",
        icon: BookText,
        desc: "respondentni individual xabardor qilish",
        items: [
          {
            name: "Telefon orqali tushuntirish berish",
            included: true,
            value: "barcha hisobot yoki so‘rovnoma bo‘yicha",
          },
          {
            name: "Zoom platformasi orqali seminar o‘tkazish grafikka asosan)",
            value: "10 soat",
            included: true,
          },
          {
            name: "Statistika organlari xodimlari tomonidan joylarda seminar o‘tkazish (grafikka asosan)",
            value: "10 soat",
            included: true,
          },
        ],
      },
      {
        category: "Statistika ma’lumotlarini taqdim etish:",
        icon: Calculator,
        desc: "respondentni individual xabardor qilish",
        items: [
          {
            name: "O‘zbekiston Respublikasining ijtimoiy-iqtisodiy holati bo‘yicha axborotnomasi",
            included: true,
          },
          {
            name: "Viloyatning ijtimoiy-iqtisodiy holati bo‘yicha axborotnomasi",
            included: true,
          },
          {
            name: "Tuman va shaharlarning ijtimoiy-iqtisodiy holati bo‘yicha axborotnomasi",
            included: true,
          },
        ],
      },
      {
        category:
          "Statistik ko‘rsatkichlar asosida tahliliy ma’lumotlarni tayyorlash",
        icon: ScrollText,
        desc: "so‘rovga asosan tarmoqlar bo‘yicha mavjud statistik ko‘rsatkichlar va uslubiyotlardan foydalangan holda tahliliy ma’lumotlar tayyorlash",
        items: [
          {
            name: "10 yillik dinamik qator, 50 ta ko‘rsatkich",
            value: "", 
            included: true,
          },
        ],
      },
      {
        category:
          "Korxonalar va tashkilotlarning yagona davlat registri (KTYaDR) bo‘yicha ma’lumot taqdim etish",
        icon: AudioLines,
        desc: "so‘rovga asosan KTYaDR bazasida yuridik shaxslar to‘g‘risidagi 16 turdagi ma’lumotlar taqdim etish",
        items: [
          {
            name: "10000 tа korxona to‘g‘risida ma’lumot",
            included: true,
          },
        ],
      },
      {
        category: "Statistik byulletenlarni taqdim etish",
        icon: Factory,
        desc: "tarmoq yo‘nalishlari bo‘yicha, elektron shaklda",
        items: [
          {
            name: "7 tа byulleten",
            included: true,
          },
        ],
      },
      {
        category: "Statistik byulletenlarni taqdim etish",
        icon: Factory,
        desc: "elektron shaklda",
        items: [
          {
            name: "7 tа byulleten",
            included: true,
          },
        ],
      },
    ],
  },
];

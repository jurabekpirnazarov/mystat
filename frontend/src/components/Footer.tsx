import {
  Phone,
  Mail,
  MapPin,
  Facebook,
  Twitter,
  Instagram,
  Globe,
  Send,
  Youtube,
} from "lucide-react";

const Footer = () => {
  const footerLinks = {
    platform: {
      title: "Platform",
      links: [
        { name: "Portal Haqida", href: "/about" },
        { name: "Xizmatlar", href: "/services" },
        { name: "Statistika", href: "/statistics" },
        { name: "Foydalanish Shartlari", href: "#" },
      ],
    },
    services: {
      title: "Xizmatlar",
      links: [
        { name: "Biznes Konsalting ", href: "#" },
        { name: "Soliq Maslahat", href: "#" },
        { name: "Hisobot Tayyorlash", href: "#" },
        { name: "Audit Xizmatlari", href: "#" },
      ],
    },
    support: {
      title: "Yordam",
      links: [
        { name: "Qo'llab-quvvatlash", href: "/contact" },
        { name: "FAQ", href: "/about#faq" },
        { name: "Texnik Yordam", href: "#" },
        { name: "Qo'llanma", href: "#" },
      ],
    },
  };

  return (
    <footer className="bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Footer Content */}
        <div className="py-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <div>
              <h3 className="text-xl font-bold mb-4">
                Milliy Statistika Qo'mitasi
              </h3>
              <p className="text-gray-300 text-sm leading-relaxed">
                Professional biznes konsalting xizmatlari va statistik
                ma'lumotlar yagona platformada. Biznes rivojlantirish uchun
                ishonchli hamkor.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-3">
                <Phone className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-300">+998 71 233-45-67</span>
              </div>
              <div className="flex items-center space-x-3">
                <Mail className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-300">info@stat.uz</span>
              </div>
              <div className="flex items-center space-x-3">
                <MapPin className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-300">
                  Toshkent, Yunusobod tumani
                </span>
              </div>
            </div>
          </div>

          {/* Footer Links */}
          {Object.entries(footerLinks).map(([key, section]) => (
            <div key={key}>
              <h4 className="text-lg font-semibold mb-4">{section.title}</h4>
              <ul className="space-y-2">
                {section.links.map((link, index) => (
                  <li key={index}>
                    <a
                      href={link.href}
                      className="text-gray-300 hover:text-white text-sm transition-colors duration-200"
                    >
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Social Media & Bottom Section */}
        <div className="border-t border-blue-700/30 py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div>
              <h4 className="text-sm font-semibold mb-3">Ijtimoiy Tarmoqlar</h4>
              <div className="flex space-x-4">
                <a
                  href="https://www.facebook.com/uzstataxborot"
                  target="_blank"
                  aria-label="Facebook"
                  rel="noopener noreferrer"
                  className="w-8 h-8 bg-blue-800/50 rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors duration-200"
                >
                  <Facebook className="w-4 h-4" />
                </a>
                <a
                  href="https://twitter.com/uzstataxborot"
                  target="_blank"
                  aria-label="Twitter (X)"
                  rel="noopener noreferrer"
                  className="w-8 h-8 bg-blue-800/50 rounded-full flex items-center justify-center hover:bg-blue-400 transition-colors duration-200"
                >
                  <Twitter className="w-4 h-4" />
                </a>
                <a
                  href="https://t.me/uzstataxborot"
                  target="_blank"
                  aria-label="Telegram"
                  rel="noopener noreferrer"
                  className="w-8 h-8 bg-blue-800/50 rounded-full flex items-center justify-center hover:bg-cyan-500 transition-colors duration-200"
                >
                  <Send className="w-4 h-4" />
                </a>
                <a
                  href="https://www.instagram.com/uzstataxborot?igsh=MWZ5OG10empwMGVqNg=="
                  target="_blank"
                  aria-label="Instagram"
                  rel="noopener noreferrer"
                  className="w-8 h-8 bg-blue-800/50 rounded-full flex items-center justify-center hover:bg-pink-600 transition-colors duration-200"
                >
                  <Instagram className="w-4 h-4" />
                </a>
                <a
                  href="https://stat.uz/uz/"
                  target="_blank"
                  aria-label="stat.uz rasmiy sayti"
                  rel="noopener noreferrer"
                  className="w-8 h-8 bg-blue-800/50 rounded-full flex items-center justify-center hover:bg-green-600 transition-colors duration-200"
                >
                  <Globe className="w-4 h-4" />
                </a>
                <a
                  href="https://www.youtube.com/channel/UCiMwrLl7Cq_NrUv1L5ubNkw"
                  target="_blank"
                  aria-label="YouTube"
                  rel="noopener noreferrer"
                  className="w-8 h-8 bg-blue-800/50 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors duration-200"
                >
                  <Youtube className="w-4 h-4" />
                </a>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-4 text-sm text-gray-300">
                <span>Sertifikatlar:</span>
                <span className="bg-blue-600 text-white px-2 py-1 rounded text-xs">
                  SSL Secured
                </span>
              </div>
              <div className="text-sm text-gray-400">
                24/7 Texnik Qo'llab-quvvatlash | Barcha huquqlar himoyalangan
              </div>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-gray-800 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between text-sm text-gray-500 space-y-2 md:space-y-0">
            <div>
              © 2024 O'zbekiston Respublikasi Milliy Statistika Qo'mitasi.
              Barcha huquqlar himoyalangan.
            </div>
            <div className="flex space-x-6">
              <a
                href="#"
                className="hover:text-gray-300 transition-colors duration-200"
              >
                Maxfiylik Siyosati
              </a>
              <a
                href="#"
                className="hover:text-gray-300 transition-colors duration-200"
              >
                Cookie Siyosati
              </a>
              <a
                href="#"
                className="hover:text-gray-300 transition-colors duration-200"
              >
                Sayt Xaritasi
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

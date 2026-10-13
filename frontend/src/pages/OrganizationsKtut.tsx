import React, { useState } from 'react';
import { Search, RefreshCw } from 'lucide-react';

function OrganizationsKtut() {
  const [stir, setStir] = useState('');
  const [captcha, setCaptcha] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [captchaCode] = useState('cf ЯК ec');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    setTimeout(() => {
      setIsLoading(false);
    }, 2000);
  };

  const handleStirChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, ''); // Faqat raqamlar
    if (value.length <= 9) {
      setStir(value);
    }
  };

  const refreshCaptcha = () => {
    console.log('Refreshing captcha...');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Main Card */}
        <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
          {/* Header with Logo */}
          {/* <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-8 py-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg">
                  <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center">
                    <Globe className="w-5 h-5 text-white" />
                  </div>
                </div>
                <div className="text-white">
                  <h1 className="text-lg font-bold leading-tight">UZSTAT</h1>
                </div>
              </div>
            </div>
            
            <p className="text-blue-100 text-sm leading-relaxed">
              O'zbekiston Respublikasi Milliy statistika qo'mitasi
            </p>
          </div> */}

          {/* Form Content */}
          <div className="p-8">
            {/* Title */}
            <div className="text-center mb-8">
              <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
                <Search className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                KTUT kodini bilish
              </h2>
              <p className="text-gray-600 text-sm">
                Tashkilot STIR raqamini kiriting
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* STIR Input */}
              <div>
                <label htmlFor="stir" className="block text-sm font-semibold text-gray-700 mb-3">
                  STIR raqami
                </label>
                
                {/* Custom STIR Input with Animated Underscores */}
                <div className="relative">
                  <input
                    type="text"
                    id="stir"
                    value={stir}
                    onChange={handleStirChange}
                    placeholder="123456789"
                    maxLength={9}
                    className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-lg bg-gray-50 hover:bg-white text-center tracking-widest"
                    required
                  />
                  
                  {/* Animated Underscores */}
                  <div className="flex justify-center mt-2 space-x-2">
                    {Array.from({ length: 9 }).map((_, index) => (
                      <div
                        key={index}
                        className={`w-6 h-0.5 transition-all duration-300 ${
                          index < stir.length
                            ? 'bg-blue-500 scale-100 opacity-100'
                            : 'bg-gray-300 scale-75 opacity-50'
                        }`}
                        style={{
                          transitionDelay: `${index * 50}ms`
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Captcha */}
              <div>
                <label htmlFor="captcha" className="block text-sm font-semibold text-gray-700 mb-3">
                  Tasdiqlash kodi
                </label>
                
                {/* Captcha Display */}
                <div className="flex items-center space-x-3 mb-4">
                  <div className="flex-1 bg-gradient-to-r from-green-100 to-green-200 rounded-xl p-4 flex items-center justify-center border-2 border-green-300">
                    <span className="text-2xl font-bold text-green-800 tracking-wider select-none">
                      {captchaCode}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={refreshCaptcha}
                    className="p-4 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all duration-200 group shadow-md hover:shadow-lg"
                    title="Yangilash"
                  >
                    <RefreshCw className="w-5 h-5 text-gray-600 group-hover:rotate-180 transition-transform duration-300" />
                  </button>
                </div>

                <input
                  type="text"
                  id="captcha"
                  value={captcha}
                  onChange={(e) => setCaptcha(e.target.value)}
                  placeholder="Tasdiqlash kodini kiriting"
                  className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 hover:bg-white"
                  required
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading || !stir || !captcha}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-bold py-4 px-6 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-3 text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span>Qidirilmoqda...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-5 h-5" />
                    <span>Qidirish</span>
                  </>
                )}
              </button>
            </form>

            {/* Security Note */}
            {/* <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
              <p className="text-blue-800 text-sm text-center">
                🔒 Ma'lumotlaringiz xavfsiz saqlanadi
              </p>
            </div> */}
            
          </div>

          {/* Footer */}
          {/* <div className="bg-gray-50 px-8 py-4 text-center border-t border-gray-100">
            <p className="text-gray-600 text-sm">
              © 2025 yil • UZSTAT
            </p>
          </div> */}
        </div>
      </div>
    </div>
  );
}

export default OrganizationsKtut;
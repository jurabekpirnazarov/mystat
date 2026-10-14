import { useState, useEffect } from 'react';
import { ArrowLeft, Phone, Mail, MapPin, User, AlertCircle, Download } from 'lucide-react';
import { OrganizationData } from '../api/organizationInfo';
import { getClassificatorItem } from '../api/organizationInfo';
import toast from 'react-hot-toast';

interface OrgDetailProps {
  onBack: () => void;
  organizationData: OrganizationData | null;
}

function OrgDetail({ onBack, organizationData }: OrgDetailProps) {
  const [classificatorNames, setClassificatorNames] = useState<{[key: string]: string}>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isPdfLoading, setIsPdfLoading] = useState(false);

  const generatePDF = async () => {
    if (!organizationData) return;

    try {
      setIsPdfLoading(true);
      const contentElement = document.getElementById('org-detail-content');
      
      if (!contentElement) {
        throw new Error('Content element not found');
      }

      toast.loading('PDF fayl tayyorlanmoqda...');

      // Q-02: og'ir kutubxonalar faqat PDF so'ralganda yuklanadi (OrgInfoPage chunk'i 635 KB edi)
      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([import('html2canvas'), import('jspdf')]);
      const canvas = await html2canvas(contentElement, {
        scale: 2,
        useCORS: true,
        logging: false
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      
      pdf.addImage(imgData, 'PNG', imgX, 0, imgWidth * ratio, imgHeight * ratio);
      pdf.save(`${organizationData.name}_ma'lumotlari.pdf`);

      toast.dismiss();
      toast.success('PDF fayl yuklandi');
    } catch (error) {
      console.error('PDF generation error:', error);
      toast.dismiss();
      toast.error('PDF faylni yaratishda xatolik yuz berdi');
    } finally {
      setIsPdfLoading(false);
    }
  };

  // Load classificator names for codes
  useEffect(() => {
    const loadClassificatorNames = async () => {
      if (!organizationData) return;
      
      setIsLoading(true);
      const nameMap: {[key: string]: string} = {};
      
      // Try to fetch classificator names for different codes
      try {
        // reg_o (registration organ)
        if (organizationData.reg_o) {
          try {
            const result = await getClassificatorItem('reg_o', organizationData.reg_o.toString());
            if (result.data.results && result.data.results.length > 0) {
              nameMap[organizationData.reg_o.toString()] = result.data.results[0].name || result.data.results[0].name_uz || '';
            }
          } catch (error) {
            console.error('Failed to load reg_o classificator:', error);
          }
        }

        // opf (organizational-legal form)
        if (organizationData.opf) {
          try {
            const result = await getClassificatorItem('opf', organizationData.opf.toString());
            if (result.data.results && result.data.results.length > 0) {
              nameMap[organizationData.opf.toString()] = result.data.results[0].name || result.data.results[0].name_uz || '';
            }
          } catch (error) {
            console.error('Failed to load opf classificator:', error);
          }
        }

        // soogu
        if (organizationData.soogu) {
          try {
            const result = await getClassificatorItem('soogu', organizationData.soogu);
            if (result.data.results && result.data.results.length > 0) {
              nameMap[organizationData.soogu] = result.data.results[0].name || result.data.results[0].name_uz || '';
            }
          } catch (error) {
            console.error('Failed to load soogu classificator:', error);
          }
        }

        // soato (administrative territorial code)
        if (organizationData.soato) {
          try {
            const result = await getClassificatorItem('soato', organizationData.soato);
            if (result.data.results && result.data.results.length > 0) {
              nameMap[organizationData.soato] = result.data.results[0].name || result.data.results[0].name_uz || '';
            }
          } catch (error) {
            console.error('Failed to load soato classificator:', error);
          }
        }

        // okeds
        for (const oked of organizationData.okeds || []) {
          if (oked.oked) {
            try {
              const result = await getClassificatorItem('oked', oked.oked);
              if (result.data.results && result.data.results.length > 0) {
                nameMap[oked.oked] = result.data.results[0].name || result.data.results[0].name_uz || '';
              }
            } catch (error) {
              console.error(`Failed to load oked classificator for ${oked.oked}:`, error);
            }
          }
        }
      } catch (error) {
        console.error('Error loading classificator names:', error);
        toast.error('Klassifikator ma\'lumotlarini yuklashda xatolik');
      }
      
      setClassificatorNames(nameMap);
      setIsLoading(false);
    };

    loadClassificatorNames();
  }, [organizationData]);

  if (!organizationData) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-lg p-8">
          <div className="text-center">
            <AlertCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Ma'lumot topilmadi</h2>
            <p className="text-gray-600 mb-4">Tashkilot ma'lumotlari mavjud emas.</p>
            <button 
              onClick={onBack}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
            >
              Ortga qaytish
            </button>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div id="org-detail-content" className="max-w-4xl mx-auto bg-white shadow-lg rounded-lg overflow-hidden">
        {/* Header */}
        <div className="bg-white p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button 
                onClick={onBack}
                className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                <ArrowLeft className="h-5 w-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {organizationData.name}
                </h1>
                <div className="flex items-center space-x-4 text-sm text-gray-500 mt-2">
                  <span>📍 {organizationData.address?.address || 'Manzil ko\'rsatilmagan'}</span>
                  {organizationData.org_elpochta && (
                    <span>📄 {organizationData.org_elpochta}</span>
                  )}
                </div>
              </div>
            </div>
            <button
              onClick={generatePDF}
              disabled={isPdfLoading}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200 transition-colors ${
                isPdfLoading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <Download className="h-5 w-5" />
              <span className="font-medium">PDF yuklab olish</span>
            </button>
          </div>
        </div>

        {/* Basic Information Cards */}
        <div className="p-6 bg-gray-50">
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <p className="text-sm text-gray-500">Ro'yxatga olish raqami</p>
              <p className="text-lg font-semibold text-gray-900">{organizationData.reg_nom || 'N/A'}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <p className="text-sm text-gray-500">Ro'yxatga olingan sana</p>
              <p className="text-lg font-semibold text-gray-900">{organizationData.reg_date || 'N/A'}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <p className="text-sm text-gray-500">STIR</p>
              <p className="text-lg font-semibold text-gray-900">{organizationData.tin}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <p className="text-sm text-gray-500">Faollik holati</p>
              <span className={`inline-block text-sm px-3 py-1 rounded-full font-medium ${
                organizationData.status 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {organizationData.status ? 'Faol' : 'Nofaol'}
              </span>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="p-6">
          {/* General Information */}
          <section className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Umumiy ma'lumot</h2>
            {isLoading && (
              <div className="mb-4">
                <p className="text-sm text-gray-500">Klassifikator ma'lumotlari yuklanmoqda...</p>
              </div>
            )}
            <div className="space-y-4">
              {organizationData.opf && (
                <div className="flex justify-between items-start border-b border-gray-100 pb-3">
                  <div className="text-gray-600 w-80">
                    <p className="text-sm">Tashkiliy-huquqiy shakllari tasniflash(THSHT)</p>
                  </div>
                  <div className="flex-1 text-left">
                    <span className="text-blue-600 font-medium">{organizationData.opf}</span>
                    <span className="text-gray-700 ml-2">
                      - {classificatorNames[organizationData.opf.toString()] || 'Yuklanmoqda...'}
                    </span>
                  </div>
                </div>
              )}

              {organizationData.okeds && organizationData.okeds.length > 0 && (
                <div className="flex justify-between items-start border-b border-gray-100 pb-3">
                  <div className="text-gray-600 w-80">
                    <p className="text-sm">Iqtisodiy faoliyat turlari umumdavlat tasniflash(IIFUT)</p>
                  </div>
                  <div className="flex-1 text-left">
                    {organizationData.okeds.map((oked, index) => (
                      <div key={index} className="mb-2">
                        <span className="text-blue-600 font-medium">{oked.oked}</span>
                        <span className="text-gray-700 ml-2">
                          - {classificatorNames[oked.oked] || 'Yuklanmoqda...'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-between items-start border-b border-gray-100 pb-3">
                <div className="text-gray-600 w-80">
                  <p className="text-sm">Davlat va xo'jalik boshqaruv organlari belgilangan(DXBOT)</p>
                </div>
                <div className="flex-1 text-left">
                  <span className="text-blue-600 font-medium">79994</span>
                  <span className="text-gray-700 ml-2">- Davlat va xo'jalik boshqaruv organlari tarkibiga kirmagan tadbirkorlik sub'yektlari</span>
                </div>
              </div>

              <div className="flex justify-between items-start border-b border-gray-100 pb-3">
                <div className="text-gray-600 w-80">
                  <p className="text-sm">Kichik biznes sub'ektliga mansubligi</p>
                </div>
                <div className="flex-1 text-right">
                  <span className="text-gray-700">Ha</span>
                </div>
              </div>

              <div className="flex justify-between items-start">
                <div className="text-gray-600 w-80">
                  <p className="text-sm">Ustav fondi</p>
                </div>
                <div className="flex-1 text-right">
                  <span className="bg-blue-500 text-white px-3 py-1 rounded text-sm font-medium">
                    500000000 So'm
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* Important Notice */}
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-8">
            <div className="flex items-start">
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 mr-3" />
              <div>
                <p className="text-sm font-medium text-blue-900">Iltimos, e'tibor qiling!</p>
                <p className="text-sm text-blue-800 mt-1">
                  Ushbu ma'lumotlar ro'yxatdan o'tkazuvchi va nazoratchi organlar har turnli asosida shakllantirigan.
                  O'zingizni qiziqtirgan bizdagi statistik ma'lumotlar bilan tanishmoqchi bo'lsangiz O'zbekiston Respublikasi Milliy statistika qo'mitasi rasmiy veb-saytiga tashrif buyuring.
                </p>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <section className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Kontakt ma'lumotlari</h2>
            <div className="space-y-4">
              {organizationData.org_elpochta && (
                <div className="flex justify-between items-start border-b border-gray-100 pb-3">
                  <div className="flex items-center space-x-3 w-80">
                    <Mail className="h-5 w-5 text-gray-500" />
                    <span className="text-gray-600">Elektron pochta</span>
                  </div>
                  <div className="flex-1 text-left">
                    <span className="font-medium text-gray-900">{organizationData.org_elpochta}</span>
                  </div>
                </div>
              )}
              
              {organizationData.org_phone && (
                <div className="flex justify-between items-start border-b border-gray-100 pb-3">
                  <div className="flex items-center space-x-3 w-80">
                    <Phone className="h-5 w-5 text-gray-500" />
                    <span className="text-gray-600">Telefon raqami</span>
                  </div>
                  <div className="flex-1 text-left">
                    <span className="font-medium text-gray-900">{organizationData.org_phone}</span>
                  </div>
                </div>
              )}

              {organizationData.soato && (
                <div className="flex justify-between items-start border-b border-gray-100 pb-3">
                  <div className="flex items-center space-x-3 w-80">
                    <MapPin className="h-5 w-5 text-gray-500" />
                    <span className="text-gray-600">Ma'muriy hududiy tuzilmalarini belgilash tizimi</span>
                  </div>
                  <div className="flex-1 text-left">
                    <span className="text-blue-600 font-medium">{organizationData.soato}</span>
                    <span className="text-gray-700 ml-2">
                      - {classificatorNames[organizationData.soato] || 'Yuklanmoqda...'}
                    </span>
                  </div>
                </div>
              )}

              {organizationData.address?.address && (
                <div className="flex justify-between items-start">
                  <div className="flex items-center space-x-3 w-80">
                    <MapPin className="h-5 w-5 text-gray-500" />
                    <span className="text-gray-600">Manzil</span>
                  </div>
                  <div className="flex-1 text-left">
                    <span className="text-gray-700">{organizationData.address.address}</span>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Manager Information */}
          <section className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Boshqaruvchi haqida ma'lumot</h2>
            <div className="flex items-center space-x-3">
              <User className="h-5 w-5 text-gray-500" />
              <div>
                <p className="text-sm text-gray-500">Rahbar</p>
                <p className="font-medium text-gray-900">{organizationData.director_name || 'Ma\'lumot ko\'rsatilmagan'}</p>
              </div>
            </div>

            {/* Founders Information */}
            {organizationData.founders && organizationData.founders.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Ta'sischilar</h3>
                <div className="space-y-3">
                  {organizationData.founders.map((founder, index) => (
                    <div key={index} className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-gray-900">{founder.name}</p>
                          <p className="text-sm text-gray-500">Ulush miqdori: {founder.share_amount} So'm</p>
                        </div>
                        <div className="text-right">
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm font-medium">
                            {founder.share_amount_percent}%
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* Additional Notes */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Qisqartmalar:</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-start border-b border-gray-100 pb-3">
                <div className="w-80">
                  <span className="font-medium text-gray-700">STIR</span>
                </div>
                <div className="flex-1 text-left">
                  <span className="text-gray-700">
                    Soliq to'lovchining identifikatsiya raqami
                  </span>
                </div>
              </div>
              <div className="flex justify-between items-start">
                <div className="w-80">
                  <span className="font-medium text-gray-700">📄</span>
                </div>
                <div className="flex-1 text-left">
                  <span className="text-gray-700">Ro'yxatga oluvchi organ</span>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export default OrgDetail;
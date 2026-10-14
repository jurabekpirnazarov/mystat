import { ArrowLeft, Download, Eye, BarChart3, TrendingUp, FileSpreadsheet } from 'lucide-react';

export interface TradeDataItem {
  country?: string;
  july?: number;
  // New API response fields
  id?: number;
  trade_type?: number;
  trade_type_display?: string;
  product?: number;
  product_name?: string;
  unit?: number;
  unit_name?: string;
  year?: number;
  year_value?: number;
  month?: string;
  month_display?: string;
  country_name?: string;
  country_code?: string;
  region?: number;
  region_name?: string;
  region_code?: string;
  sitc?: number;
  sitc_name?: string;
  hs2_code?: string;
  hs2_name?: string;
  value?: string | number;
  quantity?: string | number;
  isGroupSummary?: boolean;
  label?: string;
  [key: string]: string | number | boolean | null | undefined; // qo'shimcha ustunlar (group_by ga qarab)
}

export interface HeaderItem {
  field: string;
  label: string;
}

export interface ApiTradeData {
  success?: boolean;
  data: TradeDataItem[];
  total: number;
  filters: Record<string, unknown>;
  headers: HeaderItem[];
  units: string[];
  missing: unknown[];
}

interface ServiceResultsStepProps {
  onPrevious: () => void;
  tradeData: ApiTradeData;
  handleDownloadData: () => void;
}

const ServiceResultsStep = ({ onPrevious, tradeData, handleDownloadData }: ServiceResultsStepProps) => {
  const formatNumber = (num: number) => {
    return num.toLocaleString('en-US', { minimumFractionDigits: 1 });
  };

  // Helper function to get country name from various possible fields
  const getCountryName = (item: TradeDataItem): string => {
    if (item.isGroupSummary && item.label) {
      return item.label;
    }
    return String(item.country_name || item.country || item.name || item.label || 'Unknown');
  };

  // Helper function to get value from various possible fields
  const getValue = (item: TradeDataItem): number => {
    // For group summary rows, try to get total value from dynamic fields
    if (item.isGroupSummary) {
      // Look for value fields in dynamic columns
      const valueFields = Object.keys(item).filter(key => key.includes('value_'));
      if (valueFields.length > 0) {
        return valueFields.reduce((sum, field) => {
          const value = item[field];
          return sum + (typeof value === 'number' ? value : parseFloat(value?.toString() || '0') || 0);
        }, 0);
      }
    }
    
    // Handle both string and number types for value
    const apiValue = item.value;
    if (typeof apiValue === 'string') {
      return parseFloat(apiValue) || 0;
    }
    if (typeof apiValue === 'number') {
      return apiValue;
    }
    
    // Try dynamic value fields (like value_2022_M1, etc.)
    const valueFields = Object.keys(item).filter(key => key.includes('value_'));
    if (valueFields.length > 0) {
      return valueFields.reduce((sum, field) => {
        const value = item[field];
        return sum + (typeof value === 'number' ? value : parseFloat(value?.toString() || '0') || 0);
      }, 0);
    }
    
    return Number(item.july || item.amount || item.total || 0);
  };

  // Helper function to get product name
  const getProductName = (item: TradeDataItem): string => {
    if (item.isGroupSummary && item.label) {
      return item.label;
    }
    return item.hs2_name || item.product_name || item.sitc_name || 'Unknown Product';
  };

  // Helper function to get trade type
  const getTradeType = (item: TradeDataItem): string => {
    if (tradeData.filters && tradeData.filters.trade_type_name) {
      return String(tradeData.filters.trade_type_name);
    }
    return item.trade_type_display || 'Unknown';
  };

  // Ensure we have valid data
  const validTradeData = tradeData.data.filter((item: TradeDataItem) => item && typeof item === 'object');
  
  // Check if we have any data
  const hasData = validTradeData.length > 0;
  
  const totalSum = validTradeData.reduce((sum: number, item: TradeDataItem) => sum + getValue(item), 0);
  const topCountries = validTradeData.slice(0, 5);
  const averageValue = validTradeData.length > 0 ? totalSum / validTradeData.length : 0;

  // Render empty state if no data
  if (!hasData) {
    return (
      <div className="space-y-8 max-w-6xl mx-auto px-6 py-12">
        {/* Empty State Header */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-gray-500 to-gray-600 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="bg-white/20 p-3 rounded-lg">
                  <BarChart3 className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Ma'lumot Topilmadi</h2>
                  <p className="text-gray-100 text-lg">Tanlangan parametrlar bo'yicha ma'lumot mavjud emas</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Empty State Content */}
          <div className="p-12 text-center">
            <div className="bg-gray-100 p-6 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
              <FileSpreadsheet className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Hech qanday ma'lumot topilmadi</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Siz tanlagan parametrlar bo'yicha ma'lumotlar mavjud emas. Iltimos, boshqa parametrlarni tanlashga harakat qiling yoki vaqt oralig'ini o'zgartiring.
            </p>
            <div className="space-y-3 text-sm text-gray-500">
              <p>• Boshqa yil yoki oy tanlashga harakat qiling</p>
              <p>• Davlatlar yoki mahsulot toifalarini o'zgartiring</p>
              <p>• Eksport/Import turini tekshiring</p>
            </div>
          </div>
        </div>

        {/* Back Button */}
        <div className="flex justify-start">
          <button
            onClick={onPrevious}
            className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center space-x-2 transition-all duration-200"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Sozlamalarga qaytish</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto px-6 py-12">
      {/* Results Header */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-green-600 to-green-700 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-white/20 p-3 rounded-lg">
                <BarChart3 className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Tahlil Natijalari</h2>
                <p className="text-green-100 text-lg">Tashqi savdo ma'lumotlari tahlili</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={handleDownloadData}
                className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-all duration-200"
              >
                <Download className="w-5 h-5" />
                <span>Yuklab olish</span>
              </button>
            </div>
          </div>
        </div>
        
        {/* Summary Statistics */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600 font-medium">Jami Yozuvlar</p>
                  <p className="text-2xl font-bold text-blue-900">{tradeData.data.length}</p>
                </div>
                <div className="bg-blue-100 p-3 rounded-lg">
                  <Eye className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-600 font-medium">Jami Qiymat</p>
                  <p className="text-2xl font-bold text-green-900">{formatNumber(totalSum)}</p>
                  <p className="text-xs text-green-600">AQSh dollari</p>
                </div>
                <div className="bg-green-100 p-3 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-600 font-medium">O'rtacha Qiymat</p>
                  <p className="text-2xl font-bold text-purple-900">{formatNumber(averageValue)}</p>
                  <p className="text-xs text-purple-600">AQSh dollari</p>
                </div>
                <div className="bg-purple-100 p-3 rounded-lg">
                  <BarChart3 className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </div>

            <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-orange-600 font-medium">Eng Katta Qiymat</p>
                  <p className="text-lg font-bold text-orange-900">{getCountryName(topCountries[0] || {})}</p>
                  <p className="text-xs text-orange-600">{formatNumber(getValue(topCountries[0] || {}))} USD</p>
                </div>
                <div className="bg-orange-100 p-3 rounded-lg">
                  <FileSpreadsheet className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Top Countries Chart */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-gray-900">Top 5 Eng Katta Qiymatlar</h3>
          <div className="text-sm text-gray-500">AQSh dollari</div>
        </div>
        
        <div className="space-y-4">
          {topCountries.map((item: TradeDataItem, index: number) => {
            const percentage = totalSum > 0 ? (getValue(item) / totalSum) * 100 : 0;
            const countryName = getCountryName(item);
            const productName = getProductName(item);
            const tradeType = getTradeType(item);
            
            return (
              <div 
                key={`${item.id || index}`} 
                className={`p-4 rounded-lg border ${
                  index === 0 
                    ? 'bg-yellow-50 border-yellow-200' 
                    : 'bg-gray-50 border-gray-200'
                } hover:shadow-md transition-all duration-200`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      index === 0 
                        ? 'bg-yellow-500 text-white' 
                        : 'bg-gray-500 text-white'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">
                        {countryName}
                      </p>
                      <p className="text-sm text-gray-600">
                        {tradeType} - {item.month_display || item.month} {item.year}
                      </p>
                      <p className="text-xs text-gray-500 truncate max-w-xs">
                        {productName}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-gray-900">
                      {formatNumber(getValue(item))}
                    </p>
                    <p className="text-sm text-gray-600">USD</p>
                    <p className="text-xs text-gray-500">{percentage.toFixed(1)}%</p>
                  </div>
                </div>
                
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${
                      index === 0 ? 'bg-yellow-500' : 'bg-blue-500'
                    }`}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Detailed Data Table */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-gray-900">Batafsil Ma'lumotlar</h3>
            <div className="flex items-center space-x-3">
              <span className="text-sm text-gray-500">{tradeData.data.length} ta yozuv</span>
              <button
                onClick={handleDownloadData}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-all duration-200"
              >
                <Download className="w-4 h-4" />
                <span>Excel</span>
              </button>
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  №
                </th>
                {tradeData.headers && tradeData.headers.length > 0 ? (
                  tradeData.headers.map((header: HeaderItem) => (
                    <th 
                      key={header.field}
                      className={`px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider ${
                        header.field.includes('value') || header.field.includes('quantity')
                          ? 'text-right'
                          : 'text-left'
                      }`}
                    >
                      {header.label}
                    </th>
                  ))
                ) : (
                  // Fallback headers if API headers are not available
                  <>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Country
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Value
                    </th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {validTradeData.map((item: TradeDataItem, index: number) => {
                return (
                  <tr 
                    key={item.id || index}
                    className={`hover:bg-gray-50 transition-colors duration-200 ${
                      item.isGroupSummary ? 'bg-blue-50 font-semibold' : ''
                    }`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.isGroupSummary ? '' : index + 1}
                    </td>
                    {tradeData.headers && tradeData.headers.length > 0 ? (
                      tradeData.headers.map((header: HeaderItem) => {
                        const value = item[header.field];
                        const isNumeric = typeof value === 'number' || 
                          (typeof value === 'string' && !isNaN(parseFloat(value)));
                        
                        return (
                          <td 
                            key={header.field}
                            className={`px-6 py-4 whitespace-nowrap text-sm ${
                              item.isGroupSummary ? 'font-semibold text-blue-900' : 'text-gray-900'
                            } ${isNumeric ? 'text-right' : 'text-left'}`}
                          >
                            {isNumeric && value !== null && value !== undefined
                              ? formatNumber(parseFloat(value.toString()))
                              : value || '-'
                            }
                          </td>
                        );
                      })
                    ) : (
                      // Fallback cells if API headers are not available
                      <>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.country_name || item.country || item.label}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {item.hs2_name || item.product_name || item.sitc_name || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-900">
                          {formatNumber(getValue(item))}
                        </td>
                      </>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Analysis Summary */}
      <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl border border-blue-200 p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Tahlil Xulosasi</h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Asosiy Ko'rsatkichlar</h4>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start">
                <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                <span>Jami {tradeData.data.length} ta savdo operatsiyasi</span>
              </li>
              <li className="flex items-start">
                <span className="inline-block w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                <span>Eng katta operatsiya: {formatNumber(getValue(topCountries[0] || {}))} USD</span>
              </li>
              <li className="flex items-start">
                <span className="inline-block w-2 h-2 bg-purple-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                <span>O'rtacha operatsiya qiymati: {formatNumber(averageValue)} USD</span>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Taqsimot</h4>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start">
                <span className="inline-block w-2 h-2 bg-orange-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                <span>Top 5 operatsiya umumiy qiymatning {totalSum > 0 ? ((topCountries.slice(0, 5).reduce((sum: number, item: TradeDataItem) => sum + getValue(item), 0) / totalSum) * 100).toFixed(1) : '0.0'}% ni tashkil qiladi</span>
              </li>
              <li className="flex items-start">
                <span className="inline-block w-2 h-2 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                <span>Turli davlatlar va mahsulotlar bo'yicha taqsimlangan</span>
              </li>
              <li className="flex items-start">
                <span className="inline-block w-2 h-2 bg-indigo-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                <span>Eksport va import operatsiyalarini o'z ichiga oladi</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Back Button */}
      <div className="flex justify-start">
        <button
          onClick={onPrevious}
          className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center space-x-2 transition-all duration-200"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Sozlamalarga qaytish</span>
        </button>
      </div>
    </div>
  );
};

export default ServiceResultsStep;

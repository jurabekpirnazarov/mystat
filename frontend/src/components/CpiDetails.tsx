import React, { useState } from 'react';
import { BarChart3, Table } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export interface PriceIndexData {
  period: string;
  fullPeriod: string;
  value: number;
  displayValue: string;
}

const priceIndexData: PriceIndexData[] = [
  { period: '2024 - II', fullPeriod: '2024 II', value: 100, displayValue: '100%' },
  { period: '2024 - III', fullPeriod: '2024 III', value: 100.67, displayValue: '100.67%' },
  { period: '2024 - IV', fullPeriod: '2024 IV', value: 101.6, displayValue: '101.606231%' },
  { period: '2024 - V', fullPeriod: '2024 V', value: 104.5, displayValue: '104.4512055468%' },
  { period: '2024 - VI', fullPeriod: '2024 VI', value: 109.9, displayValue: '109.882668152340%' },
  { period: '2024 - VII', fullPeriod: '2024 VII', value: 115.3, displayValue: '115.266918891800%' },
  { period: '2024 - VIII', fullPeriod: '2024 VIII', value: 121.6, displayValue: '121.606599430850%' }
];

const CpiDetails: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'chart' | 'table'>('chart');

  const currentValue = priceIndexData[priceIndexData.length - 1].value;
  const previousValue = priceIndexData[priceIndexData.length - 2].value;
  const monthlyChange = ((currentValue - previousValue) / previousValue * 100).toFixed(1);

  const formatTooltip = (value: number) => {
    return [`${value.toFixed(1)}%`, 'tanlangan davrga nisbatan, %'];
  };

  const renderChartView = () => (
    <div className="p-6">
      <div className="bg-white rounded-lg">
        {/* Chart Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-800">
            O'zbekiston Respublikasi bo'yicha iste'mol narxlari indeksi
          </h3>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span>tanlangan davrga nisbatan, %</span>
          </div>
        </div>

        {/* Chart Container */}
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={priceIndexData}
              margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="period" 
                stroke="#666"
                fontSize={12}
                tick={{ fill: '#666' }}
              />
              <YAxis 
                domain={['dataMin - 2', 'dataMax + 2']}
                stroke="#666"
                fontSize={12}
                tick={{ fill: '#666' }}
              />
              <Tooltip 
                formatter={formatTooltip}
                labelStyle={{ color: '#333' }}
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #ccc',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke="#3b82f6" 
                strokeWidth={2}
                dot={{ 
                  fill: '#3b82f6', 
                  stroke: '#3b82f6', 
                  strokeWidth: 2, 
                  r: 4 
                }}
                activeDot={{ 
                  r: 6, 
                  stroke: '#3b82f6', 
                  strokeWidth: 2,
                  fill: 'white'
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Data Points Display */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          {priceIndexData.map((item, index) => (
            <div key={index} className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-sm font-medium text-gray-600 mb-1">
                {item.period}
              </div>
              <div className="text-lg font-bold text-blue-600">
                {item.value.toFixed(1)}
              </div>
            </div>
          ))}
        </div>

        {/* Chart Attribution */}
        <div className="mt-6 text-right">
          <span className="text-xs text-gray-400">Highcharts.com</span>
        </div>
      </div>
    </div>
  );

  const renderTableView = () => (
    <div className="p-6">
      <div className="bg-white rounded-lg overflow-hidden border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-gray-200">
                {priceIndexData.map((item, index) => (
                  <th 
                    key={index} 
                    className="px-6 py-4 text-left font-semibold text-gray-800 bg-gray-50 min-w-[120px]"
                  >
                    <div className="space-y-1">
                      <div className="text-sm">{item.fullPeriod.split(' ')[0]}</div>
                      <div className="text-sm">{item.fullPeriod.split(' ')[1]}</div>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-100">
                {priceIndexData.map((item, index) => (
                  <td 
                    key={index} 
                    className={`px-6 py-4 text-sm font-medium ${
                      index === 0 ? 'text-blue-600' : 'text-gray-900'
                    }`}
                  >
                    {item.displayValue}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>

        {/* Additional Info */}
        <div className="px-6 py-4 bg-gray-50 text-sm text-gray-600">
          <p className="font-medium">Ma'lumot:</p>
          <p className="mt-1">
            Jadvalda O'zbekiston Respublikasi bo'yicha iste'mol narxlari indeksi 
            ko'rsatkichlari tanlangan davr mobaynidagi o'zgarishlar aks ettirilgan.
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white">
      {/* Header Section */}
      <div className="bg-white px-6 py-8 border-b border-gray-200">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Natija:</h2>
          
          <div className="space-y-3">
            <p className="text-gray-700 leading-relaxed">
              <span className="font-medium">2024 yilning avgust oyi 2024 yilning fevral oyiga nisbatan O`zbekiston Respublikasi bo`yicha iste`mol narxlari indeksi</span>
              <span className="text-red-600 font-bold text-xl ml-2">{currentValue}%</span>
              <span className="font-medium"> ni tashkil etgan.</span>
            </p>
            
            <p className="text-gray-700">
              <span className="font-medium">Tanlangan davr mobaynidagi umumiy INI o`sishi</span>
              <span className="text-red-600 font-bold text-lg ml-2">{monthlyChange}%</span>
              <span className="font-medium"> ni tashkil etdi</span>
            </p>
          </div>

          <p className="text-sm text-gray-600 mt-4 leading-relaxed">
            *INI katkulyatori asosida hisoblanаan ma`lumotlardan faqatgina axborot o`rnida foydalanish uchun ishlab chiqilgan. O`zbekiston Respublikasi Davlat statistika qo`mitasi 
            ushbu ma`lumotlarni qo`llashga doir tavsiyalar bermasligí bilan bir qatorda ma`lumotlardan noo`rin foydalanish oqibatlari bo`yicha javobgarlikni o`z zimmasiga olmaydi.
          </p>
        </div>
      </div>

      {/* Tabs and Content Section */}
      <div className="max-w-7xl mx-auto">
        {/* Tab Navigation */}
        <div className="flex bg-gradient-to-r from-blue-600 to-blue-500 text-white">
          <button
            onClick={() => setActiveTab('chart')}
            className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors ${
              activeTab === 'chart' 
                ? 'bg-blue-700 bg-opacity-50' 
                : 'hover:bg-blue-700 hover:bg-opacity-30'
            }`}
          >
            <BarChart3 size={20} />
            <span>Grafik</span>
          </button>
          <button
            onClick={() => setActiveTab('table')}
            className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors ${
              activeTab === 'table' 
                ? 'bg-blue-700 bg-opacity-50' 
                : 'hover:bg-blue-700 hover:bg-opacity-30'
            }`}
          >
            <Table size={20} />
            <span>Jadval</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="bg-white">
          {activeTab === 'chart' ? renderChartView() : renderTableView()}
        </div>
      </div>
    </div>
  );
};

export default CpiDetails;
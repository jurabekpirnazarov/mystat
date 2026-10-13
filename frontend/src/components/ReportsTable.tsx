import React from 'react';
import { ReportData } from '../types/report';
import { FileText, Clock, Calendar } from 'lucide-react';

interface ReportsTableProps {
  reports: ReportData[];
}

const ReportsTable: React.FC<ReportsTableProps> = ({ reports }) => {
  const getTypeColor = (type: string) => {
    if (type.includes('invest')) return 'bg-blue-50 text-blue-700';
    if (type.includes('sanoat')) return 'bg-green-50 text-green-700';
    if (type.includes('kb') || type.includes('KB')) return 'bg-purple-50 text-purple-700';
    if (type.includes('korxona')) return 'bg-orange-50 text-orange-700';
    return 'bg-gray-50 text-gray-700';
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 w-1/4">
                <div className="flex items-center space-x-2">
                  <FileText className="h-4 w-4" />
                  <span>Hisobot turi</span>
                </div>
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 w-1/2">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4" />
                  <span>Hisobot nomi</span>
                </div>
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 w-1/4">
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4" />
                  <span>Taqdim etish muddati</span>
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {reports.map((report, index) => (
              <tr key={report.id} className="hover:bg-gray-50 transition-colors duration-150">
                <td className="px-6 py-4">
                  <div className={`inline-flex items-center px-3 py-1 rounded-lg text-sm font-medium ${getTypeColor(report.type)}`}>
                    {report.type}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <p className="text-sm text-gray-800 leading-relaxed">
                    {report.name}
                  </p>
                </td>
                <td className="px-6 py-4">
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {report.deadline}
                  </p>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ReportsTable;
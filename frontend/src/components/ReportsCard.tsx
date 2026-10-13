import React from 'react';
import { ReportData } from '../types/report';
import { FileText, Clock } from 'lucide-react';

interface ReportCardProps {
  report: ReportData;
  index: number;
}

const ReportCard: React.FC<ReportCardProps> = ({ report, index }) => {
  const getTypeColor = (type: string) => {
    if (type.includes('invest')) return 'bg-blue-50 text-blue-700 border-blue-200';
    if (type.includes('sanoat')) return 'bg-green-50 text-green-700 border-green-200';
    if (type.includes('kb') || type.includes('KB')) return 'bg-purple-50 text-purple-700 border-purple-200';
    if (type.includes('korxona')) return 'bg-orange-50 text-orange-700 border-orange-200';
    return 'bg-gray-50 text-gray-700 border-gray-200';
  };

  const getReportFrequency = (type: string) => {
    if (type.includes('choraklik')) return 'Choraklik';
    if (type.includes('yillik')) return 'Yillik';
    if (type.includes('Oylik')) return 'Oylik';
    return 'Davriy';
  };

  return (
    <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 border border-gray-100 hover:border-blue-200 p-6 group">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg p-2 shadow-sm">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <span className="text-sm font-medium text-gray-500">Hisobot #{index + 1}</span>
            <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ml-2 ${getTypeColor(report.type)}`}>
              {getReportFrequency(report.type)}
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-800 mb-2 leading-5 group-hover:text-blue-600 transition-colors duration-200">
            {report.type}
          </h3>
          <p className="text-sm text-gray-600 leading-relaxed line-clamp-3">
            {report.name}
          </p>
        </div>

        <div className="flex items-start space-x-2 pt-4 border-t border-gray-50">
          <Clock className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-gray-600 leading-relaxed">
            <span className="font-medium text-gray-700">Muddat:</span> {report.deadline}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ReportCard;
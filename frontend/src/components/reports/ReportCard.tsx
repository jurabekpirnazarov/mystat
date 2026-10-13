import React from 'react';
import { ReportData } from '../../types/report';

interface ReportCardProps {
  report: ReportData;
  index: number;
}

const ReportCard: React.FC<ReportCardProps> = ({ report }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-medium text-gray-500">Hisobot turi</h3>
          <p className="mt-1 text-base font-semibold text-gray-900">{report.type_uz}</p>
        </div>
        <div>
          <h3 className="text-sm font-medium text-gray-500">Hisobot nomi</h3>
          <p className="mt-1 text-base text-gray-900">{report.formsname_uz}</p>
        </div>
        <div>
          <h3 className="text-sm font-medium text-gray-500">Taqdim etish muddati</h3>
          <p className="mt-1 text-base text-blue-600 font-medium">{report.srok_uz}</p>
        </div>
      </div>
    </div>
  );
};

export default ReportCard;
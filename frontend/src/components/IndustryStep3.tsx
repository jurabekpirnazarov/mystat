import React from 'react';

interface TableRow {
  kodSKP: string;
  naimenovanieProdukciya: string;
  oblast: string;
  okpo: string;
  inn: string;
  naimenovanie: string;
  yuridicheskiyAdres: string;
  telefon: string;
}

const IndustryStep3: React.FC = () => {
  const data: TableRow[] = [
    {
      kodSKP: "3832220",
      naimenovanieProdukciya: "Вторсырье (вторичные сырьевые материалы) содержащие черные металлы",
      oblast: "Асакинский район",
      okpo: "32492192",
      inn: "310190757",
      naimenovanie: "MULKIMYNO xususiy korxonasi",
      yuridicheskiyAdres: "Andijon viloyati Asaka tumani QFY Axtachi ko'chasi 596-uy",
      telefon: "+998 74 225 45 67"
    },
    {
      kodSKP: "3811550", 
      naimenovanieProdukciya: "Отходы пластмасс",
      oblast: "Бозский район",
      okpo: "31904020",
      inn: "309606076",
      naimenovanie: "BO'STON NURU ZAMINI 2022 oilaviy korxonasi",
      yuridicheskiyAdres: "Andijon viloyati Bo'ston tumani Bo'z shaharchasi Tafakkur MFY Mustaqillik ko'chasi, 9-uy",
      telefon: "+998 74 335 12 89"
    },
    {
      kodSKP: "3832290",
      naimenovanieProdukciya: "Вторсырье (вторичные сырьевые материалы) из прочих металлов",
      oblast: "г. Янгиер",
      okpo: "27094561", 
      inn: "304841264",
      naimenovanie: "MUXAMMADZOXID YANGIYER mas'uliyati cheklangan jamiyati",
      yuridicheskiyAdres: "Sirdaryo viloyati Yangiver shahri Paxtakor ko'chasi 15-uy",
      telefon: "+998 67 789 34 56"
    }
  ];

  return (
    <div className="w-full p-6 bg-white">
      <div className="bg-white border border-gray-300 rounded-lg shadow-sm overflow-hidden">
        {/* Header */}
        <div className="bg-blue-50 p-4 border-b border-gray-300">
          <h2 className="text-lg font-semibold text-gray-800 text-center">
            Производства промышленной продукции (товаров) в разрезе предприятий
          </h2>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-300">
                <th className="px-3 py-3 text-left font-medium text-gray-700 border-r border-gray-300 min-w-[100px]">
                  Код СКП
                </th>
                <th className="px-3 py-3 text-left font-medium text-gray-700 border-r border-gray-300 min-w-[200px]">
                  Наименование продукция
                </th>
                <th className="px-3 py-3 text-left font-medium text-gray-700 border-r border-gray-300 min-w-[120px]">
                  Область
                </th>
                <th className="px-3 py-3 text-left font-medium text-gray-700 border-r border-gray-300 min-w-[100px]">
                  ОКПО
                </th>
                <th className="px-3 py-3 text-left font-medium text-gray-700 border-r border-gray-300 min-w-[120px]">
                  ИНН
                </th>
                <th className="px-3 py-3 text-left font-medium text-gray-700 border-r border-gray-300 min-w-[200px]">
                  Наименование
                </th>
                <th className="px-3 py-3 text-left font-medium text-gray-700 border-r border-gray-300 min-w-[250px]">
                  Юридический адрес*
                </th>
                <th className="px-3 py-3 text-left font-medium text-gray-700 min-w-[120px]">
                  Телефон*
                </th>
              </tr>
            </thead>
            <tbody>
              {data.map((row, index) => (
                <tr key={index} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="px-3 py-3 border-r border-gray-200 align-top">
                    {row.kodSKP}
                  </td>
                  <td className="px-3 py-3 border-r border-gray-200 align-top">
                    {row.naimenovanieProdukciya}
                  </td>
                  <td className="px-3 py-3 border-r border-gray-200 align-top">
                    {row.oblast}
                  </td>
                  <td className="px-3 py-3 border-r border-gray-200 align-top">
                    {row.okpo}
                  </td>
                  <td className="px-3 py-3 border-r border-gray-200 align-top">
                    {row.inn}
                  </td>
                  <td className="px-3 py-3 border-r border-gray-200 align-top">
                    {row.naimenovanie}
                  </td>
                  <td className="px-3 py-3 border-r border-gray-200 align-top">
                    {row.yuridicheskiyAdres}
                  </td>
                  <td className="px-3 py-3 align-top">
                    {row.telefon}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default IndustryStep3;
import { Download } from "lucide-react";
import type { Contract, FormData } from "./types";

interface Props {
  contracts: Contract[] | null;
  formData: FormData;
  handleInputChange: (field: keyof FormData, value: string) => void;
  isFormValid: () => boolean;
  handleSubmit: () => void;
  isAgreed: boolean;
  setIsAgreed: (v: boolean) => void;
  tabName: { name?: string; contract?: boolean } | null;
}

/** Q-01: PersonalCabinet.tsx dan ajratilgan bo'lim. */
export default function ContractsTab({ contracts, formData, handleInputChange, isFormValid, handleSubmit, isAgreed, setIsAgreed, tabName }: Props) {
  return (
    (tabName?.contract ? (
      <div className="p-6 bg-white shadow-lg rounded-lg">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
          Shartnoma
        </h2>

        <div className="space-y-4">
          {/* STIR */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Korxona STIRi <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.stir}
              onChange={(e) =>
                handleInputChange("stir", e.target.value)
              }
              placeholder="STIR raqamini kiriting"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Korxona nomi */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Korxona nomi <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.companyName}
              onChange={(e) =>
                handleInputChange("companyName", e.target.value)
              }
              placeholder="Korxona nomini kiriting"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Direktor F.I.Sh */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Direktor F.I.Sh{" "}
              <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.directorName}
              onChange={(e) =>
                handleInputChange("directorName", e.target.value)
              }
              placeholder="Direktor familiya, ism, sharifini kiriting"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Manzil */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Manzil <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.address}
              onChange={(e) =>
                handleInputChange("address", e.target.value)
              }
              placeholder="To'liq manzilni kiriting"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Telefon raqam */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Telefon raqam <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              value={formData.phoneNumber}
              onChange={(e) =>
                handleInputChange("phoneNumber", e.target.value)
              }
              placeholder="+998 XX XXX XX XX"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Xizmat shartlari */}
        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">
            Xizmat ko'rsatish shartlari
          </h3>
          <div className="text-sm text-gray-600 space-y-2">
            <p>• To'lov xizmati 24/7 faol holda ishlaydi</p>
            <p>• Tranzaksiya uchun 0.5% komissiya olinadi</p>
            <p>
              • To'lov ma'lumotlari xavfsizlik standartlariga
              muvofiq saqlanadi
            </p>
            <p>
              • Noto'g'ri ma'lumotlar uchun javobgarlik mijoz
              zimmasida
            </p>
            <p>
              • Xizmat shartlari o'zgarishi mumkin, mijozlar
              oldindan xabardor qilinadi
            </p>
            <p>• Texnik yordam 24/7 mavjud</p>
          </div>
        </div>

        {/* Checkbox */}
        <div className="mt-6 flex items-start space-x-3">
          <input
            id="agreement"
            type="checkbox"
            checked={isAgreed}
            onChange={(e) => setIsAgreed(e.target.checked)}
            className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label
            htmlFor="agreement"
            className="text-sm text-gray-700"
          >
            Men yuqoridagi xizmat ko'rsatish shartlariga roziman va
            ularni to'liq o'qib chiqqanman
          </label>
        </div>

        {/* Submit button */}
        <div className="mt-8">
          <button
            onClick={handleSubmit}
            disabled={!isFormValid()}
            className={`w-full py-3 px-4 rounded-md font-medium transition-colors ${isFormValid()
                ? "bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
          >
            ERI bilan tasdiqlash
          </button>
        </div>

        {/* Form validation status */}
        {!isFormValid() && (
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-500">
              Anketa yuborish uchun barcha maydonlarni to'ldiring va
              shartlarga rozilik bering
            </p>
          </div>
        )}
      </div>
    ) : (
      <div className="p-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          Shartnomalar
        </h2>

        <div className="space-y-4">
          {Array.isArray(contracts) && contracts.map((contract: Contract) => {
            const buyer = contract.didox_contract_data?.pending_document?.document_json?.buyer;
            const seller = contract.didox_contract_data?.pending_document?.document_json?.seller;
            const document = contract.didox_contract_data?.pending_document?.document_json?.document;
            const contractDoc = contract.didox_contract_data?.pending_document?.document_json?.contractdoc;
            const contractUrl = contract.contract_url ?? undefined;
            return (
              <div
                key={contract.id}
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm"
              >
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
                      {contractDoc?.contractno || contract.contract_number}
                    </h3>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium mr-2 ${contract.status === "created"
                        ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400"
                        : contract.status === "active"
                          ? "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
                          : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                      }`}>
                      {contract.status}
                    </span>
                  </div>
                  <a href={contractUrl} target="_blank" rel="noopener noreferrer" className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg flex items-center gap-1">
                    <Download className="w-4 h-4" />
                    <span className="text-xs">Yuklab olish</span>
                  </a>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-300"><span className="font-semibold">Boshlanish:</span> {contract.start_date?.slice(0, 10)}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-300"><span className="font-semibold">Tugash:</span> {contract.end_date?.slice(0, 10)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-300"><span className="font-semibold">Hujjat nomi:</span> {document?.documentname}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-300"><span className="font-semibold">Hujjat raqami:</span> {document?.documentno}</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-700 dark:text-gray-200 font-semibold mb-1">Xaridor:</p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">{buyer?.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{buyer?.address}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-700 dark:text-gray-200 font-semibold mb-1">Sotuvchi:</p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">{seller?.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{seller?.address}</p>
                  </div>
                </div>
                {contract.notes && (
                  <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    <span className="font-semibold">Izoh:</span> {contract.notes}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    ))
  );
}

import React, { useState, useEffect } from 'react';
import { Building2, Factory, Zap, Droplets } from 'lucide-react';
import IndustryStep1 from '../components/IndustryStep1';
import { getIndustryCategories, IndustryCategory, getIndustrialProductsByCategory, DetailedIndustrialProduct } from '../api/industrialProducts';
import { useServiceId } from '../utils/useServiceId';
import CompanyScoreBadge from '../components/company-score/CompanyScoreBadge';
import { useCompanyScores } from '../api/companyScores';
import { useLang } from '../i18n/LangContext';

const PAGE_SIZE = 20;

/** Daraxtdan toifani topish (ikkinchi va uchinchi daraja ham). */
function findCategory(list: IndustryCategory[], id: number): IndustryCategory | undefined {
  for (const c of list) {
    if (c.id === id) return c;
    const hit = findCategory(c.children ?? [], id);
    if (hit) return hit;
  }
  return undefined;
}

/** Ishlab chiqaruvchisi bor toifalar (bo'sh toifalar yashiriladi). */
const nonEmpty = (list: IndustryCategory[]) => list.filter((c) => (c.product_count ?? 1) > 0);

const Industry: React.FC = () => {
  const { serviceId } = useServiceId(); // get real ID from API
  const { lang } = useLang();
  // Toifa nomi tanlangan tilda (ilgari doim ruscha chiqardi)
  const catName = (c?: IndustryCategory | null) =>
    (lang === 'ru' ? c?.name_ru : lang === 'cry' ? (c?.name_cry ?? c?.name_cyr) : c?.name_uz) || c?.name_uz || c?.name_ru || '';

  // Component unmount bo'lganda localStorage'ni tozalash
  useEffect(() => {
    return () => {
      localStorage.removeItem("industry_currentStep");
    };
  }, []);

  // Step management (persisted in localStorage)
  const getInitialStep = () => {
    const saved = localStorage.getItem("industry_currentStep");
    if (saved === "2" || saved === "3") return Number(saved) as 2 | 3;
    return 1;
  };

  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(getInitialStep());

  // API state
  const [industryCategories, setIndustryCategories] = useState<IndustryCategory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 2 state
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedParent, setSelectedParent] = useState<IndustryCategory | null>(null);
  const [expandedParent, setExpandedParent] = useState<number | null>(null);

  // Step 3 state
  const [industrialProducts, setIndustrialProducts] = useState<DetailedIndustrialProduct[]>([]);
  // Sahifadagi barcha ishlab chiqaruvchilar uchun bitta batch so'rov (KR-34)
  const scores = useCompanyScores(industrialProducts.map((p) => p.inn).filter(Boolean) as string[]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productsError, setProductsError] = useState<string | null>(null);
  const [totalProducts, setTotalProducts] = useState(0);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');

  // Fetch industry categories from API
  const fetchIndustryCategories = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const categories = await getIndustryCategories();

      if (Array.isArray(categories) && categories.length > 0) {
        // Filter only parent categories (those without parent)
        const parentCategories = categories.filter(item => item.parent === null && (item.product_count ?? 1) > 0);
        setIndustryCategories(parentCategories);
      } else {
        console.warn('⚠️ No categories found or invalid response');
        setIndustryCategories([]);
      }
    } catch (err) {
      setError('Ma\'lumotlarni yuklashda xato yuz berdi');
      console.error('❌ Error fetching industry categories:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch data when component loads on step 2
  useEffect(() => {
    if (currentStep === 2 && industryCategories.length === 0) {
      fetchIndustryCategories();
    }
  }, [currentStep, industryCategories.length]);

  // Step navigation functions
  const goToNextStep = () => {
    if (currentStep < 3) {
      const nextStep = (currentStep + 1) as 1 | 2 | 3;

      // If going to Step 3, fetch industrial products
      if (nextStep === 3 && selectedCategory) {
        setSearch('');
        fetchIndustrialProducts(Number(selectedCategory), 0, '');
      }

      setCurrentStep(nextStep);
      localStorage.setItem("industry_currentStep", String(nextStep));
    }
  };

  const goToPreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => {
        const prevStep = (prev - 1) as 1 | 2 | 3;
        localStorage.setItem("industry_currentStep", String(prevStep));
        return prevStep;
      });
    }
  };



  // Fetch industrial products for Step 3
  const fetchIndustrialProducts = async (categoryId: number, pageIndex = 0, query = search) => {
    try {
      setProductsLoading(true);
      setProductsError(null);
      setPage(pageIndex);

      const response = await getIndustrialProductsByCategory(categoryId, {
        limit: PAGE_SIZE, offset: pageIndex * PAGE_SIZE, search: query.trim(), lang,
      });

      setIndustrialProducts(response.results);
      setTotalProducts(response.count);
    } catch (err) {
      setProductsError('Korxonalar ma\'lumotlarini yuklashda xato yuz berdi');
      console.error('❌ Error fetching industrial products:', err);
    } finally {
      setProductsLoading(false);
    }
  };

  // Keep localStorage in sync if currentStep changes elsewhere
  useEffect(() => {
    localStorage.setItem("industry_currentStep", String(currentStep));
  }, [currentStep]);





  const getCategoryIcon = (product: IndustryCategory) => {
    const text = [
      product.name_ru,
      product.name_uz
    ].filter(Boolean).join(' ').toLowerCase();

    if (text.includes('tog') || text.includes('kon') || text.includes('горно') || text.includes('геоло')) {
      return <Building2 className="w-5 h-5" />;
    } else if (text.includes('qayta') || text.includes('ishlash') || text.includes('перераб') || text.includes('производ')) {
      return <Factory className="w-5 h-5" />;
    } else if (text.includes('elektr') || text.includes('gaz') || text.includes('электр') || text.includes('энерг')) {
      return <Zap className="w-5 h-5" />;
    } else if (text.includes('suv') || text.includes('kanalizat') || text.includes('водопров') || text.includes('водосн')) {
      return <Droplets className="w-5 h-5" />;
    }
    return <Building2 className="w-5 h-5" />;
  };

  // Step Progress Bar
  const StepProgress = () => (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
      <div className="flex items-center justify-between">
        {[1, 2, 3].map((step) => (
          <div key={step} className="flex items-center">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                currentStep >= step
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-500"
              }`}
            >
              {step}
            </div>
            <div
              className={`ml-3 text-sm font-medium ${
                currentStep >= step ? "text-blue-600" : "text-gray-500"
              }`}
            >
              {step === 1
                ? "Xizmat haqida"
                : step === 2
                ? "Yo'nalish tanlash"
                : "Statistika"}
            </div>
            {step < 3 && (
              <div
                className={`w-16 h-1 mx-4 ${
                  currentStep > step ? "bg-blue-600" : "bg-gray-200"
                }`}
              ></div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  const Step2 = () => (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="p-6">
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-gray-800">
                Sanoat bo'limini tanlang
              </h1>
              <button
                onClick={goToPreviousStep}
                className="flex items-center text-blue-600 hover:text-blue-700"
              >
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
                Orqaga
              </button>
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span className="text-slate-600">Ma'lumotlar yuklanmoqda...</span>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="text-red-600 mb-2">⚠️</div>
                <p className="text-red-600">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Qayta urinish
                </button>
              </div>
            </div>
          ) : industryCategories.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="text-gray-400 mb-2">📋</div>
                <p className="text-gray-600">Hech qanday sanoat kategoriyasi topilmadi</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-sm text-gray-600 mb-4 flex items-center gap-2">
                <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Topilgan kategoriyalar: {industryCategories.length} ta asosiy yo'nalish
              </div>

              {industryCategories.map((parentCategory: IndustryCategory) => (
                <div key={parentCategory.id} className="border rounded-lg overflow-hidden">
                  {/* Parent Category Header */}
                  <div
                    onClick={() => {
                      if (expandedParent === parentCategory.id) {
                        setExpandedParent(null);
                      } else {
                        setExpandedParent(parentCategory.id);
                      }
                    }}
                    className={`p-4 cursor-pointer transition-all duration-200 hover:bg-gray-50 ${
                      expandedParent === parentCategory.id ? 'bg-blue-50 border-b' : 'bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="text-2xl">
                          {getCategoryIcon(parentCategory)}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-800 text-lg">
                            {catName(parentCategory)}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {nonEmpty(parentCategory.children ?? []).length} ta kategoriya · {(parentCategory.product_count ?? 0).toLocaleString('ru-RU')} ta korxona
                          </p>
                        </div>
                      </div>
                      <svg
                        className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${
                          expandedParent === parentCategory.id ? 'rotate-90' : ''
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>

                  {/* Children Categories */}
                  {expandedParent === parentCategory.id && parentCategory.children && (
                    <div className="bg-gray-50 p-2">
                      <div className="space-y-2">
                        {nonEmpty(parentCategory.children).map((child: IndustryCategory) => (
                          <div
                            key={child.id}
                            onClick={() => {
                              setSelectedCategory(child.id.toString());
                              setSelectedParent(parentCategory);
                            }}
                            className={`p-3 ml-6 bg-white rounded border cursor-pointer transition-all hover:shadow-sm ${
                              selectedCategory === child.id.toString()
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-200 hover:border-blue-300'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="font-medium text-gray-800">
                                  {catName(child)}
                                </h4>
                                <p className="text-xs text-gray-500 mt-1">
                                  {(child.product_count ?? 0).toLocaleString('ru-RU')} ta korxona
                                  {nonEmpty(child.children ?? []).length > 0 && ` · ${nonEmpty(child.children).length} ta sub-kategoriya`}
                                </p>
                              </div>
                              {selectedCategory === child.id.toString() && (
                                <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              )}
                            </div>
                            {/* Quyi toifa: tanlangan toifa ichidan torroq tanlash */}
                            {(selectedCategory === child.id.toString() || nonEmpty(child.children ?? []).some((g) => g.id.toString() === selectedCategory))
                              && nonEmpty(child.children ?? []).length > 0 && (
                              <div className="mt-3 flex flex-wrap gap-2" onClick={(e) => e.stopPropagation()}>
                                <button type="button" onClick={() => setSelectedCategory(child.id.toString())}
                                  className={`rounded-full border px-3 py-1 text-xs ${selectedCategory === child.id.toString() ? 'border-blue-600 bg-blue-600 text-white' : 'border-gray-300 text-gray-700'}`}>
                                  Hammasi
                                </button>
                                {nonEmpty(child.children).map((g) => (
                                  <button key={g.id} type="button" onClick={() => setSelectedCategory(g.id.toString())}
                                    className={`rounded-full border px-3 py-1 text-xs ${selectedCategory === g.id.toString() ? 'border-blue-600 bg-blue-600 text-white' : 'border-gray-300 text-gray-700'}`}>
                                    {catName(g)} ({(g.product_count ?? 0).toLocaleString('ru-RU')})
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {selectedCategory && selectedParent && (
            <>
              <div className="mt-6 p-6 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 text-green-700">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="font-medium">Tanlangan yo'nalish:</span>
                </div>
                <p className="mt-2 text-green-800 font-semibold">
                  {catName(selectedParent)}
                  {selectedCategory && (
                    <span className="text-gray-600">
                      {' → '}
                      {catName(findCategory(selectedParent.children ?? [], Number(selectedCategory)))}
                    </span>
                  )}
                </p>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={goToNextStep}
                  className="bg-mg-primary hover:bg-mg-primary-dark text-white font-medium py-3 px-8 rounded-lg transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 flex items-center gap-2"
                >
                  <span>Keyingisi</span>
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );



  return (
    <div className="">
      <StepProgress />

      <div className="mt-8">
        {currentStep === 1 && <IndustryStep1 onNext={goToNextStep} serviceId={serviceId} />}
        {currentStep === 2 && <Step2 />}
        {currentStep === 3 && (
          <div className="w-full">
            <div className="mb-6 flex justify-between items-center">
              <button
                onClick={goToPreviousStep}
                className="flex items-center text-blue-600 hover:text-blue-700"
              >
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
                Orqaga
              </button>
            </div>
            <div className="space-y-8">
              <div className="bg-white rounded-lg shadow-lg">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">Korxonalar ro'yxati</h2>
                      <p className="text-gray-600 mt-1">
                        {selectedParent && selectedCategory && (
                          <>
                            <span className="font-medium">{catName(selectedParent)}</span>
                            <span className="text-gray-400 mx-2">→</span>
                            <span className="text-blue-600">
                              {catName(findCategory(selectedParent.children ?? [], Number(selectedCategory)))}
                            </span>
                          </>
                        )}
                      </p>
                    </div>
                    {totalProducts > 0 && (
                      <div className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                        Jami: {totalProducts} ta korxona
                      </div>
                    )}
                  </div>

                  <form className="mb-4 flex gap-2" onSubmit={(e) => { e.preventDefault(); if (selectedCategory) fetchIndustrialProducts(Number(selectedCategory), 0, search); }}>
                    <label htmlFor="industry-search" className="sr-only">Korxona nomi yoki STIR bo'yicha qidirish</label>
                    <input id="industry-search" type="search" value={search} onChange={(e) => setSearch(e.target.value)}
                      placeholder="Korxona nomi yoki STIR bo'yicha qidirish"
                      className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm" />
                    <button type="submit" className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700">Qidirish</button>
                  </form>

                  {productsLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="flex items-center space-x-3">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        <span className="text-gray-600 text-lg">Korxonalar yuklanmoqda...</span>
                      </div>
                    </div>
                  ) : productsError ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="text-center">
                        <div className="text-red-500 text-4xl mb-4">⚠️</div>
                        <p className="text-red-600 text-lg">{productsError}</p>
                        <button
                          onClick={() => selectedCategory && fetchIndustrialProducts(Number(selectedCategory), page)}
                          className="mt-4 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                        >
                          Qayta urinish
                        </button>
                      </div>
                    </div>
                  ) : industrialProducts.length === 0 ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="text-center">
                        <div className="text-gray-400 text-4xl mb-4">🏢</div>
                        <p className="text-gray-600 text-lg">Bu kategoriyada korxonalar topilmadi</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {industrialProducts.map((product) => (
                        <div key={product.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {/* Company Info */}
                            <div className="lg:col-span-2">
                              <h3 className="font-semibold text-lg text-gray-900 mb-2 flex flex-wrap items-center gap-2">
                                {product.name}
                                {/* KORXONA_SCORING.md KR-35: ishlab chiqaruvchi korxona bali */}
                                <CompanyScoreBadge score={scores[product.inn]} to={`/company/${product.inn}`} />
                              </h3>
                              <div className="space-y-2 text-sm">
                                <div className="flex items-start gap-2">
                                  <span className="text-gray-500 font-medium min-w-[80px]">Manzil:</span>
                                  <span className="text-gray-700">{product.adress}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-gray-500 font-medium min-w-[80px]">Hudud:</span>
                                  <span className="text-gray-700">{product.soato}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-gray-500 font-medium min-w-[80px]">Telefon:</span>
                                  <span className="text-blue-600">{product.phone}</span>
                                </div>
                              </div>
                            </div>

                            {/* Technical Info */}
                            <div className="space-y-3">
                              <div className="bg-gray-50 p-3 rounded-lg">
                                <h4 className="font-medium text-gray-800 mb-2">SKP Ma'lumotlari</h4>
                                <div className="text-sm space-y-1">
                                  <div><span className="font-medium">Kod:</span> {product.skp.code}</div>
                                  <div><span className="font-medium">Nom:</span> {product.skp.name}</div>
                                </div>
                              </div>

                              <div className="bg-blue-50 p-3 rounded-lg">
                                <h4 className="font-medium text-gray-800 mb-2">Identifikatorlar</h4>
                                <div className="text-sm space-y-1">
                                  <div><span className="font-medium">OKPO:</span> {product.okpo}</div>
                                  <div><span className="font-medium">INN:</span> {product.inn}</div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {totalProducts > PAGE_SIZE && (
                    <nav aria-label="Sahifalash" className="mt-6 flex items-center justify-between gap-3">
                      <button type="button" disabled={page === 0 || productsLoading}
                        onClick={() => selectedCategory && fetchIndustrialProducts(Number(selectedCategory), page - 1)}
                        className="rounded-lg border border-gray-300 px-4 py-2 text-sm disabled:opacity-40">← Oldingi</button>
                      <span className="text-sm text-gray-600">
                        {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, totalProducts)} / {totalProducts.toLocaleString('ru-RU')}
                      </span>
                      <button type="button" disabled={(page + 1) * PAGE_SIZE >= totalProducts || productsLoading}
                        onClick={() => selectedCategory && fetchIndustrialProducts(Number(selectedCategory), page + 1)}
                        className="rounded-lg border border-gray-300 px-4 py-2 text-sm disabled:opacity-40">Keyingi →</button>
                    </nav>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Industry;

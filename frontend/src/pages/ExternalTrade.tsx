import { useEffect, useState } from 'react';
import ServiceInfoStep from '../components/ServiceInfoStep';
import ServiceSettingsStep from '../components/ServiceSettingsStep';
import ServiceResultsStep from '../components/ServiceResultsStep';
import { getRequest, postRequest } from '../api/request';
import { countries_api, country_groups_api, years_api, regions_api, product_categories_api, product_subcategories_api, product_products_api, sitc1_api, sitc2_api, sitc3_api, sitc4_api, post_get_data_api } from '../api/apiUrls';
import { useServiceId } from '../utils/useServiceId';
import RatingModal from '../components/modals/RatingModal';
import { createRating } from '../api/rating';
import type { ApiTradeData, HeaderItem, TradeDataItem } from '../components/ServiceResultsStep';

/** trade-data/ POST so'rovi: filtr ro'yxatlari va bir nechta skalyar maydon */
type TradeQueryPayload = { [key: string]: (string | number)[] | string | number | undefined } & {
  countries?: (string | number)[];
  regions?: (string | number)[];
  country_groups?: (string | number)[];
};

interface OptionType {
  value: string | number;
  label: string;
}

interface ApiResponseType {
  country_group?: string,
  country_group_name?: string,
  ctrana?: string,
  id: number,
  kod_kont?: string,
  name?: string,
  name_cry?: string,
  name_en?: string,
  name_ru?: string,
  name_uz?: string,
  code?: string,
  level?: number,
  level_display?: string,
  parent?: number | null,
  year?: number,
}

type StepType = 'info' | 'settings' | 'results';

const ExternalTrade = () => {
  const { serviceId } = useServiceId(); // get real ID from API

  // UI State
  const [currentStep, setCurrentStep] = useState<StepType>('info');
  const [isMainOptionsExpanded, setIsMainOptionsExpanded] = useState(true);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [isAdditionalOptionsExpanded, setIsAdditionalOptionsExpanded] = useState(true);
  const [isCommodityClassExpanded, setIsCommodityClassExpanded] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isHsExpanded, setIsHsExpanded] = useState(true);
  const [isSitcExpanded, setIsSitcExpanded] = useState(false);

  // Form State
  const [tradeFlows, setTradeFlows] = useState<OptionType[]>([{ value: 1, label: 'Eksport' }]);
  const [selectedYear, setSelectedYear] = useState<OptionType[]>([{ value: 2022, label: '2022' }]);
  const [isYearEnabled, setIsYearEnabled] = useState(true);
  const [selectedQuarter, setSelectedQuarter] = useState<OptionType[]>([]);
  const [isQuarterEnabled, setIsQuarterEnabled] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<OptionType[]>([{ value: 'M1', label: 'Yanvar' }]);
  const [isMonthEnabled, setIsMonthEnabled] = useState(true);
  const [cumulativeSum, setCumulativeSum] = useState(false);
  const [measurementUnit, setMeasurementUnit] = useState<OptionType[]>([{ value: 'thousand', label: 'Ming AQSh dollari' }]);
  const [countryGroups, setCountryGroups] = useState<OptionType[]>([]);
  const [country, setCountry] = useState<OptionType[]>([{ value: 'global', label: 'Global' }]);
  const [regions, setRegions] = useState<OptionType[]>([]);
  const [isHsSectionEnabled, setIsHsSectionEnabled] = useState(true);
  const [hsSection, setHsSection] = useState<OptionType[]>([
    { value: '13', label: 'XIII Articles of stone, plaster, cement, asbestos, mica or similar materials; ceramic products; glass and glassware' },
    { value: '14', label: 'XIV Natural or cultured pearls, precious or semi-precious stones, precious metals, metals clad with precious metal and articles thereof; imitation jewellery; coin' },
  ]);
  const [isHs2Enabled, setIsHs2Enabled] = useState(false);
  const [hs2, setHs2] = useState<OptionType[]>([]);
  const [isHs4Enabled, setIsHs4Enabled] = useState(false);
  const [hs4, setHs4] = useState<OptionType[]>([]);
  const [isHs6Enabled, setIsHs6Enabled] = useState(false);
  const [hs6, setHs6] = useState<OptionType[]>([]);
  const [isSitc1Enabled, setIsSitc1Enabled] = useState(false);
  const [sitc1, setSitc1] = useState<OptionType[]>([]);
  const [isSitc2Enabled, setIsSitc2Enabled] = useState(false);
  const [sitc2, setSitc2] = useState<OptionType[]>([]);
  const [isSitc3Enabled, setIsSitc3Enabled] = useState(false);
  const [sitc3, setSitc3] = useState<OptionType[]>([]);
  const [isSitc4Enabled, setIsSitc4Enabled] = useState(false);
  const [sitc4, setSitc4] = useState<OptionType[]>([]);

  // API response data state
  const [apiTradeData, setApiTradeData] = useState<ApiTradeData>({
    data: [],
    total: 0,
    filters: {},
    headers: [],
    units: [],
    missing: []
  });

  // Helper functions for mutual exclusivity
  const handleTradeFlowChange = (newTradeFlows: OptionType[]) => {
    // Only allow single selection
    if (newTradeFlows.length <= 1) {
      setTradeFlows(newTradeFlows);
    }
  };

  const handleQuarterChange = (newQuarters: OptionType[]) => {
    setSelectedQuarter(newQuarters);
    if (newQuarters.length > 0) {
      // Disable month when quarter is selected
      setIsMonthEnabled(false);
      setSelectedMonth([]);
    } else {
      // Enable month when no quarter is selected
      setIsMonthEnabled(true);
    }
  };

  const handleMonthChange = (newMonths: OptionType[]) => {
    setSelectedMonth(newMonths);
    if (newMonths.length > 0) {
      // Disable quarter when month is selected
      setIsQuarterEnabled(false);
      setSelectedQuarter([]);
    } else {
      // Enable quarter when no month is selected
      setIsQuarterEnabled(true);
    }
  };

  const handleHsChange = (enabled: boolean) => {
    if (enabled) {
      // Disable SITC when HS is enabled
      setIsSitc1Enabled(false);
      setIsSitc2Enabled(false);
      setIsSitc3Enabled(false);
      setIsSitc4Enabled(false);
      setSitc1([]);
      setSitc2([]);
      setSitc3([]);
      setSitc4([]);
    }
  };

  const handleSitcChange = (enabled: boolean) => {
    if (enabled) {
      // Disable HS when SITC is enabled
      setIsHsSectionEnabled(false);
      setIsHs2Enabled(false);
      setIsHs4Enabled(false);
      setIsHs6Enabled(false);
      setHsSection([]);
      setHs2([]);
      setHs4([]);
      setHs6([]);
    }
  };

  const handleCountryGroupChange = (newCountryGroups: OptionType[]) => {
    setCountryGroups(newCountryGroups);
    if (newCountryGroups.length > 0) {
      // Clear individual countries when country group is selected (set to global)
      setCountry([{ value: 'global', label: 'Global' }]);
    }
  };

  const handleCountryChange = (newCountries: OptionType[]) => {
    setCountry(newCountries);
    // Check if global is selected or countries are selected
    const hasGlobal = newCountries.some(c => c.value === 'global');
    const hasSpecificCountries = newCountries.some(c => c.value !== 'global');
    
    if (hasSpecificCountries && !hasGlobal) {
      // Clear country groups when specific individual countries are selected
      setCountryGroups([]);
    }
  };

  // Options for selects
  const tradeFlowOptions: OptionType[] = [
    // { value: 'Reexport', label: 'Qayta eksport' },
    { value: 1, label: 'Eksport' },
    { value: 2, label: 'Import' },
    // { value: 'Domestic Export', label: 'Ichki eksport' },
    // { value: 'Trade Turnover', label: 'Savdo aylanmasi' },
    // { value: 'Balance', label: 'Balans' },
  ];

  const quarterOptions: OptionType[] = [
    { value: 'Q1', label: 'I chorak' },
    { value: 'Q2', label: 'II chorak' },
    { value: 'Q3', label: 'III chorak' },
    { value: 'Q4', label: 'IV chorak' },
  ];

  const monthOptions: OptionType[] = [
    { value: 'M1', label: 'Yanvar' },
    { value: 'M2', label: 'Fevral' },
    { value: 'M3', label: 'Mart' },
    { value: 'M4', label: 'Aprel' },
    { value: 'M5', label: 'May' },
    { value: 'M6', label: 'Iyun' },
    { value: 'M7', label: 'Iyul' },
    { value: 'M8', label: 'Avgust' },
    { value: 'M9', label: 'Sentyabr' },
    { value: 'M10', label: 'Oktyabr' },
    { value: 'M11', label: 'Noyabr' },
    { value: 'M12', label: 'Dekabr' },
  ];

  const measurementOptions: OptionType[] = [
    { value: 'thousand', label: 'Ming AQSh dollari' },
    { value: 'million', label: 'Million AQSh dollari' }
  ];

  const [countryOptions, setCountryOptions] = useState<OptionType[]>([])
  const [countryLoading, setCountryLoading] = useState(false)
  const [hasMoreCountries, setHasMoreCountries] = useState(true)
  const [countryOffset, setCountryOffset] = useState(0)

  const [countryGroupOptions, setCountryGroupOptions] = useState<OptionType[]>([])
  const [countryGroupLoading, setCountryGroupLoading] = useState(false)
  const [hasMoreCountryGroups, setHasMoreCountryGroups] = useState(true)
  const [countryGroupOffset, setCountryGroupOffset] = useState(0)

  const [yearOptions, setYearOptions] = useState<OptionType[]>([])
  const [yearLoading, setYearLoading] = useState(false)
  const [hasMoreYears, setHasMoreYears] = useState(true)
  const [yearOffset, setYearOffset] = useState(0)

  const [regionsOptions, setRegionsOptions] = useState<OptionType[]>([])
  const [regionsLoading, setRegionsLoading] = useState(false)
  const [hasMoreRegions, setHasMoreRegions] = useState(true)
  const [regionsOffset, setRegionsOffset] = useState(0)

  const [hs2Options, setHs2Options] = useState<OptionType[]>([])
  const [hs2Loading, setHs2Loading] = useState(false)
  const [hasMoreHs2, setHasMoreHs2] = useState(true)
  const [originalHs2Data, setOriginalHs2Data] = useState<OptionType[]>([])

  const [hs4Options, setHs4Options] = useState<OptionType[]>([])
  const [hs4Loading, setHs4Loading] = useState(false)
  const [hasMoreHs4, setHasMoreHs4] = useState(true)
  const [originalHs4Data, setOriginalHs4Data] = useState<OptionType[]>([])

  const [hs6Options, setHs6Options] = useState<OptionType[]>([])
  const [hs6Loading, setHs6Loading] = useState(false)
  const [hasMoreHs6, setHasMoreHs6] = useState(true)
  const [originalHs6Data, setOriginalHs6Data] = useState<OptionType[]>([])

  // SITC states
  const [sitc1Options, setSitc1Options] = useState<OptionType[]>([])
  const [sitc1Loading, setSitc1Loading] = useState(false)
  const [hasMoreSitc1, setHasMoreSitc1] = useState(true)
  const [originalSitc1Data, setOriginalSitc1Data] = useState<OptionType[]>([])

  const [sitc2Options, setSitc2Options] = useState<OptionType[]>([])
  const [sitc2Loading, setSitc2Loading] = useState(false)
  const [hasMoreSitc2, setHasMoreSitc2] = useState(true)
  const [originalSitc2Data, setOriginalSitc2Data] = useState<OptionType[]>([])

  const [sitc3Options, setSitc3Options] = useState<OptionType[]>([])
  const [sitc3Loading, setSitc3Loading] = useState(false)
  const [hasMoreSitc3, setHasMoreSitc3] = useState(true)
  const [originalSitc3Data, setOriginalSitc3Data] = useState<OptionType[]>([])

  const [sitc4Options, setSitc4Options] = useState<OptionType[]>([])
  const [sitc4Loading, setSitc4Loading] = useState(false)
  const [hasMoreSitc4, setHasMoreSitc4] = useState(true)
  const [originalSitc4Data, setOriginalSitc4Data] = useState<OptionType[]>([])

  const loadCountries = async (offset = 0, isLoadMore = false, searchQuery = '') => {
    if (countryLoading) return;

    setCountryLoading(true);
    try {
      const searchParam = searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : '';
      const res = await getRequest(`${countries_api}?limit=10&offset=${offset}${searchParam}`);
      const response = res as {
        results: ApiResponseType[],
        next: string | null,
        count: number
      };

      const sortData = response.results?.map(item => ({
        value: String(item.ctrana ?? ''),
        label: item.name_uz ?? ''
      })) || [];

      // Add "Global" option only for first load (offset = 0) and not for search
      let finalData = sortData;
      if (offset === 0 && !searchQuery) {
        const globalOption = { value: 'global', label: 'Global' };
        finalData = [globalOption, ...sortData];
      }

      if (isLoadMore) {
        setCountryOptions(prev => [...prev, ...finalData]);
      } else {
        setCountryOptions(finalData);
      }

      setHasMoreCountries(!!response.next);
      setCountryOffset(offset + 10);
    } catch (err) {
      console.error(err);
    } finally {
      setCountryLoading(false);
    }
  };

  const loadAllCountries = async () => {
    if (countryLoading) return;

    setCountryLoading(true);
    try {
      const res = await getRequest(`${countries_api}?limit=1000`);
      const response = res as {
        results: ApiResponseType[],
        next: string | null,
        count: number
      };

      const sortData = response.results?.map(item => ({
        value: String(item.ctrana ?? ''),
        label: item.name_uz ?? ''
      })) || [];

      // Add "Global" option to all countries
      const globalOption = { value: 'global', label: 'Global' };
      const allCountries = [globalOption, ...sortData];

      setCountryOptions(allCountries);
      setCountry(allCountries); // Select all countries including global
      setHasMoreCountries(false);
    } catch (err) {
      console.error(err);
    } finally {
      setCountryLoading(false);
    }
  };

  const handleCountrySearch = (query: string) => {
    setCountryOffset(0);
    loadCountries(0, false, query);
  };

  const loadCountryGroups = async (offset = 0, isLoadMore = false, searchQuery = '') => {
    if (countryGroupLoading) return;

    setCountryGroupLoading(true);
    try {
      const searchParam = searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : '';
      const res = await getRequest(`${country_groups_api}?limit=10&offset=${offset}${searchParam}`);
      const response = res as {
        results: ApiResponseType[],
        next: string | null,
        count: number
      };

      const sortData = response.results?.map(item => ({
        value: String(item.id ?? ''),
        label: item.name_uz ?? ''
      })) || [];

      // Add "World Total" only for first load (offset = 0) and not for search
      let finalData = sortData;
      if (offset === 0 && !searchQuery) {
        const worldTotal = { value: 'World_Total', label: 'Dunyo, Jami' };
        finalData = [worldTotal, ...sortData];
      }

      if (isLoadMore) {
        setCountryGroupOptions(prev => [...prev, ...finalData]);
      } else {
        setCountryGroupOptions(finalData);
      }

      setHasMoreCountryGroups(!!response.next);
      setCountryGroupOffset(offset + 10);
    } catch (err) {
      console.error(err);
    } finally {
      setCountryGroupLoading(false);
    }
  };

  const loadAllCountryGroups = async () => {
    if (countryGroupLoading) return;

    setCountryGroupLoading(true);
    try {
      const res = await getRequest(`${country_groups_api}?limit=1000`);
      const response = res as {
        results: ApiResponseType[],
        next: string | null,
        count: number
      };

      const sortData = response.results?.map(item => ({
        value: String(item.id ?? ''),
        label: item.name_uz ?? ''
      })) || [];

      // Add "World Total" to country groups
      const worldTotal = { value: 'World_Total', label: 'Dunyo, Jami' };
      const allCountryGroups = [worldTotal, ...sortData];

      setCountryGroupOptions(allCountryGroups);
      setCountryGroups(allCountryGroups); // Select all country groups
      setHasMoreCountryGroups(false);
    } catch (err) {
      console.error(err);
    } finally {
      setCountryGroupLoading(false);
    }
  };

  const handleCountryGroupSearch = (query: string) => {
    setCountryGroupOffset(0);
    loadCountryGroups(0, false, query);
  };

  const loadYears = async (offset = 0, isLoadMore = false, searchQuery = '') => {
    if (yearLoading) return;

    setYearLoading(true);
    try {
      const searchParam = searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : '';
      const res = await getRequest(`${years_api}?limit=10&offset=${offset}${searchParam}`);
      const response = res as {
        results: ApiResponseType[],
        next: string | null,
        count: number
      };

      const sortData = response.results?.map(item => ({
        value: item.year ?? '',
        label: String(item.year ?? '')
      })) || [];

      if (isLoadMore) {
        setYearOptions(prev => [...prev, ...sortData]);
      } else {
        setYearOptions(sortData);
      }

      setHasMoreYears(!!response.next);
      setYearOffset(offset + 10);
    } catch (err) {
      console.error(err);
    } finally {
      setYearLoading(false);
    }
  };

  const loadAllYears = async () => {
    if (yearLoading) return;

    setYearLoading(true);
    try {
      const res = await getRequest(`${years_api}?limit=1000`);
      const response = res as {
        results: ApiResponseType[],
        next: string | null,
        count: number
      };

      const sortData = response.results?.map(item => ({
        value: item.year ?? '',
        label: String(item.year ?? '')
      })) || [];

      setYearOptions(sortData);
      setSelectedYear(sortData); // Select all years
      setHasMoreYears(false);
    } catch (err) {
      console.error(err);
    } finally {
      setYearLoading(false);
    }
  };

  const handleYearSearch = (query: string) => {
    setYearOffset(0);
    loadYears(0, false, query);
  };

  const loadRegions = async (offset = 0, isLoadMore = false, searchQuery = '') => {
    if (regionsLoading) return;

    setRegionsLoading(true);
    try {
      const searchParam = searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : '';
      const res = await getRequest(`${regions_api}?limit=10&offset=${offset}${searchParam}`);
      const response = res as {
        results: ApiResponseType[],
        next: string | null,
        count: number
      };

      const sortData = response.results?.map(item => ({
        value: item.id ?? '',
        label: item.name_uz ?? item.name ?? ''
      })) || [];

      if (isLoadMore) {
        setRegionsOptions(prev => [...prev, ...sortData]);
      } else {
        setRegionsOptions(sortData);
      }

      setHasMoreRegions(!!response.next);
      setRegionsOffset(offset + 10);
    } catch (err) {
      console.error(err);
    } finally {
      setRegionsLoading(false);
    }
  };

  const loadAllRegions = async () => {
    if (regionsLoading) return;

    setRegionsLoading(true);
    try {
      const res = await getRequest(`${regions_api}?limit=1000`);
      const response = res as {
        results: ApiResponseType[],
        next: string | null,
        count: number
      };

      const sortData = response.results?.map(item => ({
        value: item.id ?? '',
        label: item.name_uz ?? item.name ?? ''
      })) || [];

      setRegionsOptions(sortData);
      setRegions(sortData); // Select all regions
      setHasMoreRegions(false);
    } catch (err) {
      console.error(err);
    } finally {
      setRegionsLoading(false);
    }
  };

  const handleRegionsSearch = (query: string) => {
    setRegionsOffset(0);
    loadRegions(0, false, query);
  };

  useEffect(() => {
    loadCountries(0, false);
    loadCountryGroups(0, false);
    loadYears(0, false);
    loadRegions(0, false);
    loadHs2();
    loadHs4();
    loadHs6();
    loadSitc1();
    loadSitc2();
    loadSitc3();
    loadSitc4();
  }, [])

  const hsSectionOptions: OptionType[] = [
    { value: '1', label: 'I Tirik hayvonlar; hayvon mahsulotlari' },
    { value: '2', label: 'II O\'simlik mahsulotlari' },
    { value: '3', label: 'III Hayvon yoki o\'simlik yog\'lari va moylar hamda ularning parchalanish mahsulotlari; tayyorlangan oziq-ovqat yog\'lari; hayvon yoki o\'simlik mumlari' },
    { value: '4', label: 'IV Tayyorlangan oziq-ovqat mahsulotlari; ichimliklar, spirtli ichimliklar va sirka; tamaki va tayyorlangan tamaki o\'rinbosarlari' },
    { value: '5', label: 'V Mineral mahsulotlar' },
    { value: '6', label: 'VI Kimyo yoki tegishli sanoat mahsulotlari' },
    { value: '7', label: 'VII Plastmassa va undan tayyorlangan buyumlar; kauchuk va undan tayyorlangan buyumlar' },
    { value: '8', label: 'VIII Xom teri va terisi, teri, mo\'ynali terisi va undan tayyorlangan buyumlar; egarlar va jabduqlar; sayohat buyumlari, sumkalar va shunga o\'xshash konteynerlar; hayvon ichak buyumlari (ipak qurti ichagidan tashqari)' },
    { value: '9', label: 'IX Yog\'och va yog\'ochdan tayyorlangan buyumlar; yog\'och ko\'mir; tiqin va tiqindan tayyorlangan buyumlar; somon, esparto yoki boshqa o\'rash materiallaridan tayyorlangan mahsulotlar; savatchilik va to\'quvchilik' },
    { value: '10', label: 'X Yog\'och yoki boshqa tolali tsellyuloza materiallarning pulpasi; qayta tiklangan (chiqindi va qoldiq) qog\'oz yoki karton; qog\'oz va karton hamda ulardan tayyorlangan buyumlar' },
    { value: '11', label: 'XI To\'qimachilik va to\'qimachilik buyumlari' },
    { value: '12', label: 'XII Oyoq kiyimlar, bosh kiyimlar, soyabonlar, quyosh soyabonlari, tayoqlar, o\'tirish tayoqlari, qamchi, ot qamchisi va ularning qismlari; tayyorlangan patlar va ulardan tayyorlangan buyumlar; sun\'iy gullar; inson sochidan tayyorlangan buyumlar' },
    { value: '13', label: 'XIII Tosh, gips, tsement, asbest, slyuda yoki shunga o\'xshash materiallardan tayyorlangan buyumlar; keramika mahsulotlari; shisha va shisha buyumlari' },
    { value: '14', label: 'XIV Tabiiy yoki madaniy marvaridlar, qimmatbaho yoki yarim qimmatbaho toshlar, qimmatbaho metallar, qimmatbaho metallar bilan qoplangan metallar va ulardan tayyorlangan buyumlar; imitatsiya zargarlik buyumlari; tanga' },
    { value: '15', label: 'XV Asosiy metallar va asosiy metallardan tayyorlangan buyumlar' },
    { value: '16', label: 'XVI Mashinalar va mexanik qurilmalar; elektr uskunalari; ularning qismlari; ovoz yozuvchi va takrorlash qurilmalari, televizor tasvir va ovoz yozuvchi va takrorlash qurilmalari hamda bunday buyumlarning qismlari va aksessuarlari' },
    { value: '17', label: 'XVII Transport vositalari, samolyotlar, kemalar va tegishli transport uskunalari' },
    { value: '18', label: 'XVIII Optik, fotografik, kinematografik, o\'lchash, tekshirish, aniqlik, tibbiy yoki jarrohlik asboblari va apparatlari; soatlar va soatlar; musiqa asboblari; ularning qismlari va aksessuarlari' },
    { value: '19', label: 'XIX Qurol va o\'q-dorilar; ularning qismlari va aksessuarlari' },
    { value: '20', label: 'XX Turli xil ishlab chiqarilgan buyumlar' },
    { value: '21', label: 'XXI San\'at asarlari, kolleksiya buyumlari va antiq buyumlar' },
  ];

  const loadHs2 = async () => {
    if (hs2Loading) return;

    setHs2Loading(true);
    try {
      const res = await getRequest(`${product_categories_api}`);
      const response = res as ApiResponseType[];

      const sortData = response?.map(item => ({
        value: item.id ?? '',
        label: `${item.code ?? ''} - ${item.name_uz ?? item.name ?? ''}`
      })) || [];

      setOriginalHs2Data(sortData); // Store original data
      setHs2Options(sortData);
      setHasMoreHs2(false); // No pagination needed
    } catch (err) {
      console.error(err);
    } finally {
      setHs2Loading(false);
    }
  };

  const loadAllHs2 = async () => {
    // Use already loaded data, don't make new API call
    if (originalHs2Data.length > 0) {
      setHs2(originalHs2Data); // Select all from original data
    } else {
      // If no data loaded yet, load first then select all
      await loadHs2();
      setHs2(originalHs2Data);
    }
  };

  const handleHs2Search = (query: string) => {
    // Always filter from original data, not current displayed data
    if (!query.trim()) {
      setHs2Options(originalHs2Data); // Show all original data
      return;
    }

    const filteredData = originalHs2Data.filter(item =>
      item.label.toLowerCase().includes(query.toLowerCase())
    );
    setHs2Options(filteredData);
  };

  const loadHs4 = async () => {
    if (hs4Loading) return;

    setHs4Loading(true);
    try {
      const res = await getRequest(`${product_subcategories_api}`);
      const response = res as ApiResponseType[];

      const sortData = response?.map(item => ({
        value: item.id ?? '',
        label: `${item.code ?? ''} - ${item.name_uz ?? item.name ?? ''}`
      })) || [];

      setOriginalHs4Data(sortData); // Store original data
      setHs4Options(sortData);
      setHasMoreHs4(false); // No pagination needed
    } catch (err) {
      console.error(err);
    } finally {
      setHs4Loading(false);
    }
  };

  const loadAllHs4 = async () => {
    // Use already loaded data, don't make new API call
    if (originalHs4Data.length > 0) {
      setHs4(originalHs4Data); // Select all from original data
    } else {
      // If no data loaded yet, load first then select all
      await loadHs4();
      setHs4(originalHs4Data);
    }
  };

  const handleHs4Search = (query: string) => {
    // Always filter from original data, not current displayed data
    if (!query.trim()) {
      setHs4Options(originalHs4Data); // Show all original data
      return;
    }

    const filteredData = originalHs4Data.filter(item =>
      item.label.toLowerCase().includes(query.toLowerCase())
    );
    setHs4Options(filteredData);
  };

  const loadHs6 = async () => {
    if (hs6Loading) return;

    setHs6Loading(true);
    try {
      const res = await getRequest(`${product_products_api}`);
      const response = res as ApiResponseType[];

      const sortData = response?.map(item => ({
        value: item.id ?? '',
        label: `${item.code ?? ''} - ${item.name_uz ?? item.name ?? ''}`
      })) || [];

      setOriginalHs6Data(sortData); // Store original data
      setHs6Options(sortData);
      setHasMoreHs6(false); // No pagination needed
    } catch (err) {
      console.error(err);
    } finally {
      setHs6Loading(false);
    }
  };

  const loadAllHs6 = async () => {
    // Use already loaded data, don't make new API call
    if (originalHs6Data.length > 0) {
      setHs6(originalHs6Data); // Select all from original data
    } else {
      // If no data loaded yet, load first then select all
      await loadHs6();
      setHs6(originalHs6Data);
    }
  };

  const handleHs6Search = (query: string) => {
    // Always filter from original data, not current displayed data
    if (!query.trim()) {
      setHs6Options(originalHs6Data); // Show all original data
      return;
    }

    const filteredData = originalHs6Data.filter(item =>
      item.label.toLowerCase().includes(query.toLowerCase())
    );
    setHs6Options(filteredData);
  };

  // SITC loading functions
  const loadSitc1 = async () => {
    if (sitc1Loading) return;

    setSitc1Loading(true);
    try {
      const res = await getRequest(`${sitc1_api}`);
      const response = res as ApiResponseType[];

      const sortData = response?.map(item => ({
        value: item.id ?? '',
        label: `${item.code ?? ''} - ${item.name_uz ?? item.name ?? ''}`
      })) || [];

      setOriginalSitc1Data(sortData); // Store original data
      setSitc1Options(sortData);
      setHasMoreSitc1(false); // No pagination needed
    } catch (err) {
      console.error(err);
    } finally {
      setSitc1Loading(false);
    }
  };

  const loadAllSitc1 = async () => {
    // Use already loaded data, don't make new API call
    if (originalSitc1Data.length > 0) {
      setSitc1(originalSitc1Data); // Select all from original data
    } else {
      // If no data loaded yet, load first then select all
      await loadSitc1();
      setSitc1(originalSitc1Data);
    }
  };

  const handleSitc1Search = (query: string) => {
    // Always filter from original data, not current displayed data
    if (!query.trim()) {
      setSitc1Options(originalSitc1Data); // Show all original data
      return;
    }

    const filteredData = originalSitc1Data.filter(item =>
      item.label.toLowerCase().includes(query.toLowerCase())
    );
    setSitc1Options(filteredData);
  };

  const loadSitc2 = async () => {
    if (sitc2Loading) return;

    setSitc2Loading(true);
    try {
      const res = await getRequest(`${sitc2_api}`);
      const response = res as ApiResponseType[];

      const sortData = response?.map(item => ({
        value: item.id ?? '',
        label: `${item.code ?? ''} - ${item.name_uz ?? item.name ?? ''}`
      })) || [];

      setOriginalSitc2Data(sortData); // Store original data
      setSitc2Options(sortData);
      setHasMoreSitc2(false); // No pagination needed
    } catch (err) {
      console.error(err);
    } finally {
      setSitc2Loading(false);
    }
  };

  const loadAllSitc2 = async () => {
    // Use already loaded data, don't make new API call
    if (originalSitc2Data.length > 0) {
      setSitc2(originalSitc2Data); // Select all from original data
    } else {
      // If no data loaded yet, load first then select all
      await loadSitc2();
      setSitc2(originalSitc2Data);
    }
  };

  const handleSitc2Search = (query: string) => {
    // Always filter from original data, not current displayed data
    if (!query.trim()) {
      setSitc2Options(originalSitc2Data); // Show all original data
      return;
    }

    const filteredData = originalSitc2Data.filter(item =>
      item.label.toLowerCase().includes(query.toLowerCase())
    );
    setSitc2Options(filteredData);
  };

  const loadSitc3 = async () => {
    if (sitc3Loading) return;

    setSitc3Loading(true);
    try {
      const res = await getRequest(`${sitc3_api}`);
      const response = res as ApiResponseType[];

      const sortData = response?.map(item => ({
        value: item.id ?? '',
        label: `${item.code ?? ''} - ${item.name_uz ?? item.name ?? ''}`
      })) || [];

      setOriginalSitc3Data(sortData); // Store original data
      setSitc3Options(sortData);
      setHasMoreSitc3(false); // No pagination needed
    } catch (err) {
      console.error(err);
    } finally {
      setSitc3Loading(false);
    }
  };

  const loadAllSitc3 = async () => {
    // Use already loaded data, don't make new API call
    if (originalSitc3Data.length > 0) {
      setSitc3(originalSitc3Data); // Select all from original data
    } else {
      // If no data loaded yet, load first then select all
      await loadSitc3();
      setSitc3(originalSitc3Data);
    }
  };

  const handleSitc3Search = (query: string) => {
    // Always filter from original data, not current displayed data
    if (!query.trim()) {
      setSitc3Options(originalSitc3Data); // Show all original data
      return;
    }

    const filteredData = originalSitc3Data.filter(item =>
      item.label.toLowerCase().includes(query.toLowerCase())
    );
    setSitc3Options(filteredData);
  };

  const loadSitc4 = async () => {
    if (sitc4Loading) return;

    setSitc4Loading(true);
    try {
      const res = await getRequest(`${sitc4_api}`);
      const response = res as ApiResponseType[];

      const sortData = response?.map(item => ({
        value: item.id ?? '',
        label: `${item.code ?? ''} - ${item.name_uz ?? item.name ?? ''}`
      })) || [];

      setOriginalSitc4Data(sortData); // Store original data
      setSitc4Options(sortData);
      setHasMoreSitc4(false); // No pagination needed
    } catch (err) {
      console.error(err);
    } finally {
      setSitc4Loading(false);
    }
  };

  const loadAllSitc4 = async () => {
    // Use already loaded data, don't make new API call
    if (originalSitc4Data.length > 0) {
      setSitc4(originalSitc4Data); // Select all from original data
    } else {
      // If no data loaded yet, load first then select all
      await loadSitc4();
      setSitc4(originalSitc4Data);
    }
  };

  const handleSitc4Search = (query: string) => {
    // Always filter from original data, not current displayed data
    if (!query.trim()) {
      setSitc4Options(originalSitc4Data); // Show all original data
      return;
    }

    const filteredData = originalSitc4Data.filter(item =>
      item.label.toLowerCase().includes(query.toLowerCase())
    );
    setSitc4Options(filteredData);
  };

  // Steps navigation
  const goToNext = () => {
    if (currentStep === 'info') {
      setCurrentStep('settings');
    } else if (currentStep === 'settings') {
      setCurrentStep('results');
    }
  };

  const goToPrevious = () => {
    if (currentStep === 'results') {
      setCurrentStep('settings');
    } else if (currentStep === 'settings') {
      setCurrentStep('info');
    }
  };

  // Handle get data
  const handleGetData = async () => {
    setIsLoading(true);
    try {
      // Build POST payload based on enabled fields
      const payload: TradeQueryPayload = {};

      // Set trade_type with default value of 1
      payload.trade_type = tradeFlows.length > 0 ? Number(tradeFlows[0].value) : 1;

      // Set years with default value of [2022]
      if (isYearEnabled && selectedYear.length > 0) {
        payload.years = selectedYear.map(item => Number(item.value));
      } else {
        payload.years = [2022];
      }

      // Handle months and quarters (mutually exclusive)
      if (isQuarterEnabled && selectedQuarter.length > 0) {
        payload.quarters = selectedQuarter.map(item => String(item.value));
        // Don't include months when quarters are selected
      } else if (isMonthEnabled && selectedMonth.length > 0) {
        payload.months = selectedMonth.map(item => String(item.value));
      } else {
        // Default to M1 if neither months nor quarters are selected
        payload.months = ['M1'];
      }

      // Set countries with default value of ['global']
      if (country.length > 0) {
        payload.countries = country.map(item => String(item.value));
      } else {
        payload.countries = ['global'];
      }

      // Add country groups (only if has values)
      if (countryGroups.length > 0) {
        payload.country_groups = countryGroups.map(item => String(item.value));
      }

      // Add regions (only if has values)
      if (regions.length > 0) {
        payload.regions = regions.map(item => String(item.value));
      }

      // Check if any HS codes are enabled and have values
      const hasHsCodes = (isHs2Enabled && hs2.length > 0) ||
                        (isHs4Enabled && hs4.length > 0) ||
                        (isHs6Enabled && hs6.length > 0);

      // Check if any SITC codes are enabled and have values
      const hasSitcCodes = (isSitc1Enabled && sitc1.length > 0) ||
                          (isSitc2Enabled && sitc2.length > 0) ||
                          (isSitc3Enabled && sitc3.length > 0) ||
                          (isSitc4Enabled && sitc4.length > 0);

      // Add HS codes (only if enabled and has values, and no SITC codes)
      if (hasHsCodes && !hasSitcCodes) {
        if (isHs2Enabled && hs2.length > 0) {
          payload.hs2_codes = hs2.map(item => String(item.value));
        }
        if (isHs4Enabled && hs4.length > 0) {
          payload.hs4_codes = hs4.map(item => String(item.value));
        }
        if (isHs6Enabled && hs6.length > 0) {
          payload.hs6_codes = hs6.map(item => String(item.value));
        }
      }

      // Add SITC codes (only if enabled and has values, and no HS codes)
      if (hasSitcCodes && !hasHsCodes) {
        if (isSitc1Enabled && sitc1.length > 0) {
          payload.sitc1_codes = sitc1.map(item => String(item.value));
        }
        if (isSitc2Enabled && sitc2.length > 0) {
          payload.sitc2_codes = sitc2.map(item => String(item.value));
        }
        if (isSitc3Enabled && sitc3.length > 0) {
          payload.sitc3_codes = sitc3.map(item => String(item.value));
        }
        if (isSitc4Enabled && sitc4.length > 0) {
          payload.sitc4_codes = sitc4.map(item => String(item.value));
        }
      }

      // Generate group_by based on available filters
      const groupByOptions = [];
      
      // Determine if countries is global
      const isGlobal = payload.countries.includes('global');
      
      // Add region if available
      if (payload.regions && payload.regions.length > 0) {
        groupByOptions.push('region');
      }
      
      // Add country or country_group based on what's available and global status
      if (!isGlobal && payload.countries && payload.countries.length > 0) {
        groupByOptions.push('country');
      } else if (isGlobal && payload.country_groups && payload.country_groups.length > 0) {
        groupByOptions.push('country_group');
      }
      
      // Add HS or SITC based on what's available
      if (hasHsCodes && !hasSitcCodes) {
        groupByOptions.push('hs');
      } else if (hasSitcCodes && !hasHsCodes) {
        groupByOptions.push('sitc');
      }
      
      // Only add group_by if there are options
      if (groupByOptions.length > 0) {
        payload.group_by = groupByOptions;
      }


      // Make POST API call
      const response = await postRequest<ApiTradeData>(post_get_data_api, payload);

      // Handle new API response format
      if (response.success && response.data) {
        // Store the complete API response with metadata
        setApiTradeData({
          data: response.data,
          total: response.total,
          filters: response.filters,
          headers: response.headers,
          units: response.units,
          missing: response.missing
        });
        
      } else {
        // Fallback for other formats
        console.warn('Unexpected API response format:', response);
        setApiTradeData({
          data: [],
          total: 0,
          filters: {},
          headers: [],
          units: [],
          missing: []
        });
      }

      // Automatically go to results step after data is loaded
      setCurrentStep('results');
    } catch (error) {
      console.error('Error fetching data:', error);
      // Still go to results step to show error state or empty data
      setCurrentStep('results');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle download data
  const handleDownloadData = () => {
    const dataToDownload = apiTradeData.data;

    // Create CSV content based on the data structure
    let csvContent = '';
    let headers = '';

    if (dataToDownload.length > 0) {
      // Use API headers if available, otherwise extract from first item
      if (apiTradeData.headers && apiTradeData.headers.length > 0) {
        headers = apiTradeData.headers.map((header: HeaderItem) => header.label).join(',');
      } else {
        const firstItem = dataToDownload[0];
        headers = Object.keys(firstItem).join(',');
      }

      // Create rows
      const rows = dataToDownload.map((row: TradeDataItem) =>
        Object.values(row).map(value =>
          typeof value === 'number' ? value.toLocaleString('en-US', { minimumFractionDigits: 1 }) : value
        ).join(',')
      ).join('\n');

      csvContent = `${headers}\n${rows}`;
    } else {
      // No data available
      csvContent = 'Ma\'lumot topilmadi / No data available';
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'export_data.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Show rating after download
    setTimeout(() => {
      setShowRatingModal(true);
    }, 1000);
  };

  const handleRatingSubmit = async (rating: number, comment: string) => {
    try {
      await createRating({
        service: serviceId || 9, // External Trade service ID
        value: rating,
        comment: comment || "Tashqi savdo statistikasi xizmati"
      });
      setShowRatingModal(false);
    } catch (error) {
      console.error('Rating submission error:', error);
      setShowRatingModal(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <div className="w-full mx-auto">
        {/* Header */}
        {/* <div className="mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Tashqi Savdo Tahlili</h1>
                <p className="text-gray-600">Savdo ma'lumotlari tahlili xizmati</p>
              </div>
              <div className="flex items-center space-x-3">
                <div className="bg-blue-50 p-3 rounded-lg">
                  <Filter className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>
          </div>
        </div> */}

        {/* Steps Navigation */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            {['info', 'settings', 'results'].map((step, index) => {
              const stepNum = index + 1;
              const isActive = currentStep === step;
              const isCompleted =
                (step === 'info' && (currentStep === 'settings' || currentStep === 'results')) ||
                (step === 'settings' && currentStep === 'results');

              return (
                <div key={step} className="flex items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${isActive || isCompleted
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-500"
                      }`}
                  >
                    {stepNum}
                  </div>
                  <div
                    className={`ml-3 text-sm font-medium ${isActive || isCompleted ? "text-blue-600" : "text-gray-500"
                      }`}
                  >
                    {step === 'info'
                      ? "Xizmat haqida"
                      : step === 'settings'
                        ? "Sozlamalar"
                        : "Natija"}
                  </div>
                  {index < 2 && (
                    <div
                      className={`w-16 h-1 mx-4 ${isCompleted || (isActive && index === 0)
                        ? "bg-blue-600"
                        : "bg-gray-200"
                        }`}
                    ></div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Step Content */}
        {currentStep === 'info' && (
          <ServiceInfoStep onNext={goToNext} serviceId={serviceId} />
        )}

        {currentStep === 'settings' && (
          <ServiceSettingsStep
            onNext={goToNext}
            onPrevious={goToPrevious}
            onGetData={handleGetData}
            isLoading={isLoading}
            // Pass all form states
            isMainOptionsExpanded={isMainOptionsExpanded}
            setIsMainOptionsExpanded={setIsMainOptionsExpanded}
            isAdditionalOptionsExpanded={isAdditionalOptionsExpanded}
            setIsAdditionalOptionsExpanded={setIsAdditionalOptionsExpanded}
            isCommodityClassExpanded={isCommodityClassExpanded}
            setIsCommodityClassExpanded={setIsCommodityClassExpanded}
            isHsExpanded={isHsExpanded}
            setIsHsExpanded={setIsHsExpanded}
            isSitcExpanded={isSitcExpanded}
            setIsSitcExpanded={setIsSitcExpanded}
            tradeFlows={tradeFlows}
            setTradeFlows={setTradeFlows}
            selectedYear={selectedYear}
            setSelectedYear={setSelectedYear}
            isYearEnabled={isYearEnabled}
            setIsYearEnabled={setIsYearEnabled}
            selectedQuarter={selectedQuarter}
            setSelectedQuarter={setSelectedQuarter}
            isQuarterEnabled={isQuarterEnabled}
            setIsQuarterEnabled={setIsQuarterEnabled}
            selectedMonth={selectedMonth}
            setSelectedMonth={setSelectedMonth}
            isMonthEnabled={isMonthEnabled}
            setIsMonthEnabled={setIsMonthEnabled}
            cumulativeSum={cumulativeSum}
            setCumulativeSum={setCumulativeSum}
            measurementUnit={measurementUnit}
            setMeasurementUnit={setMeasurementUnit}
            countryGroups={countryGroups}
            setCountryGroups={setCountryGroups}
            country={country}
            setCountry={setCountry}
            regions={regions}
            setRegions={setRegions}
            isHsSectionEnabled={isHsSectionEnabled}
            setIsHsSectionEnabled={setIsHsSectionEnabled}
            hsSection={hsSection}
            setHsSection={setHsSection}
            isHs2Enabled={isHs2Enabled}
            setIsHs2Enabled={setIsHs2Enabled}
            hs2={hs2}
            setHs2={setHs2}
            isHs4Enabled={isHs4Enabled}
            setIsHs4Enabled={setIsHs4Enabled}
            hs4={hs4}
            setHs4={setHs4}
            isHs6Enabled={isHs6Enabled}
            setIsHs6Enabled={setIsHs6Enabled}
            hs6={hs6}
            setHs6={setHs6}
            isSitc1Enabled={isSitc1Enabled}
            setIsSitc1Enabled={setIsSitc1Enabled}
            sitc1={sitc1}
            setSitc1={setSitc1}
            isSitc2Enabled={isSitc2Enabled}
            setIsSitc2Enabled={setIsSitc2Enabled}
            sitc2={sitc2}
            setSitc2={setSitc2}
            isSitc3Enabled={isSitc3Enabled}
            setIsSitc3Enabled={setIsSitc3Enabled}
            sitc3={sitc3}
            setSitc3={setSitc3}
            isSitc4Enabled={isSitc4Enabled}
            setIsSitc4Enabled={setIsSitc4Enabled}
            sitc4={sitc4}
            setSitc4={setSitc4}
            // Options data
            tradeFlowOptions={tradeFlowOptions}
            yearOptions={yearOptions}
            onLoadMoreYears={() => loadYears(yearOffset, true)}
            onSearchYears={handleYearSearch}
            onSelectAllYears={loadAllYears}
            yearLoading={yearLoading}
            hasMoreYears={hasMoreYears}
            quarterOptions={quarterOptions}
            monthOptions={monthOptions}
            measurementOptions={measurementOptions}
            countryGroupOptions={countryGroupOptions}
            onLoadMoreCountryGroups={() => loadCountryGroups(countryGroupOffset, true)}
            onSearchCountryGroups={handleCountryGroupSearch}
            onSelectAllCountryGroups={loadAllCountryGroups}
            countryGroupLoading={countryGroupLoading}
            hasMoreCountryGroups={hasMoreCountryGroups}
            countryOptions={countryOptions}
            onLoadMoreCountries={() => loadCountries(countryOffset, true)}
            onSearchCountries={handleCountrySearch}
            onSelectAllCountries={loadAllCountries}
            countryLoading={countryLoading}
            hasMoreCountries={hasMoreCountries}
            regionsOptions={regionsOptions}
            onLoadMoreRegions={() => loadRegions(regionsOffset, true)}
            onSearchRegions={handleRegionsSearch}
            onSelectAllRegions={loadAllRegions}
            regionsLoading={regionsLoading}
            hasMoreRegions={hasMoreRegions}
            hsSectionOptions={hsSectionOptions}
            hs2Options={hs2Options}
            onSearchHs2={handleHs2Search}
            onSelectAllHs2={loadAllHs2}
            hs2Loading={hs2Loading}
            hasMoreHs2={hasMoreHs2}
            hs4Options={hs4Options}
            onSearchHs4={handleHs4Search}
            onSelectAllHs4={loadAllHs4}
            hs4Loading={hs4Loading}
            hasMoreHs4={hasMoreHs4}
            hs6Options={hs6Options}
            onSearchHs6={handleHs6Search}
            onSelectAllHs6={loadAllHs6}
            hs6Loading={hs6Loading}
            hasMoreHs6={hasMoreHs6}
            sitc1Options={sitc1Options}
            onSearchSitc1={handleSitc1Search}
            onSelectAllSitc1={loadAllSitc1}
            sitc1Loading={sitc1Loading}
            hasMoreSitc1={hasMoreSitc1}
            sitc2Options={sitc2Options}
            onSearchSitc2={handleSitc2Search}
            onSelectAllSitc2={loadAllSitc2}
            sitc2Loading={sitc2Loading}
            hasMoreSitc2={hasMoreSitc2}
            sitc3Options={sitc3Options}
            onSearchSitc3={handleSitc3Search}
            onSelectAllSitc3={loadAllSitc3}
            sitc3Loading={sitc3Loading}
            hasMoreSitc3={hasMoreSitc3}
            sitc4Options={sitc4Options}
            onSearchSitc4={handleSitc4Search}
            onSelectAllSitc4={loadAllSitc4}
            sitc4Loading={sitc4Loading}
            hasMoreSitc4={hasMoreSitc4}
            // Helper functions for mutual exclusivity
            onTradeFlowChange={handleTradeFlowChange}
            onQuarterChange={handleQuarterChange}
            onMonthChange={handleMonthChange}
            onHsChange={handleHsChange}
            onSitcChange={handleSitcChange}
            onCountryGroupChange={handleCountryGroupChange}
            onCountryChange={handleCountryChange}
          />
        )}

        {currentStep === 'results' && (
          <ServiceResultsStep
            onPrevious={goToPrevious}
            tradeData={apiTradeData}
            handleDownloadData={handleDownloadData}
          />
        )}
      </div>
      
      <RatingModal
        isOpen={showRatingModal}
        onClose={() => setShowRatingModal(false)}
        onSubmit={handleRatingSubmit}
        serviceName="Tashqi savdo statistikasi"
      />
    </div>
  );
};

export default ExternalTrade;

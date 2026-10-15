import { ArrowRight, ArrowLeft, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';
import Select from 'react-dropdown-select';
import Checkbox from '@mui/material/Checkbox';
import { useState, useRef, useEffect } from 'react';
import type { SelectRenderer } from 'react-dropdown-select';

const pick = (item: OptionType, key?: string) => (key ? (item as unknown as Record<string, unknown>)[key] : undefined);

interface OptionType {
  value: string | number;
  label: string;
}

interface ServiceSettingsStepProps {
  onNext: () => void;
  onPrevious: () => void;
  onGetData: () => void;
  isLoading: boolean;
  // Expansion states
  isMainOptionsExpanded: boolean;
  setIsMainOptionsExpanded: (value: boolean) => void;
  isAdditionalOptionsExpanded: boolean;
  setIsAdditionalOptionsExpanded: (value: boolean) => void;
  isCommodityClassExpanded: boolean;
  setIsCommodityClassExpanded: (value: boolean) => void;
  isHsExpanded: boolean;
  setIsHsExpanded: (value: boolean) => void;
  isSitcExpanded: boolean;
  setIsSitcExpanded: (value: boolean) => void;
  // Form states
  tradeFlows: OptionType[];
  setTradeFlows: (value: OptionType[]) => void;
  selectedYear: OptionType[];
  setSelectedYear: (value: OptionType[]) => void;
  isYearEnabled: boolean;
  setIsYearEnabled: (value: boolean) => void;
  selectedQuarter: OptionType[];
  setSelectedQuarter: (value: OptionType[]) => void;
  isQuarterEnabled: boolean;
  setIsQuarterEnabled: (value: boolean) => void;
  selectedMonth: OptionType[];
  setSelectedMonth: (value: OptionType[]) => void;
  isMonthEnabled: boolean;
  setIsMonthEnabled: (value: boolean) => void;
  cumulativeSum: boolean;
  setCumulativeSum: (value: boolean) => void;
  measurementUnit: OptionType[];
  setMeasurementUnit: (value: OptionType[]) => void;
  countryGroups: OptionType[];
  setCountryGroups: (value: OptionType[]) => void;
  country: OptionType[];
  setCountry: (value: OptionType[]) => void;
  regions: OptionType[];
  setRegions: (value: OptionType[]) => void;
  isHsSectionEnabled: boolean;
  setIsHsSectionEnabled: (value: boolean) => void;
  hsSection: OptionType[];
  setHsSection: (value: OptionType[]) => void;
  isHs2Enabled: boolean;
  setIsHs2Enabled: (value: boolean) => void;
  hs2: OptionType[];
  setHs2: (value: OptionType[]) => void;
  isHs4Enabled: boolean;
  setIsHs4Enabled: (value: boolean) => void;
  hs4: OptionType[];
  setHs4: (value: OptionType[]) => void;
  isHs6Enabled: boolean;
  setIsHs6Enabled: (value: boolean) => void;
  hs6: OptionType[];
  setHs6: (value: OptionType[]) => void;
  isSitc1Enabled: boolean;
  setIsSitc1Enabled: (value: boolean) => void;
  sitc1: OptionType[];
  setSitc1: (value: OptionType[]) => void;
  isSitc2Enabled: boolean;
  setIsSitc2Enabled: (value: boolean) => void;
  sitc2: OptionType[];
  setSitc2: (value: OptionType[]) => void;
  isSitc3Enabled: boolean;
  setIsSitc3Enabled: (value: boolean) => void;
  sitc3: OptionType[];
  setSitc3: (value: OptionType[]) => void;
  isSitc4Enabled: boolean;
  setIsSitc4Enabled: (value: boolean) => void;
  sitc4: OptionType[];
  setSitc4: (value: OptionType[]) => void;
  // Options data
  tradeFlowOptions: OptionType[];
  yearOptions: OptionType[];
  onLoadMoreYears?: () => void;
  onSearchYears?: (query: string) => void;
  onSelectAllYears?: () => void;
  yearLoading?: boolean;
  hasMoreYears?: boolean;
  quarterOptions: OptionType[];
  monthOptions: OptionType[];
  measurementOptions: OptionType[];
  countryGroupOptions: OptionType[];
  onLoadMoreCountryGroups?: () => void;
  onSearchCountryGroups?: (query: string) => void;
  onSelectAllCountryGroups?: () => void;
  countryGroupLoading?: boolean;
  hasMoreCountryGroups?: boolean;
  countryOptions: OptionType[];
  onLoadMoreCountries?: () => void;
  onSearchCountries?: (query: string) => void;
  onSelectAllCountries?: () => void;
  countryLoading?: boolean;
  hasMoreCountries?: boolean;
  regionsOptions: OptionType[];
  onLoadMoreRegions?: () => void;
  onSearchRegions?: (query: string) => void;
  onSelectAllRegions?: () => void;
  regionsLoading?: boolean;
  hasMoreRegions?: boolean;
  hsSectionOptions: OptionType[];
  hs2Options: OptionType[];
  onLoadMoreHs2?: () => void;
  onSearchHs2?: (query: string) => void;
  onSelectAllHs2?: () => void;
  hs2Loading?: boolean;
  hasMoreHs2?: boolean;
  hs4Options: OptionType[];
  onLoadMoreHs4?: () => void;
  onSearchHs4?: (query: string) => void;
  onSelectAllHs4?: () => void;
  hs4Loading?: boolean;
  hasMoreHs4?: boolean;
  hs6Options: OptionType[];
  onLoadMoreHs6?: () => void;
  onSearchHs6?: (query: string) => void;
  onSelectAllHs6?: () => void;
  hs6Loading?: boolean;
  hasMoreHs6?: boolean;
  sitc1Options: OptionType[];
  onLoadMoreSitc1?: () => void;
  onSearchSitc1?: (query: string) => void;
  onSelectAllSitc1?: () => void;
  sitc1Loading?: boolean;
  hasMoreSitc1?: boolean;
  sitc2Options: OptionType[];
  onLoadMoreSitc2?: () => void;
  onSearchSitc2?: (query: string) => void;
  onSelectAllSitc2?: () => void;
  sitc2Loading?: boolean;
  hasMoreSitc2?: boolean;
  sitc3Options: OptionType[];
  onLoadMoreSitc3?: () => void;
  onSearchSitc3?: (query: string) => void;
  onSelectAllSitc3?: () => void;
  sitc3Loading?: boolean;
  hasMoreSitc3?: boolean;
  sitc4Options: OptionType[];
  onLoadMoreSitc4?: () => void;
  onSearchSitc4?: (query: string) => void;
  onSelectAllSitc4?: () => void;
  sitc4Loading?: boolean;
  hasMoreSitc4?: boolean;
  // Helper functions for mutual exclusivity
  onTradeFlowChange?: (newTradeFlows: OptionType[]) => void;
  onQuarterChange?: (newQuarters: OptionType[]) => void;
  onMonthChange?: (newMonths: OptionType[]) => void;
  onHsChange?: (enabled: boolean) => void;
  onSitcChange?: (enabled: boolean) => void;
  onCountryGroupChange?: (newCountryGroups: OptionType[]) => void;
  onCountryChange?: (newCountries: OptionType[]) => void;
}

const ServiceSettingsStep = (props: ServiceSettingsStepProps) => {
  const {
    onPrevious,
    onGetData,
    isLoading,
    // Expansion states
    isMainOptionsExpanded,
    setIsMainOptionsExpanded,
    isAdditionalOptionsExpanded,
    setIsAdditionalOptionsExpanded,
    isCommodityClassExpanded,
    setIsCommodityClassExpanded,
    isHsExpanded,
    setIsHsExpanded,
    isSitcExpanded,
    setIsSitcExpanded,
    // Form states
    tradeFlows,
    setTradeFlows,
    selectedYear,
    setSelectedYear,
    isYearEnabled,
    setIsYearEnabled,
    selectedQuarter,
    setSelectedQuarter,
    isQuarterEnabled,
    setIsQuarterEnabled,
    selectedMonth,
    setSelectedMonth,
    isMonthEnabled,
    setIsMonthEnabled,
    measurementUnit,
    setMeasurementUnit,
    countryGroups,
    setCountryGroups,
    country,
    setCountry,
    regions,
    setRegions,
    isHs2Enabled,
    setIsHs2Enabled,
    hs2,
    setHs2,
    isHs4Enabled,
    setIsHs4Enabled,
    hs4,
    setHs4,
    isHs6Enabled,
    setIsHs6Enabled,
    hs6,
    setHs6,
    isSitc1Enabled,
    setIsSitc1Enabled,
    sitc1,
    setSitc1,
    isSitc2Enabled,
    setIsSitc2Enabled,
    sitc2,
    setSitc2,
    isSitc3Enabled,
    setIsSitc3Enabled,
    sitc3,
    setSitc3,
    isSitc4Enabled,
    setIsSitc4Enabled,
    sitc4,
    setSitc4,
    // Options data
    tradeFlowOptions,
    yearOptions,
    onLoadMoreYears,
    onSearchYears,
    onSelectAllYears,
    yearLoading,
    hasMoreYears,
    quarterOptions,
    monthOptions,
    measurementOptions,
    countryGroupOptions,
    onLoadMoreCountryGroups,
    onSearchCountryGroups,
    onSelectAllCountryGroups,
    countryGroupLoading,
    hasMoreCountryGroups,
    countryOptions,
    onLoadMoreCountries,
    onSearchCountries,
    onSelectAllCountries,
    countryLoading,
    hasMoreCountries,
    regionsOptions,
    onLoadMoreRegions,
    onSearchRegions,
    onSelectAllRegions,
    regionsLoading,
    hasMoreRegions,
    hs2Options,
    onLoadMoreHs2,
    onSearchHs2,
    onSelectAllHs2,
    hs2Loading,
    hasMoreHs2,
    hs4Options,
    onLoadMoreHs4,
    onSearchHs4,
    onSelectAllHs4,
    hs4Loading,
    hasMoreHs4,
    hs6Options,
    onLoadMoreHs6,
    onSearchHs6,
    onSelectAllHs6,
    hs6Loading,
    hasMoreHs6,
    sitc1Options,
    onLoadMoreSitc1,
    onSearchSitc1,
    onSelectAllSitc1,
    sitc1Loading,
    hasMoreSitc1,
    sitc2Options,
    onLoadMoreSitc2,
    onSearchSitc2,
    onSelectAllSitc2,
    sitc2Loading,
    hasMoreSitc2,
    sitc3Options,
    onLoadMoreSitc3,
    onSearchSitc3,
    onSelectAllSitc3,
    sitc3Loading,
    hasMoreSitc3,
    sitc4Options,
    onLoadMoreSitc4,
    onSearchSitc4,
    onSelectAllSitc4,
    sitc4Loading,
    hasMoreSitc4,
    // Helper functions for mutual exclusivity
    onTradeFlowChange,
    onQuarterChange,
    onMonthChange,
    onHsChange,
    onSitcChange,
    onCountryGroupChange,
    onCountryChange
  } = props;

  // Custom content renderer
  const customContentRenderer = ({ props, state, methods }: SelectRenderer<OptionType>) => (
    <div className="flex items-center justify-between w-full min-h-[42px] px-3 py-2 bg-white border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition-all duration-200">
      <span className="flex-1 text-sm text-gray-700">
        {state.values.length === 0 ? (
          <span className="text-gray-400">{props.placeholder}</span>
        ) : state.values.length === 1 ? (
          <span className="font-medium">{state.values[0].label}</span>
        ) : (
          <span className="font-medium">
            {state.values.length} ta element tanlandi
          </span>
        )}
      </span>
      <div className="flex items-center space-x-2">
        {state.values.length > 0 && (
          <button 
            className="text-gray-400 hover:text-red-500 transition-colors duration-200 p-1 rounded-full hover:bg-red-50"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              // clearAll — methods'da (state'da yo'q edi: tugma TypeError berardi)
              methods.clearAll();
            }}
            title="Barcha tanlovlarni tozalash"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        )}
        <svg className="w-5 h-5 text-gray-400 transform transition-transform duration-200" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </div>
    </div>
  );

  // Custom dropdown renderer for multi selects
  const customMultiDropdownRenderer = ({ props, state, methods }: SelectRenderer<OptionType>) => {
    const regexp = new RegExp(state.search, 'i');
    const options = props.options.filter((item: OptionType) => regexp.test(String(pick(item, props.searchBy) ?? pick(item, props.labelField) ?? '')));
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
        {props.searchable && (
          <div className="p-3 border-b border-gray-200">
            <input
              type="text"
              value={state.search}
              onChange={methods.setSearch}
              placeholder="Variantlarni qidirish..."
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
            />
          </div>
        )}
        <div className="p-3 border-b border-gray-200 bg-gray-50">
          <div className="flex justify-between items-center">
            <button 
              className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors duration-200" 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                methods.selectAll();
              }}
            >
              Hammasini tanlash
            </button>
            <button 
              className="text-sm text-red-600 hover:text-red-800 font-medium transition-colors duration-200" 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                methods.clearAll();
              }}
            >
              Hammasini tozalash
            </button>
          </div>
        </div>
        {options.length === 0 ? (
          <div className="p-4 text-sm text-gray-500 text-center">Hech qanday variant topilmadi</div>
        ) : (
          <div className="py-2">
            {options.map((option: OptionType) => {
              const isSelected = state.values.some((v: OptionType) => v.value === option.value);
              return (
                <div
                  key={option.value}
                  className={`px-4 py-3 text-sm cursor-pointer transition-all duration-200 flex items-center justify-between group hover:bg-blue-50 ${
                    isSelected ? 'bg-blue-100 text-blue-800 border-l-4 border-blue-500' : 'text-gray-700 hover:text-blue-700'
                  }`}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    
                    let newValues: OptionType[];
                    if (isSelected) {
                      // Remove the item from selection
                      newValues = state.values.filter((v: OptionType) => v.value !== option.value);
                    } else {
                      // Add the item to selection
                      newValues = [...state.values, option];
                    }
                    
                    // Call onChange directly
                    props.onChange(newValues);
                    // Don't close dropdown for multi-select to allow multiple selections
                  }}
                  title={isSelected ? `${option.label} ni bekor qilish uchun bosing` : `${option.label} ni tanlash uchun bosing`}
                >
                  <span className="flex-1 pr-3">{option.label}</span>
                  <div className="flex-shrink-0">
                    {isSelected ? (
                      <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    ) : (
                      <div className="w-5 h-5 border-2 border-gray-300 rounded-full hover:border-blue-400 transition-colors duration-200"></div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  // Custom dropdown renderer for single selects
  const customSingleDropdownRenderer = ({ props, state, methods }: SelectRenderer<OptionType>) => {
    const regexp = new RegExp(state.search, 'i');
    const options = props.options.filter((item: OptionType) => regexp.test(String(pick(item, props.searchBy) ?? pick(item, props.labelField) ?? '')));
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
        {props.searchable && (
          <div className="p-3 border-b border-gray-200">
            <input
              type="text"
              value={state.search}
              onChange={methods.setSearch}
              placeholder="Variantlarni qidirish..."
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
            />
          </div>
        )}
        {options.length === 0 ? (
          <div className="p-4 text-sm text-gray-500 text-center">Hech qanday variant topilmadi</div>
        ) : (
          <div className="py-2">
            {options.map((option: OptionType) => {
              const isSelected = state.values.some((v: OptionType) => v.value === option.value);
              return (
                <div
                  key={option.value}
                  className={`px-4 py-3 text-sm cursor-pointer transition-all duration-200 flex items-center justify-between group hover:bg-blue-50 ${
                    isSelected ? 'bg-blue-100 text-blue-800 border-l-4 border-blue-500' : 'text-gray-700 hover:text-blue-700'
                  }`}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    
                    let newValues: OptionType[];
                    if (isSelected) {
                      // For single select, clear the selection if clicking on selected item
                      newValues = [];
                    } else {
                      // Add the item to selection (replace previous selection)
                      newValues = [option];
                    }
                    
                    // Call onChange directly
                    props.onChange(newValues);
                    // For single select, close dropdown only when selecting (not deselecting)
                    if (!isSelected) {
                      setTimeout(() => methods.dropDown('close'), 100);
                    }
                  }}
                  title={isSelected ? `${option.label} ni bekor qilish uchun bosing` : `${option.label} ni tanlash uchun bosing`}
                >
                  <span className="flex-1 pr-3">{option.label}</span>
                  <div className="flex-shrink-0">
                    {isSelected ? (
                      <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    ) : (
                      <div className="w-5 h-5 border-2 border-gray-300 rounded-full hover:border-blue-400 transition-colors duration-200"></div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const singleSelectProps = {
    multi: false,
    searchable: true,
    searchBy: 'label',
    contentRenderer: customContentRenderer,
    dropdownRenderer: customSingleDropdownRenderer,
    clearable: true,
    dropdownHandle: true,
    color: '#0074D9',
  };

  const multiSelectProps = {
    multi: true,
    searchable: true,
    searchBy: 'label',
    contentRenderer: customContentRenderer,
    dropdownRenderer: customMultiDropdownRenderer,
    clearable: true,
    dropdownHandle: true,
    color: '#0074D9',
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto px-6 py-12">
      {/* Progress indicator */}
      <div className="mb-8">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Tahlil parametrlarini sozlash</h2>
          <p className="text-gray-600 text-sm">
            Quyidagi parametrlarni tanlab, tashqi savdo ma'lumotlarini tahlil qiling. 
            Barcha maydonlar ixtiyoriy, faqat kerakli ma'lumotlarni tanlang.
          </p>
        </div>
      </div>

      {/* Main Options */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200">
        <div 
          className="p-6 cursor-pointer border-b border-gray-200 hover:bg-gray-50 transition-colors duration-200"
          onClick={() => setIsMainOptionsExpanded(!isMainOptionsExpanded)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-blue-600 font-bold">1</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Asosiy Ma'lumotlar</h3>
                <p className="text-sm text-gray-500">Import/Eksport, vaqt va o'lchov birligi</p>
              </div>
            </div>
            {isMainOptionsExpanded ? (
              <ChevronUp className="w-5 h-5 text-gray-500" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-500" />
            )}
          </div>
        </div>
        
        {isMainOptionsExpanded && (
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Savdo turi <span className="text-red-500">*</span>
                </label>
                <p className="text-xs text-gray-500 mb-2">Qaysi turdagi savdo ma'lumotlarini ko'rmoqchisiz?</p>
                <Select
                  options={tradeFlowOptions}
                  values={tradeFlows}
                  onChange={onTradeFlowChange || setTradeFlows}
                  placeholder="Eksport yoki Import tanlang"
                  {...multiSelectProps}
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Pul birligi <span className="text-red-500">*</span>
                </label>
                <p className="text-xs text-gray-500 mb-2">Ma'lumotlar qaysi pul birligida ko'rsatilsin?</p>
                <Select
                  options={measurementOptions}
                  values={measurementUnit}
                  onChange={setMeasurementUnit}
                  placeholder="AQSh dollari turini tanlang"
                  {...singleSelectProps}
                />
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-yellow-800 mb-2">📅 Vaqt oralig'ini tanlang</h4>
              <p className="text-xs text-yellow-700 mb-3">
                Qaysi vaqt davri uchun ma'lumot kerak? Kerakli davrlarni belgilang va tanlang.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700">Yil bo'yicha</label>
                    <div className="flex items-center">
                      <Checkbox
                        checked={isYearEnabled}
                        onChange={(e) => setIsYearEnabled(e.target.checked)}
                        color="primary"
                        size="small"
                      />
                      <span className="text-xs text-gray-500 ml-1">
                        {isYearEnabled ? 'Faol' : 'O\'chiq'}
                      </span>
                    </div>
                  </div>
                  <CustomCountrySelect
                    options={yearOptions}
                    selectedValues={selectedYear}
                    onChange={setSelectedYear}
                    onLoadMore={isYearEnabled ? onLoadMoreYears : undefined}
                    onSearch={isYearEnabled ? onSearchYears : undefined}
                    onSelectAll={isYearEnabled ? onSelectAllYears : undefined}
                    loading={yearLoading}
                    hasMore={hasMoreYears}
                    placeholder={isYearEnabled ? "Yillarni tanlang" : "Yil tanlovi o'chirilgan"}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700">Chorak bo'yicha</label>
                    <div className="flex items-center">
                      <Checkbox
                        checked={isQuarterEnabled}
                        onChange={(e) => setIsQuarterEnabled(e.target.checked)}
                        color="primary"
                        size="small"
                      />
                      <span className="text-xs text-gray-500 ml-1">
                        {isQuarterEnabled ? 'Faol' : 'O\'chiq'}
                      </span>
                    </div>
                  </div>
                  <Select
                    options={quarterOptions}
                    values={selectedQuarter}
                    onChange={onQuarterChange || setSelectedQuarter}
                    placeholder={isQuarterEnabled ? "Chorakni tanlang" : "Chorak tanlovi o'chirilgan"}
                    disabled={!isQuarterEnabled}
                    {...(isQuarterEnabled ? multiSelectProps : { ...multiSelectProps, disabled: true })}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700">Oy bo'yicha</label>
                    <div className="flex items-center">
                      <Checkbox
                        checked={isMonthEnabled}
                        onChange={(e) => setIsMonthEnabled(e.target.checked)}
                        color="primary"
                        size="small"
                      />
                      <span className="text-xs text-gray-500 ml-1">
                        {isMonthEnabled ? 'Faol' : 'O\'chiq'}
                      </span>
                    </div>
                  </div>
                  <Select
                    options={monthOptions}
                    values={selectedMonth}
                    onChange={onMonthChange || setSelectedMonth}
                    placeholder={isMonthEnabled ? "Oyni tanlang" : "Oy tanlovi o'chirilgan"}
                    disabled={!isMonthEnabled}
                    {...(isMonthEnabled ? multiSelectProps : { ...multiSelectProps, disabled: true })}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Additional Options */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200">
        <div 
          className="p-6 cursor-pointer border-b border-gray-200 hover:bg-gray-50 transition-colors duration-200"
          onClick={() => setIsAdditionalOptionsExpanded(!isAdditionalOptionsExpanded)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-green-700 font-bold">2</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Davlat va Hudud</h3>
                <p className="text-sm text-gray-500">Qaysi davlatlar va hududlar bilan savdo</p>
              </div>
            </div>
            {isAdditionalOptionsExpanded ? (
              <ChevronUp className="w-5 h-5 text-gray-500" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-500" />
            )}
          </div>
        </div>
        
        {isAdditionalOptionsExpanded && (
          <div className="p-6 space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-blue-800 mb-2">🌍 Qaysi davlatlar bilan savdo?</h4>
              <p className="text-xs text-blue-700 mb-4">
                Alohida davlatlar yoki davlatlar guruhini tanlashingiz mumkin. Agar hech narsa tanlamasangiz, barcha davlatlar bo'yicha ma'lumot ko'rsatiladi.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Davlatlar guruhi
                  </label>
                  <p className="text-xs text-gray-500">Masalan: Evropa Ittifoqi, EAEC va h.k.</p>
                  <CustomCountrySelect
                    options={countryGroupOptions}
                    selectedValues={countryGroups}
                    onChange={onCountryGroupChange || setCountryGroups}
                    onLoadMore={onLoadMoreCountryGroups}
                    onSearch={onSearchCountryGroups}
                    onSelectAll={onSelectAllCountryGroups}
                    loading={countryGroupLoading}
                    hasMore={hasMoreCountryGroups}
                    placeholder="Davlatlar guruhini tanlang"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Alohida davlatlar <span className="text-red-500">*</span>
                  </label>
                  <p className="text-xs text-gray-500">Konkret davlatlarni tanlang</p>
                  <CustomCountrySelect
                    options={countryOptions}
                    selectedValues={country}
                    onChange={onCountryChange || setCountry}
                    onLoadMore={onLoadMoreCountries}
                    onSearch={onSearchCountries}
                    onSelectAll={onSelectAllCountries}
                    loading={countryLoading}
                    hasMore={hasMoreCountries}
                    placeholder="Davlatlarni tanlang"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                O'zbekiston hududlari (Viloyatlar)
              </label>
              <p className="text-xs text-gray-500 mb-2">
                Qaysi viloyat yoki hududlar bo'yicha ma'lumot kerak? (ixtiyoriy)
              </p>
              <CustomCountrySelect
                options={regionsOptions}
                selectedValues={regions}
                onChange={setRegions}
                onLoadMore={onLoadMoreRegions}
                onSearch={onSearchRegions}
                onSelectAll={onSelectAllRegions}
                loading={regionsLoading}
                hasMore={hasMoreRegions}
                placeholder="Viloyatlarni tanlang"
              />
            </div>
          </div>
        )}
      </div>

      {/* Commodity Classification */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200">
        <div 
          className="p-6 cursor-pointer border-b border-gray-200 hover:bg-gray-50 transition-colors duration-200"
          onClick={() => setIsCommodityClassExpanded(!isCommodityClassExpanded)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <span className="text-purple-600 font-bold">3</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Tovar Turlari</h3>
                <p className="text-sm text-gray-500">Qaysi mahsulotlar bo'yicha ma'lumot kerak</p>
              </div>
            </div>
            {isCommodityClassExpanded ? (
              <ChevronUp className="w-5 h-5 text-gray-500" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-500" />
            )}
          </div>
        </div>
        
        {isCommodityClassExpanded && (
          <div className="p-6">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
              <h4 className="text-sm font-medium text-amber-800 mb-2">📦 Tovar klassifikatsiyasi haqida</h4>
              <p className="text-xs text-amber-700 mb-2">
                Tovarlar xalqaro standartlar bo'yicha tasniflangan. Agar muayyan tovar turini tanlashni istasangiz, quyidagi bo'limlardan birini faollashtiring:
              </p>
              <ul className="text-xs text-amber-700 list-disc list-inside space-y-1">
                <li><strong>HS kodi:</strong> Xalqaro standart (ko'proq ishlatiladigan)</li>
                <li><strong>SITC kodi:</strong> Statistik tasnif (ixtisoslashgan)</li>
              </ul>
            </div>

            {/* HS Classification */}
            <div className="mb-8">
              <div 
                className="flex items-center justify-between cursor-pointer p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors duration-200"
                onClick={() => setIsHsExpanded(!isHsExpanded)}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-bold">HS</span>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-blue-900">HS Kodlar (Harmonized System)</h4>
                    <p className="text-sm text-blue-700">Xalqaro standart tovar klassifikatsiyasi</p>
                  </div>
                </div>
                {isHsExpanded ? (
                  <ChevronUp className="w-5 h-5 text-blue-600" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-blue-600" />
                )}
              </div>
              
              {isHsExpanded && (
                <div className="mt-4 space-y-4">
                  <div className="bg-white border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-4">
                      <strong>HS kodlar:</strong> 2 raqamli (umumiy kategoriya) dan 6 raqamli (aniq mahsulot) gacha bo'ladi. 
                      Qanchalik ko'p raqam bo'lsa, shunchalik aniq ma'lumot olasiz.
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <label className="text-sm font-medium text-gray-700">HS2 - Asosiy kategoriya</label>
                            <p className="text-xs text-gray-500">Masalan: "Hayvon mahsulotlari"</p>
                          </div>
                          <Checkbox
                            checked={isHs2Enabled}
                            onChange={(e) => {
                              setIsHs2Enabled(e.target.checked);
                              if (onHsChange) onHsChange(e.target.checked);
                            }}
                            color="primary"
                            size="small"
                          />
                        </div>
                        {!isHs2Enabled ? (
                          <div className="relative">
                            <div className="w-full min-h-[42px] px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg flex items-center cursor-not-allowed">
                              <span className="text-gray-400 text-sm">Yuqoridagi katakchani belgilang</span>
                            </div>
                          </div>
                        ) : (
                          <CustomCountrySelect
                            options={hs2Options}
                            selectedValues={hs2}
                            onChange={setHs2}
                            onLoadMore={onLoadMoreHs2}
                            loading={hs2Loading}
                            hasMore={hasMoreHs2}
                            placeholder="HS2 kategoriyalarini tanlang"
                            onSearch={onSearchHs2}
                            onSelectAll={onSelectAllHs2}
                          />
                        )}
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <label className="text-sm font-medium text-gray-700">HS4 - Kengaytirilgan</label>
                            <p className="text-xs text-gray-500">Aniqroq tasnif</p>
                          </div>
                          <Checkbox
                            checked={isHs4Enabled}
                            onChange={(e) => {
                              setIsHs4Enabled(e.target.checked);
                              if (onHsChange) onHsChange(e.target.checked);
                            }}
                            color="primary"
                            size="small"
                          />
                        </div>
                        {isHs4Enabled ? (
                          <CustomCountrySelect
                            options={hs4Options}
                            selectedValues={hs4}
                            onChange={setHs4}
                            placeholder="HS4 kodlarini tanlang"
                            loading={hs4Loading}
                            hasMore={hasMoreHs4}
                            onLoadMore={onLoadMoreHs4}
                            onSearch={onSearchHs4}
                            onSelectAll={onSelectAllHs4}
                          />
                        ) : (
                          <div className="min-h-[42px] px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-400 text-sm flex items-center">
                            Yuqoridagi katakchani belgilang
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-4">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <label className="text-sm font-medium text-gray-700">HS6 - Eng aniq</label>
                          <p className="text-xs text-gray-500">Eng batafsil ma'lumot</p>
                        </div>
                        <Checkbox
                          checked={isHs6Enabled}
                          onChange={(e) => {
                            setIsHs6Enabled(e.target.checked);
                            if (onHsChange) onHsChange(e.target.checked);
                          }}
                          color="primary"
                          size="small"
                        />
                      </div>
                      {isHs6Enabled ? (
                        <CustomCountrySelect
                          options={hs6Options}
                          selectedValues={hs6}
                          onChange={setHs6}
                          placeholder="HS6 kodlarini tanlang"
                          loading={hs6Loading}
                          hasMore={hasMoreHs6}
                          onLoadMore={onLoadMoreHs6}
                          onSearch={onSearchHs6}
                          onSelectAll={onSelectAllHs6}
                        />
                      ) : (
                        <div className="min-h-[42px] px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-400 text-sm flex items-center">
                          Yuqoridagi katakchani belgilang
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* SITC Classification */}
            <div>
              <div 
                className="flex items-center justify-between cursor-pointer p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors duration-200"
                onClick={() => setIsSitcExpanded(!isSitcExpanded)}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-bold">SITC</span>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-green-900">SITC Kodlar (Statistik Tasnif)</h4>
                    <p className="text-sm text-green-700">Maxsus statistik klassifikatsiya</p>
                  </div>
                </div>
                {isSitcExpanded ? (
                  <ChevronUp className="w-5 h-5 text-green-700" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-green-700" />
                )}
              </div>
              
              {isSitcExpanded && (
                <div className="mt-4 space-y-4">
                  <div className="bg-white border border-green-200 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-4">
                      <strong>SITC kodlar:</strong> Statistik tahlil uchun maxsus klassifikatsiya. 
                      Odatda ixtisoslashgan tahlillar uchun ishlatiladi.
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-sm font-medium text-gray-700">SITC 1-daraja</label>
                          <Checkbox
                            checked={isSitc1Enabled}
                            onChange={(e) => {
                              setIsSitc1Enabled(e.target.checked);
                              if (onSitcChange) onSitcChange(e.target.checked);
                            }}
                            color="primary"
                            size="small"
                          />
                        </div>
                        {isSitc1Enabled ? (
                          <CustomCountrySelect
                            options={sitc1Options}
                            selectedValues={sitc1}
                            onChange={setSitc1}
                            placeholder="SITC 1 kodlarini tanlang"
                            loading={sitc1Loading}
                            hasMore={hasMoreSitc1}
                            onLoadMore={onLoadMoreSitc1}
                            onSearch={onSearchSitc1}
                            onSelectAll={onSelectAllSitc1}
                          />
                        ) : (
                          <div className="min-h-[42px] px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-400 text-sm flex items-center">
                            Yuqoridagi katakchani belgilang
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-sm font-medium text-gray-700">SITC 2-daraja</label>
                          <Checkbox
                            checked={isSitc2Enabled}
                            onChange={(e) => {
                              setIsSitc2Enabled(e.target.checked);
                              if (onSitcChange) onSitcChange(e.target.checked);
                            }}
                            color="primary"
                            size="small"
                          />
                        </div>
                        {isSitc2Enabled ? (
                          <CustomCountrySelect
                            options={sitc2Options}
                            selectedValues={sitc2}
                            onChange={setSitc2}
                            placeholder="SITC 2 kodlarini tanlang"
                            loading={sitc2Loading}
                            hasMore={hasMoreSitc2}
                            onLoadMore={onLoadMoreSitc2}
                            onSearch={onSearchSitc2}
                            onSelectAll={onSelectAllSitc2}
                          />
                        ) : (
                          <div className="min-h-[42px] px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-400 text-sm flex items-center">
                            Yuqoridagi katakchani belgilang
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-sm font-medium text-gray-700">SITC 3-daraja</label>
                          <Checkbox
                            checked={isSitc3Enabled}
                            onChange={(e) => {
                              setIsSitc3Enabled(e.target.checked);
                              if (onSitcChange) onSitcChange(e.target.checked);
                            }}
                            color="primary"
                            size="small"
                          />
                        </div>
                        {isSitc3Enabled ? (
                          <CustomCountrySelect
                            options={sitc3Options}
                            selectedValues={sitc3}
                            onChange={setSitc3}
                            placeholder="SITC 3 kodlarini tanlang"
                            loading={sitc3Loading}
                            hasMore={hasMoreSitc3}
                            onLoadMore={onLoadMoreSitc3}
                            onSearch={onSearchSitc3}
                            onSelectAll={onSelectAllSitc3}
                          />
                        ) : (
                          <div className="min-h-[42px] px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-400 text-sm flex items-center">
                            Yuqoridagi katakchani belgilang
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-sm font-medium text-gray-700">SITC 4-daraja</label>
                          <Checkbox
                            checked={isSitc4Enabled}
                            onChange={(e) => {
                              setIsSitc4Enabled(e.target.checked);
                              if (onSitcChange) onSitcChange(e.target.checked);
                            }}
                            color="primary"
                            size="small"
                          />
                        </div>
                        {isSitc4Enabled ? (
                          <CustomCountrySelect
                            options={sitc4Options}
                            selectedValues={sitc4}
                            onChange={setSitc4}
                            placeholder="SITC 4 kodlarini tanlang"
                            loading={sitc4Loading}
                            hasMore={hasMoreSitc4}
                            onLoadMore={onLoadMoreSitc4}
                            onSearch={onSearchSitc4}
                            onSelectAll={onSelectAllSitc4}
                          />
                        ) : (
                          <div className="min-h-[42px] px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-400 text-sm flex items-center">
                            Yuqoridagi katakchani belgilang
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between items-center pt-6">
        <button
          onClick={onPrevious}
          className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center space-x-2 transition-all duration-200 shadow-md hover:shadow-lg"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Orqaga qaytish</span>
        </button>

        <button
          onClick={onGetData}
          disabled={isLoading}
          className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:from-gray-400 disabled:to-gray-500 text-white px-8 py-3 rounded-lg font-semibold flex items-center space-x-2 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:transform-none"
        >
          {isLoading ? (
            <>
              <RefreshCw className="w-5 h-5 animate-spin" />
              <span>Tahlil qilinmoqda...</span>
            </>
          ) : (
            <>
              <span>Tahlilni boshlash</span>
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default ServiceSettingsStep;

// Custom Country Select Component
const CustomCountrySelect: React.FC<{
  options: OptionType[];
  selectedValues: OptionType[];
  onChange: (values: OptionType[]) => void;
  onLoadMore?: () => void;
  loading?: boolean;
  hasMore?: boolean;
  placeholder: string;
  onSearch?: (query: string) => void;
  onSelectAll?: () => void;
}> = ({ 
  options, 
  selectedValues, 
  onChange, 
  onLoadMore, 
  loading, 
  hasMore, 
  placeholder,
  onSearch,
  onSelectAll
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop <= clientHeight + 5 && hasMore && !loading && onLoadMore) {
      onLoadMore();
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    if (onSearch) {
      onSearch(query);
    }
  };

  const toggleOption = (option: OptionType) => {
    const isSelected = selectedValues.some(item => item.value === option.value);
    if (isSelected) {
      onChange(selectedValues.filter(item => item.value !== option.value));
    } else {
      onChange([...selectedValues, option]);
    }
  };

  const handleSelectAll = () => {
    if (onSelectAll) {
      onSelectAll();
    }
  };

  const handleDeselectAll = () => {
    onChange([]);
  };

  const displayText = selectedValues.length === 0 
    ? placeholder 
    : selectedValues.length === 1 
      ? selectedValues[0].label 
      : `${selectedValues.length} ta element tanlandi`;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3 border border-gray-300 rounded-lg bg-white hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all duration-200"
      >
        <span className={selectedValues.length === 0 ? "text-gray-500" : "text-gray-900 font-medium"}>
          {displayText}
        </span>
        <div className="flex items-center space-x-2">
          {selectedValues.length > 0 && (
            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
              {selectedValues.length}
            </span>
          )}
          <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-gray-300 rounded-lg shadow-xl">
          {/* Search Input */}
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder="Qidirish..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none text-sm"
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="p-3 border-b border-gray-200 bg-blue-50 flex justify-between items-center">
            <button
              type="button"
              onClick={handleSelectAll}
              className="text-blue-600 hover:text-blue-800 font-medium text-sm transition-colors duration-200 flex items-center space-x-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Hammasini tanlash</span>
            </button>
            <button
              type="button"
              onClick={handleDeselectAll}
              className="text-red-600 hover:text-red-800 font-medium text-sm transition-colors duration-200 flex items-center space-x-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              <span>Tozalash</span>
            </button>
          </div>

          {/* Options */}
          <div 
            className="max-h-64 overflow-y-auto"
            onScroll={handleScroll}
          >
            {options.length === 0 && !loading ? (
              <div className="p-4 text-center text-gray-500">
                <svg className="w-8 h-8 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.467-.881-6.08-2.33" />
                </svg>
                <p className="text-sm">Hech qanday variant topilmadi</p>
              </div>
            ) : (
              <>
                {options.map((option) => {
                  const isSelected = selectedValues.some(item => item.value === option.value);
                  return (
                    <div
                      key={option.value}
                      onClick={() => toggleOption(option)}
                      className={`p-3 cursor-pointer hover:bg-blue-50 flex items-center space-x-3 transition-colors duration-200 ${
                        isSelected ? 'bg-blue-100 border-l-4 border-blue-500' : ''
                      }`}
                    >
                      <div className="flex-shrink-0">
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-200 ${
                          isSelected 
                            ? 'bg-blue-600 border-blue-600' 
                            : 'border-gray-300 hover:border-blue-400'
                        }`}>
                          {isSelected && (
                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                      </div>
                      <span className={`flex-1 text-sm ${isSelected ? 'text-blue-800 font-medium' : 'text-gray-900'}`}>
                        {option.label}
                      </span>
                    </div>
                  );
                })}
                
                {loading && (
                  <div className="p-4 text-center text-gray-500 border-t border-gray-200">
                    <RefreshCw className="w-5 h-5 animate-spin inline mr-2" />
                    <span className="text-sm">Qo'shimcha variantlar yuklanmoqda...</span>
                  </div>
                )}

                {hasMore && !loading && (
                  <div className="p-3 text-center border-t border-gray-200">
                    <button
                      onClick={onLoadMore}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors duration-200"
                    >
                      Yana variantlar yuklash
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

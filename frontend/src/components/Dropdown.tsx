import React from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { DropdownProps } from "../types";

const Dropdown: React.FC<DropdownProps> = ({
  id,
  label,
  icon,
  options,
  content,
  isOpen = false,
  onToggle,
  onLoadMore,
  loading = false,
  hasMore = false,
}) => {
  const handleToggle = () => {
    if (onToggle) {
      onToggle(id);
    }
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop === clientHeight && hasMore && !loading && onLoadMore) {
      onLoadMore();
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-blue-200 dark:border-gray-600 shadow-lg hover:shadow-xl transition-all duration-300 hover:border-blue-300 dark:hover:border-gray-500 hover:scale-[1.02] overflow-hidden">
      <button
        onClick={handleToggle}
        className="w-full flex items-center justify-between p-6 text-left hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-100 dark:hover:from-gray-700 dark:hover:to-gray-600 transition-all duration-300 group flex-shrink-0"
      >
        <div className="flex items-center gap-3">
          <div className="text-blue-500 dark:text-blue-400 flex-shrink-0 p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg group-hover:bg-blue-100 dark:group-hover:bg-blue-900/50 transition-all duration-200">
            {icon}
          </div>
          <span className="text-gray-800 dark:text-gray-200 font-semibold text-sm">
            {label}
          </span>
        </div>
        <div className="text-blue-500 dark:text-blue-400 flex-shrink-0 transition-transform duration-200 group-hover:scale-110">
          {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </div>
      </button>

      <div
        className={`transition-all duration-300 ease-in-out ${
          isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        } overflow-hidden`}
      >
        <div className="border-t border-blue-200 dark:border-gray-600 bg-gradient-to-r from-blue-50/80 to-white dark:from-gray-700/50 dark:to-gray-800 p-6">
          {content ? (
            content
          ) : options && options.length > 0 ? (
            <div 
              className="space-y-2 max-h-60 overflow-y-auto"
              onScroll={handleScroll}
            >
              {options.map((option) => (
                <button
                  key={option.id}
                  className="w-full text-left p-4 rounded-xl hover:bg-white dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 transition-all duration-200 hover:shadow-md hover:scale-[1.01] border border-transparent hover:border-blue-200 dark:hover:border-gray-500"
                >
                  {option.label}
                </button>
              ))}
              {loading && (
                <div className="text-center py-2">
                  <span className="text-gray-500">Yuklanmoqda...</span>
                </div>
              )}
            </div>
          ) : (
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Ma'lumot topilmadi
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dropdown;

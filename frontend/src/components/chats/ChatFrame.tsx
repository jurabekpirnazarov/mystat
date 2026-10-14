import { useEffect, useRef, type ReactNode } from "react";
import { Send, X, type LucideIcon } from "lucide-react";

interface Props {
  title: string;
  badge?: string;
  icon: LucideIcon;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  placeholder: string;
  disabled?: boolean;
  scrollKey?: unknown;
}

/** Ikkala chat uchun umumiy oyna: sarlavha, xabarlar, kiritish. */
export default function ChatFrame({ title, badge, icon: Icon, onClose, children, footer, value, onChange, onSend, placeholder, disabled, scrollKey }: Props) {
  const listRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [scrollKey]);

  return (
    <div role="dialog" aria-label={title} className="fixed bottom-24 right-4 sm:right-6 z-50 w-[calc(100vw-2rem)] sm:w-96 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[70vh]">
      <div className="bg-blue-600 p-4 text-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Icon className="w-6 h-6" aria-hidden="true" />
          <h3 className="font-medium">
            {title}
            {badge && <span className="ml-2 text-xs bg-blue-500 px-2 py-0.5 rounded-full">{badge}</span>}
          </h3>
        </div>
        <button type="button" onClick={onClose} aria-label="Yopish" className="p-1 hover:bg-blue-500 rounded-full transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>
      <div ref={listRef} className="flex-1 min-h-[16rem] overflow-y-auto p-4 space-y-3" aria-live="polite">
        {children}
      </div>
      {footer}
      <form
        className="p-3 border-t border-gray-200 dark:border-gray-700 flex items-center gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (!disabled && value.trim()) onSend();
        }}
      >
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          aria-label={placeholder}
          disabled={disabled}
          className="flex-1 px-4 py-2 rounded-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 disabled:opacity-60"
        />
        <button type="submit" disabled={disabled || !value.trim()} aria-label="Yuborish" className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors disabled:opacity-50">
          <Send className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
}

export function Bubble({ mine, children, time }: { mine: boolean; children: ReactNode; time?: string }) {
  return (
    <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm ${mine ? "bg-blue-600 text-white rounded-br-none" : "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-bl-none"}`}>
        {children}
        {time && <span className="text-[11px] opacity-70 mt-1 block">{time}</span>}
      </div>
    </div>
  );
}

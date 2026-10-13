import type { ReactNode } from "react";
import { Inbox, type LucideIcon } from "lucide-react";

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  action?: ReactNode;
  className?: string;
}

export default function EmptyState({ title, description, icon: Icon = Inbox, action, className = "" }: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center text-center py-12 px-4 ${className}`}>
      <div className="w-14 h-14 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
        <Icon className="w-7 h-7 text-gray-400 dark:text-gray-500" aria-hidden="true" />
      </div>
      <h3 className="text-base font-semibold text-gray-900 dark:text-white">{title}</h3>
      {description && <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 max-w-sm">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

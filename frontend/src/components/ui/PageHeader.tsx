import type { ReactNode } from "react";

export interface Crumb {
  label: string;
  to?: string;
}

interface PageHeaderProps {
  title: string;
  description?: string;
  breadcrumbs?: Crumb[];
  actions?: ReactNode;
  badge?: ReactNode;
}

/**
 * Sahifa sarlavhasi. MG-15: breadcrumb endi umumiy layout'da (`components/layout/Breadcrumbs.tsx`, my.gov.uz dagi kabi),
 * shuning uchun `breadcrumbs` prop'i qabul qilinadi, lekin chizilmaydi — sahifada ikkita breadcrumb bo'lmasin.
 */
export default function PageHeader({ title, description, actions, badge }: PageHeaderProps) {
  return (
    <header className="mb-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-[28px] font-semibold text-mg-primary flex items-center gap-3 flex-wrap">
            {title}
            {badge}
          </h1>
          {description && <p className="mt-1 text-gray-600 dark:text-gray-300">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>
    </header>
  );
}

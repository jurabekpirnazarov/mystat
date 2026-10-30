import type { ReactNode } from "react";

export default function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-[28px] font-semibold leading-9 text-mg-primary">{title}</h1>
        {description && <p className="mt-1 text-sm text-mg-muted">{description}</p>}
      </div>
      {actions}
    </div>
  );
}

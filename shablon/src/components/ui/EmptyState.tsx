import type { ReactNode } from "react";
import { Inbox, type LucideIcon } from "lucide-react";

export default function EmptyState({ title, description, icon: Icon = Inbox, action }: { title: string; description?: string; icon?: LucideIcon; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
      <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[rgb(var(--ds-panel))]">
        <Icon className="h-7 w-7 text-[rgb(var(--ds-on-panel-muted))]" aria-hidden="true" />
      </span>
      <h3 className="text-base font-semibold text-mg-heading">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-mg-muted">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

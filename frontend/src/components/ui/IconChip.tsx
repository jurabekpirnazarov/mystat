import type { LucideIcon } from "lucide-react";

/** Kichik doira ichidagi ikonka (bosh sahifa ro'yxatlarida mavzuni ko'rsatadi). Bezak: ekran o'quvchidan yashirin. */
export default function IconChip({ icon: Icon, size = "md" }: { icon: LucideIcon; size?: "sm" | "md" }) {
  const box = size === "sm" ? "h-8 w-8" : "h-10 w-10";
  return (
    <span className={`flex ${box} shrink-0 items-center justify-center rounded-full bg-[rgb(var(--ds-panel))] text-[rgb(var(--ds-primary))]`} aria-hidden="true">
      <Icon className={size === "sm" ? "h-4 w-4" : "h-5 w-5"} strokeWidth={1.8} />
    </span>
  );
}

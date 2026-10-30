import type { ReactNode } from "react";
import { ArrowUpRight } from "lucide-react";

/** Tashqi havola: ↗ belgisi va ekran o'quvchi uchun "(yangi oynada ochiladi)". */
export default function ExternalLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-mg-primary hover:underline">
      {children}
      <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
      <span className="sr-only"> (yangi oynada ochiladi)</span>
    </a>
  );
}

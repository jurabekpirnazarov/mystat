type Variant = "card" | "table" | "chart" | "line";

interface SkeletonProps {
  variant?: Variant;
  rows?: number;
  className?: string;
}

const bar = "animate-pulse rounded bg-gray-200 dark:bg-gray-700";

export default function Skeleton({ variant = "line", rows = 5, className = "" }: SkeletonProps) {
  if (variant === "card") {
    return (
      <div className={`rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-3 ${className}`} aria-busy="true">
        <div className={`${bar} h-4 w-1/3`} />
        <div className={`${bar} h-8 w-1/2`} />
        <div className={`${bar} h-3 w-2/3`} />
      </div>
    );
  }
  if (variant === "chart") {
    return (
      <div className={`rounded-xl border border-gray-200 dark:border-gray-700 p-5 ${className}`} aria-busy="true">
        <div className={`${bar} h-4 w-1/4 mb-4`} />
        <div className="flex items-end gap-2 h-40">
          {[40, 70, 55, 90, 65, 80, 45].map((h, i) => (
            <div key={i} className={`${bar} flex-1`} style={{ height: `${h}%` }} />
          ))}
        </div>
      </div>
    );
  }
  if (variant === "table") {
    return (
      <div className={`space-y-2 ${className}`} aria-busy="true">
        <div className={`${bar} h-9 w-full`} />
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className={`${bar} h-7 w-full opacity-70`} />
        ))}
      </div>
    );
  }
  return (
    <div className={`space-y-2 ${className}`} aria-busy="true">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className={`${bar} h-4`} style={{ width: `${90 - (i % 3) * 15}%` }} />
      ))}
    </div>
  );
}

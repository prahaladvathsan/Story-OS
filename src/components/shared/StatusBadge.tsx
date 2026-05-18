import { cn, toTitleCase } from "../../lib/utils";

type StatusBadgeProps = {
  value?: string;
};

export function StatusBadge({ value }: StatusBadgeProps) {
  if (!value) {
    return null;
  }

  const lower = value.toLowerCase();

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold",
        lower.includes("draft") && "bg-sea-100 text-sea-700 dark:bg-sea-900/40 dark:text-sea-200",
        lower.includes("idea") && "bg-ink-100 text-ink-700 dark:bg-ink-900/60 dark:text-ink-100",
        lower.includes("outline") && "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-200",
        lower.includes("final") && "bg-moss-100 text-moss-700 dark:bg-moss-950/60 dark:text-moss-200",
        lower.includes("planted") && "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-100",
        lower.includes("paid") && "bg-moss-100 text-moss-700 dark:bg-moss-950/60 dark:text-moss-200",
        lower.includes("abandoned") && "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-200",
        lower.includes("red_herring") && "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-200",
      )}
    >
      {toTitleCase(value)}
    </span>
  );
}


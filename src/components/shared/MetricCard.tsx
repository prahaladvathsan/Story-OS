import type { ReactNode } from "react";

type MetricCardProps = {
  label: string;
  value: ReactNode;
  hint?: string;
};

export function MetricCard({ label, value, hint }: MetricCardProps) {
  return (
    <div className="panel p-4">
      <div className="text-xs uppercase tracking-[0.22em] text-[color:var(--muted)]">{label}</div>
      <div className="mt-3 font-display text-3xl font-bold">{value}</div>
      {hint ? <div className="mt-2 text-sm text-[color:var(--muted)]">{hint}</div> : null}
    </div>
  );
}


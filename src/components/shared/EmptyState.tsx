import type { ReactNode } from "react";

type EmptyStateProps = {
  title: string;
  description: ReactNode;
  action?: ReactNode;
};

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="panel flex min-h-[220px] flex-col items-start justify-center gap-4 p-8">
      <div className="font-display text-3xl font-bold">{title}</div>
      <div className="max-w-xl text-sm leading-6 text-[color:var(--muted)]">{description}</div>
      {action}
    </div>
  );
}

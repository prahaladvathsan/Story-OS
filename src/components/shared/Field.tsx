import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { cn } from "../../lib/utils";

type FieldShellProps = {
  label: string;
  hint?: string;
  children: ReactNode;
};

export function FieldShell({ label, hint, children }: FieldShellProps) {
  return (
    <label className="flex flex-col gap-2 text-sm">
      <span className="font-semibold text-[color:var(--text)]">{label}</span>
      {children}
      {hint ? <span className="text-xs text-[color:var(--muted)]">{hint}</span> : null}
    </label>
  );
}

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        "w-full rounded-2xl border border-[color:var(--line)] bg-white/70 px-4 py-3 text-sm text-[color:var(--text)] outline-none transition placeholder:text-[color:var(--muted)] focus:border-sea-400 focus:bg-white dark:bg-white/5",
        props.className,
      )}
    />
  );
}

export function TextArea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={cn(
        "min-h-[120px] w-full rounded-2xl border border-[color:var(--line)] bg-white/70 px-4 py-3 text-sm text-[color:var(--text)] outline-none transition placeholder:text-[color:var(--muted)] focus:border-sea-400 focus:bg-white dark:bg-white/5",
        props.className,
      )}
    />
  );
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={cn(
        "w-full rounded-2xl border border-[color:var(--line)] bg-white/70 px-4 py-3 text-sm text-[color:var(--text)] outline-none transition focus:border-sea-400 focus:bg-white dark:bg-white/5",
        props.className,
      )}
    />
  );
}


import type { ReactNode } from "react";

type StatCardProps = {
  label: string;
  value: ReactNode;
  hint?: string;
  icon?: ReactNode;
  accent?: "blue" | "emerald" | "amber" | "rose" | "violet";
};

const ACCENTS: Record<string, { bg: string; ring: string; text: string }> = {
  blue: { bg: "bg-blue-50", ring: "ring-blue-100", text: "text-blue-600" },
  emerald: {
    bg: "bg-emerald-50",
    ring: "ring-emerald-100",
    text: "text-emerald-600",
  },
  amber: {
    bg: "bg-amber-50",
    ring: "ring-amber-100",
    text: "text-amber-600",
  },
  rose: { bg: "bg-rose-50", ring: "ring-rose-100", text: "text-rose-600" },
  violet: {
    bg: "bg-violet-50",
    ring: "ring-violet-100",
    text: "text-violet-600",
  },
};

export function StatCard({
  label,
  value,
  hint,
  icon,
  accent = "blue",
}: StatCardProps) {
  const a = ACCENTS[accent];
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
          {label}
        </span>
        {icon && (
          <span
            className={`flex h-8 w-8 items-center justify-center rounded-lg ring-4 ${a.bg} ${a.ring} ${a.text}`}
          >
            {icon}
          </span>
        )}
      </div>
      <div className="mt-2 text-2xl font-bold text-slate-900">{value}</div>
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

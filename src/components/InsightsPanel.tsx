import {
  TrendingUp,
  Users,
  Star,
  Sparkles,
  ThumbsUp,
} from "lucide-react";
import type { Insight } from "@/lib/analytics";

const KIND_META: Record<
  Insight["kind"],
  { icon: typeof TrendingUp; color: string; bg: string; label: string }
> = {
  headline: {
    icon: Sparkles,
    color: "text-blue-600",
    bg: "bg-blue-50",
    label: "Headline",
  },
  trend: {
    icon: TrendingUp,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    label: "Trend",
  },
  demographic: {
    icon: Users,
    color: "text-violet-600",
    bg: "bg-violet-50",
    label: "Demographic",
  },
  rating: {
    icon: Star,
    color: "text-amber-600",
    bg: "bg-amber-50",
    label: "Rating",
  },
  sentiment: {
    icon: ThumbsUp,
    color: "text-rose-600",
    bg: "bg-rose-50",
    label: "Sentiment",
  },
};

export function InsightsPanel({ insights }: { insights: Insight[] }) {
  if (insights.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-400 shadow-sm">
        No insights yet — load data to see analysis.
      </div>
    );
  }
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {insights.map((ins) => {
        const meta = KIND_META[ins.kind];
        const Icon = meta.icon;
        return (
          <div
            key={ins.id}
            className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md"
          >
            <div className="mb-2 flex items-center gap-2">
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-lg ${meta.bg} ${meta.color}`}
              >
                <Icon size={15} />
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                {meta.label}
              </span>
            </div>
            <h4 className="text-sm font-semibold text-slate-900">
              {ins.title}
            </h4>
            <p className="mt-1 text-xs leading-relaxed text-slate-500">
              {ins.detail}
            </p>
          </div>
        );
      })}
    </div>
  );
}

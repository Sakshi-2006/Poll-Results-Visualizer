import { useState } from "react";
import type { PollRow } from "@/lib/types";

export function DataTable({ rows }: { rows: PollRow[] }) {
  const [page, setPage] = useState(0);
  const pageSize = 12;
  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  const current = Math.min(page, pageCount - 1);
  const slice = rows.slice(current * pageSize, current * pageSize + pageSize);

  return (
    <div>
      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              {[
                "ID",
                "Timestamp",
                "Age",
                "Gender",
                "Region",
                "Preferred Tool",
                "Satisfaction",
                "Feedback",
              ].map((h) => (
                <th
                  key={h}
                  className="whitespace-nowrap px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {slice.map((r) => (
              <tr key={r.id} className="transition hover:bg-slate-50">
                <td className="whitespace-nowrap px-3 py-2 font-mono text-xs text-slate-500">
                  {r.id}
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-xs text-slate-600">
                  {new Date(r.timestamp).toLocaleString(undefined, {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-slate-700">
                  {r.ageGroup}
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-slate-700">
                  {r.gender}
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-slate-700">
                  {r.region}
                </td>
                <td className="whitespace-nowrap px-3 py-2 font-medium text-slate-800">
                  {r.preferredTool}
                </td>
                <td className="whitespace-nowrap px-3 py-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                    {r.satisfaction}/5
                  </span>
                </td>
                <td className="max-w-xs truncate px-3 py-2 text-xs text-slate-500">
                  {r.feedback}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
        <span>
          Showing {slice.length} of {rows.length} rows
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setPage(Math.max(0, current - 1))}
            disabled={current === 0}
            className="rounded-md border border-slate-200 px-2.5 py-1 transition enabled:hover:bg-slate-50 disabled:opacity-40"
          >
            Prev
          </button>
          <span className="px-2">
            {current + 1} / {pageCount}
          </span>
          <button
            onClick={() => setPage(Math.min(pageCount - 1, current + 1))}
            disabled={current >= pageCount - 1}
            className="rounded-md border border-slate-200 px-2.5 py-1 transition enabled:hover:bg-slate-50 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}

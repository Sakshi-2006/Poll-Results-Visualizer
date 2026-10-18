import { Upload, RotateCcw, Download, Filter } from "lucide-react";
import { useRef } from "react";

type DataSourcePanelProps = {
  onUpload: (file: File) => void;
  onUseSample: () => void;
  onExport: () => void;
  fileName?: string;
};

export function DataSourcePanel({
  onUpload,
  onUseSample,
  onExport,
  fileName,
}: DataSourcePanelProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <Filter size={15} className="text-slate-400" />
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Data Source
        </h3>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onUpload(f);
          e.target.value = "";
        }}
      />
      <div className="space-y-2">
        <button
          onClick={() => inputRef.current?.click()}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
        >
          <Upload size={15} />
          Upload CSV
        </button>
        <button
          onClick={onUseSample}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
        >
          <RotateCcw size={15} />
          Load sample poll
        </button>
        <button
          onClick={onExport}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
        >
          <Download size={15} />
          Export cleaned CSV
        </button>
      </div>
      {fileName && (
        <p className="mt-3 truncate text-xs text-slate-400" title={fileName}>
          {fileName}
        </p>
      )}
    </div>
  );
}

type FilterPanelProps = {
  tools: string[];
  selectedTools: string[];
  onToggleTool: (tool: string) => void;
  regions: string[];
  selectedRegions: string[];
  onToggleRegion: (region: string) => void;
  ageGroups: string[];
  selectedAgeGroups: string[];
  onToggleAge: (age: string) => void;
  satisfactionRange: [number, number];
  onSatisfactionChange: (range: [number, number]) => void;
  onReset: () => void;
  activeCount: number;
};

export function FilterPanel({
  tools,
  selectedTools,
  onToggleTool,
  regions,
  selectedRegions,
  onToggleRegion,
  ageGroups,
  selectedAgeGroups,
  onToggleAge,
  satisfactionRange,
  onSatisfactionChange,
  onReset,
  activeCount,
}: FilterPanelProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Filters
        </h3>
        {activeCount > 0 && (
          <button
            onClick={onReset}
            className="text-xs font-medium text-blue-600 transition hover:text-blue-700"
          >
            Reset ({activeCount})
          </button>
        )}
      </div>

      <FilterGroup
        title="Preferred tool"
        options={tools}
        selected={selectedTools}
        onToggle={onToggleTool}
      />
      <FilterGroup
        title="Region"
        options={regions}
        selected={selectedRegions}
        onToggle={onToggleRegion}
      />
      <FilterGroup
        title="Age group"
        options={ageGroups}
        selected={selectedAgeGroups}
        onToggle={onToggleAge}
      />

      <div className="mt-4">
        <p className="mb-2 text-xs font-semibold text-slate-600">
          Satisfaction range: {satisfactionRange[0]} – {satisfactionRange[1]}
        </p>
        <div className="flex items-center gap-3">
          <input
            type="range"
            min={1}
            max={5}
            value={satisfactionRange[0]}
            onChange={(e) =>
              onSatisfactionChange([
                Math.min(Number(e.target.value), satisfactionRange[1]),
                satisfactionRange[1],
              ])
            }
            className="w-full accent-blue-600"
          />
          <input
            type="range"
            min={1}
            max={5}
            value={satisfactionRange[1]}
            onChange={(e) =>
              onSatisfactionChange([
                satisfactionRange[0],
                Math.max(Number(e.target.value), satisfactionRange[0]),
              ])
            }
            className="w-full accent-blue-600"
          />
        </div>
      </div>
    </div>
  );
}

function FilterGroup({
  title,
  options,
  selected,
  onToggle,
}: {
  title: string;
  options: string[];
  selected: string[];
  onToggle: (opt: string) => void;
}) {
  return (
    <div className="mb-3">
      <p className="mb-1.5 text-xs font-semibold text-slate-600">{title}</p>
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => {
          const active = selected.includes(opt);
          return (
            <button
              key={opt}
              onClick={() => onToggle(opt)}
              className={`rounded-full px-2.5 py-1 text-xs font-medium transition ${
                active
                  ? "bg-blue-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}

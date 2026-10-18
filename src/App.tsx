import { useEffect, useMemo, useState } from "react";
import {
  Users,
  Star,
  ThumbsUp,
  Vote,
  Table as TableIcon,
  LayoutDashboard,
  Lightbulb,
} from "lucide-react";

import { Header } from "@/components/Header";
import {
  DataSourcePanel,
  FilterPanel,
} from "@/components/FilterSidebar";
import { InsightsPanel } from "@/components/InsightsPanel";
import { DataTable } from "@/components/DataTable";
import { StatCard } from "@/components/ui/StatCard";
import { Card } from "@/components/ui/Card";
import { BarChartCard, DonutChartCard } from "@/components/charts/CategoryCharts";
import { TrendChartCard } from "@/components/charts/TrendChart";
import { DemographicChart } from "@/components/charts/DemographicChart";
import { WordCloud } from "@/components/charts/WordCloud";

import { generateSamplePoll } from "@/lib/sampleData";
import {
  parseCsv,
  pollRowsToCsv,
  rowsToPollRows,
} from "@/lib/csv";
import {
  averageSatisfaction,
  countBy,
  dailyTrend,
  demographicBreakdown,
  demographicToolMatrix,
  generateInsights,
  satisfactionDistribution,
  sentimentSplit,
  wordFrequencies,
} from "@/lib/analytics";
import { TOOLS, type PollRow } from "@/lib/types";

type Tab = "dashboard" | "insights" | "data";

function App() {
  const [rows, setRows] = useState<PollRow[]>([]);
  const [fileName, setFileName] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [notice, setNotice] = useState<string>("");

  const [selectedTools, setSelectedTools] = useState<string[]>([]);
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [selectedAges, setSelectedAges] = useState<string[]>([]);
  const [satRange, setSatRange] = useState<[number, number]>([1, 5]);
  const [demoDimension, setDemoDimension] = useState<
    "region" | "ageGroup" | "gender"
  >("region");
  const [trendMode, setTrendMode] = useState<"count" | "cumulative">(
    "cumulative"
  );
  const [tab, setTab] = useState<Tab>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Load sample data on first mount so the app isn't empty.
  useEffect(() => {
    setRows(generateSamplePoll());
    setFileName("sample_poll_data.csv");
  }, []);

  const allTools = useMemo(
    () => Array.from(new Set(rows.map((r) => r.preferredTool))).sort(),
    [rows]
  );
  const allRegions = useMemo(
    () => Array.from(new Set(rows.map((r) => r.region))).sort(),
    [rows]
  );
  const allAges = useMemo(
    () =>
      Array.from(new Set(rows.map((r) => r.ageGroup))).sort((a, b) =>
        a.localeCompare(b)
      ),
    [rows]
  );

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (selectedTools.length && !selectedTools.includes(r.preferredTool))
        return false;
      if (selectedRegions.length && !selectedRegions.includes(r.region))
        return false;
      if (selectedAges.length && !selectedAges.includes(r.ageGroup))
        return false;
      if (r.satisfaction < satRange[0] || r.satisfaction > satRange[1])
        return false;
      return true;
    });
  }, [rows, selectedTools, selectedRegions, selectedAges, satRange]);

  const toolCounts = useMemo(
    () => countBy(filtered, (r) => r.preferredTool),
    [filtered]
  );
  const regionCounts = useMemo(
    () => countBy(filtered, (r) => r.region),
    [filtered]
  );
  const satDist = useMemo(() => satisfactionDistribution(filtered), [filtered]);
  const trend = useMemo(() => dailyTrend(filtered), [filtered]);
  const demoMatrix = useMemo(
    () =>
      demographicToolMatrix(
        filtered,
        demoDimension,
        allTools.length ? allTools : TOOLS
      ),
    [filtered, demoDimension, allTools]
  );
  const demoBreak = useMemo(
    () => demographicBreakdown(filtered, demoDimension),
    [filtered, demoDimension]
  );
  const words = useMemo(() => wordFrequencies(filtered), [filtered]);
  const sentiment = useMemo(() => sentimentSplit(filtered), [filtered]);
  const insights = useMemo(() => generateInsights(filtered), [filtered]);
  const avgSat = useMemo(() => averageSatisfaction(filtered), [filtered]);

  const activeFilterCount =
    selectedTools.length +
    selectedRegions.length +
    selectedAges.length +
    (satRange[0] !== 1 || satRange[1] !== 5 ? 1 : 0);

  function handleUpload(file: File) {
    setError("");
    setNotice("");
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? "");
      const raw = parseCsv(text);
      const result = rowsToPollRows(raw);
      if (result.errors.length > 0) {
        setError(result.errors.join(" "));
        return;
      }
      setRows(result.rows);
      setFileName(file.name);
      resetFilters();
      setNotice(
        result.skipped > 0
          ? `Loaded ${result.rows.length} responses (${result.skipped} skipped).`
          : `Loaded ${result.rows.length} responses.`
      );
    };
    reader.onerror = () => setError("Could not read the file.");
    reader.readAsText(file);
  }

  function handleUseSample() {
    setRows(generateSamplePoll());
    setFileName("sample_poll_data.csv");
    setError("");
    setNotice("Loaded 480 synthetic poll responses.");
    resetFilters();
  }

  function handleExport() {
    const csv = pollRowsToCsv(filtered.length ? filtered : rows);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "cleaned_poll_data.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  function resetFilters() {
    setSelectedTools([]);
    setSelectedRegions([]);
    setSelectedAges([]);
    setSatRange([1, 5]);
  }

  function toggle(
    list: string[],
    setter: (v: string[]) => void,
    value: string
  ) {
    setter(
      list.includes(value)
        ? list.filter((v) => v !== value)
        : [...list, value]
    );
  }

  const sentimentTotal =
    sentiment.positive + sentiment.neutral + sentiment.negative;

  const tabs: { id: Tab; label: string; icon: typeof LayoutDashboard }[] = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "insights", label: "Insights", icon: Lightbulb },
    { id: "data", label: "Data", icon: TableIcon },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Header
        responseCount={rows.length}
        onToggleSidebar={() => setSidebarOpen((v) => !v)}
      />

      <div className="mx-auto flex max-w-[1400px] gap-6 px-4 py-6 sm:px-6 lg:px-8">
        {/* Sidebar */}
        <aside
          className={`${
            sidebarOpen ? "fixed inset-y-0 left-0 z-40 w-72 overflow-y-auto bg-slate-50 p-4 pt-20 lg:static lg:z-auto lg:w-72 lg:shrink-0 lg:bg-transparent lg:p-0 lg:pt-0"
              : "hidden lg:block lg:w-72 lg:shrink-0"
          }`}
        >
          <div className="space-y-4">
            <DataSourcePanel
              onUpload={handleUpload}
              onUseSample={handleUseSample}
              onExport={handleExport}
              fileName={fileName}
            />
            <FilterPanel
              tools={allTools}
              selectedTools={selectedTools}
              onToggleTool={(t) => toggle(selectedTools, setSelectedTools, t)}
              regions={allRegions}
              selectedRegions={selectedRegions}
              onToggleRegion={(r) =>
                toggle(selectedRegions, setSelectedRegions, r)
              }
              ageGroups={allAges}
              selectedAgeGroups={selectedAges}
              onToggleAge={(a) => toggle(selectedAges, setSelectedAges, a)}
              satisfactionRange={satRange}
              onSatisfactionChange={setSatRange}
              onReset={resetFilters}
              activeCount={activeFilterCount}
            />
          </div>
        </aside>

        {sidebarOpen && (
          <div
            className="fixed inset-0 z-30 bg-slate-900/40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main */}
        <main className="min-w-0 flex-1">
          {/* Tab bar */}
          <div className="mb-6 flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
            {tabs.map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
                    tab === t.id
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <Icon size={16} />
                  {t.label}
                </button>
              );
            })}
          </div>

          {error && (
            <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
              {error}
            </div>
          )}
          {notice && !error && (
            <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
              {notice}
            </div>
          )}
          {filtered.length === 0 && rows.length > 0 && (
            <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
              No responses match the current filters. Try resetting.
            </div>
          )}

          {tab === "dashboard" && (
            <div className="space-y-6">
              {/* Stat cards */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                  label="Total Responses"
                  value={filtered.length.toLocaleString()}
                  hint={
                    filtered.length !== rows.length
                      ? `${rows.length - filtered.length} filtered out`
                      : "After cleaning"
                  }
                  icon={<Vote size={16} />}
                  accent="blue"
                />
                <StatCard
                  label="Avg Satisfaction"
                  value={avgSat.toFixed(2)}
                  hint="Out of 5.0"
                  icon={<Star size={16} />}
                  accent="amber"
                />
                <StatCard
                  label="Leading Tool"
                  value={toolCounts[0]?.name ?? "—"}
                  hint={
                    toolCounts[0]
                      ? `${toolCounts[0].percent.toFixed(1)}% share`
                      : ""
                  }
                  icon={<Users size={16} />}
                  accent="emerald"
                />
                <StatCard
                  label="Positive Feedback"
                  value={
                    sentimentTotal
                      ? `${Math.round((sentiment.positive / sentimentTotal) * 100)}%`
                      : "—"
                  }
                  hint={`${sentiment.positive} of ${sentimentTotal} text responses`}
                  icon={<ThumbsUp size={16} />}
                  accent="violet"
                />
              </div>

              {/* Top charts row */}
              <div className="grid gap-6 lg:grid-cols-5">
                <Card
                  title="Preferred Tool — Vote Share"
                  subtitle="Count and percentage of responses per option"
                  className="lg:col-span-3"
                >
                  <div className="h-72">
                    <BarChartCard data={toolCounts} showPercent />
                  </div>
                </Card>
                <Card
                  title="Vote Distribution"
                  subtitle="Share of total responses"
                  className="lg:col-span-2"
                >
                  <div className="h-72">
                    <DonutChartCard data={toolCounts} />
                  </div>
                </Card>
              </div>

              {/* Satisfaction + region */}
              <div className="grid gap-6 lg:grid-cols-5">
                <Card
                  title="Satisfaction Rating Distribution"
                  subtitle="How respondents rated on a 1–5 scale"
                  className="lg:col-span-2"
                >
                  <div className="h-64">
                    <BarChartCard
                      data={satDist}
                      colors={["#fca5a5", "#fdba74", "#fcd34d", "#86efac", "#22c55e"]}
                    />
                  </div>
                </Card>
                <Card
                  title="Responses by Region"
                  subtitle="Volume per region"
                  className="lg:col-span-3"
                >
                  <div className="h-64">
                    <BarChartCard data={regionCounts} />
                  </div>
                </Card>
              </div>

              {/* Trend */}
              <Card
                title="Response Trend Over Time"
                subtitle="How responses accumulated across the survey period"
                actions={
                  <div className="flex gap-1 rounded-lg bg-slate-100 p-1 text-xs">
                    {(["cumulative", "count"] as const).map((m) => (
                      <button
                        key={m}
                        onClick={() => setTrendMode(m)}
                        className={`rounded-md px-2.5 py-1 font-medium transition ${
                          trendMode === m
                            ? "bg-white text-slate-900 shadow-sm"
                            : "text-slate-500 hover:text-slate-700"
                        }`}
                      >
                        {m === "cumulative" ? "Cumulative" : "Daily"}
                      </button>
                    ))}
                  </div>
                }
              >
                <div className="h-64">
                  <TrendChartCard data={trend} mode={trendMode} />
                </div>
              </Card>

              {/* Demographic breakdown */}
              <Card
                title="Demographic Comparison"
                subtitle="Tool preference share (%) by demographic group"
                actions={
                  <div className="flex gap-1 rounded-lg bg-slate-100 p-1 text-xs">
                    {(
                      [
                        ["region", "Region"],
                        ["ageGroup", "Age"],
                        ["gender", "Gender"],
                      ] as const
                    ).map(([dim, label]) => (
                      <button
                        key={dim}
                        onClick={() => setDemoDimension(dim)}
                        className={`rounded-md px-2.5 py-1 font-medium transition ${
                          demoDimension === dim
                            ? "bg-white text-slate-900 shadow-sm"
                            : "text-slate-500 hover:text-slate-700"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                }
              >
                <div className="h-72">
                  <DemographicChart
                    data={demoMatrix}
                    tools={allTools.length ? allTools : TOOLS}
                  />
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {demoBreak.entries.map((e) => (
                    <div
                      key={e.name}
                      className="rounded-lg border border-slate-100 bg-slate-50 p-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-slate-800">
                          {e.name}
                        </span>
                        <span className="text-xs text-slate-400">
                          {e.total} resp.
                        </span>
                      </div>
                      <div className="mt-1 text-xs text-slate-500">
                        Top tool:{" "}
                        <span className="font-medium text-slate-700">
                          {e.topTool}
                        </span>{" "}
                        ({e.topToolShare.toFixed(0)}%)
                      </div>
                      <div className="mt-0.5 text-xs text-slate-500">
                        Avg satisfaction:{" "}
                        <span className="font-medium text-slate-700">
                          {e.avgSatisfaction.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Word cloud */}
              <Card
                title="Feedback Word Cloud"
                subtitle="Most common words in open-ended responses"
              >
                <div className="h-72">
                  <WordCloud words={words} />
                </div>
              </Card>
            </div>
          )}

          {tab === "insights" && (
            <div className="space-y-6">
              <Card
                title="Auto-Generated Insights"
                subtitle="Key findings computed from the filtered responses"
              >
                <InsightsPanel insights={insights} />
              </Card>
            </div>
          )}

          {tab === "data" && (
            <Card
              title="Response Data"
              subtitle="Cleaned, standardized rows used in all charts"
            >
              <DataTable rows={filtered} />
            </Card>
          )}
        </main>
      </div>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-[1400px] px-4 py-4 text-center text-xs text-slate-400 sm:px-6 lg:px-8">
          Poll Results Visualizer — load sample data or upload a Google Forms
          CSV export to explore results.
        </div>
      </footer>
    </div>
  );
}

export default App;

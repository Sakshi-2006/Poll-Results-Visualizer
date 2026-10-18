import type { PollRow } from "./types";

export type CategoryDatum = {
  name: string;
  value: number;
  percent: number;
};

export type TrendPoint = {
  date: string;
  count: number;
  cumulative: number;
  avgSatisfaction: number;
};

export type DemographicBreakdown = {
  dimension: "region" | "ageGroup" | "gender";
  entries: {
    name: string;
    total: number;
    avgSatisfaction: number;
    topTool: string;
    topToolShare: number;
    distribution: CategoryDatum[];
  }[];
};

export type WordFreq = { word: string; count: number };

export type Insight = {
  id: string;
  kind: "headline" | "trend" | "demographic" | "rating" | "sentiment";
  title: string;
  detail: string;
};

const STOPWORDS = new Set([
  "the",
  "a",
  "an",
  "and",
  "or",
  "but",
  "is",
  "are",
  "was",
  "were",
  "be",
  "been",
  "being",
  "to",
  "of",
  "in",
  "on",
  "for",
  "with",
  "at",
  "by",
  "from",
  "it",
  "its",
  "this",
  "that",
  "these",
  "those",
  "i",
  "you",
  "we",
  "they",
  "he",
  "she",
  "my",
  "our",
  "their",
  "very",
  "too",
  "so",
  "just",
  "really",
  "have",
  "has",
  "had",
  "not",
  "no",
  "yes",
  "but",
  "than",
  "then",
  "there",
  "here",
  "about",
  "into",
  "out",
  "up",
  "down",
  "over",
  "under",
  "again",
  "more",
  "most",
  "some",
  "any",
  "all",
  "can",
  "will",
  "would",
  "could",
  "should",
  "do",
  "does",
  "did",
  "done",
  "use",
  "using",
  "used",
  "tool",
  "tools",
  "feel",
  "felt",
  "like",
  "get",
  "got",
  "one",
  "two",
  "three",
]);

export function countBy(
  rows: PollRow[],
  field: (r: PollRow) => string
): CategoryDatum[] {
  const counts = new Map<string, number>();
  for (const r of rows) {
    const k = field(r);
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  const total = rows.length || 1;
  return Array.from(counts.entries())
    .map(([name, value]) => ({
      name,
      value,
      percent: (value / total) * 100,
    }))
    .sort((a, b) => b.value - a.value);
}

export function averageSatisfaction(rows: PollRow[]): number {
  if (rows.length === 0) return 0;
  const sum = rows.reduce((s, r) => s + r.satisfaction, 0);
  return sum / rows.length;
}

export function satisfactionDistribution(rows: PollRow[]): CategoryDatum[] {
  const buckets = [1, 2, 3, 4, 5].map((n) => ({
    name: `${n} ${n === 1 ? "star" : "stars"}`,
    value: 0,
    percent: 0,
  }));
  for (const r of rows) {
    const idx = r.satisfaction - 1;
    if (idx >= 0 && idx < buckets.length) buckets[idx].value++;
  }
  const total = rows.length || 1;
  for (const b of buckets) b.percent = (b.value / total) * 100;
  return buckets;
}

export function dailyTrend(rows: PollRow[]): TrendPoint[] {
  const byDay = new Map<
    string,
    { count: number; satSum: number }
  >();
  for (const r of rows) {
    const day = r.timestamp.slice(0, 10);
    const entry = byDay.get(day) ?? { count: 0, satSum: 0 };
    entry.count++;
    entry.satSum += r.satisfaction;
    byDay.set(day, entry);
  }
  const days = Array.from(byDay.entries()).sort(([a], [b]) =>
    a.localeCompare(b)
  );
  let cumulative = 0;
  return days.map(([date, e]) => {
    cumulative += e.count;
    return {
      date,
      count: e.count,
      cumulative,
      avgSatisfaction: e.count ? e.satSum / e.count : 0,
    };
  });
}

export function demographicBreakdown(
  rows: PollRow[],
  dimension: "region" | "ageGroup" | "gender"
): DemographicBreakdown {
  const groups = new Map<string, PollRow[]>();
  for (const r of rows) {
    const key = r[dimension];
    const arr = groups.get(key) ?? [];
    arr.push(r);
    groups.set(key, arr);
  }
  const entries = Array.from(groups.entries())
    .map(([name, group]) => {
      const toolCounts = countBy(group, (r) => r.preferredTool);
      const top = toolCounts[0];
      return {
        name,
        total: group.length,
        avgSatisfaction: averageSatisfaction(group),
        topTool: top?.name ?? "—",
        topToolShare: top?.percent ?? 0,
        distribution: toolCounts,
      };
    })
    .sort((a, b) => b.total - a.total);
  return { dimension, entries };
}

// Build a matrix of demographic-group x tool for stacked / grouped charts.
export function demographicToolMatrix(
  rows: PollRow[],
  dimension: "region" | "ageGroup" | "gender",
  tools: string[]
): { group: string; [tool: string]: string | number }[] {
  const groups = new Map<string, PollRow[]>();
  for (const r of rows) {
    const key = r[dimension];
    const arr = groups.get(key) ?? [];
    arr.push(r);
    groups.set(key, arr);
  }
  return Array.from(groups.entries())
    .map(([group, groupRows]) => {
      const counts: Record<string, number> = {};
      for (const t of tools) counts[t] = 0;
      for (const r of groupRows) {
        if (counts[r.preferredTool] !== undefined) counts[r.preferredTool]++;
      }
      const total = groupRows.length || 1;
      const row: { group: string; [tool: string]: string | number } = {
        group,
      };
      for (const t of tools) {
        row[t] = Number(((counts[t] / total) * 100).toFixed(1));
      }
      return row;
    })
    .sort((a, b) => a.group.localeCompare(b.group));
}

export function wordFrequencies(
  rows: PollRow[],
  limit = 40
): WordFreq[] {
  const freq = new Map<string, number>();
  for (const r of rows) {
    const text = r.feedback.toLowerCase();
    const tokens = text.match(/[a-z][a-z'-]+/g) ?? [];
    for (const tok of tokens) {
      if (STOPWORDS.has(tok) || tok.length < 3) continue;
      freq.set(tok, (freq.get(tok) ?? 0) + 1);
    }
  }
  return Array.from(freq.entries())
    .map(([word, count]) => ({ word, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

const POSITIVE = new Set([
  "love",
  "great",
  "helpful",
  "intuitive",
  "fast",
  "powerful",
  "clean",
  "reliable",
  "amazing",
  "smooth",
  "good",
  "super",
  "useful",
  "awesome",
  "best",
  "excellent",
]);
const NEGATIVE = new Set([
  "slow",
  "confusing",
  "crashes",
  "limited",
  "buggy",
  "clunky",
  "improvement",
  "frustrating",
  "hard",
  "bad",
  "poor",
  "difficult",
  "needs",
  "steep",
]);

export function sentimentSplit(rows: PollRow[]): {
  positive: number;
  neutral: number;
  negative: number;
} {
  let positive = 0;
  let neutral = 0;
  let negative = 0;
  for (const r of rows) {
    const tokens = r.feedback.toLowerCase().match(/[a-z][a-z'-]+/g) ?? [];
    let score = 0;
    for (const t of tokens) {
      if (POSITIVE.has(t)) score++;
      if (NEGATIVE.has(t)) score--;
    }
    if (score > 0) positive++;
    else if (score < 0) negative++;
    else neutral++;
  }
  return { positive, neutral, negative };
}

export function generateInsights(rows: PollRow[]): Insight[] {
  const insights: Insight[] = [];
  if (rows.length === 0) return insights;

  const toolCounts = countBy(rows, (r) => r.preferredTool);
  const topTool = toolCounts[0];
  const runnerUp = toolCounts[1];
  const avg = averageSatisfaction(rows);
  const satDist = satisfactionDistribution(rows);
  const regionBreak = demographicBreakdown(rows, "region");
  const ageBreak = demographicBreakdown(rows, "ageGroup");
  const trend = dailyTrend(rows);
  const sentiment = sentimentSplit(rows);

  insights.push({
    id: "headline-top-tool",
    kind: "headline",
    title: `${topTool.name} leads with ${topTool.percent.toFixed(1)}% of responses`,
    detail:
      runnerUp && topTool.value - runnerUp.value > 0
        ? `Ahead of ${runnerUp.name} (${runnerUp.percent.toFixed(1)}%) by ${(topTool.percent - runnerUp.percent).toFixed(1)} points across ${rows.length} responses.`
        : `Accounts for ${topTool.value} of ${rows.length} total responses.`,
  });

  insights.push({
    id: "rating-average",
    kind: "rating",
    title: `Average satisfaction is ${avg.toFixed(2)} out of 5`,
    detail:
      avg >= 4
        ? "Indicates a broadly positive response from participants."
        : avg >= 3
          ? "Sentiment is middling — worth investigating lower-rated segments."
          : "Signals dissatisfaction; prioritize follow-up on pain points.",
  });

  const promoters =
    satDist.find((d) => d.name.startsWith("5"))?.value ?? 0;
  const detractors =
    (satDist.find((d) => d.name.startsWith("1"))?.value ?? 0) +
    (satDist.find((d) => d.name.startsWith("2"))?.value ?? 0);
  const nps = rows.length
    ? Math.round(((promoters - detractors) / rows.length) * 100)
    : 0;
  insights.push({
    id: "rating-nps",
    kind: "rating",
    title: `Net satisfaction score: ${nps > 0 ? "+" : ""}${nps}`,
    detail: `Based on ${promoters} five-star responses minus ${detractors} one/two-star responses.`,
  });

  if (regionBreak.entries.length > 1) {
    const top = regionBreak.entries[0];
    const bottom = regionBreak.entries[regionBreak.entries.length - 1];
    insights.push({
      id: "demo-region-volume",
      kind: "demographic",
      title: `${top.name} has the most responses (${top.total})`,
      detail: `Top tool there is ${top.topTool} at ${top.topToolShare.toFixed(1)}% share. Lowest volume region is ${bottom.name} (${bottom.total}).`,
    });
  }

  if (ageBreak.entries.length > 1) {
    const sorted = [...ageBreak.entries].sort(
      (a, b) => b.avgSatisfaction - a.avgSatisfaction
    );
    const happiest = sorted[0];
    const leastHappy = sorted[sorted.length - 1];
    insights.push({
      id: "demo-age-satisfaction",
      kind: "demographic",
      title: `${happiest.name} reports the highest satisfaction (${happiest.avgSatisfaction.toFixed(2)})`,
      detail:
        happiest.name !== leastHappy.name
          ? `${leastHappy.name} is lowest at ${leastHappy.avgSatisfaction.toFixed(2)} — a ${(happiest.avgSatisfaction - leastHappy.avgSatisfaction).toFixed(2)}-point gap.`
          : "Satisfaction is roughly even across age groups.",
    });
  }

  if (trend.length > 1) {
    const first = trend[0];
    const last = trend[trend.length - 1];
    const spanDays =
      (new Date(last.date).getTime() - new Date(first.date).getTime()) /
      86400000;
    const perDay = last.cumulative / Math.max(1, Math.round(spanDays));
    insights.push({
      id: "trend-volume",
      kind: "trend",
      title: `${last.cumulative} responses collected over ${Math.max(1, Math.round(spanDays))} days`,
      detail: `Roughly ${perDay.toFixed(1)} responses per day on average between ${first.date} and ${last.date}.`,
    });
  }

  const sentimentTotal =
    sentiment.positive + sentiment.neutral + sentiment.negative;
  if (sentimentTotal > 0) {
    const posPct = (sentiment.positive / sentimentTotal) * 100;
    const negPct = (sentiment.negative / sentimentTotal) * 100;
    insights.push({
      id: "sentiment-split",
      kind: "sentiment",
      title: `${posPct.toFixed(0)}% positive feedback, ${negPct.toFixed(0)}% negative`,
      detail: `Keyword-based sentiment across ${sentimentTotal} feedback responses with text.`,
    });
  }

  return insights;
}

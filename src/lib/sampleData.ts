import {
  AGE_GROUPS,
  GENDERS,
  REGIONS,
  TOOLS,
  type PollRow,
} from "./types";

// Seeded pseudo-random generator so the sample dataset is stable across reloads.
function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const POSITIVE_WORDS = [
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
];
const NEUTRAL_WORDS = [
  "okay",
  "works",
  "decent",
  "learning",
  "getting used to",
  "average",
  "fine",
];
const NEGATIVE_WORDS = [
  "slow",
  "confusing",
  "steep learning curve",
  "crashes",
  "needs improvement",
  "limited",
  "buggy",
  "clunky",
];

const FEEDBACK_TEMPLATES: Record<number, string[]> = {
  5: [
    "Absolutely love it, super helpful and fast",
    "Amazing tool, very intuitive and clean",
    "Powerful and reliable for daily work",
    "Great experience overall, smooth workflow",
  ],
  4: [
    "Great tool, very useful overall",
    "Good and reliable, small learning curve",
    "Works well and feels powerful",
    "Clean and helpful for most tasks",
  ],
  3: [
    "Okay but could be better",
    "Decent, getting used to it",
    "Fine for basic work, limited for advanced",
    "Average experience, works but needs polish",
  ],
  2: [
    "Needs improvement, feels clunky",
    "Confusing at first, slow sometimes",
    "Steep learning curve, limited features",
    "Buggy and not intuitive",
  ],
  1: [
    "Crashes often, frustrating to use",
    "Too slow and confusing",
    "Very limited and clunky",
    "Hard to recommend right now",
  ],
};

function pick<T>(rng: () => number, arr: T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}

function weightedTool(rng: () => number, region: string): string {
  // Create regional preferences so demographic analysis is interesting.
  const weights: Record<string, number[]> = {
    North: [5, 2, 3, 4, 2, 1],
    South: [4, 3, 4, 3, 2, 2],
    East: [3, 4, 5, 2, 3, 2],
    West: [6, 2, 2, 3, 3, 3],
    Central: [4, 2, 5, 3, 2, 2],
  };
  const w = weights[region] ?? [3, 3, 3, 3, 3, 3];
  const total = w.reduce((s, n) => s + n, 0);
  let r = rng() * total;
  for (let i = 0; i < w.length; i++) {
    r -= w[i];
    if (r <= 0) return TOOLS[i];
  }
  return TOOLS[0];
}

export function generateSamplePoll(count = 480, seed = 20241018): PollRow[] {
  const rng = mulberry32(seed);
  const rows: PollRow[] = [];
  const start = new Date("2024-03-01T08:00:00Z").getTime();
  const spanDays = 45;

  for (let i = 0; i < count; i++) {
    const region = pick(rng, REGIONS);
    const ageGroup = pick(rng, AGE_GROUPS);
    const gender = pick(rng, GENDERS);
    const preferredTool = weightedTool(rng, region);

    // Younger respondents lean slightly higher satisfaction; tool matters too.
    const ageBias: Record<string, number> = {
      "18-24": 0.4,
      "25-34": 0.2,
      "35-44": 0,
      "45-54": -0.2,
      "55+": -0.4,
    };
    const toolBias: Record<string, number> = {
      Python: 0.5,
      "Power BI": 0.2,
      Tableau: 0.3,
      R: 0,
      Excel: -0.2,
      SQL: 0.1,
    };
    const base = 3.2 + (ageBias[ageGroup] ?? 0) + (toolBias[preferredTool] ?? 0);
    let satisfaction = Math.round(base + (rng() * 2 - 1));
    satisfaction = Math.max(1, Math.min(5, satisfaction));

    const templates = FEEDBACK_TEMPLATES[satisfaction];
    let feedback = pick(rng, templates);
    // Occasionally append a keyword for richer word-cloud signal.
    if (rng() > 0.5) {
      const pool =
        satisfaction >= 4
          ? POSITIVE_WORDS
          : satisfaction === 3
            ? NEUTRAL_WORDS
            : NEGATIVE_WORDS;
      feedback = `${feedback} ${pick(rng, pool)}`;
    }

    const dayOffset = Math.floor(rng() * spanDays);
    const hour = 8 + Math.floor(rng() * 12);
    const minute = Math.floor(rng() * 60);
    const ts = new Date(start + dayOffset * 86400000);
    ts.setUTCHours(hour, minute, Math.floor(rng() * 60));

    rows.push({
      id: `R${(i + 1).toString().padStart(4, "0")}`,
      timestamp: ts.toISOString(),
      ageGroup,
      gender,
      region,
      preferredTool,
      satisfaction,
      feedback,
    });
  }

  // Sort chronologically so trend charts read naturally.
  rows.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  return rows;
}

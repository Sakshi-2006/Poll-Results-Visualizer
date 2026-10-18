import type { PollRow } from "./types";
import { AGE_GROUPS, GENDERS, REGIONS, TOOLS } from "./types";

// Minimal CSV parser that handles quoted fields, escaped quotes, and CRLF.
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let field = "";
  let row: string[] = [];
  let inQuotes = false;

  const normalized = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  for (let i = 0; i < normalized.length; i++) {
    const ch = normalized[i];
    if (inQuotes) {
      if (ch === '"') {
        if (normalized[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (ch === ",") {
      row.push(field);
      field = "";
    } else {
      field += ch;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => c.trim().length > 0));
}

// Map a variety of header spellings to our canonical PollRow fields.
const HEADER_ALIASES: Record<string, keyof PollRow> = {
  timestamp: "timestamp",
  date: "timestamp",
  time: "timestamp",
  submitted: "timestamp",
  agegroup: "ageGroup",
  "age group": "ageGroup",
  age: "ageGroup",
  gender: "gender",
  sex: "gender",
  region: "region",
  location: "region",
  area: "region",
  preferredtool: "preferredTool",
  "preferred tool": "preferredTool",
  tool: "preferredTool",
  favorite: "preferredTool",
  "favorite tool": "preferredTool",
  satisfaction: "satisfaction",
  "satisfaction (1-5)": "satisfaction",
  rating: "satisfaction",
  score: "satisfaction",
  feedback: "feedback",
  comment: "feedback",
  comments: "feedback",
  response: "feedback",
};

function normalizeKey(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, " ");
}

function standardizeTool(raw: string): string {
  const v = raw.trim();
  const match = TOOLS.find(
    (t) => t.toLowerCase() === v.toLowerCase()
  );
  return match ?? v.replace(/\b\w/g, (c) => c.toUpperCase());
}

function standardizeRegion(raw: string): string {
  const v = raw.trim();
  const match = REGIONS.find((r) => r.toLowerCase() === v.toLowerCase());
  return match ?? v.replace(/\b\w/g, (c) => c.toUpperCase());
}

function standardizeAgeGroup(raw: string): string {
  const v = raw.trim();
  const match = AGE_GROUPS.find((a) => a === v);
  return match ?? v;
}

function standardizeGender(raw: string): string {
  const v = raw.trim();
  const lower = v.toLowerCase();
  if (lower === "m" || lower === "male") return "Male";
  if (lower === "f" || lower === "female") return "Female";
  if (lower.startsWith("non")) return "Non-binary";
  const match = GENDERS.find((g) => g.toLowerCase() === lower);
  return match ?? v;
}

export function rowsToPollRows(rawRows: string[][]): {
  rows: PollRow[];
  skipped: number;
  errors: string[];
} {
  const errors: string[] = [];
  if (rawRows.length === 0) {
    return { rows: [], skipped: 0, errors: ["The file appears to be empty."] };
  }

  const header = rawRows[0].map(normalizeKey);
  const colMap: Partial<Record<keyof PollRow, number>> = {};
  header.forEach((h, i) => {
    const key = HEADER_ALIASES[h];
    if (key && colMap[key] === undefined) colMap[key] = i;
  });

  const required: (keyof PollRow)[] = [
    "timestamp",
    "ageGroup",
    "region",
    "preferredTool",
    "satisfaction",
  ];
  const missing = required.filter((k) => colMap[k] === undefined);
  if (missing.length > 0) {
    errors.push(
      `Missing required columns: ${missing.join(", ")}. ` +
        `Expected headers like Timestamp, Age Group, Region, Preferred Tool, Satisfaction (1-5), Feedback.`
    );
    return { rows: [], skipped: 0, errors };
  }

  const rows: PollRow[] = [];
  let skipped = 0;

  for (let i = 1; i < rawRows.length; i++) {
    const r = rawRows[i];
    const get = (k: keyof PollRow) => {
      const idx = colMap[k];
      return idx === undefined ? "" : (r[idx] ?? "").trim();
    };

    const rawSatisfaction = get("satisfaction");
    const satisfaction = Number(rawSatisfaction);
    if (!rawSatisfaction || Number.isNaN(satisfaction)) {
      skipped++;
      continue;
    }

    const rawTs = get("timestamp");
    let ts = rawTs ? new Date(rawTs).toISOString() : "";
    if (!rawTs || Number.isNaN(Date.parse(rawTs))) {
      ts = new Date().toISOString();
    }

    rows.push({
      id: `R${i.toString().padStart(4, "0")}`,
      timestamp: ts,
      ageGroup: standardizeAgeGroup(get("ageGroup")),
      gender: standardizeGender(get("gender") || "Unknown"),
      region: standardizeRegion(get("region")),
      preferredTool: standardizeTool(get("preferredTool")),
      satisfaction: Math.max(1, Math.min(5, Math.round(satisfaction))),
      feedback: get("feedback") || "",
    });
  }

  if (rows.length === 0) {
    errors.push("No valid rows could be parsed from the file.");
  }
  return { rows, skipped, errors };
}

export function pollRowsToCsv(rows: PollRow[]): string {
  const headers = [
    "Timestamp",
    "Age Group",
    "Gender",
    "Region",
    "Preferred Tool",
    "Satisfaction (1-5)",
    "Feedback",
  ];
  const escape = (v: string) =>
    /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
  const lines = rows.map((r) =>
    [
      r.timestamp,
      r.ageGroup,
      r.gender,
      r.region,
      r.preferredTool,
      String(r.satisfaction),
      r.feedback,
    ]
      .map((v) => escape(String(v)))
      .join(",")
  );
  return [headers.join(","), ...lines].join("\n");
}

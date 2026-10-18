import { useMemo } from "react";
import type { WordFreq } from "@/lib/analytics";

type WordCloudProps = {
  words: WordFreq[];
  max?: number;
};

const PALETTE = [
  "#2563eb",
  "#0891b2",
  "#059669",
  "#d97706",
  "#dc2626",
  "#7c3aed",
  "#db2777",
  "#0d9488",
  "#ca8a04",
  "#4f46e5",
];

type Placed = {
  word: string;
  count: number;
  x: number;
  y: number;
  fontSize: number;
  color: string;
  rotate: boolean;
};

// Simple deterministic layout: spiral placement with overlap checks.
export function WordCloud({ words, max = 28 }: WordCloudProps) {
  const placed = useMemo<Placed[]>(() => {
    const top = words.slice(0, max);
    if (top.length === 0) return [];
    const maxCount = top[0].count;
    const minCount = top[top.length - 1].count;
    const width = 720;
    const height = 360;
    const placedBoxes: {
      x: number;
      y: number;
      w: number;
      h: number;
    }[] = [];

    const result: Placed[] = [];
    const centerX = width / 2;
    const centerY = height / 2;

    for (let i = 0; i < top.length; i++) {
      const w = top[i];
      const ratio =
        maxCount === minCount
          ? 1
          : (w.count - minCount) / (maxCount - minCount);
      const fontSize = 14 + ratio * 34;
      const rotate = i % 5 === 2;
      // Rough text box estimate.
      const boxW = Math.max(
        rotate ? fontSize * 0.9 : w.word.length * fontSize * 0.62,
        40
      );
      const boxH = rotate ? w.word.length * fontSize * 0.55 : fontSize * 1.3;

      let placedOk = false;
      let x = centerX;
      let y = centerY;
      const step = 6;
      const maxRadius = Math.min(width, height) / 2 - 10;
      for (let r = 0; r < maxRadius && !placedOk; r += step) {
        const points = Math.max(8, Math.floor((r / step) * 6));
        for (let p = 0; p < points && !placedOk; p++) {
          const angle = (p / points) * Math.PI * 2 + i * 0.4;
          const cx = centerX + r * Math.cos(angle);
          const cy = centerY + r * Math.sin(angle);
          const bx = cx - boxW / 2;
          const by = cy - boxH / 2;
          if (bx < 2 || by < 2 || bx + boxW > width - 2 || by + boxH > height - 2)
            continue;
          const overlaps = placedBoxes.some(
            (b) =>
              bx < b.x + b.w &&
              bx + boxW > b.x &&
              by < b.y + b.h &&
              by + boxH > b.y
          );
          if (!overlaps) {
            x = cx;
            y = cy;
            placedBoxes.push({ x: bx, y: by, w: boxW, h: boxH });
            placedOk = true;
          }
        }
      }
      if (!placedOk) continue;
      result.push({
        word: w.word,
        count: w.count,
        x,
        y,
        fontSize,
        color: PALETTE[i % PALETTE.length],
        rotate,
      });
    }
    return result;
  }, [words, max]);

  if (placed.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-slate-400">
        No feedback text available to cloud.
      </div>
    );
  }

  return (
    <div className="h-full w-full overflow-hidden">
      <svg
        viewBox="0 0 720 360"
        preserveAspectRatio="xMidYMid meet"
        className="h-full w-full"
      >
        {placed.map((p) => (
          <g
            key={p.word}
            transform={`translate(${p.x} ${p.y})${
              p.rotate ? " rotate(-45)" : ""
            }`}
          >
            <title>
              {p.word} — {p.count} mentions
            </title>
            <text
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={p.fontSize}
              fill={p.color}
              fontWeight={p.fontSize > 28 ? 700 : 600}
              style={{
                fontFamily: "Inter, system-ui, sans-serif",
                cursor: "default",
              }}
            >
              {p.word}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

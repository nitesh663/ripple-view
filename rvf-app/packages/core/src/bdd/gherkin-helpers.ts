import type { BddTag } from './types.js';

export const STEP_KEYWORDS = ['Given', 'When', 'Then', 'And', 'But'] as const;
export type StepKeyword = (typeof STEP_KEYWORDS)[number];

export function parseTags(line: string): BddTag[] {
  return line
    .trim()
    .split(/\s+/)
    .filter((t) => t.startsWith('@'))
    .map((t) => ({ name: t.slice(1) }));
}

export function parseDataTable(
  lines: string[],
  startIndex: number,
): {
  table: readonly Readonly<Record<string, string>>[];
  consumed: number;
} {
  const rows: string[][] = [];
  let i = startIndex;

  while (i < lines.length) {
    const l = lines[i]?.trim() ?? '';
    if (!l.startsWith('|')) {
      break;
    }
    const cells = l
      .split('|')
      .slice(1, -1)
      .map((c) => c.trim());
    rows.push(cells);
    i++;
  }

  if (rows.length < 2) {
    return { table: [], consumed: 0 };
  }

  const headers = rows[0] ?? [];
  const table = rows.slice(1).map((row) => {
    const entry: Record<string, string> = {};
    headers.forEach((h, idx) => {
      entry[h] = row[idx] ?? '';
    });
    return entry;
  });

  return { table, consumed: i - startIndex };
}

export function parseStepKeyword(line: string): StepKeyword | null {
  for (const kw of STEP_KEYWORDS) {
    if (line.trimStart().startsWith(`${kw} `)) {
      return kw;
    }
  }
  return null;
}

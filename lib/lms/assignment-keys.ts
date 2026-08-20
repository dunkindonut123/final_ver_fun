import { HSK_LEVELS, isValidHskLevel, MAX_HSK_LEVEL } from "@/lib/lms/hsk-levels";

export const ASSIGNMENT_A_KEYS = [
  "A1",
  "A2",
  "A3",
  "A4",
  "A5",
  "A6",
  "A7",
  "A8",
  "A9",
  "A10",
] as const;
export type AssignmentALevel = (typeof ASSIGNMENT_A_KEYS)[number];

export const ASSIGNMENT_KEYS = [...ASSIGNMENT_A_KEYS, "B"] as const;
export type AssignmentKey = (typeof ASSIGNMENT_KEYS)[number];

export const MAX_ASSIGNMENT_A_COUNT = ASSIGNMENT_A_KEYS.length;
export const ASSIGNMENT_B_ORDER_INDEX = MAX_ASSIGNMENT_A_COUNT + 1;

/**
 * Number of Assignment A slots per HSK level (1–10 each, independently).
 * Change any level here, then copy the same numbers into
 * supabase/migration_v2_assignment_a_count_by_hsk.sql a_counts and re-run it.
 */
export const ASSIGNMENT_A_COUNT_BY_HSK: Record<number, number> = {
  1: 3,
  2: 4,
  3: 4,
  4: 4,
  5: 4,
  6: 4,
  7: 4,
  8: 4,
  9: 4,
};

function assertAssignmentACountMap() {
  for (const level of HSK_LEVELS) {
    const count = ASSIGNMENT_A_COUNT_BY_HSK[level];
    if (!Number.isInteger(count) || count < 1 || count > MAX_ASSIGNMENT_A_COUNT) {
      throw new Error(
        `ASSIGNMENT_A_COUNT_BY_HSK[${level}] must be an integer from 1 to ${MAX_ASSIGNMENT_A_COUNT}`
      );
    }
  }
}

assertAssignmentACountMap();

export function assignmentACountForHsk(hskLevel: number): number {
  if (!isValidHskLevel(hskLevel)) {
    throw new Error(`Invalid HSK level: ${hskLevel}`);
  }

  return ASSIGNMENT_A_COUNT_BY_HSK[hskLevel];
}

export function assignmentAKeysForHsk(hskLevel: number): AssignmentALevel[] {
  return ASSIGNMENT_A_KEYS.slice(0, assignmentACountForHsk(hskLevel));
}

export function assignmentKeysForHsk(hskLevel: number): AssignmentKey[] {
  return [...assignmentAKeysForHsk(hskLevel), "B"];
}

export function lastAssignmentAKeyForHsk(hskLevel: number): AssignmentALevel {
  const keys = assignmentAKeysForHsk(hskLevel);
  const last = keys[keys.length - 1];
  if (!last) {
    throw new Error(`HSK ${hskLevel} has no Assignment A slots`);
  }
  return last;
}

export function isAssignmentKey(value: string): value is AssignmentKey {
  return (ASSIGNMENT_KEYS as readonly string[]).includes(value);
}

export function isAssignmentALevel(value: string): value is AssignmentALevel {
  return (ASSIGNMENT_A_KEYS as readonly string[]).includes(value);
}

export function isAssignmentKeyForHsk(hskLevel: number, key: string): boolean {
  if (!isValidHskLevel(hskLevel) || !isAssignmentKey(key)) {
    return false;
  }

  return assignmentKeysForHsk(hskLevel).includes(key);
}

/** Fallback when a chapter id cannot be parsed: use MAX_HSK_LEVEL's configured slots. */
export function resolveHskLevelForAssignments(hskLevel: number | null | undefined): number {
  return isValidHskLevel(hskLevel ?? Number.NaN) ? (hskLevel as number) : MAX_HSK_LEVEL;
}

export function parseHskLevelFromChapterId(chapterId: string): number | null {
  const match = chapterId.match(/^hsk(\d+)-ch\d+$/i);
  if (!match) return null;
  const level = Number.parseInt(match[1], 10);
  return isValidHskLevel(level) ? level : null;
}

export function assignmentAKeysLabelForHsk(hskLevel: number): string {
  const keys = assignmentAKeysForHsk(hskLevel);
  if (keys.length === 1) {
    return keys[0];
  }
  return `${keys[0]}–${keys[keys.length - 1]}`;
}

/** Compact legend derived from the map, e.g. "HSK 1: A1–A10 + B; HSK 2–9: A1–A4 + B". */
export function assignmentACountLegend(): string {
  const groups: { start: number; end: number; count: number }[] = [];

  for (const level of HSK_LEVELS) {
    const count = assignmentACountForHsk(level);
    const last = groups[groups.length - 1];
    if (last && last.count === count) {
      last.end = level;
    } else {
      groups.push({ start: level, end: level, count });
    }
  }

  return groups
    .map((group) => {
      const hskLabel =
        group.start === group.end ? `HSK ${group.start}` : `HSK ${group.start}–${group.end}`;
      const aLabel = assignmentAKeysLabelForHsk(group.start);
      return `${hskLabel}: ${aLabel} + B`;
    })
    .join("; ");
}

/** SQL VALUES rows for a_counts. Paste into migration_v2_assignment_a_count_by_hsk.sql when the map changes. */
export function assignmentACountSqlValues(): string {
  return HSK_LEVELS.map((level) => `(${level}, ${assignmentACountForHsk(level)})`).join(",\n    ");
}

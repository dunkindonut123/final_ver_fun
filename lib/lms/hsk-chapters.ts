import { HSK_LEVELS, isValidHskLevel } from "@/lib/lms/hsk-levels";

export const MAX_CHAPTER_COUNT = 15;

/**
 * Number of chapters per HSK level (1–15 each, independently).
 * Change any level here, then copy the same numbers into
 * supabase/migration_v2_chapter_count_by_hsk.sql chapter_counts and re-run it.
 * After that, re-run migration_v2_assignment_a_count_by_hsk.sql so new chapters
 * get assignment slots.
 */
export const CHAPTER_COUNT_BY_HSK: Record<number, number> = {
  1: 15,
  2: 15,
  3: 15,
  4: 15,
  5: 15,
  6: 15,
  7: 15,
  8: 15,
  9: 15,
};

function assertChapterCountMap() {
  for (const level of HSK_LEVELS) {
    const count = CHAPTER_COUNT_BY_HSK[level];
    if (!Number.isInteger(count) || count < 1 || count > MAX_CHAPTER_COUNT) {
      throw new Error(
        `CHAPTER_COUNT_BY_HSK[${level}] must be an integer from 1 to ${MAX_CHAPTER_COUNT}`
      );
    }
  }
}

assertChapterCountMap();

export function chapterCountForHsk(hskLevel: number): number {
  if (!isValidHskLevel(hskLevel)) {
    throw new Error(`Invalid HSK level: ${hskLevel}`);
  }

  return CHAPTER_COUNT_BY_HSK[hskLevel];
}

export function chapterIdFor(hskLevel: number, chapterNumber: number): string {
  return `hsk${hskLevel}-ch${chapterNumber}`;
}

export function chapterIdsForHsk(hskLevel: number): string[] {
  const count = chapterCountForHsk(hskLevel);
  return Array.from({ length: count }, (_, index) => chapterIdFor(hskLevel, index + 1));
}

const CHAPTER_ID_RE = /^hsk(\d+)-ch(\d+)$/i;

export function parseChapterId(
  chapterId: string
): { hskLevel: number; chapterNumber: number } | null {
  const match = chapterId.match(CHAPTER_ID_RE);
  if (!match) return null;
  const hskLevel = Number.parseInt(match[1], 10);
  const chapterNumber = Number.parseInt(match[2], 10);
  if (!isValidHskLevel(hskLevel) || !Number.isInteger(chapterNumber) || chapterNumber < 1) {
    return null;
  }
  return { hskLevel, chapterNumber };
}

export function parseChapterNumberFromChapterId(chapterId: string): number | null {
  return parseChapterId(chapterId)?.chapterNumber ?? null;
}

export function isChapterIdForHsk(hskLevel: number, chapterId: string): boolean {
  if (!isValidHskLevel(hskLevel)) {
    return false;
  }

  const parsed = parseChapterId(chapterId);
  if (!parsed || parsed.hskLevel !== hskLevel) {
    return false;
  }

  return parsed.chapterNumber <= chapterCountForHsk(hskLevel);
}

/** Compact legend derived from the map, e.g. "HSK 1: 5 chapters; HSK 2–9: 10 chapters". */
export function chapterCountLegend(): string {
  const groups: { start: number; end: number; count: number }[] = [];

  for (const level of HSK_LEVELS) {
    const count = chapterCountForHsk(level);
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
      const chapterLabel = group.count === 1 ? "1 chapter" : `${group.count} chapters`;
      return `${hskLabel}: ${chapterLabel}`;
    })
    .join("; ");
}

/** SQL VALUES rows for chapter_counts. Paste into migration_v2_chapter_count_by_hsk.sql when the map changes. */
export function chapterCountSqlValues(): string {
  return HSK_LEVELS.map((level) => `(${level}, ${chapterCountForHsk(level)})`).join(",\n    ");
}

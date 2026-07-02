export const MIN_HSK_LEVEL = 1;
export const MAX_HSK_LEVEL = 9;

export const HSK_LEVELS = Array.from(
  { length: MAX_HSK_LEVEL - MIN_HSK_LEVEL + 1 },
  (_, index) => MIN_HSK_LEVEL + index
);

export function isValidHskLevel(value: number): boolean {
  return Number.isInteger(value) && value >= MIN_HSK_LEVEL && value <= MAX_HSK_LEVEL;
}

export function hskLevelRangeLabel(): string {
  return `${MIN_HSK_LEVEL}–${MAX_HSK_LEVEL}`;
}

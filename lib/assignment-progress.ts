import {
  ASSIGNMENT_KEYS,
  ASSIGNMENT_B_ORDER_INDEX,
  assignmentKeysForHsk,
  isAssignmentKey,
  resolveHskLevelForAssignments,
  type AssignmentKey,
} from "@/lib/lms/assignment-keys";

export { ASSIGNMENT_KEYS, type AssignmentKey };

export interface AssignmentProgressRow {
  chapter_id: string;
  assignment_key: AssignmentKey;
  is_completed: boolean;
  completed_at: string | null;
}

export interface ChapterProgressRow {
  chapter_id: string;
  score: number | null;
  is_completed: boolean;
  time_spent_minutes: number | null;
  last_accessed: string | null;
}

export interface AssignmentSummary {
  completedKeys: AssignmentKey[];
  completedCount: number;
  totalCount: number;
  isComplete: boolean;
  nextKey: AssignmentKey | null;
}

export interface AssignmentStepConfig {
  key: AssignmentKey;
  label: string;
  chapterExerciseLabel: string;
  order: number;
}

export function assignmentStepConfig(key: AssignmentKey): AssignmentStepConfig {
  if (key === "B") {
    return {
      key: "B",
      label: "Assignment B",
      chapterExerciseLabel: "B",
      order: ASSIGNMENT_B_ORDER_INDEX,
    };
  }

  const levelNumber = Number(key.slice(1));
  return {
    key,
    label: `Assignment A - Level ${levelNumber}`,
    chapterExerciseLabel: key,
    order: levelNumber,
  };
}

export function assignmentStepsForHsk(hskLevel: number): AssignmentStepConfig[] {
  return assignmentKeysForHsk(resolveHskLevelForAssignments(hskLevel)).map(assignmentStepConfig);
}

/** Full A1–A10 + B set. Prefer assignmentStepsForHsk when the HSK level is known. */
export const ASSIGNMENT_STEPS: AssignmentStepConfig[] = assignmentStepsForHsk(
  resolveHskLevelForAssignments(null)
);

export function normalizeAssignmentKey(value: string): AssignmentKey | null {
  return isAssignmentKey(value) ? value : null;
}

export function summarizeAssignmentProgress(
  rows: AssignmentProgressRow[],
  hskLevel: number
): AssignmentSummary {
  const steps = assignmentStepsForHsk(hskLevel);
  const completedKeys = steps.reduce<AssignmentKey[]>((result, step) => {
    const matchingRow = rows.find((row) => row.assignment_key === step.key && row.is_completed);

    if (matchingRow) {
      result.push(step.key);
    }

    return result;
  }, []);

  const nextKey = steps.find((step) => !completedKeys.includes(step.key))?.key ?? null;

  return {
    completedKeys,
    completedCount: completedKeys.length,
    totalCount: steps.length,
    isComplete: completedKeys.length === steps.length,
    nextKey,
  };
}

export function isAssignmentUnlocked(
  stepKey: AssignmentKey,
  summary: AssignmentSummary,
  hskLevel: number
): boolean {
  const keys = assignmentKeysForHsk(resolveHskLevelForAssignments(hskLevel));
  const index = keys.indexOf(stepKey);
  if (index <= 0) {
    return index === 0;
  }

  const previousKey = keys[index - 1];
  return previousKey !== undefined && summary.completedKeys.includes(previousKey);
}

export function scoreToCompletedAssignments(
  score: number | null | undefined,
  hskLevel: number
): number {
  if (typeof score !== "number" || Number.isNaN(score)) {
    return 0;
  }

  const total = assignmentKeysForHsk(resolveHskLevelForAssignments(hskLevel)).length;
  if (total === 0) {
    return 0;
  }

  const step = 100 / total;
  return Math.min(total, Math.max(0, Math.floor(score / step)));
}

export function completedAssignmentsToScore(completedAssignments: number, hskLevel: number): number {
  const total = assignmentKeysForHsk(resolveHskLevelForAssignments(hskLevel)).length;
  const bounded = Math.min(Math.max(completedAssignments, 0), total);
  if (total === 0) {
    return 0;
  }

  return Math.round((bounded / total) * 100);
}

export function summaryFromCompletedCount(
  completedCount: number,
  hskLevel: number
): AssignmentSummary {
  const steps = assignmentStepsForHsk(hskLevel);
  const bounded = Math.min(Math.max(completedCount, 0), steps.length);
  const completedKeys = steps.slice(0, bounded).map((step) => step.key);

  return {
    completedKeys,
    completedCount: bounded,
    totalCount: steps.length,
    isComplete: bounded === steps.length,
    nextKey: steps[bounded]?.key ?? null,
  };
}

export function summaryFromChapterProgress(
  score: number | null | undefined,
  hskLevel: number
): AssignmentSummary {
  return summaryFromCompletedCount(scoreToCompletedAssignments(score, hskLevel), hskLevel);
}

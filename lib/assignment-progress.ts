export const ASSIGNMENT_KEYS = ["A1", "A2", "A3", "A4", "B"] as const;

export type AssignmentKey = (typeof ASSIGNMENT_KEYS)[number];

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

export const ASSIGNMENT_STEPS: AssignmentStepConfig[] = [
  {
    key: "A1",
    label: "Assignment A - Level 1",
    chapterExerciseLabel: "A1",
    order: 1,
  },
  {
    key: "A2",
    label: "Assignment A - Level 2",
    chapterExerciseLabel: "A2",
    order: 2,
  },
  {
    key: "A3",
    label: "Assignment A - Level 3",
    chapterExerciseLabel: "A3",
    order: 3,
  },
  {
    key: "A4",
    label: "Assignment A - Level 4",
    chapterExerciseLabel: "A4",
    order: 4,
  },
  {
    key: "B",
    label: "Assignment B",
    chapterExerciseLabel: "B",
    order: 5,
  },
];

export function normalizeAssignmentKey(value: string): AssignmentKey | null {
  return ASSIGNMENT_KEYS.includes(value as AssignmentKey) ? (value as AssignmentKey) : null;
}

export function summarizeAssignmentProgress(rows: AssignmentProgressRow[]): AssignmentSummary {
  const completedKeys = ASSIGNMENT_STEPS.reduce<AssignmentKey[]>((result, step) => {
    const matchingRow = rows.find((row) => row.assignment_key === step.key && row.is_completed);

    if (matchingRow) {
      result.push(step.key);
    }

    return result;
  }, []);

  const nextKey = ASSIGNMENT_STEPS.find((step) => !completedKeys.includes(step.key))?.key ?? null;

  return {
    completedKeys,
    completedCount: completedKeys.length,
    totalCount: ASSIGNMENT_STEPS.length,
    isComplete: completedKeys.length === ASSIGNMENT_STEPS.length,
    nextKey,
  };
}

export function isAssignmentUnlocked(stepKey: AssignmentKey, summary: AssignmentSummary): boolean {
  if (stepKey === "A1") {
    return true;
  }

  if (stepKey === "A2") {
    return summary.completedKeys.includes("A1");
  }

  if (stepKey === "A3") {
    return summary.completedKeys.includes("A2");
  }

  if (stepKey === "A4") {
    return summary.completedKeys.includes("A3");
  }

  return summary.completedKeys.includes("A4");
}

export function scoreToCompletedAssignments(score: number | null | undefined): number {
  if (typeof score !== "number" || Number.isNaN(score)) {
    return 0;
  }

  if (score >= 100) {
    return 5;
  }

  if (score >= 80) {
    return 4;
  }

  if (score >= 60) {
    return 3;
  }

  if (score >= 40) {
    return 2;
  }

  if (score >= 20) {
    return 1;
  }

  return 0;
}

export function completedAssignmentsToScore(completedAssignments: number): number {
  const bounded = Math.min(Math.max(completedAssignments, 0), ASSIGNMENT_KEYS.length);
  return bounded * 20;
}

export function summaryFromChapterProgress(score: number | null | undefined): AssignmentSummary {
  const completedCount = scoreToCompletedAssignments(score);
  const completedKeys = ASSIGNMENT_STEPS.slice(0, completedCount).map((step) => step.key);

  return {
    completedKeys,
    completedCount,
    totalCount: ASSIGNMENT_STEPS.length,
    isComplete: completedCount === ASSIGNMENT_STEPS.length,
    nextKey: ASSIGNMENT_STEPS[completedCount]?.key ?? null,
  };
}
function asCount(value: number | null | undefined): number | null {
  return typeof value === "number" && !Number.isNaN(value) ? value : null;
}

export function formatAAssignmentScoreDisplay(
  score: number | null | undefined,
  correctCount: number | null | undefined,
  totalQuestions: number | null | undefined,
  questionPoolCount?: number | null
): string | null {
  const storedTotal = asCount(totalQuestions);
  const poolTotal = asCount(questionPoolCount);
  const resolvedTotal = storedTotal ?? poolTotal;

  const storedCorrect = asCount(correctCount);
  const resolvedCorrect =
    storedCorrect ??
    (asCount(score) !== null && resolvedTotal !== null && resolvedTotal > 0
      ? Math.round((score! / 100) * resolvedTotal)
      : null);

  if (resolvedCorrect !== null && resolvedTotal !== null && resolvedTotal > 0) {
    const percent =
      asCount(score) ?? Math.round((resolvedCorrect / resolvedTotal) * 100);
    return `${resolvedCorrect}/${resolvedTotal} correct (${percent}%)`;
  }

  if (asCount(score) !== null) {
    return `${score}%`;
  }

  return null;
}

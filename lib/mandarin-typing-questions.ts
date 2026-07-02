export interface MandarinTypingQuestion {
	id: number
	answer: string
	meaningHintId: string
	pinyinHint: string
}

export type AssignmentALevel = "A1" | "A2" | "A3"

const ASSIGNMENT_A_LEVELS: AssignmentALevel[] = ["A1", "A2", "A3"]

export function isAssignmentALevel(value: string): value is AssignmentALevel {
	return ASSIGNMENT_A_LEVELS.includes(value as AssignmentALevel)
}

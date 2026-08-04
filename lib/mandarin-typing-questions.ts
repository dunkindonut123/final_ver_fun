export interface MandarinTypingQuestion {
	id: number
	answer: string
	meaningHintId: string
	pinyinHint: string
}

export type AssignmentALevel = "A1" | "A2" | "A3"

const ASSIGNMENT_A_LEVELS: AssignmentALevel[] = ["A1", "A2", "A3"]

/** Punctuation/symbols/spaces that are pre-filled; students only type the rest. */
const ANSWER_STOPWORD_PATTERN = /[\s\p{P}\p{S}]/u

export function isAssignmentALevel(value: string): value is AssignmentALevel {
	return ASSIGNMENT_A_LEVELS.includes(value as AssignmentALevel)
}

export function isAnswerStopword(char: string): boolean {
	return ANSWER_STOPWORD_PATTERN.test(char)
}

export function getAnswerCharacters(answer: string): string[] {
	return Array.from(answer)
}

/** Answer-key characters students must type (stopwords removed). */
export function stripAnswerStopwords(answer: string): string {
	return getAnswerCharacters(answer)
		.filter((char) => !isAnswerStopword(char))
		.join("")
}

/**
 * Strip pre-filled stopwords from student input.
 * Keeps hanzi, Latin letters, digits, etc. so English and IME pinyin both work.
 */
export function filterStudentHanziInput(value: string): string {
	return getAnswerCharacters(value)
		.filter((char) => !isAnswerStopword(char))
		.join("")
}

/**
 * Merge typed hanzi into the answer template, keeping stopwords in place.
 * Incomplete slots become empty strings so the joined result won't match the key.
 */
export function reconstructAnswerFromHanzi(
	answerKey: string,
	userHanziInput: string
): string {
	const typed = getAnswerCharacters(filterStudentHanziInput(userHanziInput))
	let typedIndex = 0

	return getAnswerCharacters(answerKey)
		.map((char) => {
			if (isAnswerStopword(char)) {
				return char
			}
			const next = typed[typedIndex] ?? ""
			typedIndex += 1
			return next
		})
		.join("")
}

/** Per-slot display values: stopwords always shown; other slots show typed hanzi. */
export function getAnswerSlotDisplays(
	answerKey: string,
	userHanziInput: string
): { char: string; isStopword: boolean }[] {
	const typed = getAnswerCharacters(filterStudentHanziInput(userHanziInput))
	let typedIndex = 0

	return getAnswerCharacters(answerKey).map((char) => {
		if (isAnswerStopword(char)) {
			return { char, isStopword: true }
		}
		const next = typed[typedIndex] ?? ""
		typedIndex += 1
		return { char: next, isStopword: false }
	})
}

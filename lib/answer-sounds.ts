let sharedContext: AudioContext | null = null

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") {
    return null
  }

  const AudioContextClass =
    window.AudioContext ||
    (window as typeof window & { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext

  if (!AudioContextClass) {
    return null
  }

  if (!sharedContext || sharedContext.state === "closed") {
    sharedContext = new AudioContextClass()
  }

  return sharedContext
}

/** Soft bell chime for a correct assignment answer. */
export function playCorrectBell() {
  const ctx = getAudioContext()
  if (!ctx) {
    return
  }

  void ctx.resume()

  const now = ctx.currentTime
  const partials = [
    { frequency: 1046.5, peak: 0.28, duration: 1.1 }, // C6
    { frequency: 1568, peak: 0.16, duration: 0.85 }, // G6
    { frequency: 2093, peak: 0.1, duration: 0.65 }, // C7
  ] as const

  for (const partial of partials) {
    const oscillator = ctx.createOscillator()
    const gain = ctx.createGain()

    oscillator.type = "sine"
    oscillator.frequency.setValueAtTime(partial.frequency, now)

    gain.gain.setValueAtTime(0.0001, now)
    gain.gain.exponentialRampToValueAtTime(partial.peak, now + 0.015)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + partial.duration)

    oscillator.connect(gain)
    gain.connect(ctx.destination)
    oscillator.start(now)
    oscillator.stop(now + partial.duration + 0.05)
  }
}

/** Short descending buzz for an incorrect assignment answer. */
export function playWrongBuzz() {
  const ctx = getAudioContext()
  if (!ctx) {
    return
  }

  void ctx.resume()

  const now = ctx.currentTime
  const notes = [
    { frequency: 311.13, peak: 0.22, start: 0, duration: 0.16 }, // Eb4
    { frequency: 233.08, peak: 0.2, start: 0.12, duration: 0.28 }, // Bb3
  ] as const

  for (const note of notes) {
    const oscillator = ctx.createOscillator()
    const gain = ctx.createGain()
    const startAt = now + note.start

    oscillator.type = "triangle"
    oscillator.frequency.setValueAtTime(note.frequency, startAt)

    gain.gain.setValueAtTime(0.0001, startAt)
    gain.gain.exponentialRampToValueAtTime(note.peak, startAt + 0.01)
    gain.gain.exponentialRampToValueAtTime(0.0001, startAt + note.duration)

    oscillator.connect(gain)
    gain.connect(ctx.destination)
    oscillator.start(startAt)
    oscillator.stop(startAt + note.duration + 0.05)
  }
}

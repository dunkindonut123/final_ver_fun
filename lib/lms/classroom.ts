const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateClassCode(teacherName: string, hskLevel: number) {
  const initials = teacherName
    .trim()
    .split(/\s+/)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
    .slice(0, 3)
    .padEnd(2, "X");

  let suffix = "";
  for (let i = 0; i < 3; i += 1) {
    suffix += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  }

  return `${initials}-HSK${hskLevel}-${suffix}`;
}

export function normalizeClassCode(code: string) {
  return code.trim().toUpperCase();
}

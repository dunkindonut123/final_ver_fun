import { StudentShell } from "@/components/layout/student-shell";

export default function StudentPortalLayout({ children }: { children: React.ReactNode }) {
  return <StudentShell>{children}</StudentShell>;
}

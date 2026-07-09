import { AdminChrome } from "@/components/admin/admin-shell";

export default function AdminPortalLayout({ children }: { children: React.ReactNode }) {
  return <AdminChrome>{children}</AdminChrome>;
}

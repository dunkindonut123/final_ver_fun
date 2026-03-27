import Link from "next/link";
import { CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function SignUpSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string }>;
}) {
  const params = await searchParams;
  const role = params.role === "teacher" ? "teacher" : "student";

  return (
    <div className="relative min-h-screen overflow-hidden bg-background px-4 py-12">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 -right-28 h-72 w-72 rounded-full bg-[#1e5fa8]/10 blur-3xl" />
        <div className="absolute top-1/2 -left-20 h-64 w-64 rounded-full bg-[#e53935]/10 blur-3xl" />
        <div className="absolute bottom-0 right-1/3 h-52 w-52 rounded-full bg-[#f9a825]/10 blur-3xl" />
      </div>

      <div className="relative mx-auto w-full max-w-md">
        <Card className="w-full rounded-2xl border-white/20 bg-background/85 text-center shadow-xl shadow-foreground/10 backdrop-blur-md">
        <CardHeader>
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#1e5fa8]/10">
            <CheckCircle className="h-6 w-6 text-[#1e5fa8]" />
          </div>
          <CardTitle className="text-2xl font-bold">Account Created!</CardTitle>
          <CardDescription>
            {role === "teacher"
              ? "Your teacher account has been successfully created."
              : "Your student account has been successfully created."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {role === "teacher"
              ? "You can now sign in and start managing your classes."
              : "You can now sign in and start learning HSK with your teacher."}
          </p>
          <Button asChild className="h-11 w-full rounded-xl bg-[#1e5fa8] text-white hover:bg-[#1a5292]">
            <Link href="/signin">Sign In</Link>
          </Button>
          <Button asChild variant="outline" className="h-11 w-full rounded-xl bg-transparent">
            <Link href="/">Back to Home</Link>
          </Button>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}

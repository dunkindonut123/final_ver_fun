"use client";

import { useState } from "react";
import type React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowLeft, BookOpen, Loader2 } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const supabase = createClient();
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError || !data.user) {
        setError(signInError?.message ?? "Invalid email or password");
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.user.id)
        .single();

      let resolvedRole: "teacher" | "student" | null = null;

      if (!profileError && profile) {
        resolvedRole = profile.role;
      } else {
        const { data: teacherRow } = await supabase
          .from("teachers")
          .select("user_id")
          .eq("user_id", data.user.id)
          .maybeSingle();

        if (teacherRow) {
          resolvedRole = "teacher";
        } else {
          const { data: studentRow } = await supabase
            .from("students")
            .select("user_id")
            .eq("user_id", data.user.id)
            .maybeSingle();

          if (studentRow) {
            resolvedRole = "student";
          }
        }

        if (resolvedRole) {
          const fallbackName =
            (typeof data.user.user_metadata?.full_name === "string" && data.user.user_metadata.full_name) ||
            null;

          const { error: insertProfileError } = await supabase.from("profiles").insert({
            id: data.user.id,
            email: data.user.email ?? email,
            full_name: fallbackName,
            role: resolvedRole,
          });

          if (insertProfileError) {
            setError(insertProfileError.message);
            return;
          }
        }
      }

      if (!resolvedRole) {
        setError(
          "Profile not found. Make sure your profiles.id matches auth.users.id and role is set to teacher or student."
        );
        return;
      }

      if (resolvedRole === "teacher") {
        const { data: approvedTeacher, error: approvedTeacherError } = await supabase
          .from("teachers")
          .select("user_id")
          .eq("user_id", data.user.id)
          .maybeSingle();

        if (approvedTeacherError || !approvedTeacher) {
          await supabase.auth.signOut();
          setError("Your teacher account is still pending admin approval.");
          return;
        }

        router.push("/teacher/dashboard");
      } else {
        router.push("/student/dashboard");
      }

      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "An unexpected error occurred";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-background px-4 py-12">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 -right-28 h-72 w-72 rounded-full bg-[#1e5fa8]/10 blur-3xl" />
        <div className="absolute top-1/2 -left-20 h-64 w-64 rounded-full bg-[#e53935]/10 blur-3xl" />
        <div className="absolute bottom-0 right-1/3 h-52 w-52 rounded-full bg-[#f9a825]/10 blur-3xl" />
      </div>

      <div className="relative mx-auto w-full max-w-md">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-foreground/70 transition-colors hover:bg-foreground/10 hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Home
        </Link>

        <Card className="w-full rounded-2xl border-white/20 bg-background/85 shadow-xl shadow-foreground/10 backdrop-blur-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#1e5fa8]/10">
              <BookOpen className="h-6 w-6 text-[#1e5fa8]" />
            </div>
            <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
            <CardDescription>Sign in to your Fun Mandarin account</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              {error && (
                <div className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive">
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-11 rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-11 rounded-xl"
                />
              </div>
              <Button
                type="submit"
                className="h-11 w-full rounded-xl bg-[#1e5fa8] text-white hover:bg-[#1a5292]"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>
            <div className="mt-6 text-center text-sm text-muted-foreground">
              <p>
                Student?{" "}
                <Link
                  href="/signup/student"
                  className="font-medium text-[#1e5fa8] hover:underline"
                >
                  Sign up here
                </Link>
              </p>
              <p className="mt-2">
                Teacher?{" "}
                <Link
                  href="/signup/teacher"
                  className="font-medium text-[#1e5fa8] hover:underline"
                >
                  Sign up here
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

"use client";

import React, { useState } from "react";
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
import { GraduationCap, Loader2, ArrowLeft } from "lucide-react";

export default function StudentSignUpPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    teacherCode: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();
      const normalizedTeacherCode = formData.teacherCode.trim().toUpperCase();

      const { data: teacherRows, error: teacherError } = await supabase.rpc(
        "find_teacher_by_code",
        {
          input_code: normalizedTeacherCode,
        }
      );

      const teacher = Array.isArray(teacherRows) ? teacherRows[0] : null;

      if (teacherError || !teacher) {
        setError("Teacher code is invalid.");
        return;
      }

      const { data, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      });

      if (signUpError || !data.user) {
        setError(signUpError?.message ?? "Unable to create account");
        return;
      }

      if (!data.session) {
        setError(
          "Signup succeeded but no session was created. In Supabase, disable Email Confirm for this flow, then try again."
        );
        return;
      }

      const { error: profileError } = await supabase.from("profiles").insert({
        id: data.user.id,
        email: formData.email,
        full_name: formData.name,
        role: "student",
      });

      if (profileError) {
        setError(profileError.message);
        return;
      }

      const { error: studentError } = await supabase.from("students").insert({
        user_id: data.user.id,
        teacher_id: teacher.user_id,
      });

      if (studentError) {
        setError(studentError.message);
        return;
      }

      router.push("/auth/sign-up-success?role=student");
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

        <Card className="w-full rounded-2xl border border-white/20 bg-background/85 shadow-xl shadow-foreground/10 backdrop-blur-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#1e5fa8]/10">
            <GraduationCap className="h-6 w-6 text-[#1e5fa8]" />
          </div>
          <CardTitle className="text-2xl font-bold">Student Sign Up</CardTitle>
          <CardDescription>
            Create your account to start learning HSK
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignUp} className="space-y-4">
            {error && (
              <div className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                name="name"
                type="text"
                placeholder="Your full name"
                value={formData.name}
                onChange={handleChange}
                required
                className="h-11 rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleChange}
                required
                className="h-11 rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="teacherCode">Teacher Code</Label>
              <Input
                id="teacherCode"
                name="teacherCode"
                type="text"
                placeholder="Enter your teacher's code"
                value={formData.teacherCode}
                onChange={handleChange}
                required
                className="h-11 rounded-xl uppercase"
              />
              <p className="text-xs text-muted-foreground">
                Ask your teacher for their unique code
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Create a password"
                value={formData.password}
                onChange={handleChange}
                required
                className="h-11 rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={handleChange}
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
                  Creating account...
                </>
              ) : (
                "Sign Up"
              )}
            </Button>
          </form>
          <div className="mt-6 space-y-2 text-center text-sm text-muted-foreground">
            <p>
              Already have an account?{" "}
              <Link
                href="/signin"
                className="font-medium text-[#1e5fa8] hover:underline"
              >
                Sign in
              </Link>
            </p>
            <p>
              <Link
                href="/signup"
                className="font-medium text-[#1e5fa8] hover:underline"
              >
                &larr; Back to role selection
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}

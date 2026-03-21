"use client";

import Link from "next/link";
import { GraduationCap, BookOpen, ArrowLeft } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function SignUpPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background px-4 py-12">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 -right-28 h-72 w-72 rounded-full bg-[#1e5fa8]/10 blur-3xl" />
        <div className="absolute top-1/2 -left-20 h-64 w-64 rounded-full bg-[#e53935]/10 blur-3xl" />
        <div className="absolute bottom-0 right-1/3 h-52 w-52 rounded-full bg-[#f9a825]/10 blur-3xl" />
      </div>

      <div className="relative mx-auto w-full max-w-2xl">
      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-foreground/70 transition-colors hover:bg-foreground/10 hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Home
      </Link>

      <div className="w-full rounded-2xl border border-white/20 bg-background/85 p-6 shadow-xl shadow-foreground/10 backdrop-blur-md sm:p-8">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold">Create an Account</h1>
          <p className="mt-2 text-muted-foreground">
            Choose how you want to sign up
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Link href="/signup/student" className="group">
            <Card className="h-full cursor-pointer rounded-2xl border border-border/60 transition-all duration-300 hover:-translate-y-1 hover:border-[#1e5fa8]/40 hover:bg-[#1e5fa8]/5 hover:shadow-lg hover:shadow-[#1e5fa8]/10">
              <CardHeader className="text-center">
                <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-[#1e5fa8]/10 transition-colors group-hover:bg-[#1e5fa8]/20">
                  <GraduationCap className="h-7 w-7 text-[#1e5fa8]" />
                </div>
                <CardTitle className="text-xl">Student</CardTitle>
                <CardDescription>
                  Join your teacher&apos;s class and start learning HSK
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center text-sm text-muted-foreground">
                You&apos;ll need a teacher code to sign up
              </CardContent>
            </Card>
          </Link>

          <Link href="/signup/teacher" className="group">
            <Card className="h-full cursor-pointer rounded-2xl border border-border/60 transition-all duration-300 hover:-translate-y-1 hover:border-[#1e5fa8]/40 hover:bg-[#1e5fa8]/5 hover:shadow-lg hover:shadow-[#1e5fa8]/10">
              <CardHeader className="text-center">
                <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-[#1e5fa8]/10 transition-colors group-hover:bg-[#1e5fa8]/20">
                  <BookOpen className="h-7 w-7 text-[#1e5fa8]" />
                </div>
                <CardTitle className="text-xl">Teacher</CardTitle>
                <CardDescription>
                  Create a class and manage your students
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center text-sm text-muted-foreground">
                Get a unique code to share with your students
              </CardContent>
            </Card>
          </Link>
        </div>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/signin" className="font-medium text-[#1e5fa8] hover:underline">
            Sign in
          </Link>
        </p>
      </div>
      </div>
    </div>
  );
}

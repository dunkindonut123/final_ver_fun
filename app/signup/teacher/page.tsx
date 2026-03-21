"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Users, Loader2, CheckCircle, ArrowLeft } from "lucide-react";

export default function TeacherSignUpPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // TODO: integrate with backend — check for existing requests and submit to teacher_requests table
      await new Promise((resolve) => setTimeout(resolve, 500));
      setSubmitted(true);
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-background px-4 py-12">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-32 -right-28 h-72 w-72 rounded-full bg-[#1e5fa8]/10 blur-3xl" />
          <div className="absolute top-1/2 -left-20 h-64 w-64 rounded-full bg-[#e53935]/10 blur-3xl" />
          <div className="absolute bottom-0 right-1/3 h-52 w-52 rounded-full bg-[#f9a825]/10 blur-3xl" />
        </div>

        <div className="relative mx-auto w-full max-w-md">
          <Card className="w-full rounded-2xl border-white/20 bg-background/85 shadow-xl shadow-foreground/10 backdrop-blur-md">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#1e5fa8]/10">
                <CheckCircle className="h-6 w-6 text-[#1e5fa8]" />
              </div>
              <CardTitle className="text-2xl font-bold">
                Request Submitted
              </CardTitle>
              <CardDescription>
                Your teacher account request has been sent to the administrator
                for approval.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <p className="mb-6 text-sm text-muted-foreground">
                You will receive an email at <strong>{formData.email}</strong>{" "}
                once your request has been reviewed. This usually takes 1-2
                business days.
              </p>
              <Link href="/signin">
                <Button variant="outline" className="h-11 w-full rounded-xl bg-transparent">
                  Back to Sign In
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

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
            <Users className="h-6 w-6 text-[#1e5fa8]" />
          </div>
          <CardTitle className="text-2xl font-bold">
            Teacher Access Request
          </CardTitle>
          <CardDescription>
            Submit your request to become a teacher on our platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
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
              <Label htmlFor="message">Why do you want to teach?</Label>
              <Textarea
                id="message"
                name="message"
                placeholder="Tell us about your teaching experience and why you want to join our platform..."
                value={formData.message}
                onChange={handleChange}
                rows={4}
                className="rounded-xl"
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
                  Submitting...
                </>
              ) : (
                "Submit Request"
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

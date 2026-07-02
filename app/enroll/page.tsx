"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { CheckCircle, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import Image from "next/image"

export default function EnrollPage() {
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitted(true)
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
        <Card className="max-w-md w-full p-8 text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold">Enrollment Successful!</h2>
            <p className="text-muted-foreground">
              Thank you for enrolling! We've sent a confirmation email with course details and next steps.
            </p>
          </div>
          <div className="space-y-3">
            <Button className="w-full" asChild>
              <Link href="/">Go to Dashboard</Link>
            </Button>
            <Button variant="outline" className="w-full bg-transparent" asChild>
              <Link href="/">
                <ArrowLeft className="mr-2 w-4 h-4" />
                Back to Home
              </Link>
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <Image
                src="/images/fun-logo-00000.png"
                alt="Fun Mandarin"
                width={175}
                height={40}
                className="h-10 w-auto"
              />
            </Link>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/">
                <ArrowLeft className="mr-2 w-4 h-4" />
                Back to Home
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-3">Enroll in Course</h1>
            <p className="text-muted-foreground text-lg">
              Fill out the form below to start your learning journey with Fun Mandarin
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Enrollment Form */}
            <Card className="md:col-span-2 p-6 md:p-8">
              <h2 className="text-2xl font-bold mb-6">Student Information</h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input id="firstName" placeholder="Enter your first name" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input id="lastName" placeholder="Enter your last name" required />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input id="email" type="email" placeholder="your.email@example.com" required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input id="phone" type="tel" placeholder="+1 (555) 000-0000" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="level">Current Mandarin Level *</Label>
                  <select
                    id="level"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    required
                  >
                    <option value="">Select your level</option>
                    <option value="beginner">Beginner - No prior knowledge</option>
                    <option value="elementary">Elementary - Basic conversations</option>
                    <option value="intermediate">Intermediate - Comfortable with daily topics</option>
                    <option value="advanced">Advanced - Fluent speaker</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="goals">Learning Goals</Label>
                  <Textarea id="goals" placeholder="Tell us what you hope to achieve with this course..." rows={4} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="referral">How did you hear about us?</Label>
                  <select
                    id="referral"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="">Select an option</option>
                    <option value="social">Social Media</option>
                    <option value="friend">Friend or Family</option>
                    <option value="search">Search Engine</option>
                    <option value="ad">Online Advertisement</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="flex items-start gap-2">
                  <input type="checkbox" id="terms" className="mt-1 rounded border-gray-300" required />
                  <Label htmlFor="terms" className="text-sm font-normal">
                    I agree to the{" "}
                    <Link href="#" className="text-primary hover:underline">
                      Terms of Service
                    </Link>{" "}
                    and{" "}
                    <Link href="#" className="text-primary hover:underline">
                      Privacy Policy
                    </Link>
                  </Label>
                </div>

                <Button type="submit" size="lg" className="w-full">
                  Complete Enrollment
                </Button>
              </form>
            </Card>

            {/* Course Summary */}
            <div className="space-y-6">
              <Card className="p-6">
                <h3 className="font-bold text-lg mb-4">Course Summary</h3>
                <div className="aspect-video bg-muted rounded-lg mb-4 overflow-hidden">
                  <Image
                    src="/classroom-students-teacher-learning-atmosphere.jpg"
                    alt="Course"
                    width={640}
                    height={360}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="space-y-3">
                  <div>
                    <div className="text-sm text-muted-foreground">Course</div>
                    <div className="font-semibold">Mandarin Language Course</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Duration</div>
                    <div className="font-semibold">12 weeks</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Schedule</div>
                    <div className="font-semibold">Flexible online learning</div>
                  </div>
                  <div className="border-t pt-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Course Price</span>
                      <span className="text-2xl font-bold text-primary">$49</span>
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="p-6 bg-muted/50">
                <h3 className="font-bold mb-3">What's Included</h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>Lifetime access to course materials</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>Interactive video lessons</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>Practice exercises and quizzes</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>Certificate of completion</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>Community support</span>
                  </li>
                </ul>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

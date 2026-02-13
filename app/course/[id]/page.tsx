import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Clock, Users, Star, MessageSquare } from 'lucide-react'
import { courseDetails } from '@/lib/courses-data'
import { redirect } from 'next/navigation'

export async function generateStaticParams() {
  return [
    { id: 'fun-kids' },
    { id: 'fun-primary' },
    { id: 'fun-conversation' },
  ]
}

export const metadata = {
  title: 'Detail Kursus - FunMandarin',
}

export default async function CoursePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const course = courseDetails[id]

  if (!course) {
    redirect('/')
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#1e5fa8]/10 to-[#f9a825]/10 py-8 border-b border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link href="/#courses" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
            <ArrowLeft className="w-4 h-4" />
            Kembali ke Kursus
          </Link>
          <div className="flex items-start justify-between">
            <div>
              <span className="text-sm font-semibold text-white px-3 py-1 rounded-full" style={{ backgroundColor: course.accent }}>
                {course.badge}
              </span>
              <h1 className="text-4xl font-bold text-foreground mt-4">{course.title}</h1>
              <p className="text-muted-foreground mt-2">{course.subtitle}</p>
            </div>
            <div className="text-right">
              
              
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="md:col-span-2 space-y-8">
            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-card rounded-lg p-4 border border-border text-center">
                <Clock className="w-5 h-5 mx-auto text-primary mb-2" />
                <div className="text-2xl font-bold text-foreground">{course.hours}</div>
                <div className="text-xs text-muted-foreground">Bulan Pelajaran</div>
              </div>
              <div className="bg-card rounded-lg p-4 border border-border text-center">
                <Users className="w-5 h-5 mx-auto text-primary mb-2" />
                <div className="text-2xl font-bold text-foreground">{course.students}</div>
                <div className="text-xs text-muted-foreground">Siswa Aktif</div>
              </div>
              <div className="bg-card rounded-lg p-4 border border-border text-center">
                <Star className="w-5 h-5 mx-auto text-primary mb-2" />
                <div className="text-2xl font-bold text-foreground">{course.rating}</div>
                <div className="text-xs text-muted-foreground">Rating</div>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-foreground">Tentang Kursus</h2>
              <p className="text-muted-foreground leading-relaxed">{course.fullDescription}</p>
            </div>

            {/* Features */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-foreground">Fitur & Keunggulan</h2>
              <div className="space-y-3">
                {course.features.map((feature: string, index: number) => (
                  <div key={index} className="flex gap-3">
                    <MessageSquare className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-foreground">{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Curriculum */}
            
          </div>

          {/* Sidebar */}
          <div className="md:col-span-1">
            <div className="bg-card border border-border rounded-lg p-6 sticky top-4 space-y-4">
              <div>
                
                
                
              </div>
              
              

              <Button
                variant="outline"
                className="w-full font-semibold rounded-xl bg-sidebar-accent"
              >
                <a href="https://wa.me/6285719996983?text=Saya%20ingin%20menanyakan%20tentang%20kursus%20FunMandarin" target="_blank" rel="noopener noreferrer" className="w-full">
                  Tanya di WhatsApp
                </a>
              </Button>

              {/* Course Info */}
              <div className="space-y-3 pt-4 border-t border-border">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Durasi</span>
                  <span className="font-semibold text-foreground">{course.hours} bulan</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Siswa</span>
                  <span className="font-semibold text-foreground">{course.students}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Rating</span>
                  <span className="font-semibold text-foreground flex items-center gap-1">
                    <Star className="w-4 h-4 fill-primary text-primary" />
                    {course.rating}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

import { BookOpen, Users, Award, TrendingUp, Clock, Star, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import Link from "next/link"

export default function EducationHome() {
  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Logo_Fun_Baru_2025_alpha-KKsP89t6IrAA3Bf8of3C5Nw05M61Kx.png" alt="Fun Mandarin" className="w-auto leading-10 h-56" />
            </div>

            <div className="hidden md:flex items-center gap-8">
              <Link href="#courses" className="text-sm font-medium hover:text-primary transition-colors">
                Courses
              </Link>
              <Link href="#about" className="text-sm font-medium hover:text-primary transition-colors">
                About
              </Link>
              <Link href="#resources" className="text-sm font-medium hover:text-primary transition-colors">
                Resources
              </Link>
              <Link href="#community" className="text-sm font-medium hover:text-primary transition-colors">
                Community
              </Link>
            </div>

            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm">
                Log In
              </Button>
              <Button size="sm">Sign Up</Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 md:py-32 bg-gradient-to-b from-muted/50 to-background">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
                🎓 Welcome to the future of learning
              </div>
              <h1 className="text-4xl md:text-6xl font-bold leading-tight text-balance">
                Learning Mandarin made <span className="text-red-500">Fun & Exciting!</span>
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Join thousands of learners worldwide in mastering new skills. From coding to design, business to
                creative arts—your journey to excellence starts here.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" className="text-base">
                  Browse Courses
                  <ChevronRight className="ml-2 w-5 h-5" />
                </Button>
                <Button size="lg" variant="outline" className="text-base bg-transparent">
                  Learn More
                </Button>
              </div>
              <div className="flex items-center gap-8 pt-4">
                <div>
                  <div className="text-3xl font-bold">50K+</div>
                  <div className="text-sm text-muted-foreground">Active Students</div>
                </div>
                <div>
                  <div className="text-3xl font-bold">200+</div>
                  <div className="text-sm text-muted-foreground">Program fleksibel</div>
                </div>
                <div>
                  <div className="text-3xl font-bold">4.8</div>
                  <div className="text-sm text-muted-foreground">Average Rating</div>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="relative aspect-square rounded-2xl overflow-hidden bg-gradient-to-br from-primary/20 to-accent/20">
                <img
                  src="/diverse-students-learning-online-with-laptops-and-.jpg"
                  alt="Students learning online"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-6 -left-6 bg-card border border-border rounded-xl p-4 shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Award className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <div className="font-semibold">Certificate Ready</div>
                    <div className="text-sm text-muted-foreground">Earn recognized credentials</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <TrendingUp className="w-8 h-8 mx-auto mb-2 opacity-90" />
              <div className="text-3xl md:text-4xl font-bold">98%</div>
              <div className="text-sm opacity-90 mt-1">Completion Rate</div>
            </div>
            <div className="text-center">
              <Users className="w-8 h-8 mx-auto mb-2 opacity-90" />
              <div className="text-3xl md:text-4xl font-bold">150+</div>
              <div className="text-sm opacity-90 mt-1">Countries</div>
            </div>
            <div className="text-center">
              <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-90" />
              <div className="text-3xl md:text-4xl font-bold">500+</div>
              <div className="text-sm opacity-90 mt-1">Courses</div>
            </div>
            <div className="text-center">
              <Award className="w-8 h-8 mx-auto mb-2 opacity-90" />
              <div className="text-3xl md:text-4xl font-bold">100K+</div>
              <div className="text-sm opacity-90 mt-1">Certificates Issued</div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Courses */}
      <section id="courses" className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Popular Courses</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Explore our most popular courses taught by industry experts
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course, index) => (
              <Card key={index} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="aspect-video relative bg-muted">
                  <img
                    src={course.image || "/placeholder.svg"}
                    alt={course.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-4 left-4 bg-background/90 backdrop-blur px-3 py-1 rounded-full text-sm font-medium">
                    {course.category}
                  </div>
                </div>
                <div className="p-6 space-y-4">
                  <div>
                    <h3 className="font-bold text-xl mb-2 text-balance">{course.title}</h3>
                    <p className="text-sm text-muted-foreground">{course.description}</p>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {course.duration}
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-primary text-primary" />
                      {course.rating}
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {course.students}
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-2">
                    {course.price && <div className="text-2xl font-bold">${course.price}</div>}
                    <Button asChild>
                      <Link href="/enroll">Book Now</Link>
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <div className="text-center mt-12">
            <Button variant="outline" size="lg">
              View All Courses
              <ChevronRight className="ml-2 w-5 h-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          {/* Founder Story */}
          <div className="mb-20">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-primary mb-8">Cerita FUN Mandarin</h2>
              <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                Seorang pendidik Indonesia yang passionate tentang bahasa Mandarin menyadari bahwa banyak anak merasa tertarik untuk belajar, namun metode pengajaran tradisional membuat mereka bosan. Dia memutuskan untuk menciptakan cara yang benar-benar berbeda—dengan pendekatan interaktif, menyenangkan, dan penuh kreativitas—agar setiap anak dapat merasakan kegembiraan dalam mempelajari bahasa Mandarin.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-12 items-center mb-20">
              <div className="flex justify-center">
                <div className="relative">
                  <img 
                    src="/fun-mandarin-founder-illustration.jpg" 
                    alt="Founder of FUN Mandarin" 
                    className="w-full max-w-md rounded-lg"
                  />
                </div>
              </div>

              <div className="space-y-8">
                <div className="border-l-4 border-primary pl-6">
                  <div className="text-sm font-medium text-primary mb-1">2014</div>
                  <h3 className="text-2xl font-bold mb-2">Awal Perjalanan</h3>
                  <p className="text-muted-foreground">
                    FUN Mandarin didirikan dengan tujuan sederhana namun kuat: membuat pembelajaran bahasa Mandarin menjadi pengalaman yang tak terlupakan dan penuh kegemiraan bagi setiap murid.
                  </p>
                </div>

                <div className="border-l-4 border-primary pl-6">
                  <div className="text-sm font-medium text-primary mb-1">2021</div>
                  <h3 className="text-2xl font-bold mb-2">Pertumbuhan Pesat</h3>
                  <p className="text-muted-foreground">
                    Dengan metode pembelajaran yang inovatif, FUN Mandarin mulai berkembang pesat. Ratusan murid dari berbagai usia telah bergabung dan merasakan manfaat pembelajaran Mandarin yang menyenangkan.
                  </p>
                </div>

                <div className="border-l-4 border-primary pl-6">
                  <div className="text-sm font-medium text-primary mb-1">2026</div>
                  <h3 className="text-2xl font-bold mb-2">Ekspansi Baru</h3>
                  <p className="text-muted-foreground">
                    FUN Mandarin buka cabang di Mall Citywalk Gajah Mada, membawa pembelajaran Mandarin yang menyenangkan lebih dekat kepada lebih banyak keluarga di Jakarta.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* What Sets Us Apart */}
          <div>
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-6">Apa yang Membedakan Kami?</h2>
              <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                Di FUN Mandarin, kami tidak hanya mengajar bahasa Mandarin—kami menciptakan pengalaman belajar yang mengubah cara murid melihat pembelajaran. Dengan pendekatan yang inovatif dan personal, kami memastikan setiap siswa tidak hanya memahami bahasa, tetapi juga mencintai proses belajarnya.
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  number: "500+",
                  label: "Murid Puas",
                  description: "Ribuan siswa telah mempercayai kami untuk perjalanan belajar Mandarin mereka"
                },
                {
                  number: "95%",
                  label: "Tingkat Kepuasan",
                  description: "Mayoritas murid kami mengatakan belajar dengan FUN Mandarin menyenangkan dan efektif"
                },
                {
                  number: "10+",
                  label: "Tahun Pengalaman",
                  description: "Tim kami memiliki dedikasi puluhan tahun dalam mengajar bahasa Mandarin"
                }
              ].map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-4xl font-bold text-primary mb-2">{stat.number}</div>
                  <h3 className="text-lg font-bold mb-2">{stat.label}</h3>
                  <p className="text-muted-foreground text-sm">{stat.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section id="about" className="py-20 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Mengapa Harus FUN Mandarin?</h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="p-6 hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-bold text-xl mb-2">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">What Our Students Say</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Hear from learners who have transformed their careers with our courses
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-primary text-primary" />
                  ))}
                </div>
                <p className="text-muted-foreground mb-6 leading-relaxed">{testimonial.quote}</p>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center font-semibold text-primary">
                    {testimonial.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-semibold">{testimonial.name}</div>
                    <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h2 className="text-3xl md:text-5xl font-bold text-balance">Start Your Learning Journey Today</h2>
            <p className="text-lg opacity-90 leading-relaxed">
              Join our community of passionate learners and transform your career with expert-led courses.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button size="lg" variant="secondary" className="text-base">
                Get Started Free
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="text-base border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary bg-transparent"
              >
                Contact Us
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t border-border py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <img src="/images/fun-logo-00000.png" alt="Fun Mandarin" className="h-10 w-auto" />
              </div>
              <p className="text-sm text-muted-foreground">Empowering learners worldwide with quality education.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Courses</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="#" className="hover:text-foreground transition-colors">
                    Web Development
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-foreground transition-colors">
                    Data Science
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-foreground transition-colors">
                    Design
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-foreground transition-colors">
                    Business
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="#" className="hover:text-foreground transition-colors">
                    About Us
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-foreground transition-colors">
                    Careers
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-foreground transition-colors">
                    Blog
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-foreground transition-colors">
                    Contact
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="#" className="hover:text-foreground transition-colors">
                    Help Center
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-foreground transition-colors">
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-foreground transition-colors">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-foreground transition-colors">
                    Community
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border pt-8 text-center text-sm text-muted-foreground">
            <p>© 2025 Fun Mandarin. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

const courses = [
  {
    title: "FUN Kids (TK 4-6 Tahun)",
    category: "Mandarin Dasar",
    description: "Belajar Mandarin melalui lagu dan permainan interaktif untuk usia dini.",
    duration: "24 hours",
    rating: "4.9",
    students: "12K",
    image: "/kindergarten-classroom-tk-teaching.jpg",
    price: "150", // Added price
  },
  {
    title: "FUN Primary (SD 6-12 Tahun)",
    category: "Mandarin Sekolah",
    description: "Fokus pada penguatan kosakata dan tata bahasa dengan metode kreatif.",
    duration: "32 hours",
    rating: "4.8",
    students: "8.5K",
    image: "/primary-school-classroom-learning.jpg",
    price: "200", // Added price
  },
  {
    title: "FUN Conversation (SMP-Dewasa)",
    category: "Percakapan",
    description: "Tingkatkan rasa percaya diri berbicara Mandarin untuk akademis & karir.",
    duration: "18 hours",
    rating: "4.9",
    students: "10K",
    image: "/conversation-class-teenagers-adults.jpg",
    price: "250", // Added price
  },
]

const features = [
  {
    icon: BookOpen,
    title: "Program fleksibel",
    description: "Setiap program kami disesuaikan dengan kebutuhan & kemampuan murid, dari anak-anak hingga dewasa.",
  },
  {
    icon: Clock,
    title: "Kelas kecil",
    description: "Hanya 8-10 anak per kelas, agar setiap murid mendapat perhatian maksimal.",
  },
  {
    icon: Award,
    title: "Metode pengajaran interaktif & menyenangkan",
    description: "Kami mengajar dengan cara yang tidak membosankan, mendorong murid untuk aktif dan berkomunikasi nyata.",
  },
  {
    icon: Users,
    title: "Tugas rumah dengan reward",
    description: "Setiap PR yang dikerjakan mendapatkan reward untuk memotivasi murid agar makin semangat belajar.",
  },
  {
    icon: TrendingUp,
    title: "Kelas online & tatap muka",
    description: "Fleksibilitas penuh bagi murid—Anda dapat memilih sesi daring atau hadir langsung di kelas sesuai kenyamanan dan kebutuhan.",
  },
  {
    icon: Star,
    title: "Quality Content",
    description: "High-quality video lessons, projects, quizzes and downloadable resources.",
  },
]

const testimonials = [
  {
    name: "Sarah Johnson",
    role: "Web Developer",
    quote:
      "The Web Development Bootcamp changed my life! I went from knowing nothing about coding to landing my dream job in just 6 months. The instructors are amazing and the community is so supportive.",
  },
  {
    name: "Michael Chen",
    role: "Data Scientist",
    quote:
      "I've taken several online courses before, but this platform stands out. The Data Science course was comprehensive, practical, and the projects helped me build a strong portfolio.",
  },
  {
    name: "Emily Rodriguez",
    role: "UX Designer",
    quote:
      "As someone transitioning careers, I found the UI/UX Design Masterclass incredibly helpful. The course content is up-to-date and the certificate helped me get interviews.",
  },
  {
    name: "David Kim",
    role: "Marketing Manager",
    quote:
      "The Digital Marketing course provided exactly what I needed to grow my business. The strategies are practical and I saw results within weeks of implementing them.",
  },
  {
    name: "Lisa Anderson",
    role: "Mobile Developer",
    quote:
      "Learning React Native here was the best decision. The hands-on approach and real-world projects gave me the confidence to build and launch my own apps.",
  },
  {
    name: "James Wilson",
    role: "Entrepreneur",
    quote:
      "The Business Fundamentals course gave me the framework I needed to start my company. The instructors share valuable insights from their own experiences.",
  },
]

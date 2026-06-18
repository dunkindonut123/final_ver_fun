import Link from "next/link"
import Image from 'next/image'
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { courseDetails } from "@/lib/courses-data"
import {
  BookOpen,
  Users,
  Award,
  TrendingUp,
  Star,
  ArrowRight,
  Menu,
  MessageSquare,
  Sparkles,
  GraduationCap,
  Play,
  MapPin,
  Phone,
  Mail,
} from "lucide-react"

// Fun Mandarin Logo Component
function FunMandarinLogo({ className = "" }: { className?: string }) {
  return (
    <Image 
      src="/images/logofunmanda.png" 
      alt="Fun Mandarin Logo"
      width={200}
      height={200}
      className={className}
    />
  )
}

// Google Reviews Data - manually extracted from screenshots (9 reviews for 3x3 grid)
const googleReviews = [
  {
    name: "Lina Yoe",
    role: "Local Guide",
    rating: 5,
    date: "2 weeks ago",
    text: "Anak saya dyv kelas TKb 5 th, les di Fun belum 1 tahun Sudah banyak perkembangan, ucapan Pinyin nya tepat & jelas, tulisan hanzi jg ok. Materi pelajaran sangat menarik anak setiap hari semangat les fun, sampai 30 mnt sebelum naik pesawat masih sempat les online.",
    avatar: "L",
  },
  {
    name: "Welly Dharmawan",
    role: "Parent",
    rating: 5,
    date: "2 weeks ago",
    text: "Pembelajaran di Fun Mandarin sangat menyenangkan setiap anak saya pulang les dia happy dapat reward koin yg bisa ditukar untuk hadiah apapun termasuk Voucher indomaret dan google. Sejak anak saya les disini, banyak sekali perkembangan yang sangat pesat.",
    avatar: "W",
  },
  {
    name: "Natalia Fransisca",
    role: "Local Guide",
    rating: 5,
    date: "a month ago",
    text: "Sejak ikut les disini nilai ujian nya ga pernah dibawah 90. Happy juga anakku les disini. Laoshi nya juga baik baik. Terima kasih",
    avatar: "N",
  },
  {
    name: "Nicoleee",
    role: "Student",
    rating: 5,
    date: "2 weeks ago",
    text: "Tempatnya nyaman bangett terus Laoshinya juga baik baikk sama ngajarinnya sabar jadinya betah bngt disini",
    avatar: "N",
  },
  {
    name: "Paulus Juan",
    role: "Student",
    rating: 5,
    date: "2 weeks ago",
    text: "Aku cinta mandarin, lingkungan enak, let's join fun mandarin. Tempat di Citywalk bagus bnget, laoshinya baik",
    avatar: "P",
  },
  {
    name: "KEVIN SUSENO",
    role: "Student",
    rating: 5,
    date: "2 weeks ago",
    text: "Tempat lesnya keren, bersih terus gurunya juga supportive banget kak",
    avatar: "K",
  },
  {
    name: "Angelyna C",
    role: "Student",
    rating: 5,
    date: "2 weeks ago",
    text: "Les Mandarin di sini ngebantu banget. Cara ngajarnya jelas, ga bikin pusing, dan laoshinya sabar banget. Materinya pelan-pelan tapi masuk. Belajarnya juga ga kaku. Worth it sih menurut aku.",
    avatar: "A",
  },
  {
    name: "Winsen Andrean",
    role: "Student",
    rating: 5,
    date: "2 weeks ago",
    text: "Suasananya cocok untuk belajar dan nyaman. Laoshinya ramah dan materi yang disampaikan mudah dimengerti",
    avatar: "W",
  },
  {
    name: "Devina Joy",
    role: "Parent",
    rating: 5,
    date: "a month ago",
    text: "Anakku les di fun mandarin, byk kemajuan bgt dlm bahasa mandarinnya, tempatnya jg bersih dan kids friendly byk games2 pd saat les mandarin membuat anak bljr mandarin jd fun. Pkknya seru dehh dan makin pinter klo les di fun mandarin",
    avatar: "D",
  },
]

const courses = Object.values(courseDetails)

// Features Data
const features = [
  {
    icon: BookOpen,
    title: "Program fleksibel",
    description: "Setiap program kami disesuaikan dengan kebutuhan & kemampuan murid.",
  },
  {
    icon: Users,
    title: "Kelas kecil",
    description: "Hanya 8-10 anak per kelas untuk perhatian maksimal.",
  },
  {
    icon: MessageSquare,
    title: "Metode interaktif",
    description: "Cara belajar yang menyenangkan dan tidak membosankan.",
  },
  {
    icon: Award,
    title: "Sistem reward",
    description: "Motivasi anak untuk belajar lebih giat dan konsisten.",
  },
  {
    icon: TrendingUp,
    title: "Online & offline",
    description: "Fleksibilitas belajar di mana saja dengan kualitas sama.",
  },
  {
    icon: Sparkles,
    title: "Konten berkualitas",
    description: "Materi selalu diperbarui sesuai kurikulum terbaru.",
  },
]

// Timeline Data
const timeline = [
  {
    year: "2014",
    title: "Awal Perjalanan",
    description: "FUN Mandarin didirikan dengan misi membuat pembelajaran Mandarin menjadi pengalaman yang menyenangkan.",
  },
  {
    year: "2021",
    title: "Pertumbuhan Pesat",
    description: "Ratusan murid dari berbagai usia telah bergabung dan merasakan manfaat pembelajaran yang inovatif.",
  },
  {
    year: "2026",
    title: "Ekspansi Baru",
    description: "Membuka cabang baru di Mall Citywalk Gajah Mada, Jakarta.",
  },
]

// Review card stays static to keep the page server-rendered.
function ReviewCard({ review }: { review: typeof googleReviews[0] }) {
  return (
    <Card className="border-0 shadow-lg shadow-foreground/5 hover:shadow-xl hover:shadow-foreground/10 transition-all duration-300">
      <CardContent className="p-6">
        {/* Stars */}
        <div className="flex gap-1 mb-4">
          {[...Array(review.rating)].map((_, i) => (
            <Star key={i} className="h-5 w-5 fill-[#f9a825] text-[#f9a825]" />
          ))}
        </div>
        
        {/* Review Text */}
        <div className="mb-6">
          <p className="text-sm text-muted-foreground leading-relaxed">{review.text}</p>
        </div>

        {/* Reviewer */}
        <div className="flex items-center gap-3 pt-4 border-t border-border">
          <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#1e5fa8] to-[#1e5fa8]/70 flex items-center justify-center text-white font-semibold">
            {review.avatar}
          </div>
          <div>
            <p className="font-semibold text-foreground">{review.name}</p>
            <p className="text-xs text-muted-foreground">{review.role} - {review.date}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function Home() {
  return (
    <div className="min-h-screen bg-background font-sans antialiased">
      {/* Header - Slick & Modern */}
      <header className="fixed top-0 left-0 right-0 z-50">
        <div className="mx-4 mt-3">
          <div className="max-w-6xl mx-auto bg-background/60 backdrop-blur-2xl rounded-2xl border border-white/20 shadow-lg shadow-foreground/5">
            <div className="flex items-center justify-between h-17 px-3 sm:px-4 lg:px-6 gap-2 lg:gap-3 overflow-hidden">
              {/* Logo */}

              <FunMandarinLogo className="h-16 lg:h-20 xl:h-24 w-auto shrink-0" />

              {/* Desktop Navigation - Flex with Logo */}
              <nav className="hidden md:flex items-center gap-4 lg:gap-6 ml-3 lg:ml-5 flex-1 min-w-0 overflow-hidden">
                {[
                  { label: "Kursus", href: "#courses" },
                  { label: "Tentang", href: "#about" },
                  { label: "Komunitas", href: "#testimonials" },
                ].map((item) => (
                  <a
                    key={item.label}
                    href={item.href}
                    className="px-2 lg:px-3 py-2 text-sm lg:text-base whitespace-nowrap font-medium text-foreground/70 hover:text-foreground hover:bg-foreground/10 rounded-xl transition-all duration-200"
                  >
                    {item.label}
                  </a>
                ))}
              </nav>

              {/* Mobile Menu Button */}
              <details className="md:hidden relative shrink-0">
                <summary className="list-none p-2 hover:bg-foreground/10 rounded-xl transition-colors cursor-pointer" aria-label="Toggle menu">
                  <Menu className="h-5 w-5" />
                </summary>

                <div className="absolute right-0 mt-2 w-56 bg-background/95 backdrop-blur-2xl rounded-2xl border border-white/20 shadow-lg p-4 space-y-1">
                  {[
                    { label: "Kursus", href: "#courses" },
                    { label: "Tentang", href: "#about" },
                    { label: "Berkompetisi", href: "#games" },
                    { label: "Komunitas", href: "#testimonials" },
                  ].map((item) => (
                    <a
                      key={item.label}
                      href={item.href}
                      className="block w-full text-left px-4 py-3 text-sm font-medium hover:bg-foreground/5 rounded-xl transition-colors"
                    >
                      {item.label}
                    </a>
                  ))}
                  <div className="pt-2 mt-2 border-t border-foreground/10 space-y-2">
                    <Link
                      href="/login"
                      className="block w-full text-left px-4 py-3 text-sm font-medium hover:bg-foreground/5 rounded-xl transition-colors"
                    >
                      Sign In
                    </Link>
                    <Link
                      href="/signup"
                      className="block w-full px-4 py-3 text-sm font-medium text-center rounded-xl bg-[#1e5fa8] text-white hover:bg-[#1a5292] transition-colors"
                    >
                      SignUp
                    </Link>
                  </div>
                </div>
              </details>

              <div className="hidden md:flex items-center gap-1.5 shrink-0">
                <Link href="/login">
                  <Button variant="ghost" className="rounded-xl h-9 px-3">Sign In</Button>
                </Link>
                <Link href="/signup">
                  <Button className="rounded-xl h-9 px-3 bg-[#1e5fa8] hover:bg-[#1a5292] text-white">SignUp</Button>
                </Link>
              </div>
            </div>
          </div>
        </div>

      </header>

      {/* Hero Section - Modern & Clean */}
      <section className="relative pt-28 pb-20 lg:pt-36 lg:pb-28 overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-[#1e5fa8]/5 rounded-full blur-3xl" />
          <div className="absolute top-1/2 -left-20 w-60 h-60 bg-[#e53935]/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-40 h-40 bg-[#f9a825]/5 rounded-full blur-3xl" />
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left Content */}
            <div className="space-y-8">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 bg-[#1e5fa8]/10 text-[#1e5fa8] px-4 py-2 rounded-full text-sm font-semibold">
                <GraduationCap className="h-4 w-4" />
                Selamat datang di masa depan pembelajaran
              </div>

              {/* Heading */}
              <div className="space-y-4">
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.1] tracking-tight text-balance">
                  <span className="bg-gradient-to-r from-[#1e5fa8] via-[#e53935] to-[#f9a825] bg-clip-text text-transparent">
                    Belajar mandarin menjadi lebih asik bersama FunMandarin
                  </span>
                </h1>
              </div>

              {/* Description */}
              <p className="text-lg text-muted-foreground leading-relaxed max-w-lg">
                Bergabunglah dengan ratusan pelajar yang menguasai Mandarin dengan pendekatan inovatif dan interaktif kami. 
                Dari anak-anak hingga dewasa—perjalanan Anda menuju keunggulan dimulai di sini.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-wrap gap-4">
                <Button
                  size="lg"
                  className="bg-[#1e5fa8] hover:bg-[#1a5292] text-white gap-2 rounded-xl text-base font-semibold px-6 h-12 shadow-lg shadow-[#1e5fa8]/25 hover:shadow-xl hover:shadow-[#1e5fa8]/30 transition-all duration-300"
                  asChild
                >
                  <a href="#courses">
                    Jelajahi Kursus
                    <ArrowRight className="h-4 w-4" />
                  </a>
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="gap-2 rounded-xl text-base font-semibold px-6 h-12 bg-transparent hover:bg-foreground/5 transition-all duration-300"
                  asChild
                >
                  <a href="#about">
                    <Play className="h-4 w-4" />
                    Pelajari Lebih Lanjut
                  </a>
                </Button>
              </div>

              {/* Stats */}
              <div className="flex flex-wrap gap-8 pt-4">
                {[
                  { value: "500+", label: "Active Students" },
                  { value: "3", label: "Programs" },
                  { value: "4.9", label: "Rating", icon: Star },
                ].map((stat) => (
                  <div key={stat.label} className="text-center">
                    <p className="text-3xl font-bold text-foreground flex items-center gap-1">
                      {stat.value}
                      {stat.icon && <stat.icon className="h-5 w-5 fill-[#f9a825] text-[#f9a825]" />}
                    </p>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Content - Modern Card */}
            <div className="relative hidden lg:block">
              <div className="relative">
                {/* Main visual card */}
                <div className="bg-gradient-to-br from-[#1e5fa8]/10 via-[#e53935]/5 to-[#f9a825]/10 rounded-3xl p-8 min-h-[480px] flex flex-col justify-between border border-border/50">
                  {/* Top decorative elements */}
                  <div className="flex justify-between items-start">
                    <div className="flex gap-2">
                      <div className="w-3 h-3 rounded-full bg-[#e53935]" />
                      <div className="w-3 h-3 rounded-full bg-[#f9a825]" />
                      <div className="w-3 h-3 rounded-full bg-[#1e5fa8]" />
                    </div>
                    <div className="bg-background/80 backdrop-blur rounded-xl px-3 py-1.5 text-xs font-medium">
                      Live Class
                    </div>
                  </div>
                  
                  {/* Center content - Image fills the space */}
                  <div className="flex-1 relative rounded-2xl overflow-hidden my-4">
                    <Image
                      src="/images/heropict.jpg"
                      alt="FUN Mandarin students in class"
                      fill
                      className="object-cover"
                    />
                  </div>
                  
                  {/* Bottom card */}
                  <div className="bg-background rounded-2xl p-5 shadow-xl shadow-foreground/5 flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#1e5fa8] to-[#1e5fa8]/80 flex items-center justify-center flex-shrink-0">
                      <Award className="h-7 w-7 text-white" />
                    </div>
                    <div>
                      <p className="font-bold text-foreground text-lg">Certificate Ready</p>
                      <p className="text-sm text-muted-foreground">Dapatkan kredensial yang diakui</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Courses Section - Modern Cards */}
      <section id="courses" className="py-20 lg:py-28 bg-secondary/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <span className="text-sm font-semibold text-[#1e5fa8] tracking-wide uppercase">Program Kami</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mt-3 mb-4">
              Kursus Populer
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Jelajahi kursus paling populer kami yang dirancang untuk berbagai kelompok usia dan tingkat keahlian
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <Link key={course.id} href={`/course/${course.id}`} className="block h-full" scroll={true}>
                <Card 
                  className="group overflow-hidden border-0 shadow-lg shadow-foreground/5 hover:shadow-xl hover:shadow-foreground/10 transition-all duration-300 hover:-translate-y-1 h-full cursor-pointer"
                >
                  {/* Course Header */}
                  <div
                    className="relative h-60 p-25 flex flex-col justify-between"
                    style={{
                      backgroundImage: `url(${course.image})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                    }}
                  >
                    {/* Optionally add overlay text/icon here if needed */}
                  </div>

                  <CardContent className="p-6 flex flex-col justify-between h-full">
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="text-lg font-bold text-foreground">{course.title}</h3>
                          <p className="text-sm text-muted-foreground">{course.subtitle}</p>
                        </div>
                        <span 
                          className="text-xs font-semibold px-3 py-1 rounded-full"
                          style={{ backgroundColor: `${course.accent}15`, color: course.accent }}
                        >
                          {course.badge}
                        </span>
                      </div>
                      <hr className="my-2 border-border" />
                      <p className="text-sm text-muted-foreground mb-5 leading-relaxed">{course.description}</p>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-border">
                      <Button 
                        size="sm" 
                        className="rounded-xl font-semibold text-white"
                        style={{ backgroundColor: course.accent }}
                      >
                        Lihat Detail
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us Section - Modern Grid */}
      <section className="py-20 lg:py-28 bg-background">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <span className="text-sm font-semibold text-[#1e5fa8] tracking-wide uppercase">Mengapa Memilih Kami</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mt-3 mb-4">
              Keunggulan FunMandarin
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Kami menyediakan pengalaman belajar terbaik dengan metode inovatif dan dukungan penuh untuk kesuksesan Anda
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group p-6 rounded-2xl bg-secondary/50 hover:bg-[#1e5fa8]/5 border border-transparent hover:border-[#1e5fa8]/20 transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-xl bg-[#1e5fa8]/10 group-hover:bg-[#1e5fa8] flex items-center justify-center mb-4 transition-colors duration-300">
                  <feature.icon className="h-6 w-6 text-[#1e5fa8] group-hover:text-white transition-colors duration-300" />
                </div>
                <h3 className="font-bold text-lg mb-2 text-foreground">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About / Story Section - Modern Timeline */}
      <section id="about" className="py-20 lg:py-28 bg-secondary/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <span className="text-sm font-semibold text-[#1e5fa8] tracking-wide uppercase">Our Story</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-black mt-3 mb-6">
              Cerita FUN Mandarin
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Seorang pendidik Indonesia yang passionate tentang bahasa Mandarin menyadari bahwa
              banyak anak merasa tertarik untuk belajar, namun metode pengajaran tradisional membuat
              mereka bosan. Dia memutuskan untuk menciptakan cara yang benar-benar berbeda.
            </p>
          </div>

          {/* Timeline */}
          <div className="max-w-3xl mx-auto">
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-0 md:left-1/2 top-0 bottom-0 w-px bg-[#1e5fa8]/20 transform md:-translate-x-1/2" />
              
              {timeline.map((item, index) => (
                <div key={item.year} className="relative flex items-center mb-12 md:flex-row">
                  {/* Content */}
                  <div className="w-full md:w-1/2 pl-8 md:pl-0 md:pr-12 md:text-right">
                    <div className="bg-background rounded-2xl p-10 shadow-lg shadow-foreground/5 border border-border/50">
                      <span className="inline-block text-sm font-bold text-[#1e5fa8] bg-[#1e5fa8]/10 px-3 py-1 rounded-full mb-3">
                        {item.year}
                      </span>
                      <h3 className="font-bold text-xl text-foreground mb-2">{item.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                  </div>
                  {/* Dot */}
                  <div className="absolute left-0 md:left-1/2 w-4 h-4 bg-[#1e5fa8] rounded-full transform -translate-x-1/2 border-4 border-background" />
                  {index === 1 && (
                    <div className="hidden md:block md:w-1/2 md:pl-12">
                      <Image 
                        src="/images/aboutpict.png" 
                        alt="Timeline Visual" 
                        width={0} 
                        height={0} 
                        sizes="100vw"
                        className="w-full h-full object-cover rounded-2xl shadow-lg border border-border/50"
                        style={{ minHeight: '100%', minWidth: '100%' }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* What Makes Us Different */}
          <div className="mt-20 text-center">
            <h3 className="text-2xl sm:text-3xl font-bold text-foreground mb-6">
              Apa yang Membedakan Kami?
            </h3>
            <p className="text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Di FUN Mandarin, kami tidak hanya mengajar bahasa Mandarin—kami menciptakan
              pengalaman belajar yang mengubah cara murid melihat pembelajaran. Dengan pendekatan
              yang inovatif dan personal, kami memastikan setiap siswa tidak hanya memahami bahasa,
              tetapi juga mencintai proses belajarnya.
            </p>
          </div>
        </div>
      </section>

      {/* Reviews Section - Modern Cards */}
      <section id="testimonials" className="py-20 lg:py-28 bg-background">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <span className="text-sm font-semibold text-[#1e5fa8] tracking-wide uppercase">Testimoni</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mt-3 mb-4">
              Apa Kata Siswa Kami
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Dengarkan dari para pelajar yang telah mengubah keterampilan Mandarin mereka bersama kami
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {googleReviews.map((review) => (
              <ReviewCard key={review.name} review={review} />
            ))}
          </div>

          {/* Google Reviews Badge */}
          <div className="mt-10 text-center">
            <a 
              href="https://www.google.com/maps/place/Fun+Mandarin/@-6.1454973,106.8104744,17z/data=!3m1!4b1!4m6!3m5!1s0x2e69f60617529637:0xfa9d7620dc9fd3fa!8m2!3d-6.1454973!4d106.8130493!16s%2Fg%2F11c47_zkqb?entry=ttu&g_ep=EgoyMDI2MDEyNy4wIKXMDSoASAFQAw%3D%3D" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 bg-foreground text-background rounded-full px-6 py-3 shadow-lg hover:scale-105 transition-transform"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-[#f9a825] text-[#f9a825]" />
                ))}
              </div>
              <span className="text-sm font-bold">4.9</span>
              <span className="text-sm opacity-80">from {googleReviews.length} Google reviews</span>
            </a>
          </div>
        </div>
      </section>

      {/* Footer - Modern & Clean */}
      <footer className="bg-foreground text-background">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-10">
            <div className="lg:col-span-2">
              <FunMandarinLogo className="h-12 w-auto brightness-200 mb-4" />
              <p className="text-background/60 text-sm max-w-sm leading-relaxed">
                Belajar Mandarin menjadi Seru & Menyenangkan! Gabunglah bersama ratusan pelajar dalam menguasai salah satu bahasa yang paling sering digunakan di dunia.
              </p>
              <div className="flex gap-3 mt-6">
                <div className="w-10 h-10 rounded-xl bg-background/10 hover:bg-background/20 flex items-center justify-center transition-colors cursor-pointer">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                </div>
                <div className="w-10 h-10 rounded-xl bg-background/10 hover:bg-background/20 flex items-center justify-center transition-colors cursor-pointer">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427a4.902 4.902 0 011.153 1.772 4.902 4.902 0 011.772 1.153c.636.247 1.363.416 2.427.465 1.067.048 1.407.06 4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.153-1.772 4.902 4.902 0 01-1.772-1.153c-.636-.247-1.363-.416-2.427-.465-1.067-.048-1.407-.06-4.123-.06h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 4.041v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z"/></svg>
                </div>
              </div>
            </div>
            <div className="lg:col-span-2">
              <h4 className="font-semibold mb-5 text-lg">Hours</h4>
              <div className="grid md:grid-cols-2 gap-4 text-sm text-background/60">
                <div className="rounded-xl border border-background/10 p-4 space-y-3">
                  <p className="font-medium text-background/90">Glodok</p>
                  <p className="flex items-start gap-3">
                    <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    Jl. Kemurnian IV No.35, Glodok, Kec. Taman Sari, Jakarta Barat
                  </p>
                  <div className="flex justify-between">
                    <span>Mon - Fri</span>
                    <span>9am - 6pm</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Saturday</span>
                    <span>9am - 4pm</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Sunday</span>
                    <span>Closed</span>
                  </div>
                </div>

                <div className="rounded-xl border border-background/10 p-4 space-y-3">
                  <p className="font-medium text-background/90">Citywalk Gajah Mada</p>
                  <p className="flex items-start gap-3">
                    <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    Mall Citywalk Gajah Mada, Jakarta
                  </p>
                  <div className="flex justify-between">
                    <span>Mon - Fri</span>
                    <span>10am - 7pm</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Saturday</span>
                    <span>10am - 5pm</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Sunday</span>
                    <span>Closed</span>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-5 text-lg">Contact</h4>
              <div className="space-y-3 text-sm text-background/60">

                <p className="flex items-center gap-3">
                  <Phone className="h-4 w-4 flex-shrink-0" />
                  (021) 6295371
                </p>
                <p className="flex items-center gap-3">
                  <Mail className="h-4 w-4 flex-shrink-0" />
                  info@funmandarin.com
                </p>
              </div>
            </div>
            
          </div>
          <div className="mt-12 pt-8 border-t border-background/10 text-center text-sm text-background/40">
            <p>2026 FUN Mandarin. All rights reserved.</p>
          </div>
        </div>
      </footer>

    </div>
  )
}

import { Button } from "@/components/ui/button"
import Link from "next/link"

export const metadata = {
  title: "About Fun Mandarin - Learn Chinese Language",
  description: "Learn more about Fun Mandarin's mission to make learning Mandarin Chinese fun, engaging, and accessible for all ages.",
}

export default function AboutPage() {
  return (
    <main>
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <img src="/images/fun-logo-00000.png" alt="Fun Mandarin" className="h-8 w-auto" />
          </Link>
          <Link href="/">
            <Button variant="outline">Back to Home</Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 text-balance">
            Tentang <span className="text-primary">FUN Mandarin</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Kami percaya bahwa belajar bahasa Mandarin seharusnya menyenangkan, engaging, dan dapat diakses oleh semua usia.
          </p>
        </div>
      </section>

      {/* Mission Section */}
      <section className="bg-secondary/30 py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6">Misi Kami</h2>
              <p className="text-lg text-muted-foreground mb-4">
                FUN Mandarin didirikan dengan tujuan untuk membuat pembelajaran bahasa Mandarin menjadi pengalaman yang menyenangkan dan tidak membosankan bagi anak-anak dan dewasa.
              </p>
              <p className="text-lg text-muted-foreground">
                Kami menggunakan metode pengajaran interaktif yang mendorong murid untuk aktif berpartisipasi dan berkomunikasi dalam situasi nyata, sehingga pembelajaran menjadi lebih bermakna dan efektif.
              </p>
            </div>
            <div className="bg-primary/10 rounded-lg p-8">
              <p className="text-sm font-medium text-primary mb-2">Visi Kami</p>
              <p className="text-2xl font-bold">
                Memberdayakan setiap orang untuk menguasai bahasa Mandarin dengan cara yang menyenangkan dan berkesan.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <h2 className="text-3xl font-bold mb-12 text-center">Nilai-Nilai Kami</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              title: "Pembelajaran yang Menyenangkan",
              description: "Kami percaya bahwa belajar harus menyenangkan dan engaging, bukan membosankan atau memberatkan.",
            },
            {
              title: "Perhatian Personal",
              description: "Dengan kelas kecil (8-10 murid), setiap siswa mendapat perhatian maksimal dari instruktur kami.",
            },
            {
              title: "Fleksibilitas Penuh",
              description: "Pilih antara kelas online atau tatap muka sesuai dengan kenyamanan dan kebutuhan Anda.",
            },
          ].map((value, index) => (
            <div key={index} className="bg-card rounded-lg p-6 border border-border">
              <h3 className="text-xl font-bold mb-3">{value.title}</h3>
              <p className="text-muted-foreground">{value.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Founder Story Section */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-primary mb-8">Cerita FUN Mandarin</h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto mb-12">
            Seorang pendidik Indonesia yang passionate tentang bahasa Mandarin menyadari bahwa banyak anak merasa tertarik untuk belajar, namun metode pengajaran tradisional membuat mereka bosan. Dia memutuskan untuk menciptakan cara yang benar-benar berbeda—dengan pendekatan interaktif, menyenangkan, dan penuh kreativitas—agar setiap anak dapat merasakan kegembiraan dalam mempelajari bahasa Mandarin.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="flex justify-center">
            <div className="relative">
              <img 
                src="/aboutpict.png" 
                alt="Founder of FUN Mandarin" 
                className="w-full max-w-md rounded-lg"
              />
            </div>
          </div>

          <div className="space-y-8">
            <div className="border-l-4 border-primary pl-6">
              <div className="text-sm font-medium text-primary mb-1">2019</div>
              <h3 className="text-2xl font-bold mb-2">Awal Perjalanan</h3>
              <p className="text-muted-foreground">
                FUN Mandarin didirikan dengan tujuan sederhana namun kuat: membuat pembelajaran bahasa Mandarin menjadi pengalaman yang tak terlupakan dan penuh kegembiraan bagi setiap murid.
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
              <div className="text-sm font-medium text-primary mb-1">2024</div>
              <h3 className="text-2xl font-bold mb-2">Misi Global</h3>
              <p className="text-muted-foreground">
                Hari ini, FUN Mandarin terus berinovasi dan bermimpi untuk membuat pembelajaran Mandarin yang menyenangkan dapat diakses oleh lebih banyak orang di seluruh dunia.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-6">Apa yang Membedakan Kami?</h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Di FUN Mandarin, kami tidak hanya mengajar bahasa Mandarin—kami menciptakan pengalaman belajar yang mengubah cara murid melihat pembelajaran. Dengan pendekatan yang inovatif dan personal, kami memastikan setiap siswa tidak hanya memahami bahasa, tetapi juga mencintai proses belajarnya.
          </p>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="bg-secondary/30 py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold mb-12 text-center">Mengapa Memilih FUN Mandarin?</h2>
          <div className="space-y-6">
            {[
              "Program yang disesuaikan dengan kebutuhan dan kemampuan murid, dari anak-anak hingga dewasa",
              "Metode pengajaran interaktif yang mendorong partisipasi aktif",
              "Sistem reward untuk setiap tugas rumah yang dikerjakan",
              "Opsi fleksibel antara kelas online dan tatap muka",
              "Instruktur berpengalaman yang passionate dalam mengajar",
              "Komunitas pembelajaran yang supportif dan positif",
            ].map((reason, index) => (
              <div key={index} className="flex items-start gap-4">
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-primary font-bold">✓</span>
                </div>
                <p className="text-lg text-muted-foreground">{reason}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-6">Siap untuk Memulai?</h2>
        <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
          Bergabunglah dengan ribuan murid yang telah merasakan pengalaman belajar Mandarin yang menyenangkan bersama FUN Mandarin.
        </p>
        <Link href="/">
          <Button size="lg" className="px-8">
            Lihat Program Kami
          </Button>
        </Link>
      </section>

      {/* Footer */}
      <footer className="bg-secondary/20 border-t border-border py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <img src="/images/fun-logo-00000.png" alt="Fun Mandarin" className="h-8 w-auto mb-4 md:mb-0" />
            <p className="text-muted-foreground text-sm">© 2026 FUN Mandarin. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </main>
  )
}

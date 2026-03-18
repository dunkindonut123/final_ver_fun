import { type HSKLevel, hskLevelInfo } from "@/lib/hanzi-data"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default function GamesPage() {
  return (
    <main className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-4xl space-y-12">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link href="/" className="flex items-center gap-2 text-lg text-black hover:text-[#1e5fa8] mb-4">
            <ArrowLeft className="h-5 w-5" />
            Kembali ke beranda
          </Link>
        </div>

        {/* Level Selection */}
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-semibold text-foreground">Pilih Sesi</h2>
            
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {([1, 2] as HSKLevel[]).map((level) => {
              const info = hskLevelInfo[level]

              return (
                <Link
                  key={level}
                  href={`/game/${level}`}
                  className="group p-6 rounded-xl border border-border bg-card hover:border-foreground/20 hover:shadow-lg transition-all duration-200 text-left"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-2xl font-bold text-foreground group-hover:text-[#1e5fa8] transition-colors">
                        {info.name}
                      </h3>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">{info.description}</p>
                  <div className="inline-flex items-center gap-2 text-sm font-medium text-[#1e5fa8] group-hover:gap-3 transition-all">
                    <span>Start Game</span>
                    <span className="group-hover:translate-x-1 transition-transform">→</span>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>

        {/* Instructions */}
        <div className="border-t border-border my-0 space-y-5 pt-8">
          <h3 className="text-lg font-semibold text-foreground">Cara Bermain</h3>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="text-3xl font-bold text-[#1e5fa8] leading-7 py-1">1</div>
              <h4 className="font-semibold text-foreground">Baca Hanzi</h4>
              <p className="text-muted-foreground text-xs px-0 py-0">Sebuah hanzi akan ditampilkan pada layar</p>
            </div>
            <div className="space-y-2">
              <div className="text-3xl font-bold text-[#1e5fa8]">2</div>
              <h4 className="font-semibold text-foreground text-base">Ketik Pinyin</h4>
              <p className="text-muted-foreground text-xs">Ketiklah pinyin menggunakan keyboard</p>
            </div>
            <div className="space-y-2">
              <div className="text-3xl font-bold text-[#1e5fa8]">3</div>
              <h4 className="font-semibold text-foreground">Daparkan Skor</h4>
              <p className="text-muted-foreground text-xs">Dapatkan skor tertinggi dalam 1 menit</p>
            </div>
          </div>
          
        </div>
      </div>
    </main>
  )
}

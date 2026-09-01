import React from "react"
import type { Metadata, Viewport } from 'next'
import { Analytics } from '@vercel/analytics/next'
import { ChunkLoadErrorReloader } from '@/components/chunk-load-error-reloader'
import './globals.css'

export const metadata: Metadata = {
  title: 'Fun Mandarin - Belajar Mandarin Menjadi Seru & Menyenangkan!',
  description: 'Gabunglah dengan ratusan pelajar dalam menguasai bahasa Mandarin.',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
    ],
    apple: '/apple-icon.png',
  },
}

/** Enables safe-area insets + keyboard overlay (page stays put when typing). */
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  interactiveWidget: 'overlays-content',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans antialiased`}>
        <ChunkLoadErrorReloader />
        {children}
        <Analytics />
      </body>
    </html>
  )
}

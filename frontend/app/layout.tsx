import type { Metadata } from 'next'
import { Plus_Jakarta_Sans, Inter } from 'next/font/google'
import './globals.css'

const syne = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '600', '700', '800'],
  variable: '--font-syne',
})

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: 'FreelanceRadar — AI Job Matching for Upwork',
  description: 'Stop hunting for jobs. Let AI find them for you.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${syne.variable} ${inter.variable}`} style={{
        backgroundColor: '#0a0a0a',
        color: '#ffffff',
        margin: 0,
        padding: 0,
        overflowX: 'hidden',
        fontFamily: 'var(--font-inter)'
      }}>
        {children}
      </body>
    </html>
  )
}
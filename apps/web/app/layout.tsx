import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Video Learning',
  description: 'Fill-in-the-blank exercises from YouTube videos',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

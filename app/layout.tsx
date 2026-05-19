import type { Metadata } from 'next'
import 'remixicon/fonts/remixicon.css'
import './globals.css'

export const metadata: Metadata = {
  title: 'ScenarioForge',
  description: '시나리오 작성·정리 도구',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className="antialiased">{children}</body>
    </html>
  )
}

import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import GlobalHeader from '@/components/ui/GlobalHeader'
import { SearchHistoryProvider } from '@/lib/search-history'

const inter = Inter({ subsets: ['latin'] })

export const viewport = {
  width: 'device-width',
  initialScale: 1,
}

export const metadata: Metadata = {
  title: 'ヘルスケア食材アプリ',
  description: '病気・症状に効果的な食材と調理法を提供するアプリケーション',
  keywords: '健康, 食材, 栄養, 病気予防, 健康食品, 調理法, ヘルスケア',
  authors: [{ name: 'ヘルスケア食材アプリチーム' }],
  robots: 'index, follow',
  metadataBase: new URL('https://healthcare-food-app.example.com'),
  openGraph: {
    title: 'ヘルスケア食材アプリ',
    description: '病気・症状に効果的な食材と調理法を提供するアプリケーション',
    url: 'https://healthcare-food-app.example.com',
    siteName: 'ヘルスケア食材アプリ',
    locale: 'ja_JP',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ヘルスケア食材アプリ',
    description: '病気・症状に効果的な食材と調理法を提供するアプリケーション',
  },
  manifest: '/manifest.json',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja" className="h-full">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#4f46e5" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="ヘルスケア食材アプリ" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
      </head>
      <body className={`${inter.className} h-full`}>
        <SearchHistoryProvider>
          <div className="min-h-screen flex flex-col bg-gray-50">
            <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:p-4 focus:bg-white focus:z-50">
              メインコンテンツにスキップ
            </a>
            <GlobalHeader />
            <main id="main-content" className="flex-grow max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
              {children}
            </main>
            <footer className="bg-white border-t mt-auto" role="contentinfo">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                <p className="text-center text-sm text-gray-500">
                  © {new Date().getFullYear()} ヘルスケア食材アプリ
                </p>
              </div>
            </footer>
          </div>
        </SearchHistoryProvider>
      </body>
    </html>
  )
}
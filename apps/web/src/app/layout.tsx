import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Toaster } from 'react-hot-toast'
import Navbar from '@/components/Navbar'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'ShopEase — Premium Products',
  description: 'Your one-stop shop for premium products'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Navbar />
        <main className="min-h-screen bg-gray-50">
          {children}
        </main>
        <footer className="bg-gray-900 text-gray-400 py-12 mt-16">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <p className="text-2xl font-bold text-white mb-2">ShopEase</p>
            <p>© 2026 ShopEase. All rights reserved.</p>
          </div>
        </footer>
        <Toaster position="top-right" />
      </body>
    </html>
  )
}

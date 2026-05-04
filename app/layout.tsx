import type { Metadata, Viewport } from 'next'
import { Toaster } from 'react-hot-toast'
import AppWrapper from '@/components/AppWrapper'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'العُريف | لعبة المعلومات التفاعلية',
    template: '%s | العُريف',
  },
  description: 'منصة ألعاب معلومات تفاعلية — العب مع فريقك في الوقت الفعلي',
  keywords: ['معلومات', 'مسابقات', 'لعبة', 'فريق', 'ترفيه', 'عربي'],
  authors: [{ name: 'العُريف' }],
  openGraph: {
    title: 'العُريف | لعبة المعلومات التفاعلية',
    description: 'العب مسابقات المعلومات مع فريقك في الوقت الفعلي',
    type: 'website',
    locale: 'ar_SA',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export const viewport: Viewport = {
  themeColor: '#0a0a0f',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700;800;900&family=Tajawal:wght@300;400;500;700;800;900&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased" suppressHydrationWarning>
        <AppWrapper>
          {children}
        </AppWrapper>
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: 'rgba(15, 15, 45, 0.9)',
              color: 'white',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(16px)',
              borderRadius: '20px',
            },
          }}
        />
      </body>
    </html>
  )
}

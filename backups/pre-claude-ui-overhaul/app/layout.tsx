import type { Metadata, Viewport } from 'next'
import { Toaster } from 'react-hot-toast'
import ParticleField from '@/components/ParticleField'
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
      </head>
      <body className="bg-loud noise" suppressHydrationWarning>
        {children}
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: 'var(--color-surface-2)',
              color: 'var(--color-text-primary)',
              border: '1px solid var(--color-border)',
              fontFamily: 'var(--font-body)',
              direction: 'rtl',
            },
            success: {
              iconTheme: {
                primary: '#10b981',
                secondary: 'white',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: 'white',
              },
            },
          }}
        />
      </body>
    </html>
  )
}

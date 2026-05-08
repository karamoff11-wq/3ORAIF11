import type { Metadata, Viewport } from 'next'
import { Toaster } from 'react-hot-toast'
import AppWrapper from '@/components/AppWrapper'
import GlobalControls from '@/components/GlobalControls'
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
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var stored = localStorage.getItem('abu-al-areef-feedback-storage');
                  if (!stored) return;
                  var data = JSON.parse(stored);
                  var state = data.state || data;

                  // Apply theme
                  var theme = state.themeMode || 'dark';
                  if (theme === 'system') {
                    theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                  }
                  document.documentElement.classList.add(theme);
                  document.documentElement.style.colorScheme = theme;

                  // Apply lang + dir
                  var lang = state.lang || 'AR';
                  document.documentElement.setAttribute('lang', lang === 'AR' ? 'ar' : 'en');
                  document.documentElement.setAttribute('dir',  lang === 'AR' ? 'rtl' : 'ltr');

                  // Apply accent color
                  var accent = state.accentColor || '#8B5CF6';
                  document.documentElement.style.setProperty('--accent',        accent);
                  document.documentElement.style.setProperty('--accent-glow',   accent + '40');
                  document.documentElement.style.setProperty('--accent-subtle', accent + '15');

                  // Reveal page (was hidden to prevent FOUC)
                  document.documentElement.style.visibility = 'visible';
                } catch(e) {
                  // If anything fails, still show the page with defaults
                  document.documentElement.classList.add('dark');
                  document.documentElement.style.visibility = 'visible';
                }
              })();
            `,
          }}
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700;800;900&family=Tajawal:wght@300;400;500;700;800;900&family=Aref+Ruqaa:wght@400;700&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased" suppressHydrationWarning>
        <AppWrapper>
          {children}
          <GlobalControls />
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

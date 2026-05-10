import type { Metadata, Viewport } from 'next'
import { Toaster } from 'react-hot-toast'
import AppWrapper from '@/components/AppWrapper'
import GlobalControls from '@/components/GlobalControls'
import LazyPostHog from '@/components/LazyPostHog'
import './globals.css'

import { ThemeProvider } from '@/context/ThemeContext'
import ThemeBanner from '@/components/ThemeBanner'

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
                  var THEMES = {
                    medical: {
                      '--accent':'#22D3EE','--accent-glow':'rgba(34,211,238,0.35)','--accent-subtle':'rgba(34,211,238,0.10)',
                      '--bg-primary':'#020D18','--bg-secondary':'#051829','--bg-card':'rgba(6,182,212,0.08)',
                      '--bg-card-hover':'rgba(6,182,212,0.14)','--border-card':'rgba(34,211,238,0.18)',
                      '--color-primary':'#22D3EE','--color-surface':'#051829','--color-bg':'#020D18',
                      '--nav-bg':'rgba(2,13,24,0.9)','--glass-card-bg':'rgba(6,182,212,0.08)','--glass-card-border':'rgba(34,211,238,0.18)',
                      '--body-gradient':'linear-gradient(to bottom, #020D18, #051829)'
                    },
                    engineering: {
                      '--accent':'#FB923C','--accent-glow':'rgba(251,146,60,0.35)','--accent-subtle':'rgba(251,146,60,0.10)',
                      '--bg-primary':'#0C0700','--bg-secondary':'#171000','--bg-card':'rgba(249,115,22,0.08)',
                      '--bg-card-hover':'rgba(249,115,22,0.14)','--border-card':'rgba(251,146,60,0.18)',
                      '--color-primary':'#FB923C','--color-surface':'#171000','--color-bg':'#0C0700',
                      '--nav-bg':'rgba(12,7,0,0.9)','--glass-card-bg':'rgba(249,115,22,0.08)','--glass-card-border':'rgba(251,146,60,0.18)',
                      '--body-gradient':'linear-gradient(to bottom, #0C0700, #171000)'
                    },
                    education: {
                      '--accent':'#A78BFA','--accent-glow':'rgba(167,139,250,0.35)','--accent-subtle':'rgba(167,139,250,0.10)',
                      '--bg-primary':'#06020F','--bg-secondary':'#0D071E','--bg-card':'rgba(139,92,246,0.09)',
                      '--bg-card-hover':'rgba(139,92,246,0.15)','--border-card':'rgba(167,139,250,0.2)',
                      '--color-primary':'#A78BFA','--color-surface':'#0D071E','--color-bg':'#06020F',
                      '--nav-bg':'rgba(6,2,15,0.9)','--glass-card-bg':'rgba(139,92,246,0.09)','--glass-card-border':'rgba(167,139,250,0.2)',
                      '--body-gradient':'linear-gradient(to bottom, #06020F, #0D071E)'
                    },
                    birthday: {
                      '--accent':'#F472B6','--accent-glow':'rgba(244,114,182,0.40)','--accent-subtle':'rgba(244,114,182,0.10)',
                      '--bg-primary':'#08000E','--bg-secondary':'#130018','--bg-card':'rgba(236,72,153,0.09)',
                      '--bg-card-hover':'rgba(236,72,153,0.16)','--border-card':'rgba(244,114,182,0.2)',
                      '--color-primary':'#F472B6','--color-surface':'#130018','--color-bg':'#08000E',
                      '--nav-bg':'rgba(8,0,14,0.9)','--glass-card-bg':'rgba(236,72,153,0.09)','--glass-card-border':'rgba(244,114,182,0.2)',
                      '--body-gradient':'radial-gradient(circle at 20% 30%, rgba(244,114,182,0.15) 0%, transparent 50%), radial-gradient(circle at 80% 70%, rgba(245,158,11,0.1) 0%, transparent 50%), radial-gradient(circle at 50% 50%, #0d001a 0%, #08000e 100%)'
                    }
                  };

                  var stored = localStorage.getItem('abu-al-areef-feedback-storage');
                  var state = {};
                  if (stored) { try { var d = JSON.parse(stored); state = d.state || d; } catch(e){} }

                  var urlParams = new URLSearchParams(window.location.search);
                  var urlTheme = urlParams.get('theme');

                  // 1. Dark / Light
                  var mode = state.themeMode || 'dark';
                  if (mode === 'system') mode = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                  document.documentElement.classList.add(mode);
                  document.documentElement.style.colorScheme = mode;

                  // 2. Lang + Dir
                  var lang = state.lang || 'AR';
                  document.documentElement.setAttribute('lang', lang === 'AR' ? 'ar' : 'en');
                  document.documentElement.setAttribute('dir',  lang === 'AR' ? 'rtl' : 'ltr');

                  // 3. Apply full theme variable set (URL > store > default)
                  var activeId = urlTheme || state.specialTheme || 'default';
                  document.documentElement.setAttribute('data-theme', activeId);
                  var t = THEMES[activeId];
                  var r = document.documentElement;
                  if (t) {
                    Object.keys(t).forEach(function(k){ r.style.setProperty(k, t[k]); });
                  } else {
                    var accent = state.accentColor || '#8B5CF6';
                    r.style.setProperty('--accent',        accent);
                    r.style.setProperty('--accent-glow',   accent + '40');
                    r.style.setProperty('--accent-subtle', accent + '15');
                  }

                  document.documentElement.style.visibility = 'visible';
                } catch(e) {
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
        <LazyPostHog>
          <ThemeProvider>
            <ThemeBanner />
            <AppWrapper>
              {children}
              <GlobalControls />
            </AppWrapper>
          </ThemeProvider>
        </LazyPostHog>
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

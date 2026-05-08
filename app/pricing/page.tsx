import PricingClient from './PricingClient'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'الأسعار | العُريف',
  description: 'خطط أسعار العُريف — ابدأ مجاناً، وسّع بلا حدود',
}

export default function PricingPage() {
  return <PricingClient />
}

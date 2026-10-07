import type { Metadata } from 'next';
import '@fontsource-variable/dm-sans';
import '@fontsource-variable/noto-sans-thai';
import './globals.css';
export const metadata: Metadata = {
  title: 'Concierge — ศูนย์วางแผนการขาย',
  description:
    'AI Sales Decision & Action Concierge จัดสรรเวลาทีมขายให้โอกาสที่เหมาะสม พร้อมเหตุผลและขั้นตอนลงมือทำ',
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <body>{children}</body>
    </html>
  );
}

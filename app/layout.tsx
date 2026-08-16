import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'RepoSync — Repository Intelligence',
  description: 'Understand, run, and improve any public GitHub repository.',
  openGraph: {
    images: [{ url: '/ChatGPT_Image_Aug_14,_2026,_08_12_34_PM.png' }],
  },
  twitter: {
    card: 'summary_large_image',
    images: [{ url: '/ChatGPT_Image_Aug_14,_2026,_08_12_34_PM.png' }],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}

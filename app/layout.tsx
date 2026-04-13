import type { Metadata } from 'next';
import { Bungee_Shade, Barlow, Barlow_Semi_Condensed, Playfair_Display, Lora } from 'next/font/google';
import { BrandProvider } from '@/context/BrandContext';
import './globals.css';

const bungeeShade = Bungee_Shade({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-bungee-shade',
  display: 'swap',
});

const barlow = Barlow({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-barlow',
  display: 'swap',
});

const barlowSemiCondensed = Barlow_Semi_Condensed({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-barlow-condensed',
  display: 'swap',
});

const playfairDisplay = Playfair_Display({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
});

const lora = Lora({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-lora',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'EPA \u2014 Executive Production Assistant',
  description: 'Standardized briefs for every stage of production.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${bungeeShade.variable} ${barlow.variable} ${barlowSemiCondensed.variable} ${playfairDisplay.variable} ${lora.variable}`}
    >
      <body>
        <BrandProvider>
          {children}
        </BrandProvider>
      </body>
    </html>
  );
}

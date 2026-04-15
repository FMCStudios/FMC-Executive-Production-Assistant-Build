import type { Metadata } from 'next';
import { OperatorProvider } from '@/context/OperatorContext';
import './globals.css';

export const metadata: Metadata = {
  title: 'EPA — Executive Production Assistant',
  description: 'Lifecycle pipeline for every stage of production.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <OperatorProvider>
          {children}
        </OperatorProvider>
      </body>
    </html>
  );
}

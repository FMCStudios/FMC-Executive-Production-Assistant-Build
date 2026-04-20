import type { Metadata } from 'next';
import { SessionProvider } from '@/context/SessionContext';
import { ProfileModalProvider } from '@/context/ProfileModalContext';
import ProfileModal from '@/components/ProfileModal';
import './globals.css';

export const metadata: Metadata = {
  title: 'EPA — Executive Production Assistant',
  description: 'Lifecycle pipeline for every stage of production.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <SessionProvider>
          <ProfileModalProvider>
            {children}
            <ProfileModal />
          </ProfileModalProvider>
        </SessionProvider>
      </body>
    </html>
  );
}

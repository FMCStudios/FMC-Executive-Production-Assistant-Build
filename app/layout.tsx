import type { Metadata } from 'next';
import { SessionProvider } from '@/context/SessionContext';
import { OperatorProvider } from '@/context/OperatorContext';
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
          <OperatorProvider>
            <ProfileModalProvider>
              {children}
              <ProfileModal />
            </ProfileModalProvider>
          </OperatorProvider>
        </SessionProvider>
      </body>
    </html>
  );
}

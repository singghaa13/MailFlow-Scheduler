import type { Metadata, Viewport } from 'next';
import './globals.css';

title: 'MailFlow Scheduler',
  description: 'Schedule and manage your emails efficiently',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

import { AuthProvider } from '../context/auth-context';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <html lang="en">
      <body className="bg-gray-50">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}

import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'MailFlow Scheduler',
  description: 'Schedule and manage your emails efficiently',
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

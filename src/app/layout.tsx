// app/layout.jsx
import { AuthProvider } from '../app/contexts/AuthContext';
import './globals.css';
import type { ReactNode } from 'react';

export const metadata = {
  title: 'OWASP Quiz Portal',
  description: 'Recruitment quiz for the OWASP Student Chapter.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
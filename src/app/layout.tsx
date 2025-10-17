// app/layout.jsx
import { AuthProvider } from '../app/contexts/AuthContext';
import './globals.css'; // Your global stylesheet

export const metadata = {
  title: 'OWASP Quiz Portal',
  description: 'Recruitment quiz for the OWASP Student Chapter.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
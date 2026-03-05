import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'TablePing Host Dashboard',
  description: 'Replace paper waitlists with QR check-in, live ETA and SMS alerts.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="app-shell">
          <header className="topbar">
            <div>
              <h1>TablePing</h1>
              <p>Live queue + AI ETA + SMS readiness</p>
            </div>
            <span className="badge">Host View</span>
          </header>
          <main>{children}</main>
        </div>
      </body>
    </html>
  );
}

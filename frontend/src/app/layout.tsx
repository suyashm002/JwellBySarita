import type { Metadata } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Jewelup by Sarita | Premium Silver & Gemstone Jewellery',
  description:
    'Discover handcrafted premium silver and gemstone jewellery from Jaipur. BIS Hallmarked 925 Sterling Silver rings, earrings, pendants, bracelets and more at Jewelup by Sarita.',
  keywords: [
    'silver jewellery',
    'gemstone jewellery',
    'sterling silver',
    'Jaipur jewellery',
    'handcrafted jewellery',
    'BIS hallmark',
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <body className="font-body bg-[#FFFAF7] text-gray-900 antialiased">
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#2D1F22',
              color: '#fff',
              borderRadius: '12px',
              fontSize: '14px',
            },
            success: {
              iconTheme: {
                primary: '#D4AF37',
                secondary: '#fff',
              },
            },
          }}
        />
      </body>
    </html>
  );
}

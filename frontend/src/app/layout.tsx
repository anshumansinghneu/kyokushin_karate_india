import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ScrollProgress from "@/components/ScrollProgress";
import StructuredData from "@/components/StructuredData";
import { ToastProvider } from "@/contexts/ToastContext";
import MobileBottomNav from "@/components/ui/MobileBottomNav";
import BackToTop from "@/components/ui/BackToTop";

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  weight: ["400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://kyokushin-karate-india.vercel.app'),
  icons: {
    icon: '/kkfi-logo.avif',
    apple: '/kkfi-logo.avif',
  },
  title: {
    default: "Kyokushin Karate Foundation of India | Official Platform",
    template: "%s | KKFI"
  },
  description: "Official platform for Kyokushin Karate Foundation of India. Join dojos, track belt progression, register for tournaments, and connect with the martial arts community.",
  keywords: ["Kyokushin Karate", "Martial Arts India", "Karate Training", "Belt Promotion", "Karate Tournament", "Dojo India", "Karate Classes"],
  authors: [{ name: "Kyokushin Karate Foundation of India" }],
  creator: "Kyokushin Karate Foundation of India",
  publisher: "Kyokushin Karate Foundation of India",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://kyokushin-karate-india.vercel.app",
    title: "Kyokushin Karate Foundation of India | Official Platform",
    description: "Official platform for Kyokushin Karate Foundation of India. Join dojos, track belt progression, register for tournaments.",
    siteName: "Kyokushin Karate Foundation of India",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Kyokushin Karate Foundation of India"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "Kyokushin Karate Foundation of India | Official Platform",
    description: "Official platform for Kyokushin Karate Foundation of India. Join dojos, track belt progression, register for tournaments.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    // google: "your-google-verification-code",
    // yandex: "your-yandex-verification-code",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={cn(montserrat.variable, "min-h-screen bg-black font-sans antialiased")}>
        <StructuredData />
        <ToastProvider>
          <ScrollProgress />
          <Navbar />
          <main className="min-h-screen pt-24 pb-20 md:pb-0">
            {children}
          </main>
          <Footer />
          <MobileBottomNav />
          <BackToTop />
        </ToastProvider>
      </body>
    </html>
  );
}

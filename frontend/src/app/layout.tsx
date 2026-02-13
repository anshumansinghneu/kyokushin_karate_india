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
import PageTransition from "@/components/PageTransition";

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  weight: ["400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://kyokushinfoundation.com'),
  icons: {
    icon: '/kkfi-logo.avif',
    apple: '/kkfi-logo.avif',
  },
  title: {
    default: "Kyokushin Karate Foundation of India | Best Full Contact Karate Training",
    template: "%s | KKFI – Kyokushin Karate Foundation of India"
  },
  description: "Join the Kyokushin Karate Foundation of India. Led by Shihan Vasant Kumar Singh, we offer authentic full-contact karate training for kids and adults across India. Dojos, tournaments, belt gradings & self-defense classes. Start your journey today!",
  keywords: [
    "Kyokushin Karate India",
    "full-contact karate India",
    "Kyokushin grading syllabus 2026",
    "self-defense classes for adults India",
    "martial arts for kids near me",
    "best karate classes India",
    "Kyokushin dojo near me",
    "Shihan Vasant Kumar Singh",
    "KKFI",
    "karate tournament India",
    "full contact karate training",
    "martial arts India",
    "karate for children India",
    "Kyokushin belt promotion",
    "IKO Kyokushin India",
    "karate self defense training"
  ],
  authors: [{ name: "Kyokushin Karate Foundation of India" }],
  creator: "Kyokushin Karate Foundation of India",
  publisher: "Kyokushin Karate Foundation of India",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: 'https://kyokushinfoundation.com',
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://kyokushinfoundation.com",
    title: "Kyokushin Karate Foundation of India | Best Full Contact Karate Training",
    description: "Join the Kyokushin Karate Foundation of India. Led by Shihan Vasant Kumar Singh, we offer authentic full-contact karate training for kids and adults across India. Start your journey today!",
    siteName: "Kyokushin Karate Foundation of India",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Kyokushin Karate Foundation of India – Full Contact Karate Training"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "Kyokushin Karate Foundation of India | Best Full Contact Karate Training",
    description: "Join the Kyokushin Karate Foundation of India. Authentic full-contact karate training for kids & adults. Dojos, tournaments & belt gradings across India.",
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
            <PageTransition>{children}</PageTransition>
          </main>
          <Footer />
          <MobileBottomNav />
          <BackToTop />
        </ToastProvider>
      </body>
    </html>
  );
}

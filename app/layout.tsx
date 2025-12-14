import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { ToastProvider } from "@/components/ui/ToastProvider";
import FloatingHelpButton from "@/components/help/FloatingHelpButton";
import { Analytics } from "@vercel/analytics/next";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "M40.mx - Simulador Modalidad 40 IMSS | Calcula tu Pensión",
  description: "Calcula tu pensión con el simulador más preciso de Modalidad 40 IMSS. Para trabajadores de 45-60 años en México. Análisis personalizado, estrategias optimizadas y proyecciones de 20 años. ¡Descubre cuánto recibirás de pensión!",
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: 'any' }
    ],
    apple: '/favicon.svg',
  },
  keywords: [
    "modalidad 40",
    "IMSS",
    "pensión",
    "jubilación",
    "México",
    "trabajadores",
    "45 años",
    "60 años",
    "calculadora pensión",
    "simulador IMSS",
    "modalidad 40 IMSS",
    "pensión IMSS",
    "jubilación IMSS",
    "trabajadores México",
    "seguridad social"
  ],
  authors: [{ name: "M40.mx" }],
  creator: "M40.mx",
  publisher: "M40.mx",
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
  openGraph: {
    type: 'website',
    locale: 'es_MX',
    url: 'https://m40.mx',
    siteName: 'M40.mx - Simulador Modalidad 40 IMSS',
    title: 'M40.mx - Simulador Modalidad 40 IMSS | Calcula tu Pensión',
    description: 'Calcula tu pensión con el simulador más preciso de Modalidad 40 IMSS. Para trabajadores de 45-60 años en México. Análisis personalizado y estrategias optimizadas.',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'M40.mx - Simulador Modalidad 40 IMSS',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'M40.mx - Simulador Modalidad 40 IMSS | Calcula tu Pensión',
    description: 'Calcula tu pensión con el simulador más preciso de Modalidad 40 IMSS. Para trabajadores de 45-60 años en México.',
    images: ['/og-image.jpg'],
  },
  alternates: {
    canonical: 'https://m40.mx',
  },
  category: 'finance',
  classification: 'Financial Tools',
  other: {
    'geo.region': 'MX',
    'geo.country': 'Mexico',
    'geo.placename': 'Mexico',
    'DC.title': 'M40.mx - Simulador Modalidad 40 IMSS',
    'DC.description': 'Calcula tu pensión con el simulador más preciso de Modalidad 40 IMSS',
    'DC.subject': 'Modalidad 40, IMSS, Pensión, Jubilación',
    'DC.language': 'es',
    'DC.coverage': 'Mexico',
    'DC.audience': 'Trabajadores de 45-60 años en México',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#2563eb" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="M40.mx" />
        <meta name="msapplication-TileColor" content="#2563eb" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          {children}
          <ToastProvider />
          <FloatingHelpButton />
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  );
}

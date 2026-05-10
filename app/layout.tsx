import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";
import AuthHeader from "@/src/components/AuthHeader";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

function resolveMetadataBase(): URL | undefined {
  try {
    if (process.env.VERCEL_URL) {
      return new URL(`https://${process.env.VERCEL_URL}`);
    }
    if (process.env.NEXT_PUBLIC_SITE_URL) {
      return new URL(process.env.NEXT_PUBLIC_SITE_URL);
    }
    return new URL("http://localhost:3000");
  } catch {
    return undefined;
  }
}

export const metadata: Metadata = {
  metadataBase: resolveMetadataBase(),
  title: "NeoFlux Lead Engine",
  description: "AI збір лідів",
  openGraph: {
    title: "NeoFlux Lead Engine",
    description: "AI збір лідів",
  },
  twitter: {
    card: "summary",
    title: "NeoFlux Lead Engine",
    description: "AI збір лідів",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="uk"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <Suspense fallback={null}>
          <AuthHeader />
        </Suspense>
        {children}
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Footer from "@/components/Footer";
import Providers from "./Providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://template1-portofolio.web.app"),
  title: "Portfolio",
  description: "Personal Portfolio Website",
  icons: {
    icon: [
      { url: "/olifyhub.png", type: "image/png" },
      { url: "/icon.png", type: "image/png" },
    ],
    shortcut: "/olifyhub.png",
    apple: "/olifyhub.png",
  },
  openGraph: {
    title: "Portfolio",
    description: "Personal Portfolio Website",
    url: "https://template1-portofolio.web.app",
    siteName: "Portfolio",
    images: [
      {
        url: "/olifyhub.png",
        width: 180,
        height: 180,
        alt: "Portfolio Icon",
        type: "image/png",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Portfolio",
    description: "Personal Portfolio Website",
    images: ["/olifyhub.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="overflow-x-clip bg-white" style={{ backgroundColor: "#ffffff" }}>
      <head>
        <link rel="icon" href="/olifyhub.png" type="image/png" sizes="180x180" />
        <link rel="apple-touch-icon" href="/olifyhub.png" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased overflow-x-clip bg-white`}
        style={{ backgroundColor: "#ffffff" }}
        suppressHydrationWarning={true}
      >
        <Providers>
          <div className="w-full relative">
            {children}
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  );
}


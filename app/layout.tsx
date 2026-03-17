import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "VeriTrace - Tracking and Tracing in Supply Chain Management",
  description:
    "A supply chain management system built with Next.js and TypeScript.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* <div className="max-w-[100vw] md:max-w-[1366px] min-h-screen md:mx-auto md:my-0 py-0 px-2 md:px-[60px] flex flex-col justify-between"> */}
        {children}
        {/* </div> */}
      </body>
    </html>
  );
}

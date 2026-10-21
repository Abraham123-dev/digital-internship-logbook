// Root layout — wraps all routes.
// Sets up fonts, global providers (QueryClient, Auth), and base HTML structure.
// Do not add page-specific UI here.

import type { Metadata } from "next";
import { Inter, Geist } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Logr — Digital Internship Logbook",
  description:
    "Logr is the official digital internship logbook system for SWEP and SIWES students at OAU Faculty of Engineering.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={cn("font-sans", geist.variable)}>
      <body>{children}</body>
    </html>
  );
}

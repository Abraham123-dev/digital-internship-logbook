import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Logr — Digital Internship Logbook",
  description:
    "Official digital logbook for SWEP & SIWES engineering students. Daily logs, weekly submissions, coordinator grading, and external supervisor verification.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={cn("font-sans", plusJakartaSans.variable)}>
      <body className="font-sans antialiased text-[#0F172A] bg-white selection:bg-[#6366F1] selection:text-white">
        {children}
      </body>
    </html>
  );
}

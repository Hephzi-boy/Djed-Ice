import type { Metadata } from "next";
import { JetBrains_Mono, Plus_Jakarta_Sans } from "next/font/google";
import { AppShell } from "./_components/app-shell";
import { ParticleBackground } from "./_components/particle-background";
import "./globals.css";

const jakartaSans = Plus_Jakarta_Sans({
  variable: "--font-jakarta-sans",
  subsets: ["latin"],
});

const mono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Djed Ice Med & Clinical AI Assistant",
  description: "AI-powered clinical assistant for hospitals.",
  icons: {
    icon: "/djed-ice.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${jakartaSans.variable} ${mono.variable} h-full antialiased`}
    >
      <body className="min-h-full relative">
        <div className="app-backdrop" aria-hidden />
        <ParticleBackground />
        <div className="relative z-10">
          <AppShell>{children}</AppShell>
        </div>
      </body>
    </html>
  );
}

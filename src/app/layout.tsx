import type { Metadata } from "next";
import { Geist, Geist_Mono, Rajdhani } from "next/font/google";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { CartBootstrap } from "@/components/providers/CartBootstrap";
import { TebexScript } from "@/components/providers/TebexScript";
import { SITE_METADATA_DESCRIPTION, SITE_METADATA_TITLE } from "@/lib/site";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const rajdhani = Rajdhani({
  variable: "--font-rajdhani",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: SITE_METADATA_TITLE,
    template: "%s — LSCNR",
  },
  description: SITE_METADATA_DESCRIPTION,
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${rajdhani.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("lscnr-theme");var d=t!=="light";document.documentElement.classList.toggle("dark",d);document.documentElement.classList.toggle("light",!d);document.documentElement.style.colorScheme=d?"dark":"light";}catch(e){document.documentElement.classList.add("dark");}})();`,
          }}
        />
      </head>
      <body className="flex min-h-full flex-col" suppressHydrationWarning>
        <ThemeProvider>
          <CartBootstrap />
          {children}
          <TebexScript />
        </ThemeProvider>
      </body>
    </html>
  );
}

import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SnackbarProvider } from "@/components/ui/Snackbar";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const viewport: Viewport = {
  themeColor: "#0f172a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: "AllStars Hub",
  description: "Comprehensive Sports Academy Management Platform",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "AllStars Hub",
  },
  icons: {
    icon: [
      { url: "/icons/allstars-favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico" },
    ],
    shortcut: "/icons/allstars-favicon.svg",
    apple: "/icons/apple-icon.png",
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
      className={`${inter.variable} h-full antialiased`}
    >
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
        />
        <link
          rel="icon"
          href="/icons/allstars-favicon.svg"
          type="image/svg+xml"
        />
        <link rel="shortcut icon" href="/icons/allstars-favicon.svg" />
      </head>
      <body className="min-h-full flex flex-col font-sans">
        <SnackbarProvider>{children}</SnackbarProvider>
      </body>
    </html>
  );
}

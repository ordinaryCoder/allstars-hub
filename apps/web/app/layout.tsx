import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SnackbarProvider } from "@/components/ui/Snackbar";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "AllStars Hub",
  description: "Comprehensive Sports Academy Management Platform",
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
      </head>
      <body className="min-h-full flex flex-col font-sans">
        <SnackbarProvider>{children}</SnackbarProvider>
      </body>
    </html>
  );
}

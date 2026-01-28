import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const bungee = localFont({
  src: "../assets/fonts/Bungee-Regular.ttf",
  variable: "--font-bungee",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Foodzo | Fastest Online Food Delivery",
  description:
    "Order your favourite meals in minutes with Foodzo's fastest online food delivery service.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${bungee.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}

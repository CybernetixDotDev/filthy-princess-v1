import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Filthy Princess | The Private World of Cally",
  description:
    "Enter the private retreat world of Cally - a Futanari Princess exploring sensuality, energy, curiosity and extraordinary human experience.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

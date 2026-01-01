import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Quick Note - ChatGPT App",
  description: "Save and manage your notes and code snippets directly in ChatGPT",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}

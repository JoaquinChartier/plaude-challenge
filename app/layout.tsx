import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Plaude Support Agent",
  description: "A durable support agent with human approval in Slack.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

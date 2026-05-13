import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Рассвет · Оператор",
  description: "Панель оператора такси-сервиса «Профсоюз Рассвет» (Севастополь)",
  icons: { icon: "/favicon.ico" },
};

export const viewport: Viewport = {
  themeColor: "#F4F1EA",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}

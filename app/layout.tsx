import type { Metadata } from "next";
import { Oswald, Merriweather_Sans } from "next/font/google";
import "./globals.css";

const oswald = Oswald({
  variable: "--font-poster",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const merriweatherSans = Merriweather_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Quero Ser Brigadista Comunitário | Só o Povo Salva o Povo!",
  description:
    "Cadastro para Brigadas Comunitárias de combate e prevenção a incêndios florestais. Servir ao povo de todo o coração!",
  icons: {
    icon: [
      { url: "/fav2.jpg", type: "image/jpeg" },
      { url: "/images/fav2.jpg", type: "image/jpeg" },
      { url: "/fav.png", type: "image/png" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    shortcut: "/fav2.jpg",
    apple: "/fav2.jpg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="pt-BR"
      className={`${oswald.variable} ${merriweatherSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans bg-[#FAF4E6] text-[#18181B] selection:bg-[#FACC15] selection:text-black">
        {children}
      </body>
    </html>
  );
}

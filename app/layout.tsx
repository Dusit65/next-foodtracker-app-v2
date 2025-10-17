import type { Metadata } from "next";
import { Prompt } from "next/font/google";
import "./globals.css";

const prompt = Prompt({
  subsets: ["thai", "latin"],
  weight:["100","200","300","400","500","600","700","800","900"],
});



export const metadata: Metadata = {
  title: "Food Tracker App V2",
  description: "Food Tracker for everybody with firebase",
  keywords: ["Food", "Tracker", "อาหาร", "ติดตาม"],
  icons: {
    icon: "/next.svg",
    shortcut: "/shortcut.png",
  },
  authors: [
    {
      name: "Dusit65",
      url: "https://github.com/Dusit65",
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${prompt.className} flex flex-col min-h-screen bg-black`}>
        <main className="flex-grow">
          {children}
        </main>
        <footer className="sticky bottom-0 text-center py-[10px] text-xl md:text-2xl text-white opacity-90 bg-gradient-to-t from-black/60 to-transparent">
          Created by Dusit65
          <br />
          Copyright &copy; 2025 Southeast Asia University
        </footer>

      </body>
    </html>
  );
}

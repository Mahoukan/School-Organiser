import "./globals.css";
import { Inter, Lato, Lora, Merriweather, Nunito_Sans, Open_Sans, Roboto, Roboto_Slab, Source_Sans_3 } from "next/font/google";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const sourceSans3 = Source_Sans_3({ subsets: ["latin"], variable: "--font-source-sans-3", display: "swap" });
const openSans = Open_Sans({ subsets: ["latin"], variable: "--font-open-sans", display: "swap" });
const nunitoSans = Nunito_Sans({ subsets: ["latin"], variable: "--font-nunito-sans", display: "swap" });
const roboto = Roboto({ subsets: ["latin"], variable: "--font-roboto", display: "swap" });
const lato = Lato({ subsets: ["latin"], weight: ["400", "700"], variable: "--font-lato", display: "swap" });
const lora = Lora({ subsets: ["latin"], variable: "--font-lora", display: "swap" });
const merriweather = Merriweather({ subsets: ["latin"], variable: "--font-merriweather", display: "swap" });
const robotoSlab = Roboto_Slab({ subsets: ["latin"], variable: "--font-roboto-slab", display: "swap" });
const fontVariables = [inter, sourceSans3, openSans, nunitoSans, roboto, lato, lora, merriweather, robotoSlab].map((font) => font.variable).join(" ");

export const metadata = {
  title: "School Organiser",
  description: "A timetable and lesson planning organiser for teachers.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={fontVariables}>
      <body>{children}</body>
    </html>
  );
}

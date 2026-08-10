import "./globals.css";

export const metadata = {
  title: "School Organiser",
  description: "A timetable and lesson planning organiser for teachers.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

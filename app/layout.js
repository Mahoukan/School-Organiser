import "./globals.css";

import AppShell from "../components/AppShell";

export const metadata = {
  title: "School Organiser",
  description: "A timetable and lesson planning organiser for teachers.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}

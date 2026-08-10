import "./globals.css";

import AppShell from "../components/AppShell";
import SchoolDataProvider from "../components/providers/SchoolDataProvider";

export const metadata = {
  title: "School Organiser",
  description: "A timetable and lesson planning organiser for teachers.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <SchoolDataProvider>
          <AppShell>{children}</AppShell>
        </SchoolDataProvider>
      </body>
    </html>
  );
}

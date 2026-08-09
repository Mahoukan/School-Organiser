import "./globals.css";

import AppHeader from "../components/AppHeader";

export const metadata = {
  title: "School Organiser",
  description: "A timetable and lesson planning organiser for teachers.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <div className="app-shell">
          <AppHeader />
          <main className="main-content">{children}</main>
        </div>
      </body>
    </html>
  );
}

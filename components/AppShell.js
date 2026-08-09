import AppNavigation from "./AppNavigation";

export default function AppShell({ children }) {
  return (
    <div className="app-shell">
      <AppNavigation />
      <main className="app-main">
        <div className="page-content">{children}</div>
      </main>
    </div>
  );
}

import AppNavigation from "./AppNavigation";
import SignOutForm from "./SignOutForm";

export default function AppShell({ children, user }) {
  return (
    <div className="app-shell">
      <AppNavigation user={user} signOutAction={<SignOutForm compact />} />
      <main className="app-main">
        <div className="page-content">{children}</div>
      </main>
    </div>
  );
}

import { signOut } from "../auth";

export default function SignOutForm({ compact = false }) {
  return (
    <form action={async () => { "use server"; await signOut({ redirectTo: "/signin" }); }}>
      <button className={compact ? "account-signout account-signout--compact" : "account-signout"} type="submit">Sign out</button>
    </form>
  );
}

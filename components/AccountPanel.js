import { auth } from "../auth";
import SignOutForm from "./SignOutForm";

export default async function AccountPanel() {
  const session = await auth();
  return (
    <section className="account-panel" aria-labelledby="account-heading">
      <h2 id="account-heading">Account</h2>
      <dl><div><dt>Name</dt><dd>{session.user.name}</dd></div><div><dt>Email</dt><dd>{session.user.email}</dd></div></dl>
      <SignOutForm />
    </section>
  );
}

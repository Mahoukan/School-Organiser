import { auth } from "../../auth.js";

export class AuthenticationRequiredError extends Error {}

export async function requireCurrentUser() {
  const session = await auth();
  if (!session?.user?.id) throw new AuthenticationRequiredError("Authentication required.");
  return { id: session.user.id, name: session.user.name, email: session.user.email };
}

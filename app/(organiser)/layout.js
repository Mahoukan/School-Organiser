import { redirect } from "next/navigation";
import { auth } from "../../auth";
import AppShell from "../../components/AppShell";
import SchoolDataProvider from "../../components/providers/SchoolDataProvider";
import { DEFAULT_USER_PREFERENCES } from "../../lib/userPreferences";
import { getUserPreferences } from "../../lib/server/userPreferences";

export default async function OrganiserLayout({ children }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");
  let initialPreferences = DEFAULT_USER_PREFERENCES;
  try {
    initialPreferences = await getUserPreferences(session.user.id);
  } catch (error) {
    console.error("Initial appearance preferences could not be loaded.", { name: error?.name, code: error?.code });
  }
  return <SchoolDataProvider initialPreferences={initialPreferences}><AppShell user={session.user}>{children}</AppShell></SchoolDataProvider>;
}

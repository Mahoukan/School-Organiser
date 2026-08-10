import { redirect } from "next/navigation";
import { auth } from "../../auth";
import AppShell from "../../components/AppShell";
import SchoolDataProvider from "../../components/providers/SchoolDataProvider";

export default async function OrganiserLayout({ children }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");
  return <SchoolDataProvider><AppShell user={session.user}>{children}</AppShell></SchoolDataProvider>;
}

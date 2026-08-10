import { AuthenticationRequiredError, requireCurrentUser } from "../../../lib/server/currentUser";
import { getOrganiserExport } from "../../../lib/server/exportData";

function localDateKey() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Pacific/Auckland",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

export async function GET() {
  try {
    const user = await requireCurrentUser();
    const payload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      ownerEmail: user.email,
      organiser: await getOrganiserExport(user.id),
    };
    return new Response(JSON.stringify(payload, null, 2), {
      headers: {
        "Cache-Control": "private, no-store",
        "Content-Disposition": `attachment; filename="school-organiser-backup-${localDateKey()}.json"`,
        "Content-Type": "application/json; charset=utf-8",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    if (error instanceof AuthenticationRequiredError) {
      return Response.json({ error: "Authentication required." }, { status: 401 });
    }
    console.error("Organiser export failed.", { name: error?.name, code: error?.code });
    return Response.json({ error: "Could not export your organiser data. Please try again." }, { status: 500 });
  }
}

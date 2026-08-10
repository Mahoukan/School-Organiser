import { NextResponse } from "next/server";
import { mutateSchoolData } from "../../../../lib/server/schoolData";
import { AuthenticationRequiredError, requireCurrentUser } from "../../../../lib/server/currentUser";

const resources = new Set(["classes", "recurring-items", "lesson-occurrences", "dated-events", "overlays", "calendar", "day-templates", "movements"]);

export async function POST(request, { params }) {
  const { resource } = await params;
  if (!resources.has(resource)) return NextResponse.json({ error: "Unsupported data operation." }, { status: 404 });
  try {
    const user = await requireCurrentUser();
    const { action, payload = {} } = await request.json();
    return NextResponse.json(await mutateSchoolData(user.id, resource, action, payload));
  } catch (error) {
    if (error instanceof AuthenticationRequiredError) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    console.error(`School data ${resource} mutation failed.`, { name: error?.name, code: error?.code });
    if (!process.env.DATABASE_URL) return NextResponse.json({ error: "Database persistence is not configured. Set DATABASE_URL and run migrations." }, { status: 503 });
    const status = error?.code ? 409 : 400;
    return NextResponse.json({ error: error?.code ? "The change conflicts with existing organiser data." : error.message || "The change could not be saved." }, { status });
  }
}

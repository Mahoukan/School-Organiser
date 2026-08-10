import { NextResponse } from "next/server";
import { mutateSchoolData } from "../../../../lib/server/schoolData";

const resources = new Set(["classes", "recurring-items", "lesson-occurrences", "overlays", "calendar", "period-blocks", "movements"]);

export async function POST(request, { params }) {
  const { resource } = await params;
  if (!resources.has(resource)) return NextResponse.json({ error: "Unsupported data operation." }, { status: 404 });
  try {
    const { action, payload = {} } = await request.json();
    return NextResponse.json(await mutateSchoolData(resource, action, payload));
  } catch (error) {
    console.error(`School data ${resource} mutation failed:`, error);
    if (!process.env.DATABASE_URL) return NextResponse.json({ error: "Database persistence is not configured. Set DATABASE_URL and run migrations and seed." }, { status: 503 });
    const status = error?.code ? 409 : 400;
    return NextResponse.json({ error: error?.code ? "The change conflicts with existing organiser data." : error.message || "The change could not be saved." }, { status });
  }
}

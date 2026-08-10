import { NextResponse } from "next/server";
import { getSchoolData } from "../../../lib/server/schoolData";
import { AuthenticationRequiredError, requireCurrentUser } from "../../../lib/server/currentUser";

function errorResponse(error) {
  console.error("School data request failed:", error);
  if (error instanceof AuthenticationRequiredError) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const configured = Boolean(process.env.DATABASE_URL);
  return NextResponse.json({ error: configured ? "The organiser data could not be loaded." : "Database persistence is not configured. Set DATABASE_URL and run migrations and seed." }, { status: 503 });
}

export async function GET() { try { const user = await requireCurrentUser(); return NextResponse.json(await getSchoolData(user.id)); } catch (error) { return errorResponse(error); } }

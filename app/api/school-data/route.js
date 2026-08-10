import { NextResponse } from "next/server";
import { getSchoolData } from "../../../lib/server/schoolData";
import { AuthenticationRequiredError, requireCurrentUser } from "../../../lib/server/currentUser";

function errorResponse(error) {
  if (error instanceof AuthenticationRequiredError) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  console.error("School data request failed.", { name: error?.name, code: error?.code });
  const configured = Boolean(process.env.DATABASE_URL);
  return NextResponse.json({ error: configured ? "The organiser data could not be loaded." : "Database persistence is not configured. Set DATABASE_URL and run migrations." }, { status: 503 });
}

export async function GET() { try { const user = await requireCurrentUser(); return NextResponse.json(await getSchoolData(user.id)); } catch (error) { return errorResponse(error); } }

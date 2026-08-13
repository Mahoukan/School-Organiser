import { NextResponse } from "next/server";
import { getSchoolData } from "../../../lib/server/schoolData";
import { AuthenticationRequiredError, requireCurrentUser } from "../../../lib/server/currentUser";
import { ensureInitialSetupForUser, InitialSetupUnavailableError } from "../../../lib/server/ensureInitialSetup";

function errorResponse(error) {
  if (error instanceof AuthenticationRequiredError) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  if (error instanceof InitialSetupUnavailableError) return NextResponse.json({ error: error.message }, { status: 503 });
  console.error("School data request failed.", { name: error?.name, code: error?.code });
  const configured = Boolean(process.env.DATABASE_URL);
  return NextResponse.json({ error: configured ? "The organiser data could not be loaded." : "Database persistence is not configured. Set DATABASE_URL and run migrations." }, { status: 503 });
}

export async function GET() { try { const user = await requireCurrentUser(); await ensureInitialSetupForUser(user); return NextResponse.json(await getSchoolData(user.id)); } catch (error) { return errorResponse(error); } }

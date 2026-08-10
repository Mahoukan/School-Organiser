import { NextResponse } from "next/server";
import { getSchoolData } from "../../../lib/server/schoolData";

function errorResponse(error) {
  console.error("School data request failed:", error);
  const configured = Boolean(process.env.DATABASE_URL);
  return NextResponse.json({ error: configured ? "The organiser data could not be loaded." : "Database persistence is not configured. Set DATABASE_URL and run migrations and seed." }, { status: 503 });
}

export async function GET() { try { return NextResponse.json(await getSchoolData()); } catch (error) { return errorResponse(error); } }

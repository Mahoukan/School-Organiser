import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDatabase } from "../../../../lib/db/index";

export async function GET() { try { await getDatabase().execute(sql`select 1`); return NextResponse.json({ status: "ok" }); } catch { return NextResponse.json({ status: "unavailable" }, { status: 503 }); } }

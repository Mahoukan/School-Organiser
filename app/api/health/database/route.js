import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDatabase } from "../../../../lib/db/index";

export async function GET() { try { await getDatabase().execute(sql`select 1`); return NextResponse.json({ database: "ok" }); } catch { return NextResponse.json({ database: "unavailable" }, { status: 503 }); } }

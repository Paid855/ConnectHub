import { NextRequest, NextResponse } from "next/server";
export async function POST() { const r = NextResponse.json({ success: true }); r.cookies.set("admin_session", "", { path: "/", maxAge: 0 }); return r; }

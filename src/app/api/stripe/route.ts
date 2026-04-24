import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const flwRes = await fetch(new URL("/api/flutterwave", req.url).toString(), {
    method: "POST",
    headers: { "Content-Type": "application/json", "Cookie": req.headers.get("cookie") || "" },
    body: JSON.stringify(body),
  });
  const data = await flwRes.json();
  return NextResponse.json(data, { status: flwRes.status });
}

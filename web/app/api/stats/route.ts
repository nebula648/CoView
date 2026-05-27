import { NextResponse } from "next/server";
import { getStats } from "@/lib/repository";

export async function GET() {
  const stats = await getStats();

  const response = NextResponse.json(stats);
  response.headers.set("Cache-Control", "public, max-age=300");
  return response;
}

import { NextResponse } from "next/server";
import { getAiIndex } from "@/lib/repository";

export async function GET() {
  const entries = await getAiIndex();

  const response = NextResponse.json(entries);
  response.headers.set("Cache-Control", "public, max-age=3600");
  return response;
}

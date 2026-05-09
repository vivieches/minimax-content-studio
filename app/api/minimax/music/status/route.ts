import { NextResponse } from "next/server";
import { getMusicJobStatus } from "@/lib/minimax/music";
import { jobStatusSchema, validateOr400 } from "@/lib/validation/schemas";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const jobId = searchParams.get("jobId");

  const validation = validateOr400(jobStatusSchema, { jobId });
  if (!validation.success) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  const status = getMusicJobStatus(validation.data.jobId);
  return NextResponse.json(status);
}
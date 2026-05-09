import { NextResponse } from "next/server";
import { getVideoJobStatus } from "@/lib/minimax/video";
import { jobStatusSchema, validateOr400 } from "@/lib/validation/schemas";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const jobId = searchParams.get("jobId");

  const validation = validateOr400(jobStatusSchema, { jobId });
  if (!validation.success) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  const status = getVideoJobStatus(validation.data.jobId);
  return NextResponse.json(status);
}
import { NextResponse } from "next/server";
import { getExport, updateExport, deleteExport } from "@/lib/storage/exports";
import { exportUpdateSchema, validateOr400 } from "@/lib/validation/schemas";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const record = await getExport(id);

  if (!record) {
    return NextResponse.json({ error: "Export not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, export: record });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const validation = validateOr400(exportUpdateSchema, body);
  if (!validation.success) {
    return NextResponse.json({ ok: false, error: validation.error }, { status: 400 });
  }

  const record = await updateExport(id, validation.data);

  if (!record) {
    return NextResponse.json({ error: "Export not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, export: record });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const deleted = await deleteExport(id);

  if (!deleted) {
    return NextResponse.json({ error: "Export not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
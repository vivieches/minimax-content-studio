import { NextResponse } from "next/server";
import { testAgent } from "@/lib/daemon/agents";
import { agentDiagnostic } from "@/lib/daemon/diagnostics";
import { getSettings } from "@/lib/storage/settings";
import { sanitizeAgentCliEnv } from "@/lib/daemon/agentConfig";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const agentId = typeof body.agentId === "string" ? body.agentId : "";
  if (!agentId) {
    return NextResponse.json({ ok: false, error: "agentId is required" }, { status: 400 });
  }

  const settings = await getSettings();
  const result = await testAgent({
    agentId,
    model: typeof body.model === "string" ? body.model : undefined,
    reasoning: typeof body.reasoning === "string" ? body.reasoning : undefined,
    agentCliEnv: Object.hasOwn(body, "agentCliEnv") ? sanitizeAgentCliEnv(body.agentCliEnv) : settings.agentCliEnv,
  });
  return NextResponse.json(
    {
      ...result,
      errorKind: result.kind,
      diagnostics: [
        agentDiagnostic({
          kind: result.kind,
          message: result.error,
          agentName: result.agentName,
          model: result.model,
        }),
      ],
    },
    { status: result.ok ? 200 : 404 }
  );
}

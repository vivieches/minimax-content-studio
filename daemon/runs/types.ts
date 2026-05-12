export type RunStatus = "queued" | "running" | "awaiting_input" | "succeeded" | "failed" | "cancelled";

export type RunKind = "agent" | "media" | "package" | "research" | "export" | "manual";

export type OpenStudioRun = {
  id: string;
  projectId: string | null;
  kind: RunKind;
  title: string | null;
  status: RunStatus;
  createdAt: string;
  updatedAt: string;
  startedAt: string | null;
  endedAt: string | null;
  cancelRequested: boolean;
  cancelSignal: string | null;
  error: string | null;
  metadata: Record<string, unknown>;
};

export type CreateRunInput = {
  id?: string;
  projectId?: string | null;
  kind?: RunKind;
  title?: string | null;
  metadata?: Record<string, unknown>;
};

export type RunEvent = {
  id: string;
  runId: string;
  type: string;
  createdAt: string;
  payload: unknown;
};

export type RunListFilter = {
  projectId?: string | null;
  status?: RunStatus | "active";
};

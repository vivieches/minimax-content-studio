export type DaemonUnavailable = {
  ok: false;
  service: "open-studio-daemon";
  mode: "embedded-next";
  error: string;
};

export type DaemonClientHealth =
  | {
      ok: true;
      service: "open-studio-daemon";
      mode: "local-daemon";
      startedAt: string;
      storageDir: string;
      capabilities: string[];
      timestamp: string;
    }
  | DaemonUnavailable;

export function getDaemonUrl(env: NodeJS.ProcessEnv = process.env) {
  const raw = env.OPEN_STUDIO_DAEMON_URL || env.OS_DAEMON_URL;
  if (!raw) return null;
  return raw.replace(/\/$/, "");
}

export async function requestDaemonJson<T>(path: string, init?: RequestInit): Promise<T> {
  const baseUrl = getDaemonUrl();
  if (!baseUrl) {
    throw new Error("OPEN_STUDIO_DAEMON_URL is not set");
  }

  const response = await fetch(`${baseUrl}${path.startsWith("/") ? path : `/${path}`}`, {
    ...init,
    headers: {
      Accept: "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message =
      typeof payload === "object" && payload && "error" in payload ? String(payload.error) : `daemon ${response.status}`;
    throw new Error(message);
  }

  return payload as T;
}

export async function getDaemonHealth(): Promise<DaemonClientHealth> {
  if (!getDaemonUrl()) {
    return {
      ok: false,
      service: "open-studio-daemon",
      mode: "embedded-next",
      error: "OPEN_STUDIO_DAEMON_URL is not set",
    };
  }

  try {
    return await requestDaemonJson<DaemonClientHealth>("/api/health");
  } catch (error) {
    return {
      ok: false,
      service: "open-studio-daemon",
      mode: "embedded-next",
      error: error instanceof Error ? error.message : "daemon_unavailable",
    };
  }
}

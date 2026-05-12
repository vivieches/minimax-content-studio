import { mkdirSync } from "fs";
import { join, resolve } from "path";

export type DaemonContext = {
  rootDir: string;
  storageDir: string;
  daemonDir: string;
  projectsDir: string;
  runsDir: string;
  logsDir: string;
  logFile: string;
  startedAt: string;
};

export type DaemonContextOptions = {
  rootDir?: string;
  storageDir?: string;
  startedAt?: string;
};

export function createDaemonContext(options: DaemonContextOptions = {}): DaemonContext {
  const rootDir = resolve(options.rootDir ?? process.cwd());
  const storageDir = resolve(
    options.storageDir ?? process.env.OPEN_STUDIO_DATA_DIR ?? join(rootDir, ".open-studio"),
  );
  const daemonDir = join(storageDir, "daemon");
  const projectsDir = join(storageDir, "projects");
  const runsDir = join(storageDir, "runs");
  const logsDir = join(daemonDir, "logs");
  const logFile = join(logsDir, "daemon.log");

  mkdirSync(storageDir, { recursive: true });
  mkdirSync(daemonDir, { recursive: true });
  mkdirSync(projectsDir, { recursive: true });
  mkdirSync(runsDir, { recursive: true });
  mkdirSync(logsDir, { recursive: true });

  return {
    rootDir,
    storageDir,
    daemonDir,
    projectsDir,
    runsDir,
    logsDir,
    logFile,
    startedAt: options.startedAt ?? new Date().toISOString(),
  };
}

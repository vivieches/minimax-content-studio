import { mkdtemp, writeFile } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";

export type PromptInputStrategy =
  | { mode: "stdin"; stdin: string; args: string[]; cleanup?: () => Promise<void> }
  | { mode: "file"; filePath: string; args: string[]; cleanup?: () => Promise<void> }
  | { mode: "argv"; args: string[] };

export async function preparePromptInput(options: {
  prompt: string;
  args: string[];
  promptViaStdin: boolean;
  fileArg?: (filePath: string) => string[];
  maxArgLength?: number;
}): Promise<PromptInputStrategy> {
  const maxArgLength = options.maxArgLength ?? (process.platform === "win32" ? 7000 : 100_000);

  if (options.promptViaStdin) {
    return { mode: "stdin", stdin: options.prompt, args: options.args };
  }

  const approximateLength = [...options.args, options.prompt].join(" ").length;
  if (approximateLength <= maxArgLength) {
    return { mode: "argv", args: options.args };
  }

  if (!options.fileArg) {
    throw new Error("AGENT_PROMPT_TOO_LARGE");
  }

  const dir = await mkdtemp(join(tmpdir(), "open-studio-agent-prompt-"));
  const filePath = join(dir, "prompt.txt");
  await writeFile(filePath, options.prompt, "utf8");
  return {
    mode: "file",
    filePath,
    args: [...options.args, ...options.fileArg(filePath)],
  };
}

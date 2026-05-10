import { generateScript } from "@/lib/minimax/text";

export async function generateContentPipeline(briefing: string) {
  return generateScript(briefing);
}

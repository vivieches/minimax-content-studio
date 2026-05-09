import { sanitizePromptInput } from "./sanitize";

export function buildVideoPrompt(params: {
  prompt: string;
  script?: string;
  duration?: string;
  style?: string;
}): string {
  return `Video generation prompt:
CONCEPT: ${sanitizePromptInput(params.prompt)}
${params.script ? `SCRIPT CONTEXT: ${sanitizePromptInput(params.script.slice(0, 500))}` : ""}
DURATION: ${sanitizePromptInput(params.duration ?? "5 seconds")}
STYLE: ${sanitizePromptInput(params.style ?? "Cinematic, modern")}

Requirements:
- High quality visual
- Smooth motion
- Professional look
- Suitable for YouTube content
- No watermarks or logos
- Consistent style throughout`;
}
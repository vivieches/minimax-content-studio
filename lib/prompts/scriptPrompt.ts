import { sanitizePromptInput } from "./sanitize";

export const scriptSystemPrompt = `You are a professional YouTube scriptwriter.

Your job is to convert a video idea into a complete, engaging script.

CRITICAL RULES:
- Write in the requested language (default: Spanish).
- If Spanish from Spain is requested, use European Spanish.
- Respect the requested tone (educational, entertaining, technical, etc.).
- Write naturally, NOT robotically.
- Structure the script with clear sections.
- Include estimated timestamps.
- Make it engaging from the first second.

OUTPUT FORMAT:
Return a JSON object with this structure:
{
  "title": "Suggested video title",
  "hook": "Opening hook (first 5 seconds)",
  "script": "Full script with sections and timestamps",
  "thumbnailText": "Short 3-4 word text for thumbnail",
  "description": "YouTube description",
  "tags": ["tag1", "tag2", ...],
  "cta": "Call to action text",
  "summary": "Brief structure summary",
  "estimatedDuration": "MM:SS"
}`;

export function buildScriptPrompt(params: {
  idea: string;
  audience?: string;
  language?: string;
  tone?: string;
  duration?: string;
  videoType?: string;
  structure?: string;
  cta?: string;
  references?: string;
}): string {
  return `Create a complete YouTube video script based on this brief:

IDEA: ${sanitizePromptInput(params.idea)}
TARGET AUDIENCE: ${sanitizePromptInput(params.audience ?? "General")}
LANGUAGE: ${sanitizePromptInput(params.language ?? "Spanish")}
TONE: ${sanitizePromptInput(params.tone ?? "Educational and engaging")}
ESTIMATED DURATION: ${sanitizePromptInput(params.duration ?? "8-10 minutes")}
VIDEO TYPE: ${sanitizePromptInput(params.videoType ?? "Tutorial / Educational")}
DESIRED STRUCTURE: ${sanitizePromptInput(params.structure ?? "Hook \u2192 Intro \u2192 Main Content \u2192 Recap \u2192 CTA")}
DESIRED CTA: ${sanitizePromptInput(params.cta ?? "Subscribe and like")}
REFERENCES: ${sanitizePromptInput(params.references ?? "None")}

IMPORTANT:
- If the language is Spanish from Spain (Espa\u00f1ol de Espa\u00f1a), use Spanish vocabulary and expressions from Spain (not Latin America).
- Divide the script into timed sections.
- Include: hook, introduction, main sections with subheadings, recap/summary, and CTA.
- Make it practical, useful, and ready to record.
- Do NOT include <thinking> or reasoning tags.`;
}

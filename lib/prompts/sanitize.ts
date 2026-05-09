/**
 * Sanitizes user input before interpolation into AI prompts.
 * Prevents prompt injection and structural breakage.
 */
export function sanitizePromptInput(input: string): string {
  if (typeof input !== "string") return "";
  return input
    .trim()
    .slice(0, 2000)
    // Remove control characters (keep newlines and tabs)
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
    // Escape backticks that could break template literals
    .replace(/`/g, "\\`")
    // Remove potential prompt-injection markers
    .replace(/<\/?(system|user|assistant|prompt)>/gi, "");
}
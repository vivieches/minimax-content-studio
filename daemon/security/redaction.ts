const SECRET_KEY_PATTERN =
  /(?:api[_-]?key|authorization|bearer|token|secret|password|passwd|cookie|session|credential|client[_-]?secret)/i;

type Replacement = string | ((match: string) => string);

const SECRET_STRING_PATTERNS: Array<[RegExp, Replacement]> = [
  [/\bBearer\s+[A-Za-z0-9._~+/=-]{12,}/gi, "Bearer [redacted]"],
  [/\bsk-ant-[A-Za-z0-9._-]{8,}/gi, "sk-ant-[redacted]"],
  [/\bsk-[A-Za-z0-9._-]{8,}/gi, "sk-[redacted]"],
  [/\bAIza[0-9A-Za-z_-]{20,}/g, "AIza[redacted]"],
  [/\b(?:OPENAI|ANTHROPIC|GOOGLE|GEMINI|TAVILY|MINIMAX|REPLICATE|FAL|BFL|XAI|GROQ|TOGETHER|DEEPSEEK)_[A-Z0-9_]*KEY\s*=\s*[^,\s]+/gi, (match) => `${match.split("=")[0]}=[redacted]`],
  [/\b(api[_-]?key|key|token|access_token|refresh_token|secret)=([^&\s]+)/gi, "$1=[redacted]"],
];

export function redactString(value: string) {
  return SECRET_STRING_PATTERNS.reduce<string>((current, [pattern, replacement]) => {
    return typeof replacement === "function" ? current.replace(pattern, replacement) : current.replace(pattern, replacement);
  }, value);
}

export function redactSecrets<T>(value: T): T {
  return redactUnknown(value, new WeakSet()) as T;
}

function redactUnknown(value: unknown, seen: WeakSet<object>): unknown {
  if (typeof value === "string") return redactString(value);
  if (typeof value !== "object" || value === null) return value;
  if (seen.has(value)) return "[circular]";
  seen.add(value);

  if (Array.isArray(value)) {
    return value.map((item) => redactUnknown(item, seen));
  }

  const out: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(value)) {
    out[key] = SECRET_KEY_PATTERN.test(key) ? "[redacted]" : redactUnknown(item, seen);
  }
  return out;
}

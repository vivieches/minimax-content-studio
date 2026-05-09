export class MiniMaxError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public details?: unknown
  ) {
    super(message);
    this.name = "MiniMaxError";
  }
}

export class MiniMaxAuthError extends MiniMaxError {
  constructor(message = "Invalid or missing API key. Go to Settings to configure your MiniMax API key.") {
    super(message, 401);
    this.name = "MiniMaxAuthError";
  }
}

export class MiniMaxConnectionError extends MiniMaxError {
  constructor(message = "Could not connect to MiniMax API. Check your internet connection and API configuration.") {
    super(message, 503);
    this.name = "MiniMaxConnectionError";
  }
}

export class MiniMaxInsufficientCreditsError extends MiniMaxError {
  constructor(message = "Insufficient credits or token plan balance.") {
    super(message, 402);
    this.name = "MiniMaxInsufficientCreditsError";
  }
}

export class MiniMaxRateLimitError extends MiniMaxError {
  constructor(message = "Rate limit exceeded. Please wait and try again.") {
    super(message, 429);
    this.name = "MiniMaxRateLimitError";
  }
}

export class MiniMaxModelUnavailableError extends MiniMaxError {
  constructor(model: string) {
    super(`Model "${model}" is currently unavailable or not found.`, 404);
    this.name = "MiniMaxModelUnavailableError";
  }
}

export class MiniMaxGenerationError extends MiniMaxError {
  constructor(message = "Content generation failed.") {
    super(message, 500);
    this.name = "MiniMaxGenerationError";
  }
}

export function classifyMiniMaxError(status: number, body: string): MiniMaxError {
  if (status === 401) return new MiniMaxAuthError();
  if (status === 402) return new MiniMaxInsufficientCreditsError();
  if (status === 429) return new MiniMaxRateLimitError();
  if (status >= 500) return new MiniMaxConnectionError(`MiniMax API server error (${status}): ${body.slice(0, 200)}`);

  let detail: string | undefined;
  try {
    const parsed = JSON.parse(body);
    const statusCode = parsed?.base_resp?.status_code;
    const statusMsg = parsed?.base_resp?.status_msg;
    detail =
      parsed?.error?.message ||
      (statusMsg ? statusMsg : statusCode !== undefined ? `status_code ${statusCode}` : undefined) ||
      parsed?.message ||
      body.slice(0, 200);
  } catch {
    detail = body.slice(0, 200);
  }

  return new MiniMaxError(detail || `MiniMax API error (${status})`, status);
}

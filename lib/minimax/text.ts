import { getResolvedConfig, createMiniMaxHeaders } from "./config";
import { classifyMiniMaxError } from "./errors";

interface TextGenerateParams {
  systemPrompt: string;
  userMessage: string;
  maxTokens?: number;
  temperature?: number;
}

export async function generateText(params: TextGenerateParams): Promise<string> {
  const config = await getResolvedConfig();
  const { systemPrompt, userMessage, maxTokens = 4096, temperature = 0.7 } = params;

  if (!config.apiKey) {
    const { isEffectiveDemoMode } = await import("./client");
    if (await isEffectiveDemoMode()) {
      return generateDemoResponse(userMessage);
    }
    throw new Error("MINIMAX_API_KEY is not configured. Please go to Settings and enter your MiniMax API key.");
  }

  const response = await fetch(`${config.baseUrl}/v1/text/chatcompletion_v2`, {
    method: "POST",
    headers: createMiniMaxHeaders(config),
    body: JSON.stringify({
      model: config.textModel,
      messages: [
        { role: "system", name: "MiniMax AI", content: systemPrompt },
        { role: "user", name: "user", content: userMessage },
      ],
      max_tokens: maxTokens,
      temperature,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw classifyMiniMaxError(response.status, body);
  }

  const data = await response.json();
  let content = data?.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("MiniMax returned an empty response");
  }

  content = content.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
  return content;
}

export async function generateScript(briefing: string): Promise<Record<string, unknown>> {
  const { systemPrompt } = await import("@/prompts/content-agent-prompt");

  const content = await generateText({
    systemPrompt,
    userMessage: briefing,
  });

  const jsonStart = content.indexOf("{");
  const jsonEnd = content.lastIndexOf("}");

  let jsonStr = content;
  if (jsonStart !== -1 && jsonEnd !== -1) {
    jsonStr = content.slice(jsonStart, jsonEnd + 1);
  }

  try {
    return JSON.parse(jsonStr);
  } catch {
    return {
      detected_requirements: [],
      script: content,
      thumbnail_prompt: "",
      thumbnail_text: "",
      music_prompt: "",
      compliance_check: [],
      missing_requirements: [],
      assumptions: [],
    };
  }
}

function generateDemoResponse(briefing: string): string {
  return JSON.stringify({
    detected_requirements: ["demo_mode"],
    script: `[DEMO MODE] Script generated based on: "${briefing.slice(0, 100)}"\n\nThis is a demo script. Configure your MiniMax API key in Settings to generate real scripts.\n\n---\nHook: Your attention-grabbing opening\nIntro: Setting the context\nMain Content: Key points and value\nCTA: Call to action\n---`,
    thumbnail_prompt: "DEMO: YouTube thumbnail with modern tech aesthetic",
    thumbnail_text: "DEMO",
    music_prompt: "DEMO: Short instrumental intro, 10 seconds, modern and energetic",
    compliance_check: [{ item: "demo_mode", status: "ok", notes: "Running in demo mode" }],
    missing_requirements: [],
    assumptions: ["Running in demo mode - no real MiniMax API call made"],
  });
}

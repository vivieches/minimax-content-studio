import { systemPrompt } from "@/prompts/content-agent-prompt";

export async function generateContentPipeline(briefing: string) {
  if (!process.env.MINIMAX_API_KEY) {
    throw new Error("MINIMAX_API_KEY is missing");
  }

  const response = await fetch("https://api.minimax.io/v1/text/chatcompletion_v2", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.MINIMAX_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "MiniMax-M2.7",
      messages: [
        {
          role: "system",
          name: "Content Agent",
          content: systemPrompt,
        },
        {
          role: "user",
          name: "user",
          content: briefing,
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`MiniMax API error: ${errorText}`);
  }

  const data = await response.json();

  let content = data?.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("MiniMax returned an empty response");
  }

  // Safety cleanup: remove possible reasoning tags if the model returns them
  content = content.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();

  // Try to extract only the JSON object
  const jsonStart = content.indexOf("{");
  const jsonEnd = content.lastIndexOf("}");

  if (jsonStart !== -1 && jsonEnd !== -1) {
    content = content.slice(jsonStart, jsonEnd + 1);
  }

  // Parse JSON and return object
  try {
    const parsed = JSON.parse(content);
    return parsed;
  } catch (parseError) {
    throw new Error(`Failed to parse MiniMax JSON response: ${parseError instanceof Error ? parseError.message : "Unknown error"}. Raw content: ${content.slice(0, 500)}`);
  }
}

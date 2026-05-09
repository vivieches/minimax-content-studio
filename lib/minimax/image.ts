import { getResolvedConfig, createMiniMaxHeaders } from "./config";
import { classifyMiniMaxError } from "./errors";

export interface GenerateImageParams {
  prompt: string;
  aspectRatio?: string;
  n?: number;
  responseFormat?: "url" | "b64_json";
  promptOptimizer?: boolean;
  referenceImage?: string; // base64 data URL
  referenceType?: "face" | "style";
}

const MINIMAX_IMAGE_PROMPT_MAX_LENGTH = 1490; // API limit is < 1500

function clampPromptForMiniMax(prompt: string): string {
  if (prompt.length <= MINIMAX_IMAGE_PROMPT_MAX_LENGTH) return prompt;
  return prompt.slice(0, MINIMAX_IMAGE_PROMPT_MAX_LENGTH);
}

function isValidImageInput(value: string): boolean {
  return /^https?:\/\//i.test(value) || /^data:image\//i.test(value);
}

export async function generateImage(params: GenerateImageParams): Promise<{
  urls: string[];
  base64s: string[];
  finalPrompt: string;
}> {
  const config = await getResolvedConfig();

  if (!config.apiKey) {
    const { isEffectiveDemoMode } = await import("./client");
    if (await isEffectiveDemoMode()) {
      return generateDemoThumbnails(params);
    }
    throw new Error(
      "MINIMAX_API_KEY is not configured. Please go to Settings and enter your MiniMax API key."
    );
  }

  const {
    prompt,
    aspectRatio = "16:9",
    n = 1,
    responseFormat = "url",
    promptOptimizer = true,
    referenceImage,
    referenceType,
  } = params;
  const finalPrompt = clampPromptForMiniMax(prompt);

  // Build request body
  const requestBody: Record<string, unknown> = {
    model: config.imageModel || "image-01",
    prompt: finalPrompt,
    aspect_ratio: aspectRatio,
    response_format: responseFormat,
    n,
    prompt_optimizer: promptOptimizer,
  };

  // MiniMax image-01 supports both public HTTPS URLs and base64 data URLs
  // (data:image/jpeg;base64,...) for subject_reference.image_file.
  if (referenceImage && referenceType === "face" && isValidImageInput(referenceImage)) {
    requestBody.subject_reference = [
      {
        type: "character",
        image_file: referenceImage,
      },
    ];
  }

  console.log("[MiniMax] Request body:", JSON.stringify(requestBody, null, 2));
  
  const response = await fetch(`${config.baseUrl}/v1/image_generation`, {
    method: "POST",
    headers: createMiniMaxHeaders(config),
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const body = await response.text();
    throw classifyMiniMaxError(response.status, body);
  }

  const data = await response.json();

  if (data?.base_resp?.status_code !== undefined && data.base_resp.status_code !== 0) {
    throw new Error(`MiniMax Image API error: ${data.base_resp.status_msg || "Unknown error"}`);
  }

  const urls =
    data?.data?.image_urls ??
    data?.image_urls ??
    data?.data?.images ??
    data?.images ??
    [];

  const base64s =
    data?.data?.image_base64 ??
    data?.image_base64 ??
    [];

  return { urls, base64s, finalPrompt };
}

/**
 * Generates demo thumbnails when no API key is configured.
 * Returns varied placeholder images to simulate different thumbnail styles.
 */
function generateDemoThumbnails(params: GenerateImageParams): {
  urls: string[];
  base64s: string[];
  finalPrompt: string;
} {
  const { n = 1, prompt } = params;

  // Generate varied demo thumbnails with different colors and labels
  const demoStyles = [
    { bg: "1a1a2e", fg: "e94560", label: "Demo+Thumbnail+1" },
    { bg: "16213e", fg: "0f3460", label: "Demo+Thumbnail+2" },
    { bg: "0f3460", fg: "e94560", label: "Demo+Thumbnail+3" },
    { bg: "533483", fg: "e94560", label: "Demo+Thumbnail+4" },
  ];

  const urls = Array.from({ length: Math.min(n, 4) }, (_, i) => {
    const style = demoStyles[i % demoStyles.length];
    const text = encodeURIComponent(prompt.slice(0, 30) || "MiniMax+Studio");
    return `https://placehold.co/1280x720/${style.bg}/${style.fg}?text=${text}`;
  });

  return { urls, base64s: [], finalPrompt: prompt };
}

/**
 * @deprecated Use buildYoutubeThumbnailPrompt from @/lib/prompts/thumbnailPrompt instead.
 */
export function buildThumbnailPrompt(visualPrompt: string, text: string): string {
  return `YouTube thumbnail, 16:9, high CTR, modern technology channel style.
Main visual: realistic AI dashboard interface with cards, charts, content pipeline elements.
Clear composition, professional lighting, dark background with blue and purple accents.
Large readable text: "${text}".
Do not generate random words.
Do not generate fake logos.
Do not generate small unreadable text.
Do not generate brand names.
Do not create a generic wallpaper.
Original visual direction:
${visualPrompt}`;
}

function buildImagePrompt(thumbnailPrompt: string, thumbnailText: string): string {
  return `YouTube thumbnail, 16:9, high CTR, modern technology channel style.
Main visual: realistic AI dashboard interface with cards, charts, content pipeline elements.
Clear composition, professional lighting, dark background with blue and purple accents.
Large readable Spanish text: "${thumbnailText}".
Do not generate random words.
Do not generate fake logos.
Do not generate "NO CODE".
Do not generate small unreadable text.
Do not generate brand names.
Do not create a generic wallpaper.
Original visual direction:
${thumbnailPrompt}`;
}

export async function generateThumbnailImage(thumbnailPrompt: string, thumbnailText: string) {
  if (!process.env.MINIMAX_API_KEY) {
    throw new Error("MINIMAX_API_KEY is missing");
  }

  const finalPrompt = buildImagePrompt(thumbnailPrompt, thumbnailText);

  const response = await fetch("https://api.minimax.io/v1/image_generation", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.MINIMAX_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "image-01",
      prompt: finalPrompt,
      aspect_ratio: "16:9",
      response_format: "url",
      n: 1,
      prompt_optimizer: true,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`MiniMax Image API error ${response.status}: ${errorText}`);
  }

  const data = await response.json();

  // Check for API-level errors
  if (data?.base_resp?.status_code !== 0 && data?.base_resp?.status_code !== undefined) {
    throw new Error(`MiniMax Image API error: ${data.base_resp.status_msg || "Unknown error"}`);
  }

  // Defensive extraction
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

  const url = urls[0] ?? null;
  const base64 = base64s[0] ?? null;

  if (!url && !base64) {
    throw new Error("MiniMax Image API returned an unexpected format.");
  }

  return { url, base64, finalPrompt };
}

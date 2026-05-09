export async function generateMusic(prompt: string) {
  if (!process.env.MINIMAX_API_KEY) {
    throw new Error("MINIMAX_API_KEY is missing");
  }

  const response = await fetch("https://api.minimax.io/v1/music_generation", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.MINIMAX_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "music-2.6",
      prompt,
      is_instrumental: true,
      output_format: "url",
      audio_setting: {
        sample_rate: 44100,
        bitrate: 256000,
        format: "mp3",
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`MiniMax Music API error ${response.status}: ${errorText}`);
  }

  const data = await response.json();

  // Safe debug log (no API key exposure)
  console.log("MiniMax Music response:", JSON.stringify(data, null, 2));

  // Check for API-level errors
  if (data?.base_resp?.status_code !== 0 && data?.base_resp?.status_code !== undefined) {
    throw new Error(`MiniMax Music API error: ${data.base_resp.status_msg || "Unknown error"}`);
  }

  // Defensive extraction
  const rawCandidates = [
    data?.data?.audio,
    data?.data?.audio_url,
    data?.data?.url,
    data?.audio_url,
    data?.url,
    data?.result?.audio_url,
    data?.result?.url,
  ];

  let validUrl = "";
  let rawValue = "";

  for (const candidate of rawCandidates) {
    if (typeof candidate === "string" && candidate.trim()) {
      const trimmed = candidate.trim();
      if (trimmed.startsWith("http")) {
        validUrl = trimmed;
        break;
      }
      if (!rawValue && trimmed.length > 50) {
        rawValue = trimmed;
      }
    }
  }

  if (validUrl) {
    return { music_audio_url: validUrl, music_audio_raw: "", music_error: "" };
  }

  if (rawValue) {
    return {
      music_audio_url: "",
      music_audio_raw: rawValue,
      music_error: "Music API returned raw data instead of a URL. The player cannot play this format.",
    };
  }

  return {
    music_audio_url: "",
    music_audio_raw: "",
    music_error: "Music API did not return a valid audio URL.",
  };
}

import { sanitizePromptInput } from "./sanitize";

export function buildMusicPrompt(params: {
  mood: string;
  genre: string;
  tempo: string;
  duration: string;
  instruments: string;
  isInstrumental: boolean;
  customPrompt?: string;
}): string {
  const base = params.customPrompt
    ? sanitizePromptInput(params.customPrompt)
    : `Create a ${sanitizePromptInput(params.mood)} ${sanitizePromptInput(params.genre)} track.
Tempo: ${sanitizePromptInput(params.tempo)}
Duration: ${sanitizePromptInput(params.duration)}
Instruments: ${sanitizePromptInput(params.instruments)}

Requirements:
- Professional quality
- Clean mix
- ${params.isInstrumental ? "Instrumental only, no vocals, no lyrics, no singing" : "May include vocals if appropriate"}
- Suitable for YouTube video background or intro
- Modern production
- Dynamic but not distracting
- Clear beginning and ending
- Works as video background music`;

  return base;
}

export function buildMusicPromptForIntro(style: string): string {
  return `Short instrumental music for a YouTube intro (vinheta).
Desired duration: 10 seconds.
No voice, no lyrics, no singing.
Style: ${sanitizePromptInput(style)}, modern, clean and energetic.
Must work as a tech/tutorial video opening.
Must be a short intro with beginning, light build-up and clean ending.
Do NOT make it a full song.
Do NOT add vocals or lyrics.`;
}
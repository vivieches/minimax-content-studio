import { sanitizePromptInput } from "./sanitize";
import {
  buildImageGenerationLocaleInstruction,
  localeToGenerationLanguage,
  normalizeLocale,
  type Locale,
} from "@/lib/locales";

export interface ThumbnailInput {
  topic: string;
  title: string;
  hookText: string;
  audience: string;
  style: string;
  mood: string;
  includeFace: boolean;
  includeText: boolean;
  includeLogo: boolean;
  background: string;
  brand?: string;
  colorPreference?: string;
  hasReferenceFace: boolean;
  hasReferenceStyle: boolean;
  safeTextMode: boolean;
  locale?: Locale;
}

export const THUMBNAIL_STYLES = [
  { id: "clean-modern", label: "Clean Modern", description: "Minimal, whitespace-driven, premium SaaS look" },
  { id: "high-ctr", label: "High CTR YouTube", description: "Bold, high contrast, click-optimized classic YouTube style" },
  { id: "minimal-tech", label: "Minimal Tech", description: "Clean lines, subtle gradients, tech aesthetic" },
  { id: "apple-linear", label: "Apple/Linear Style", description: "Soft shadows, rounded corners, premium product feel" },
  { id: "dramatic-news", label: "Dramatic News", description: "Urgent, bold typography, breaking-news energy" },
  { id: "face-product", label: "Creator Face + Product", description: "Expressive face alongside product/logo element" },
  { id: "before-after", label: "Before/After", description: "Split composition showing transformation" },
  { id: "big-text-face", label: "Big Text + Expressive Face", description: "Large typography with emotional facial expression" },
  { id: "product-showcase", label: "Product Showcase", description: "Product-centered with clean background and details" },
  { id: "custom", label: "Custom", description: "Your own visual direction" },
] as const;

export type ThumbnailStyleId = (typeof THUMBNAIL_STYLES)[number]["id"];

export const AUDIENCE_OPTIONS = [
  { id: "creators", label: "Creators & YouTubers" },
  { id: "developers", label: "Developers & Engineers" },
  { id: "marketers", label: "Marketers & Growth" },
  { id: "students", label: "Students & Learners" },
  { id: "entrepreneurs", label: "Entrepreneurs & Founders" },
  { id: "ai-enthusiasts", label: "AI Enthusiasts" },
  { id: "general", label: "General Audience" },
] as const;

export const MOOD_OPTIONS = [
  { id: "surprised", label: "Surprised 😲", promptDesc: "wide-eyed, shocked expression, mouth slightly open" },
  { id: "confident", label: "Confident 😎", promptDesc: "self-assured smile, direct eye contact, powerful posture" },
  { id: "serious", label: "Serious 🤔", promptDesc: "focused, intense gaze, determined expression" },
  { id: "excited", label: "Excited 🤩", promptDesc: "energetic, enthusiastic, big smile, dynamic pose" },
  { id: "curious", label: "Curious 🧐", promptDesc: "intrigued look, raised eyebrow, leaning forward" },
] as const;

export const BACKGROUND_OPTIONS = [
  { id: "simple", label: "Simple Solid", promptDesc: "clean solid color background" },
  { id: "gradient", label: "Soft Gradient", promptDesc: "smooth gradient background with subtle color transition" },
  { id: "studio", label: "Studio Light", promptDesc: "professional studio lighting with soft backdrop" },
  { id: "product-ui", label: "Product UI Context", promptDesc: "subtle product interface or dashboard in background" },
] as const;

export const COLOR_PRESETS = [
  { id: "minimax-coral", label: "MiniMax Warm Coral", colors: "warm coral, rose pink, soft orange" },
  { id: "black-orange", label: "Black + Orange", colors: "deep black with vibrant orange accents" },
  { id: "clean-white", label: "Clean White", colors: "clean white with subtle gray accents" },
  { id: "dark-premium", label: "Dark Premium", colors: "deep charcoal, navy, with gold or silver accents" },
  { id: "custom", label: "Custom", colors: "" },
] as const;

export const BRAND_OPTIONS = [
  { id: "none", label: "No Brand" },
  { id: "minimax", label: "MiniMax" },
  { id: "openai", label: "OpenAI" },
  { id: "claude", label: "Claude" },
  { id: "youtube", label: "YouTube" },
  { id: "custom", label: "Custom" },
] as const;

const STYLE_PROMPT_MAP: Record<string, string> = {
  "clean-modern": "Clean modern design with generous whitespace, subtle shadows, minimal elements, premium SaaS aesthetic. Refined typography, soft lighting, uncluttered composition.",
  "high-ctr": "High CTR YouTube style: bold saturated colors, strong visual contrast, eye-catching composition designed to stop the scroll. Dynamic angles, punchy lighting, immediate visual impact.",
  "minimal-tech": "Minimal tech aesthetic: thin lines, subtle grid patterns, monospace typography hints, clean geometric shapes. Cool tones with one accent color. Understated but sophisticated.",
  "apple-linear": "Apple/Linear inspired: soft diffused lighting, rounded corners, gentle shadows, premium product photography feel. Muted pastels with one bold accent. Elegant and approachable.",
  "dramatic-news": "Dramatic news style: bold condensed typography, urgent color palette (red, orange, black), high energy composition. Strong diagonal lines, impactful lighting, sense of immediacy.",
  "face-product": "Creator-focused: expressive person as primary focal point, with product or logo element integrated naturally. Warm lighting, approachable energy, personal connection with viewer.",
  "before-after": "Before/After split composition: clear divide showing two states, contrast between sides, visual storytelling through juxtaposition. Clean divider, balanced weight on both sides.",
  "big-text-face": "Big text dominant: oversized bold typography as primary element, with expressive face as secondary focal point. Text takes 40-50% of frame, high contrast between text and background.",
  "product-showcase": "Product-centered: clean background, product is hero, subtle reflections or shadows, professional studio lighting. Minimal distractions, focus entirely on product details.",
  "custom": "Custom visual direction following the user's specific requirements.",
};

const BRAND_COLOR_MAP: Record<string, string> = {
  minimax: "warm coral (#FF4B8B) to orange (#FF8035) gradient tones",
  openai: "deep teal and green accents",
  claude: "warm amber and copper tones",
  youtube: "vibrant red (#FF0000) accents",
};

/**
 * Builds a professional YouTube thumbnail prompt optimized for high CTR.
 * This is the core prompt engineering function for the thumbnail generator.
 */
export function buildYoutubeThumbnailPrompt(input: ThumbnailInput): string {
  const {
    topic,
    title,
    hookText,
    audience,
    style,
    mood,
    includeFace,
    includeText,
    includeLogo,
    background,
    brand,
    colorPreference,
    hasReferenceFace,
    safeTextMode,
    locale,
  } = input;
  const normalizedLocale = normalizeLocale(locale);

  const safeTopic = sanitizePromptInput(topic);
  const safeTitle = sanitizePromptInput(title);
  const safeHook = sanitizePromptInput(hookText);
  const safeAudience = sanitizePromptInput(audience);
  const safeStyle = sanitizePromptInput(style);
  const safeMood = sanitizePromptInput(mood);
  const safeBackground = sanitizePromptInput(background);

  // Get style description
  const styleDesc = STYLE_PROMPT_MAP[safeStyle] ?? STYLE_PROMPT_MAP["custom"];

  // Get mood description
  const moodOption = MOOD_OPTIONS.find((m) => m.id === safeMood);
  const moodDesc = moodOption?.promptDesc ?? "engaging, expressive";

  // Get background description
  const bgOption = BACKGROUND_OPTIONS.find((b) => b.id === safeBackground);
  const bgDesc = bgOption?.promptDesc ?? "clean simple background";

  // Get color direction
  let colorDirection = "";
  if (colorPreference && colorPreference !== "custom") {
    const preset = COLOR_PRESETS.find((c) => c.id === colorPreference);
    if (preset) {
      colorDirection = `Color direction: ${preset.colors}. `;
    }
  }
  if (brand && brand !== "none" && brand !== "custom") {
    const brandColor = BRAND_COLOR_MAP[brand];
    if (brandColor) {
      colorDirection += `Brand color accents: ${brandColor}. `;
    }
  }

  // Build the main prompt
  const parts: string[] = [];

  parts.push(buildImageGenerationLocaleInstruction(normalizedLocale, safeHook));

  // Opening: Set the context
  parts.push(`YouTube thumbnail design, 16:9 aspect ratio, optimized for high click-through rate.`);

  // Topic and audience context
  parts.push(`Topic: ${safeTopic}. Video title: "${safeTitle}". Target audience: ${safeAudience}.`);

  // Style and mood
  parts.push(`Visual style: ${styleDesc}`);
  parts.push(`Mood/energy: ${moodDesc}.`);

  // Background
  parts.push(`Background: ${bgDesc}.`);

  // Color direction
  if (colorDirection) {
    parts.push(colorDirection.trim());
  }

  // Face instructions
  if (includeFace) {
    if (hasReferenceFace) {
      parts.push(`The thumbnail must feature a clear, expressive face as the primary focal point. Preserve the person's facial identity and likeness accurately. The face should show a ${moodDesc} expression, well-lit, sharp focus on eyes, suitable for a creator-style YouTube thumbnail.`);
    } else {
      parts.push(`The thumbnail should include an expressive, relatable human face showing a ${moodDesc} expression. The face should be well-lit, in sharp focus, and positioned as a strong focal point.`);
    }
  }

  // Text instructions
  if (includeText && !safeTextMode) {
    parts.push(`Include large, bold, highly readable text prominently in the composition. Use the meaning of this text, adapted into ${localeToGenerationLanguage(normalizedLocale)} if needed: "${safeHook}". The text must be clear, correctly spelled, and take up significant visual weight. Use strong contrast between text and background.`);
  } else if (safeTextMode) {
    parts.push(`DO NOT include any text, letters, words, or typography in the image. Generate a clean base composition without any text elements. The text will be added later.`);
  }

  // Logo/brand instructions
  if (includeLogo && brand && brand !== "none") {
    if (brand === "custom") {
      parts.push(`Include a subtle, professional logo or brand mark area in the composition. Do not invent fake logos.`);
    } else {
      parts.push(`Include a subtle ${brand} brand color accent or recognizable brand element integrated naturally into the composition. Do not create fake logos.`);
    }
  }

  // Composition rules
  parts.push(`Composition rules:`);
  parts.push(`- One clear, dominant focal point (no competing elements)`);
  parts.push(`- Strong visual hierarchy: primary element > secondary > background`);
  parts.push(`- High contrast for readability at small sizes (mobile screens)`);
  parts.push(`- Clean, uncluttered layout with intentional negative space`);
  parts.push(`- Professional lighting and color grading`);
  parts.push(`- Sharp focus on the main subject`);

  // YouTube-specific
  parts.push(`YouTube optimization:`);
  parts.push(`- Designed to stand out in search results and suggested videos`);
  parts.push(`- Readable and impactful even at 120x68 pixels (small mobile thumbnails)`);
  parts.push(`- Avoids generic AI art look (no overdone neon, no random purple glow)`);
  parts.push(`- Feels authentic and creator-made, not stock-image generic`);

  // Negative prompt section
  parts.push(`AVOID:`);
  parts.push(`- Messy or cluttered layout`);
  parts.push(`- Too much text or tiny unreadable text`);
  if (safeTextMode) {
    parts.push(`- ANY text, letters, numbers, or words in the image`);
  }
  parts.push(`- Distorted faces, extra fingers, or anatomical errors`);
  parts.push(`- Random fake logos, watermarks, or brand names`);
  parts.push(`- Generic wallpaper or stock-photo look without purpose`);
  parts.push(`- Overdone neon effects, random sparkles, or purple AI glow`);
  parts.push(`- Fake UI elements, gibberish text, or unreadable symbols`);
  parts.push(`- Multiple competing focal points`);
  parts.push(`- Blurry or out-of-focus main subject`);

  return parts.join("\n\n");
}

/**
 * Builds a prompt specifically for the prompt-generation API route.
 * This creates a concise instruction for the LLM to generate a visual prompt.
 */
export function buildThumbnailPromptGenerationPrompt(params: {
  theme: string;
  title: string;
  style: string;
  text: string;
  language?: string;
}): string {
  const locale = normalizeLocale(params.language);
  const language = localeToGenerationLanguage(locale);
  const safeText = sanitizePromptInput(params.text);

  return `You are an expert YouTube thumbnail prompt engineer. Create a detailed, professional visual prompt for an AI image generator.

Video Topic: ${sanitizePromptInput(params.theme)}
Video Title: ${sanitizePromptInput(params.title)}
Style Direction: ${sanitizePromptInput(params.style)}
Visible text meaning: "${safeText}"
Visible text language: ${language}

Requirements:
- Write the technical image prompt in English.
- Any visible text inside the image must be in ${language}.
- If the visible text source is not already in ${language}, adapt its meaning into ${language}.
- Optimized for YouTube 16:9 thumbnail format
- High click-through rate design principles
- Clear focal point and strong visual hierarchy
- Professional lighting and composition
- Modern, clean aesthetic
- Readable at small sizes
- No generic AI art look

Return ONLY the visual prompt description (2-4 sentences). No JSON, no explanations, no markdown formatting.`;
}

/**
 * Validates thumbnail hook text and returns warnings/tips.
 */
export function validateHookText(hookText: string): {
  isValid: boolean;
  wordCount: number;
  warning?: string;
  tip?: string;
} {
  const words = hookText.trim().split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  if (wordCount === 0) {
    return { isValid: false, wordCount: 0, warning: "Thumbnail text is required", tip: "Add a short, punchy headline" };
  }

  if (wordCount > 7) {
    return {
      isValid: true,
      wordCount,
      warning: `${wordCount} words — that's a lot for a thumbnail`,
      tip: "Best thumbnails use 2-5 words. Try shortening it.",
    };
  }

  if (wordCount > 5) {
    return {
      isValid: true,
      wordCount,
      warning: undefined,
      tip: "Tip: 2-5 words work best for YouTube thumbnails",
    };
  }

  return { isValid: true, wordCount, tip: "Perfect length for a thumbnail!" };
}

/**
 * Returns contextual quality tips based on the current input state.
 */
export function getQualityTips(input: Partial<ThumbnailInput>): string[] {
  const tips: string[] = [];

  if (!input.hasReferenceFace && input.includeFace) {
    tips.push("Tip: Upload a clear face photo for more personalized, creator-style thumbnails");
  }

  if (input.hookText) {
    const validation = validateHookText(input.hookText);
    if (validation.tip && !validation.warning) {
      tips.push(validation.tip);
    }
  }

  if (!input.safeTextMode && input.includeText) {
    tips.push("Tip: Safe Text Overlay mode gives you more control over thumbnail text");
  }

  if (input.style === "high-ctr" || input.style === "big-text-face") {
    tips.push("Tip: High-contrast colors work best for click-through rates");
  }

  if (!input.mood || input.mood === "confident") {
    tips.push("Tip: A surprised or excited expression often gets more clicks than neutral");
  }

  if (input.background === "simple") {
    tips.push("Tip: Simple backgrounds make your subject pop — great choice!");
  }

  // Remove duplicates and limit
  return [...new Set(tips)].slice(0, 3);
}

/**
 * Legacy compatibility: builds a basic thumbnail prompt.
 * @deprecated Use buildYoutubeThumbnailPrompt instead.
 */
export function buildThumbnailPrompt(params: {
  theme: string;
  title: string;
  style: string;
  text: string;
  language?: string;
}): string {
  return buildThumbnailPromptGenerationPrompt(params);
}

/**
 * Legacy compatibility: builds a basic image prompt.
 * @deprecated Use buildYoutubeThumbnailPrompt instead.
 */
export function buildThumbnailImagePrompt(visualPrompt: string, text: string): string {
  return `YouTube thumbnail, 16:9, high CTR, modern style.
Main visual: clean, professional, eye-catching composition.
Dark background with vibrant accent colors.
${buildImageGenerationLocaleInstruction(normalizeLocale(undefined), sanitizePromptInput(text))}
Do NOT generate random words.
Do NOT generate fake logos.
Do NOT generate brand names.
Do NOT create a generic wallpaper.
Original visual direction:
${sanitizePromptInput(visualPrompt)}`;
}

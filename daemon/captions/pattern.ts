export type CreatorProfile = {
  tiktok?: string;
  instagram?: string;
  x?: string;
  businessEmail?: string;
  primaryLinkLabel?: string;
  primaryLinkUrl?: string;
  language?: "auto" | "pt-BR" | "es" | "en";
};

export type CaptionPack = {
  captions: string[];
  notes: string[];
  hashtags: string[];
  keywords: string[];
  followBlock: string;
  linkBlock?: string;
  businessBlock?: string;
};

export const DEFAULT_SEO_CAPTION_PATTERN = `#PrimaryKeyword #BrandKeyword #TopicKeyword
👇🏻 Main hook with the strongest keyword and clear promise 👇🏻

In this video, explain the main topic using the highest-value search terms naturally in the first sentence.

Second paragraph: expand the promise, mention the mechanism, tool, model, app, technique or trend, and connect it to the audience's practical outcome.

Third paragraph: include a "If you were searching for..." SEO sentence with variations of the target keywords, related tools, trends and intent phrases.

📌 Main link:
https://example.com

If this helped, ask for like/subscribe/follow using the same language as the video and mention the broader content pillars.

📌 FOLLOW ME:
TikTok → profile
Instagram → profile
Twitter / X → profile

Business Inquiries & Partnerships:
email@example.com

#PrimaryKeyword #SecondaryKeyword #TopicKeyword #AI #Technology`;

const stopwords = new Set([
  "para",
  "como",
  "este",
  "esta",
  "isso",
  "esse",
  "essa",
  "sobre",
  "voce",
  "você",
  "porque",
  "com",
  "sem",
  "uma",
  "um",
  "que",
  "por",
  "los",
  "las",
  "del",
  "con",
  "sin",
  "este",
  "esta",
  "para",
  "the",
  "and",
  "with",
  "from",
  "this",
  "that",
  "your",
]);

function clean(value: unknown) {
  return String(value ?? "").trim();
}

function extractJsonObject(content: string): Record<string, unknown> | null {
  const start = content.indexOf("{");
  const end = content.lastIndexOf("}");
  if (start < 0 || end < start) return null;
  try {
    const parsed = JSON.parse(content.slice(start, end + 1));
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? parsed as Record<string, unknown>
      : null;
  } catch {
    return null;
  }
}

function titleCaseHashtag(value: string) {
  const cleanValue = value
    .normalize("NFKD")
    .replace(/[^\p{L}\p{N}\s_-]/gu, "")
    .trim();
  if (!cleanValue) return "";
  const compact = cleanValue
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
  return compact ? `#${compact.slice(0, 48)}` : "";
}

export function extractSeoKeywords(input: {
  script: string;
  topic?: string;
  title?: string;
  limit?: number;
}) {
  const text = [input.title, input.topic, input.script].filter(Boolean).join(" ");
  const tokens = text.match(/[\p{L}\p{N}][\p{L}\p{N}._-]{2,}/gu) ?? [];
  const scores = new Map<string, number>();

  for (const rawToken of tokens) {
    const token = rawToken.replace(/[.,:;!?()[\]{}"“”]/g, "").trim();
    const key = token.toLowerCase();
    if (key.length < 3 || stopwords.has(key)) continue;
    const boost = /[A-Z0-9]/.test(token) ? 2 : 1;
    scores.set(token, (scores.get(token) ?? 0) + boost);
  }

  return [...scores.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([token]) => token)
    .slice(0, input.limit ?? 12);
}

export function buildHashtags(keywords: string[], limit = 12) {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const keyword of keywords) {
    const tag = titleCaseHashtag(keyword);
    const key = tag.toLowerCase();
    if (!tag || seen.has(key)) continue;
    seen.add(key);
    out.push(tag);
    if (out.length >= limit) break;
  }
  return out;
}

export function normalizeCreatorProfile(profile: unknown): CreatorProfile {
  if (!profile || typeof profile !== "object") return { language: "auto" };
  const record = profile as Record<string, unknown>;
  const language = ["pt-BR", "es", "en", "auto"].includes(clean(record.language))
    ? clean(record.language) as CreatorProfile["language"]
    : "auto";
  return {
    tiktok: clean(record.tiktok),
    instagram: clean(record.instagram),
    x: clean(record.x),
    businessEmail: clean(record.businessEmail),
    primaryLinkLabel: clean(record.primaryLinkLabel),
    primaryLinkUrl: clean(record.primaryLinkUrl),
    language,
  };
}

export function buildFollowBlock(profile: CreatorProfile) {
  const rows = [
    profile.tiktok ? `TikTok → ${profile.tiktok}` : "",
    profile.instagram ? `Instagram → ${profile.instagram}` : "",
    profile.x ? `Twitter / X → ${profile.x}` : "",
  ].filter(Boolean);
  return rows.length ? ["📌 FOLLOW ME:", ...rows].join("\n") : "";
}

export function buildSeoCaptionPrompt(input: {
  script: string;
  topic?: string;
  title?: string;
  pattern?: string;
  creatorProfile?: CreatorProfile;
}) {
  const profile = normalizeCreatorProfile(input.creatorProfile);
  const keywords = extractSeoKeywords({
    script: input.script,
    topic: input.topic,
    title: input.title,
    limit: 18,
  });
  const hashtags = buildHashtags(keywords, 14);
  const profileBlock = [
    profile.language ? `LANGUAGE: ${profile.language}` : "",
    profile.primaryLinkLabel || profile.primaryLinkUrl
      ? `PRIMARY_LINK: ${profile.primaryLinkLabel || "Main link"} -> ${profile.primaryLinkUrl || "missing"}`
      : "",
    buildFollowBlock(profile),
    profile.businessEmail ? `BUSINESS_EMAIL: ${profile.businessEmail}` : "",
  ].filter(Boolean).join("\n");

  return [
    `PATTERN:\n${input.pattern?.trim() || DEFAULT_SEO_CAPTION_PATTERN}`,
    "",
    `TOPIC:\n${input.topic || ""}`,
    "",
    `TITLE:\n${input.title || ""}`,
    "",
    `SEO_KEYWORDS_TO_USE:\n${keywords.join(", ")}`,
    "",
    `SUGGESTED_HASHTAGS:\n${hashtags.join(" ")}`,
    "",
    `CREATOR_PROFILE:\n${profileBlock || "No social links provided."}`,
    "",
    `SCRIPT:\n${input.script}`,
  ].join("\n");
}

export function buildLocalSeoCaption(input: {
  script: string;
  topic?: string;
  title?: string;
  creatorProfile?: CreatorProfile;
}) {
  const profile = normalizeCreatorProfile(input.creatorProfile);
  const title = clean(input.title) || clean(input.topic) || "este tema";
  const keywords = extractSeoKeywords({ script: input.script, topic: input.topic, title, limit: 14 });
  const hashtags = buildHashtags(keywords, 14);
  const leadTags = hashtags.slice(0, 3).join(" ");
  const seoSentence = keywords.slice(0, 10).join(", ");
  const language = profile.language === "pt-BR" ? "pt-BR" : profile.language === "en" ? "en" : "es";

  const intro = language === "pt-BR"
    ? `Neste vídeo eu explico ${title}, conectando os pontos principais do roteiro com exemplos práticos e contexto para quem quer entender o que realmente importa.`
    : language === "en"
      ? `In this video I explain ${title}, connecting the key ideas from the script with practical context and why it matters.`
      : `En este vídeo te explico ${title}, conectando los puntos principales del guion con ejemplos prácticos y contexto para entender por qué importa.`;
  const searchLine = language === "pt-BR"
    ? `Se você estava buscando ${seoSentence}, este vídeo ajuda a entender o tema com clareza e aplicação prática.`
    : language === "en"
      ? `If you were searching for ${seoSentence}, this video will help you understand the topic clearly and practically.`
      : `Si estabas buscando ${seoSentence}, este vídeo te ayudará a entender el tema con claridad y aplicación práctica.`;
  const cta = language === "pt-BR"
    ? "Se gostou, deixe seu LIKE e se INSCREVA para acompanhar novidades sobre inteligência artificial, tecnologia, automação, produtividade e tendências digitais."
    : language === "en"
      ? "If this helped, leave a LIKE and SUBSCRIBE for more updates on artificial intelligence, technology, automation, productivity and digital trends."
      : "Si te ha gustado, no olvides dejar tu LIKE y SUSCRIBIRTE para estar al día con las últimas novedades de inteligencia artificial, tecnología, apps, herramientas de IA, automatización, productividad y tendencias digitales.";
  const linkBlock = profile.primaryLinkUrl
    ? `📌 ${profile.primaryLinkLabel || "Link principal"}:\n${profile.primaryLinkUrl}`
    : "";
  const followBlock = buildFollowBlock(profile);
  const businessBlock = profile.businessEmail
    ? `Business Inquiries & Partnerships:\n${profile.businessEmail}`
    : "";

  const caption = [
    leadTags,
    `👇🏻 ${title} 👇🏻`,
    "",
    intro,
    "",
    searchLine,
    "",
    linkBlock,
    "",
    cta,
    "",
    followBlock,
    "",
    businessBlock,
    "",
    hashtags.join(" "),
  ].filter((part) => part !== "").join("\n");

  return {
    captions: [caption],
    notes: ["Fallback local aplicado para manter a estrutura SEO mesmo sem JSON válido do provider."],
    hashtags,
    keywords,
    followBlock,
    linkBlock,
    businessBlock,
  };
}

export function parseCaptionPackResponse(
  content: string,
  fallbackInput: {
    script: string;
    topic?: string;
    title?: string;
    creatorProfile?: CreatorProfile;
  }
): CaptionPack {
  const json = extractJsonObject(content);
  if (!json) return buildLocalSeoCaption(fallbackInput);

  const captions = Array.isArray(json.captions)
    ? json.captions.map(String).map((caption) => caption.trim()).filter(Boolean)
    : [];
  const caption = clean(json.caption || json.fullCaption);
  if (caption) captions.unshift(caption);
  const keywords = Array.isArray(json.keywords)
    ? json.keywords.map(String).map((item) => item.trim()).filter(Boolean)
    : extractSeoKeywords(fallbackInput);
  const hashtags = Array.isArray(json.hashtags)
    ? json.hashtags.map(String).map((item) => item.trim()).filter(Boolean)
    : buildHashtags(keywords);
  const local = buildLocalSeoCaption({ ...fallbackInput, creatorProfile: fallbackInput.creatorProfile });

  return {
    captions: captions.length ? Array.from(new Set(captions)).slice(0, 3) : local.captions,
    notes: Array.isArray(json.notes) ? json.notes.map(String).filter(Boolean) : [],
    hashtags: hashtags.length ? hashtags : local.hashtags,
    keywords: keywords.length ? keywords : local.keywords,
    followBlock: clean(json.followBlock) || local.followBlock,
    linkBlock: clean(json.linkBlock) || local.linkBlock,
    businessBlock: clean(json.businessBlock) || local.businessBlock,
  };
}

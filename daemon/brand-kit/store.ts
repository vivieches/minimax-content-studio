import { mkdir, writeFile } from "fs/promises";
import { join } from "path";

import { DATA_DIR, generateId, readDb, writeDb } from "@/lib/storage/db";

export type BrandReference = {
  id: string;
  title: string;
  content: string;
  type: "link" | "text";
  createdAt: string;
  updatedAt: string;
};

export type BrandKit = {
  brandVoice: string;
  audience: string;
  tone: string;
  forbiddenWords: string[];
  references: BrandReference[];
  updatedAt: string;
};

const BRAND_KIT_FILE = "brand-kit.json";
const DEFAULT_BRAND_VOICE =
  "Usa um linguagem claro, direto e empatico. Evita tecnicismos desnecessarios e fala como se conversasse com a audiencia.";

function now() {
  return new Date().toISOString();
}

function defaultBrandKit(): BrandKit {
  return {
    brandVoice: DEFAULT_BRAND_VOICE,
    audience: "",
    tone: "direto, util e humano",
    forbiddenWords: [],
    references: [],
    updatedAt: now(),
  };
}

function normalizeReference(value: Partial<BrandReference>): BrandReference {
  const timestamp = now();
  const content = String(value.content ?? "").trim();
  const isLink = /^https?:\/\//i.test(content);
  return {
    id: value.id || generateId(),
    title: String(value.title ?? "").trim() || (isLink ? content : "Referencia"),
    content,
    type: value.type ?? (isLink ? "link" : "text"),
    createdAt: value.createdAt || timestamp,
    updatedAt: timestamp,
  };
}

function normalizeBrandKit(value: Partial<BrandKit> | null | undefined): BrandKit {
  const defaults = defaultBrandKit();
  return {
    brandVoice: typeof value?.brandVoice === "string" && value.brandVoice.trim() ? value.brandVoice.trim() : defaults.brandVoice,
    audience: typeof value?.audience === "string" ? value.audience.trim() : defaults.audience,
    tone: typeof value?.tone === "string" && value.tone.trim() ? value.tone.trim() : defaults.tone,
    forbiddenWords: Array.isArray(value?.forbiddenWords) ? value.forbiddenWords.map(String).map((item) => item.trim()).filter(Boolean) : [],
    references: Array.isArray(value?.references)
      ? value.references.map((reference) => normalizeReference(reference)).filter((reference) => reference.content)
      : [],
    updatedAt: typeof value?.updatedAt === "string" ? value.updatedAt : defaults.updatedAt,
  };
}

async function writeBrandMarkdown(brandKit: BrandKit) {
  await mkdir(DATA_DIR, { recursive: true });
  const references = brandKit.references
    .map((reference, index) => `${index + 1}. ${reference.title}\n${reference.content}`)
    .join("\n\n");
  const markdown = [
    "# Open Studio Brand Kit",
    "",
    "## Voz de marca",
    brandKit.brandVoice,
    "",
    "## Audiencia",
    brandKit.audience || "Nao definida",
    "",
    "## Tom",
    brandKit.tone,
    "",
    "## Palavras proibidas",
    brandKit.forbiddenWords.length ? brandKit.forbiddenWords.map((word) => `- ${word}`).join("\n") : "Nenhuma",
    "",
    "## Referencias",
    references || "Nenhuma",
  ].join("\n");
  await writeFile(join(DATA_DIR, "BRAND.md"), markdown, "utf8");
}

export async function getBrandKit(): Promise<BrandKit> {
  const stored = await readDb<Partial<BrandKit>>(BRAND_KIT_FILE, defaultBrandKit());
  return normalizeBrandKit(stored);
}

export async function updateBrandKit(partial: Partial<BrandKit>): Promise<BrandKit> {
  const current = await getBrandKit();
  const next = normalizeBrandKit({
    ...current,
    ...partial,
    references: partial.references ?? current.references,
    updatedAt: now(),
  });
  await writeDb(BRAND_KIT_FILE, next);
  await writeBrandMarkdown(next);
  return next;
}

export async function upsertBrandReference(input: Partial<BrandReference>): Promise<BrandKit> {
  const current = await getBrandKit();
  const nextReference = normalizeReference(input);
  const existingIndex = current.references.findIndex((reference) => reference.id === nextReference.id);
  const references = [...current.references];
  if (existingIndex >= 0) references[existingIndex] = nextReference;
  else references.unshift(nextReference);
  return updateBrandKit({ references });
}

export async function deleteBrandReference(referenceId: string): Promise<BrandKit> {
  const current = await getBrandKit();
  return updateBrandKit({
    references: current.references.filter((reference) => reference.id !== referenceId),
  });
}

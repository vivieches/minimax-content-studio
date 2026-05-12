import type { BrandKit } from "@/daemon/brand-kit/store";
import type { MemoryRecord } from "@/daemon/memory/store";
import type { ResearchFindings } from "@/daemon/research/types";
import type { SkillRecord } from "@/daemon/skills/registry";

export const PROMPT_LAYER_ORDER = [
  "identity",
  "routine",
  "project",
  "request",
  "brandKit",
  "memory",
  "research",
  "media",
  "skills",
  "schema",
] as const;

export type PromptLayerId = (typeof PROMPT_LAYER_ORDER)[number];

export type PromptLayer = {
  id: PromptLayerId;
  title: string;
  content: string;
  enabled: boolean;
};

export type ComposePromptInput = {
  identity?: string;
  routine?: string;
  project?: string;
  request: string;
  brandKit?: BrandKit | null;
  memories?: MemoryRecord[];
  research?: ResearchFindings[];
  mediaContract?: string;
  skills?: SkillRecord[];
  schema?: string;
};

function formatBrandKit(brandKit?: BrandKit | null) {
  if (!brandKit) return "";
  const references = brandKit.references
    .slice(0, 8)
    .map((reference, index) => `${index + 1}. ${reference.title}\n${reference.content}`)
    .join("\n\n");
  return [
    brandKit.brandVoice ? `VOICE:\n${brandKit.brandVoice}` : "",
    brandKit.audience ? `AUDIENCE:\n${brandKit.audience}` : "",
    brandKit.tone ? `TONE:\n${brandKit.tone}` : "",
    brandKit.forbiddenWords.length ? `FORBIDDEN_WORDS:\n${brandKit.forbiddenWords.join(", ")}` : "",
    references ? `REFERENCES:\n${references}` : "",
  ].filter(Boolean).join("\n\n");
}

function formatMemories(memories: MemoryRecord[] = []) {
  return memories
    .slice(0, 10)
    .map((memory, index) => `${index + 1}. [${memory.tags.join(", ") || memory.source}] ${memory.content}`)
    .join("\n");
}

function formatResearch(research: ResearchFindings[] = []) {
  return research
    .slice(0, 3)
    .map((item, index) => {
      const sources = item.sources
        .slice(0, 5)
        .map((source, sourceIndex) => `[${sourceIndex + 1}] ${source.title}: ${source.snippet} (${source.url})`)
        .join("\n");
      return `REPORT ${index + 1}: ${item.query}\n${item.summary}\n${sources}`;
    })
    .join("\n\n");
}

function formatSkills(skills: SkillRecord[] = []) {
  return skills
    .slice(0, 12)
    .map((skill) => `- ${skill.name}: ${skill.description || skill.id}`)
    .join("\n");
}

function layer(id: PromptLayerId, title: string, content?: string): PromptLayer {
  return {
    id,
    title,
    content: content?.trim() ?? "",
    enabled: Boolean(content?.trim()),
  };
}

export function composePrompt(input: ComposePromptInput): { prompt: string; layers: PromptLayer[] } {
  const layerMap: Record<PromptLayerId, PromptLayer> = {
    identity: layer("identity", "Identity", input.identity),
    routine: layer("routine", "Routine", input.routine),
    project: layer("project", "Project", input.project),
    request: layer("request", "Request", input.request),
    brandKit: layer("brandKit", "Brand Kit", formatBrandKit(input.brandKit)),
    memory: layer("memory", "Memory", formatMemories(input.memories)),
    research: layer("research", "Research", formatResearch(input.research)),
    media: layer("media", "Media Contract", input.mediaContract),
    skills: layer("skills", "Skills", formatSkills(input.skills)),
    schema: layer("schema", "Output Schema", input.schema),
  };

  const layers = PROMPT_LAYER_ORDER.map((id) => layerMap[id]);
  const prompt = layers
    .filter((item) => item.enabled)
    .map((item) => `## ${item.title}\n${item.content}`)
    .join("\n\n");

  return { prompt, layers };
}

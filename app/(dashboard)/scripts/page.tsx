"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Bell,
  Check,
  ChevronDown,
  ChevronRight,
  Copy,
  Edit3,
  FileText,
  Loader2,
  MoreHorizontal,
  Plus,
  Save,
  Search,
  Sparkles,
  XCircle,
} from "lucide-react";

type ScriptSection = {
  title: string;
  time: string;
  body?: string;
  items?: Array<{ title: string; body: string }>;
};

type ReferenceItem = {
  id: string;
  title: string;
  content: string;
  type?: "link" | "text";
};

type Diagnostic = {
  severity?: "info" | "warning" | "error";
  message: string;
  action?: string;
};

const INITIAL_INSTRUCTIONS =
  "Crie um roteiro para um vídeo de YouTube sobre hábitos de produtividade para estudantes universitários. Tom motivacional e próximo, com exemplos práticos.";

const VARIABLES = [
  ["{{TEMA}}", "Tema principal"],
  ["{{PUBLICO}}", "Público-alvo"],
  ["{{TONO}}", "Tom de comunicação"],
  ["{{DURACAO}}", "Duração estimada"],
] as const;

const VERSIONS = [
  ["Roteiro - Hábitos de produtividade v2", "Há 2 horas"],
  ["Roteiro - Hábitos de produtividade v1", "Há 1 dia"],
  ["Roteiro - Primeira versão", "Há 2 dias"],
] as const;

const DEFAULT_BRAND_VOICE =
  "Use linguagem clara, direta e empática. Evite tecnicismos desnecessários e fale como se estivesse conversando com o público.";

function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <section
      className={`rounded-[14px] border border-line bg-card shadow-[inset_0_1px_0_rgba(255,255,255,0.025),0_18px_60px_rgba(0,0,0,0.18)] ${className}`}
    >
      {children}
    </section>
  );
}

function SectionHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h2 className="text-[17px] font-semibold tracking-[-0.01em] text-ink">{title}</h2>
        <p className="mt-2 max-w-[68ch] text-[13px] leading-5 text-ink-2">{description}</p>
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </div>
  );
}

function FieldShell({
  label,
  children,
  className = "",
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={`block min-w-0 ${className}`}>
      <span className="mb-2 block text-[12px] font-semibold text-ink">{label}</span>
      {children}
    </label>
  );
}

function SelectControl({
  value,
  onChange,
  options,
  ariaLabel,
}: {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  ariaLabel: string;
}) {
  return (
    <span className="relative block">
      <select
        aria-label={ariaLabel}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 w-full appearance-none rounded-[8px] border border-line bg-card-hi px-4 pr-10 text-[13px] font-medium text-ink transition duration-200 hover:border-line-hi focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/15"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-3" strokeWidth={1.8} />
    </span>
  );
}

function SecondaryButton({
  children,
  onClick,
  disabled,
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex h-10 items-center justify-center gap-2 rounded-[8px] border border-line bg-white/[0.025] px-4 text-[13px] font-semibold text-ink transition duration-200 hover:border-line-hi hover:bg-hover disabled:cursor-not-allowed disabled:opacity-45"
    >
      {children}
    </button>
  );
}

function SidebarCard({
  title,
  action,
  children,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Card className="p-5">
      <div className="mb-4 flex items-start justify-between gap-4">
        <h3 className="text-[16px] font-semibold tracking-[-0.01em] text-ink">{title}</h3>
        {action}
      </div>
      {children}
    </Card>
  );
}

function IconButton({
  label,
  children,
  onClick,
}: {
  label: string;
  children: ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="grid h-8 w-8 place-items-center rounded-[8px] border border-line bg-white/[0.025] text-ink-2 transition duration-200 hover:border-line-hi hover:bg-hover hover:text-ink"
    >
      {children}
    </button>
  );
}

export default function ScriptGeneratorPage() {
  const [objective, setObjective] = useState("Informar");
  const [topic, setTopic] = useState("Produtividade pessoal");
  const [audience, setAudience] = useState("Estudantes universitários");
  const [duration, setDuration] = useState("3 - 5 minutos");
  const [instructions, setInstructions] = useState(INITIAL_INSTRUCTIONS);
  const [brandVoice, setBrandVoice] = useState(DEFAULT_BRAND_VOICE);
  const [editingBrandVoice, setEditingBrandVoice] = useState(false);
  const [references, setReferences] = useState<ReferenceItem[]>([]);
  const [result, setResult] = useState<ScriptSection[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadBrandKit() {
      try {
        const response = await fetch("/api/brand-kit");
        const data = await response.json();
        if (!data?.ok || !data.brandKit) return;
        if (typeof data.brandKit.brandVoice === "string") setBrandVoice(data.brandKit.brandVoice);
        if (Array.isArray(data.brandKit.references)) {
          setReferences(data.brandKit.references.map((reference: ReferenceItem) => ({
            id: reference.id,
            title: reference.title,
            content: reference.content,
            type: reference.type,
          })));
        }
      } catch {
        // Brand kit is a convenience layer; script generation still works without it.
      }
    }

    void loadBrandKit();
  }, []);

  const resultText = useMemo(() => {
    if (!result) return "";
    return result
      .map((section) => {
        const header = `${section.title} (${section.time})`;
        const body = section.body ? `\n${section.body}` : "";
        const items = section.items
          ? `\n${section.items.map((item, index) => `${index + 1}. ${item.title}\n${item.body}`).join("\n\n")}`
          : "";
        return `${header}${body}${items}`;
      })
      .join("\n\n");
  }, [result]);

  function showNotice(message: string) {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2200);
  }

  function resolveVariables(text: string) {
    return text
      .replaceAll("{{TEMA}}", topic || "tema não definido")
      .replaceAll("{{PUBLICO}}", audience || "público não definido")
      .replaceAll("{{AUDIENCIA}}", audience || "público não definido")
      .replaceAll("{{TONO}}", brandVoice || "tom não definido")
      .replaceAll("{{DURACAO}}", duration || "duração não definida")
      .replaceAll("{{DURACION}}", duration || "duração não definida");
  }

  async function saveBrandKit(patch: Record<string, unknown>) {
    const response = await fetch("/api/brand-kit", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    const data = await response.json();
    if (!data?.ok) throw new Error(data?.error || "Não foi possível salvar a voz da marca.");
    if (Array.isArray(data.brandKit?.references)) {
      setReferences(data.brandKit.references.map((reference: ReferenceItem) => ({
        id: reference.id,
        title: reference.title,
        content: reference.content,
        type: reference.type,
      })));
    }
  }

  function createReferenceId() {
    return typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `ref-${Date.now()}`;
  }

  async function handleGenerate() {
    if (!instructions.trim()) {
      setError("Adicione instruções para gerar o roteiro.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      await saveBrandKit({ brandVoice, references });
      const briefing = [
        `OBJETIVO: ${objective}`,
        `TEMA: ${topic}`,
        `PUBLICO_ALVO: ${audience}`,
        `DURACAO_APROXIMADA: ${duration}`,
        `VOZ_DE_MARCA: ${brandVoice}`,
        references.length
          ? `REFERENCIAS:\n${references.map((reference, index) => `${index + 1}. ${reference.title}\n${reference.content}`).join("\n\n")}`
          : "REFERENCIAS: nenhuma",
        `INSTRUCOES: ${resolveVariables(instructions)}`,
      ].join("\n");

      const response = await fetch("/api/minimax/script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ briefing, saveToAssets: true }),
      });

      const data = await response.json();
      if (!response.ok || data?.error) {
        throw new Error(data?.details || data?.error || "Não foi possível gerar o roteiro.");
      }

      const script = data?.script || data?.content;
      if (!script) throw new Error("O provider respondeu sem conteúdo de roteiro.");
      setResult([
        {
          title: String(data?.title || "Roteiro gerado"),
          time: duration,
          body: String(script),
        },
      ]);
      void fetch("/api/memory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ extractFrom: `${brandVoice}\n${resolveVariables(instructions)}` }),
      }).catch(() => undefined);
      const diagnostics = Array.isArray(data?.diagnostics) ? (data.diagnostics as Diagnostic[]) : [];
      const visibleDiagnostic = diagnostics.find((diagnostic) => diagnostic.severity !== "info");
      showNotice(visibleDiagnostic ? [visibleDiagnostic.message, visibleDiagnostic.action].filter(Boolean).join(" ") : "Roteiro gerado");
    } catch (generateError) {
      setError(generateError instanceof Error ? generateError.message : "Não foi possível gerar o roteiro.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    if (!resultText) return;
    await navigator.clipboard.writeText(resultText);
    showNotice("Copiado");
  }

  async function handleSave() {
    if (!resultText.trim()) return;
    try {
      const response = await fetch("/api/assets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "script",
          title: `Roteiro - ${topic || "Open Studio"}`,
          description: instructions.slice(0, 500),
          content: resultText,
          metadata: { objective, topic, audience, duration, brandVoice, references, savedFrom: "scripts-page" },
          sourceModule: "script-editor",
          tags: ["script", "saved"],
        }),
      });
      const data = await response.json();
      if (!data.ok) throw new Error(data.error || "Não foi possível salvar.");
      showNotice("Salvo em Arquivos");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Não foi possível salvar o roteiro.");
    }
  }

  function handleNewScript() {
    setObjective("Informar");
    setTopic("");
    setAudience("Estudantes universitários");
    setDuration("3 - 5 minutos");
    setInstructions("");
    setReferences([]);
    setResult(null);
    setError("");
    showNotice("Novo roteiro pronto");
  }

  function insertVariable(variable: string) {
    setInstructions((current) => `${current}${current ? " " : ""}${variable}`.slice(0, 2000));
  }

  function addCustomVariable() {
    const name = window.prompt("Nome da variável. Exemplo: CTA_FINAL");
    if (!name?.trim()) return;
    const token = `{{${name.trim().toUpperCase().replaceAll(/\s+/g, "_")}}}`;
    insertVariable(token);
    showNotice(`Variável ${token} inserida`);
  }

  function addReference() {
    void addReferenceAsync();
  }

  async function addReferenceAsync() {
    const content = window.prompt("Cole um link, nota ou trecho de roteiro para usar como referência.");
    if (!content?.trim()) return;
    const trimmed = content.trim();
    const isUrl = /^https?:\/\//i.test(trimmed);
    const title = isUrl ? trimmed : `Referência ${references.length + 1}`;
    try {
      const response = await fetch("/api/brand-kit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: createReferenceId(),
          title,
          content: trimmed,
          type: isUrl ? "link" : "text",
        }),
      });
      const data = await response.json();
      if (!data?.ok) throw new Error(data?.error || "Não foi possível adicionar a referência.");
      setReferences(data.brandKit.references);
      showNotice("Referência adicionada");
    } catch (referenceError) {
      setError(referenceError instanceof Error ? referenceError.message : "Não foi possível adicionar a referência.");
    }
  }

  function removeReference(referenceId: string) {
    void removeReferenceAsync(referenceId);
  }

  async function removeReferenceAsync(referenceId: string) {
    try {
      const response = await fetch(`/api/brand-kit?id=${encodeURIComponent(referenceId)}`, { method: "DELETE" });
      const data = await response.json();
      if (!data?.ok) throw new Error(data?.error || "Não foi possível remover a referência.");
      setReferences(data.brandKit.references);
      showNotice("Referência removida");
    } catch (referenceError) {
      setError(referenceError instanceof Error ? referenceError.message : "Não foi possível remover a referência.");
    }
  }

  return (
    <main className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden bg-canvas text-ink">
      <div className="mx-auto flex w-full max-w-[1540px] flex-col gap-6 px-4 py-5 sm:px-6 lg:px-8 lg:py-7 2xl:px-10">
        <header className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-[27px] font-bold leading-tight tracking-[-0.035em] text-ink">Roteiro</h1>
            <nav className="mt-3 flex items-center gap-2 text-[13px] text-ink-2" aria-label="Breadcrumb">
              <span>Início</span>
              <ChevronRight className="h-3.5 w-3.5 text-ink-3" strokeWidth={1.8} />
              <span className="text-ink-2">Roteiro</span>
            </nav>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
            <label className="relative block min-w-0 sm:w-[280px] xl:w-[340px]">
              <span className="sr-only">Buscar em roteiros...</span>
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-2" strokeWidth={1.7} />
              <input
                type="search"
                placeholder="Buscar em roteiros..."
                readOnly
                onFocus={() => window.dispatchEvent(new Event("open-studio:quick-switcher"))}
                onClick={() => window.dispatchEvent(new Event("open-studio:quick-switcher"))}
                className="h-11 w-full rounded-[9px] border border-line bg-card px-11 pr-16 text-[13px] text-ink placeholder:text-ink-2 transition duration-200 hover:border-line-hi focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/15"
              />
              <kbd className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded-[6px] border border-line bg-card-hi px-1.5 py-0.5 text-[11px] font-medium text-ink-2">
                Ctrl K
              </kbd>
            </label>
            <IconButton label="Notificações">
              <span className="relative">
                <Bell className="h-4 w-4" strokeWidth={1.8} />
                <span className="absolute -right-0.5 -top-1 h-2 w-2 rounded-full bg-accent ring-2 ring-card" />
              </span>
            </IconButton>
            <div className="flex overflow-hidden rounded-[9px] shadow-[0_12px_34px_rgba(208,111,167,0.18)]">
              <button
                type="button"
                onClick={handleNewScript}
                className="inline-flex h-11 items-center justify-center gap-2 bg-accent px-5 text-[13px] font-semibold text-accent-fg transition duration-200 hover:bg-accent-hi"
              >
                <Plus className="h-4 w-4" strokeWidth={1.9} />
                Novo roteiro
              </button>
              <button
                type="button"
                aria-label="Opções de novo roteiro"
                className="grid h-11 w-11 place-items-center border-l border-white/15 bg-accent text-accent-fg transition duration-200 hover:bg-accent-hi"
              >
                <ChevronDown className="h-4 w-4" strokeWidth={1.9} />
              </button>
            </div>
          </div>
        </header>

        {(notice || error) && (
          <div
            className={`flex items-center gap-2 rounded-[10px] border px-4 py-3 text-[13px] ${
              error
                ? "border-danger/25 bg-danger-soft text-danger"
                : "border-accent/20 bg-accent-soft text-accent-hi"
            }`}
          >
            {error ? <XCircle className="h-4 w-4" /> : <Check className="h-4 w-4" />}
            {error || notice}
          </div>
        )}

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_330px] 2xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="min-w-0 space-y-5">
            <Card className="p-5 sm:p-6">
              <SectionHeader
                title="1. Descreva seu roteiro"
                description="Diga à IA o que você precisa e como o roteiro deve sair."
              />

              <div className="mt-7 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                <FieldShell label="Objetivo">
                  <SelectControl
                    ariaLabel="Objetivo"
                    value={objective}
                    onChange={setObjective}
                    options={["Informar", "Educar", "Vender", "Entreter"]}
                  />
                </FieldShell>
                <FieldShell label="Tema">
                  <input
                    value={topic}
                    onChange={(event) => setTopic(event.target.value)}
                    className="h-11 w-full rounded-[8px] border border-line bg-card-hi px-4 text-[13px] font-medium text-ink placeholder:text-ink-3 transition duration-200 hover:border-line-hi focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/15"
                    placeholder="Produtividade pessoal"
                  />
                </FieldShell>
                <FieldShell label="Público">
                  <SelectControl
                    ariaLabel="Público"
                    value={audience}
                    onChange={setAudience}
                    options={["Estudantes universitários", "Criadores de conteúdo", "Profissionais", "Empreendedores"]}
                  />
                </FieldShell>
                <FieldShell label="Duração aproximada">
                  <SelectControl
                    ariaLabel="Duração aproximada"
                    value={duration}
                    onChange={setDuration}
                    options={["1 - 3 minutos", "3 - 5 minutos", "5 - 8 minutos", "8 - 10 minutos"]}
                  />
                </FieldShell>
              </div>

              <div className="mt-6">
                <div className="mb-2 flex flex-col gap-1">
                  <label htmlFor="script-instructions" className="text-[12px] font-semibold text-ink">
                    Instruções
                  </label>
                  <p className="text-[12px] leading-5 text-ink-2">
                    Seja específico sobre foco, tom, estilo e pontos essenciais.
                  </p>
                </div>
                <textarea
                  id="script-instructions"
                  value={instructions}
                  onChange={(event) => setInstructions(event.target.value.slice(0, 2000))}
                  maxLength={2000}
                  rows={5}
                  className="min-h-[122px] w-full resize-y rounded-[9px] border border-line bg-card-hi px-4 py-4 text-[14px] leading-6 text-ink placeholder:text-ink-3 transition duration-200 hover:border-line-hi focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/15"
                  placeholder={INITIAL_INSTRUCTIONS}
                />
                <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <span className="text-[12px] text-ink-2">{instructions.length} / 2000</span>
                  <button
                    type="button"
                    onClick={handleGenerate}
                    disabled={loading || !instructions.trim()}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-[8px] bg-accent px-6 text-[13px] font-semibold text-accent-fg shadow-[0_10px_28px_rgba(208,111,167,0.16)] transition duration-200 hover:bg-accent-hi disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" strokeWidth={1.9} />}
                    {loading ? "Gerando..." : "Gerar roteiro"}
                  </button>
                </div>
              </div>
            </Card>

            <Card className="p-5 sm:p-6">
              <SectionHeader
                title="2. Resultado"
                description="Revise e edite o roteiro gerado. Você pode copiar ou salvar no projeto."
                actions={
                  <>
                    <SecondaryButton onClick={handleCopy} disabled={!result}>
                      <Copy className="h-4 w-4 text-ink-2" strokeWidth={1.8} />
                      Copiar
                    </SecondaryButton>
                    <SecondaryButton onClick={handleSave} disabled={!result}>
                      <Save className="h-4 w-4 text-ink-2" strokeWidth={1.8} />
                      Salvar
                    </SecondaryButton>
                  </>
                }
              />

              <div className="mt-5 rounded-[10px] border border-line bg-[#11131C]/70 p-4 sm:p-5">
                {result ? (
                  <div className="space-y-0">
                    {result.map((section, sectionIndex) => (
                      <article
                        key={`${section.title}-${section.time}`}
                        className={sectionIndex === 0 ? "pb-5" : "border-t border-line py-5 last:pb-0"}
                      >
                        <div className="mb-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                          <h3 className="text-[14px] font-bold text-accent">{section.title}</h3>
                          <span className="text-[12px] font-medium text-ink-3">({section.time})</span>
                        </div>
                        {section.body ? (
                          <p className="max-w-[78ch] text-[14px] leading-6 text-ink-2">{section.body}</p>
                        ) : null}
                        {section.items ? (
                          <ol className="mt-3 space-y-3 text-[14px] leading-6 text-ink-2">
                            {section.items.map((item, index) => (
                              <li key={item.title}>
                                <p className="font-semibold text-ink">
                                  {index + 1}. {item.title}
                                </p>
                                <p className="max-w-[78ch] text-ink-2">{item.body}</p>
                              </li>
                            ))}
                          </ol>
                        ) : null}
                      </article>
                    ))}
                    <div className="flex justify-center border-t border-line pt-5">
                      <button
                        type="button"
                        className="inline-flex h-10 items-center gap-2 rounded-[8px] border border-line bg-white/[0.025] px-5 text-[13px] font-semibold text-ink-2 transition duration-200 hover:border-line-hi hover:bg-hover hover:text-ink"
                      >
                        Mostrar mais
                        <ChevronDown className="h-4 w-4" strokeWidth={1.8} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex min-h-[260px] flex-col items-center justify-center text-center">
                    <div className="mb-4 grid h-12 w-12 place-items-center rounded-[10px] border border-line bg-card-hi">
                      <FileText className="h-5 w-5 text-accent" strokeWidth={1.7} />
                    </div>
                    <p className="text-[14px] font-semibold text-ink">Ainda não há resultado</p>
                    <p className="mt-2 max-w-[34ch] text-[13px] leading-5 text-ink-2">
                      Preencha as instruções e gere uma primeira versão para revisar aqui.
                    </p>
                  </div>
                )}
              </div>
            </Card>
          </div>

          <aside className="min-w-0 space-y-4">
            <SidebarCard
              title="Variáveis"
              action={
                <IconButton label="Adicionar variável" onClick={addCustomVariable}>
                  <Plus className="h-4 w-4" strokeWidth={1.8} />
                </IconButton>
              }
            >
              <p className="mb-4 text-[13px] leading-5 text-ink-2">Insira informações dinâmicas no roteiro.</p>
              <div className="space-y-3">
                {VARIABLES.map(([variable, description]) => (
                  <button
                    type="button"
                    key={variable}
                    onClick={() => insertVariable(variable)}
                    className="flex w-full items-center gap-3 rounded-[8px] text-left transition duration-200 hover:bg-hover"
                  >
                    <span className="shrink-0 rounded-[7px] border border-line bg-card-hi px-2.5 py-1 text-[12px] font-semibold text-ink-2">
                      {variable}
                    </span>
                    <span className="text-[12px] text-ink-2">{description}</span>
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => showNotice("Variáveis ativas: tema, público, tom e duração. As personalizadas entram como tokens.")}
                className="mt-5 inline-flex items-center gap-2 text-[13px] font-semibold text-accent transition hover:text-accent-hi"
              >
                Ver todas as variáveis
                <ChevronRight className="h-4 w-4" strokeWidth={1.8} />
              </button>
            </SidebarCard>

            <SidebarCard
              title="Voz de marca"
              action={
                <IconButton label="Editar voz da marca" onClick={() => setEditingBrandVoice((current) => !current)}>
                  <Edit3 className="h-4 w-4" strokeWidth={1.8} />
                </IconButton>
              }
            >
              {editingBrandVoice ? (
                <textarea
                  value={brandVoice}
                  onChange={(event) => setBrandVoice(event.target.value.slice(0, 800))}
                  rows={5}
                  className="w-full resize-y rounded-[9px] border border-line bg-card-hi px-3 py-3 text-[13px] leading-5 text-ink placeholder:text-ink-3 transition duration-200 focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/15"
                />
              ) : (
                <p className="text-[13px] leading-6 text-ink-2">{brandVoice}</p>
              )}
              <button
                type="button"
                onClick={() => {
                  if (editingBrandVoice) {
                    void saveBrandKit({ brandVoice, references })
                      .then(() => showNotice("Voz da marca salva"))
                      .catch((saveError) => setError(saveError instanceof Error ? saveError.message : "Não foi possível salvar."));
                  }
                  setEditingBrandVoice((current) => !current);
                }}
                className="mt-5 inline-flex items-center gap-2 text-[13px] font-semibold text-accent transition hover:text-accent-hi"
              >
                {editingBrandVoice ? "Fechar edição" : "Editar voz da marca"}
                <ChevronRight className="h-4 w-4" strokeWidth={1.8} />
              </button>
            </SidebarCard>

            <SidebarCard title="Referências">
              <p className="text-[13px] leading-5 text-ink-2">
                Arquivos, roteiros ou links que a IA deve considerar.
              </p>
              {references.length ? (
                <div className="mt-4 space-y-2">
                  {references.map((reference) => (
                    <div
                      key={reference.id}
                      className="flex items-start justify-between gap-3 rounded-[8px] border border-line bg-card-hi px-3 py-2"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-[12px] font-semibold text-ink">{reference.title}</span>
                        <span className="mt-1 line-clamp-2 block text-[11px] leading-4 text-ink-3">{reference.content}</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => removeReference(reference.id)}
                        className="shrink-0 text-[11px] font-semibold text-ink-3 transition hover:text-danger"
                      >
                        Remover
                      </button>
                    </div>
                  ))}
                </div>
              ) : null}
              <button
                type="button"
                onClick={addReference}
                className="mt-4 inline-flex h-10 items-center gap-2 rounded-[8px] border border-line bg-white/[0.025] px-4 text-[13px] font-semibold text-ink-2 transition duration-200 hover:border-line-hi hover:bg-hover hover:text-ink"
              >
                <Plus className="h-4 w-4" strokeWidth={1.8} />
                Adicionar referência
              </button>
            </SidebarCard>

            <SidebarCard title="Histórico de versões">
              <div className="space-y-1">
                {VERSIONS.map(([version, time]) => (
                  <button
                    type="button"
                    key={version}
                    className="flex w-full items-center justify-between gap-3 rounded-[8px] py-2 text-left transition duration-200 hover:bg-hover"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-[13px] font-semibold text-ink">{version}</span>
                      <span className="mt-1 block text-[12px] text-ink-3">{time}</span>
                    </span>
                    <MoreHorizontal className="h-4 w-4 shrink-0 text-ink-3" strokeWidth={1.8} />
                  </button>
                ))}
              </div>
              <button type="button" className="mt-4 inline-flex items-center gap-2 text-[13px] font-semibold text-accent transition hover:text-accent-hi">
                Ver todas as versões
                <ChevronRight className="h-4 w-4" strokeWidth={1.8} />
              </button>
            </SidebarCard>
          </aside>
        </div>
      </div>
    </main>
  );
}

"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  CheckCircle2,
  ChevronDown,
  Eye,
  EyeOff,
  Globe2,
  Image as ImageIcon,
  KeyRound,
  Languages,
  Loader2,
  Lock,
  Palette,
  RefreshCw,
  Save,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Terminal,
  Type,
  Wifi,
  XCircle,
} from "lucide-react";
import type { ActiveProviderCapability, ProviderCapability, ProviderManifest, ProviderStoredConfig } from "@/lib/providers/types";

type CatalogModel = {
  id: string;
  label: string;
  capability: ProviderCapability;
  source: "default" | "configured" | "manifest" | "discovered" | "cached";
  isDefault: boolean;
  isConfigured: boolean;
};

type SafeProviderConfig = Omit<ProviderStoredConfig, "apiKey"> & {
  apiKey: string;
  hasApiKey?: boolean;
  apiKeyTail?: string;
};

type AgentInfo = {
  id: string;
  name: string;
  available: boolean;
  version?: string;
  path?: string;
  pathSource?: "configured" | "env" | "path" | "well_known" | "fallback";
  fallbackModels: string[];
  models?: Array<{ id: string; label: string }>;
  reasoningOptions?: Array<{ id: string; label: string }>;
  permissionMode: string;
  promptViaStdin: boolean;
  commandPreview: string[];
  installUrl?: string;
  docsUrl?: string;
};

interface AppSettings {
  providers: Record<string, SafeProviderConfig>;
  defaults: Record<ActiveProviderCapability, { providerId: string; model: string }>;
  executionMode: "cli" | "byok";
  agentId: string | null;
  agentModels: Record<string, { model?: string; reasoning?: string }>;
  agentCliEnv: Record<string, Record<string, string>>;
  demoMode: boolean;
  debugMode: boolean;
  exportDirectory: string;
  language: "en" | "pt" | "es";
  updatedAt: string;
}

interface ProviderResponseItem extends ProviderManifest {
  enabled: boolean;
  hasApiKey: boolean;
  configuredModels: Partial<Record<ProviderCapability, string>>;
  modelsByCapability?: Partial<Record<ProviderCapability, CatalogModel[]>>;
  integrationStatus?: "integrated" | "unsupported" | "hidden";
  active?: boolean;
  configured?: boolean;
}

type TestResult = { ok: boolean; models: string[]; modelsDetailed?: CatalogModel[]; error?: string; source?: string; stale?: boolean };
type SectionId = "execution" | "language" | "appearance";
type ByokTabId = "anthropic" | "openai" | "azure" | "gemini" | "local";

const LOCAL_SETTINGS_KEY = "open-studio.provider-secrets.v1";
const DEFAULT_MODEL = "default";

const fieldBase =
  "h-11 w-full rounded-[10px] border border-line bg-card-hi px-3 text-[13px] text-ink outline-none transition focus:border-accent/50 focus:ring-2 focus:ring-accent/10 disabled:cursor-not-allowed disabled:opacity-55";

const capabilityCards: Array<{ id: ActiveProviderCapability; title: string; icon: typeof Type }> = [
  { id: "text", title: "Texto", icon: Type },
  { id: "image", title: "Imagem", icon: ImageIcon },
];

const sectionItems: Array<{ id: SectionId; title: string; subtitle: string; icon: typeof SlidersHorizontal }> = [
  { id: "execution", title: "Modo de execução", subtitle: "CLI local / BYOK", icon: SlidersHorizontal },
  { id: "language", title: "Idioma", subtitle: "Salvo neste navegador", icon: Languages },
  { id: "appearance", title: "Aparência", subtitle: "Tema e superfície", icon: Palette },
];

const byokTabs: Array<{ id: ByokTabId; title: string; providerIds: string[] }> = [
  { id: "anthropic", title: "Anthropic", providerIds: ["anthropic"] },
  { id: "openai", title: "OpenAI", providerIds: ["openai", "openai-compatible", "openrouter", "groq", "together", "deepseek", "minimax"] },
  { id: "azure", title: "Azure OpenAI", providerIds: ["azure-openai"] },
  { id: "gemini", title: "Google Gemini", providerIds: ["gemini"] },
  { id: "local", title: "Local first", providerIds: ["ollama", "lm-studio", "vllm", "local-openai"] },
];

const agentEnvFields = [
  { agentId: "claude", envKey: "CLAUDE_BIN", label: "Claude Code bin", placeholder: "claude" },
  { agentId: "codex", envKey: "CODEX_BIN", label: "Codex CLI bin", placeholder: "codex" },
  { agentId: "gemini", envKey: "GEMINI_BIN", label: "Gemini CLI bin", placeholder: "gemini" },
  { agentId: "opencode", envKey: "OPENCODE_BIN", label: "OpenCode bin", placeholder: "opencode-cli" },
];

const agentPathSourceLabels: Record<NonNullable<AgentInfo["pathSource"]>, string> = {
  configured: "caminho customizado",
  env: "env do processo",
  path: "PATH",
  well_known: "toolchain local",
  fallback: "fallback",
};

const emptySettings = (): AppSettings => ({
  providers: {},
  defaults: {
    text: { providerId: "minimax", model: "MiniMax-M2.7" },
    image: { providerId: "minimax", model: "image-01" },
  },
  executionMode: "byok",
  agentId: null,
  agentModels: {},
  agentCliEnv: {},
  demoMode: false,
  debugMode: false,
  exportDirectory: "",
  language: "pt",
  updatedAt: "",
});

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function keyTail(value: string) {
  return value.length > 4 ? value.slice(-4) : value;
}

function readLocalRecord<T>(key: string): Record<string, Partial<T>> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeProviderSecrets(providers: AppSettings["providers"]) {
  if (typeof window === "undefined") return;
  const current = readLocalRecord<SafeProviderConfig>(LOCAL_SETTINGS_KEY);
  const next: Record<string, Partial<SafeProviderConfig>> = { ...current };

  for (const [providerId, config] of Object.entries(providers)) {
    next[providerId] = {
      ...next[providerId],
      enabled: config.enabled,
      baseUrl: config.baseUrl,
      models: config.models,
      extra: config.extra,
      apiKey: config.apiKey?.trim() || next[providerId]?.apiKey || "",
    };
    if (next[providerId].apiKey) next[providerId].apiKeyTail = keyTail(String(next[providerId].apiKey));
  }

  window.localStorage.setItem(LOCAL_SETTINGS_KEY, JSON.stringify(next));
}

function providerNeedsKey(provider: Pick<ProviderResponseItem, "authHeader"> | undefined) {
  return provider?.authHeader !== "none";
}

function hasProviderKey(config: SafeProviderConfig | undefined) {
  return Boolean(config?.hasApiKey) || Boolean(config?.apiKey?.trim());
}

function getModelOptions(provider: ProviderResponseItem | undefined, capability: ProviderCapability, current?: string) {
  const configured = provider?.configuredModels?.[capability];
  const fallback = provider?.defaultModels?.[capability] ?? "";
  const catalog = provider?.modelsByCapability?.[capability]?.map((model) => model.id) ?? [];
  const options = provider?.modelOptions?.[capability] ?? [];
  return Array.from(new Set([current, configured, ...catalog, ...options, fallback].filter((value): value is string => Boolean(value))));
}

function providerConfigFor(provider: ProviderResponseItem, settings: AppSettings): SafeProviderConfig {
  return (
    settings.providers[provider.id] ?? {
      enabled: false,
      apiKey: "",
      baseUrl: provider.defaultBaseUrl,
      models: { ...provider.defaultModels },
      customHeaders: {},
      extra: { ...provider.extraDefaults },
    }
  );
}

function primaryCapability(provider: ProviderResponseItem | undefined): ActiveProviderCapability {
  return provider?.capabilities.includes("text") ? "text" : "image";
}

function SelectField({
  value,
  onChange,
  children,
  disabled,
}: {
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
  disabled?: boolean;
}) {
  return (
    <div className="relative">
      <select value={value} onChange={(event) => onChange(event.target.value)} disabled={disabled} className={cx(fieldBase, "appearance-none pr-9")}>
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-3" />
    </div>
  );
}

function Toggle({ enabled, onClick, label }: { enabled: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={enabled}
      onClick={onClick}
      className={cx(
        "relative h-7 w-12 shrink-0 rounded-full border transition duration-200",
        enabled ? "border-accent/30 bg-accent" : "border-line bg-line-hi",
      )}
    >
      <span className={cx("absolute top-1 h-5 w-5 rounded-full bg-ink shadow-sm transition-all duration-200", enabled ? "left-6" : "left-1")} />
    </button>
  );
}

function PlaceholderSection({ title, body }: { title: string; body: string }) {
  return (
    <section className="rounded-[16px] border border-line bg-card p-6 shadow-[0_18px_48px_rgba(0,0,0,0.16)]">
      <h2 className="text-[18px] font-semibold text-ink">{title}</h2>
      <p className="mt-2 max-w-3xl text-[13px] leading-relaxed text-ink-2">{body}</p>
    </section>
  );
}

function DefaultCard({
  capability,
  settings,
  providers,
  onDefaultChange,
}: {
  capability: (typeof capabilityCards)[number];
  settings: AppSettings;
  providers: ProviderResponseItem[];
  onDefaultChange: (capability: ActiveProviderCapability, providerId: string, model?: string) => void;
}) {
  const Icon = capability.icon;
  const selected = settings.defaults[capability.id];
  const eligibleProviders = providers.filter((provider) => provider.capabilities.includes(capability.id));
  const selectedProvider = providers.find((provider) => provider.id === selected.providerId) ?? eligibleProviders[0];
  const selectedConfig = selectedProvider ? providerConfigFor(selectedProvider, settings) : undefined;
  const ready = Boolean(selectedProvider && selectedConfig?.enabled && (!providerNeedsKey(selectedProvider) || hasProviderKey(selectedConfig)));
  const models = getModelOptions(selectedProvider, capability.id, selected.model);

  return (
    <section className="rounded-[12px] border border-line bg-card-hi p-4">
      <div className="mb-4 flex items-center gap-3">
        <span className="grid h-9 w-9 place-items-center rounded-[9px] border border-line bg-white/[0.025] text-accent">
          <Icon className="h-4 w-4" strokeWidth={1.7} />
        </span>
        <div>
          <h3 className="text-[16px] font-semibold text-ink">{capability.title}</h3>
          <p className="mt-0.5 text-[11px] text-ink-3">{ready ? "Pronto para gerar" : "Aguardando chave ou ativação"}</p>
        </div>
      </div>
      <div className="space-y-3">
        <label className="block">
          <span className="mb-1.5 block text-[11px] font-medium text-ink-2">Provedor padrão</span>
          <SelectField value={selected.providerId} onChange={(providerId) => onDefaultChange(capability.id, providerId)}>
            {eligibleProviders.map((provider) => (
              <option key={provider.id} value={provider.id}>
                {provider.name}
              </option>
            ))}
          </SelectField>
        </label>
        <label className="block">
          <span className="mb-1.5 block text-[11px] font-medium text-ink-2">Modelo</span>
          {models.length ? (
            <SelectField value={selected.model} onChange={(model) => onDefaultChange(capability.id, selected.providerId, model)}>
              {models.map((model) => (
                <option key={model} value={model}>
                  {model}
                </option>
              ))}
            </SelectField>
          ) : (
            <input className={fieldBase} value="Configure um modelo" disabled readOnly />
          )}
        </label>
      </div>
    </section>
  );
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<AppSettings>(() => emptySettings());
  const [providers, setProviders] = useState<ProviderResponseItem[]>([]);
  const [agents, setAgents] = useState<AgentInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [agentLoading, setAgentLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [activeSection, setActiveSection] = useState<SectionId>("execution");
  const [activeByokTab, setActiveByokTab] = useState<ByokTabId>("anthropic");
  const [selectedByokProviderId, setSelectedByokProviderId] = useState("anthropic");
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [testing, setTesting] = useState<Record<string, boolean>>({});
  const [agentTest, setAgentTest] = useState<{ ok: boolean; message: string } | null>(null);
  const [agentScanNotice, setAgentScanNotice] = useState<string>("");
  const [testResults, setTestResults] = useState<Record<string, TestResult>>({});

  const providerMap = useMemo(() => new Map(providers.map((provider) => [provider.id, provider])), [providers]);
  const installedCount = agents.filter((agent) => agent.available).length;
  const activeTab = byokTabs.find((tab) => tab.id === activeByokTab) ?? byokTabs[0];
  const byokProviders = providers.filter((provider) => activeTab.providerIds.includes(provider.id));
  const selectedByokProvider = byokProviders.find((provider) => provider.id === selectedByokProviderId) ?? byokProviders[0];
  const selectedByokConfig = selectedByokProvider ? providerConfigFor(selectedByokProvider, settings) : undefined;
  const selectedAgent = agents.find((agent) => agent.id === settings.agentId) ?? agents.find((agent) => agent.available) ?? agents[0];
  const selectedAgentChoice = selectedAgent ? settings.agentModels[selectedAgent.id] ?? {} : {};

  async function loadAgents(options: { rescan?: boolean; showNotice?: boolean } = {}) {
    setAgentLoading(true);
    if (options.showNotice) setAgentScanNotice("");
    try {
      const res = await fetch(options.rescan ? "/api/agents?rescan=1" : "/api/agents");
      const data = await res.json();
      if (data.ok) {
        const nextAgents = data.agents as AgentInfo[];
        setAgents(nextAgents);
        setSettings((current) => {
          const currentAgent = current.agentId ? nextAgents.find((agent) => agent.id === current.agentId) : undefined;
          if (currentAgent?.available) return current;
          const firstAvailable = nextAgents.find((agent) => agent.available);
          return firstAvailable ? { ...current, agentId: firstAvailable.id } : current;
        });
        if (options.showNotice) {
          const count = nextAgents.filter((agent) => agent.available).length;
          setAgentScanNotice(`Escaneamento concluído. ${count} ${count === 1 ? "disponível" : "disponíveis"}.`);
        }
      }
    } catch {
      if (options.showNotice) setAgentScanNotice("Não consegui reescanear as CLIs locais.");
    } finally {
      setAgentLoading(false);
    }
  }

  async function loadData() {
    try {
      const [settingsRes, providersRes] = await Promise.all([
        fetch("/api/settings"),
        fetch("/api/providers"),
      ]);
      const [settingsData, providersData] = await Promise.all([settingsRes.json(), providersRes.json()]);

      if (providersData.ok) setProviders(providersData.providers);
      if (settingsData.ok) {
        const nextSettings = settingsData.settings as AppSettings;
        const localProviderSecrets = readLocalRecord<SafeProviderConfig>(LOCAL_SETTINGS_KEY);
        const providersWithKeys = Object.fromEntries(
          Object.entries(nextSettings.providers).map(([providerId, config]) => {
            const local = localProviderSecrets[providerId] ?? {};
            const localKey = typeof local.apiKey === "string" ? local.apiKey : "";
            return [
              providerId,
              {
                ...config,
                ...local,
                models: { ...config.models, ...local.models },
                extra: { ...config.extra, ...local.extra },
                apiKey: localKey,
                hasApiKey: Boolean(localKey) || Boolean(config.hasApiKey),
                apiKeyTail: localKey ? keyTail(localKey) : local.apiKeyTail,
              },
            ];
          }),
        );
        setSettings({ ...emptySettings(), ...nextSettings, providers: providersWithKeys });
      }
      await loadAgents();
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
    // Settings loads its initial daemon/config snapshot on mount. Mutations call loadData explicitly after save.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function updateProvider(providerId: string, partial: Partial<SafeProviderConfig>) {
    setStatus("");
    const provider = providerMap.get(providerId);
    setSettings((current) => {
      const previous = provider ? providerConfigFor(provider, current) : current.providers[providerId];
      return {
        ...current,
        providers: {
          ...current.providers,
          [providerId]: {
            ...previous,
            ...partial,
            models: { ...previous?.models, ...partial.models },
            extra: { ...previous?.extra, ...partial.extra },
          },
        },
      };
    });
  }

  function mergeProviderModels(providerId: string, capability: ActiveProviderCapability, models: string[], detailed?: CatalogModel[]) {
    if (!models.length && !detailed?.length) return;
    setProviders((current) =>
      current.map((provider) => {
        if (provider.id !== providerId) return provider;
        const currentModels = provider.modelsByCapability?.[capability] ?? [];
        const incoming =
          detailed?.length
            ? detailed
            : models.map((model) => ({
                id: model,
                label: model,
                capability,
                source: "discovered" as const,
                isDefault: model === provider.defaultModels[capability],
                isConfigured: model === settings.providers[providerId]?.models?.[capability],
              }));
        const merged = new Map<string, CatalogModel>();
        for (const model of [...currentModels, ...incoming]) merged.set(model.id, model);
        return {
          ...provider,
          modelOptions: {
            ...provider.modelOptions,
            [capability]: Array.from(merged.keys()),
          },
          modelsByCapability: {
            ...provider.modelsByCapability,
            [capability]: Array.from(merged.values()),
          },
        };
      })
    );
  }

  async function saveSettingsPatch(partial: Partial<AppSettings>, successMessage: string) {
    setSaving(true);
    setStatus("");
    try {
      writeProviderSecrets(settings.providers);
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(partial),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Failed to save settings");
      setStatus(successMessage);
      setTimeout(() => setStatus(""), 2200);
      return true;
    } catch {
      setStatus("Não consegui salvar a seleção. Revise as configurações e tente de novo.");
      return false;
    } finally {
      setSaving(false);
    }
  }

  function updateDefault(capability: ActiveProviderCapability, providerId: string, model?: string) {
    setStatus("");
    const manifest = providerMap.get(providerId);
    const configuredModel =
      model ??
      settings.providers[providerId]?.models?.[capability] ??
      manifest?.defaultModels[capability] ??
      "";
    const defaults = {
      ...settings.defaults,
      [capability]: { providerId, model: configuredModel },
    };
    const providerConfig = settings.providers[providerId];

    setSettings((current) => ({
      ...current,
      defaults,
    }));
    void saveSettingsPatch(
      {
        defaults,
        providers: providerConfig ? { [providerId]: providerConfig } as AppSettings["providers"] : undefined,
      },
      "Padrões de geração salvos."
    );
  }

  function selectExecutionMode(executionMode: AppSettings["executionMode"]) {
    setSettings((current) => ({ ...current, executionMode }));
    void saveSettingsPatch({ executionMode }, "Modo de execução salvo.");
  }

  function selectAgent(agentId: string) {
    setSettings((current) => ({ ...current, agentId }));
    void saveSettingsPatch({ agentId }, "CLI local salva.");
  }

  function updateAgentChoice(agentId: string, partial: { model?: string; reasoning?: string }) {
    setStatus("");
    const agentModels = {
      ...settings.agentModels,
      [agentId]: { ...settings.agentModels[agentId], ...partial },
    };
    setSettings((current) => ({
      ...current,
      agentModels,
    }));
    void saveSettingsPatch({ agentModels }, "Configuração do agente salva.");
  }

  function updateAgentEnv(agentId: string, envKey: string, value: string) {
    setStatus("");
    setSettings((current) => {
      const trimmed = value.trim();
      const agentEnv = { ...(current.agentCliEnv[agentId] ?? {}) };
      if (trimmed) {
        agentEnv[envKey] = trimmed;
      } else {
        delete agentEnv[envKey];
      }
      const agentCliEnv = { ...current.agentCliEnv };
      if (Object.keys(agentEnv).length > 0) {
        agentCliEnv[agentId] = agentEnv;
      } else {
        delete agentCliEnv[agentId];
      }
      return { ...current, agentCliEnv };
    });
  }

  async function handleSave(message = true) {
    setSaving(true);
    setStatus("");
    try {
      writeProviderSecrets(settings.providers);
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Failed to save settings");
      if (message) setStatus("Configurações salvas localmente.");
      await loadData();
      return true;
    } catch {
      setStatus("Não consegui salvar. Revise URL base, modelo e campos obrigatórios.");
      return false;
    } finally {
      setSaving(false);
      if (message) setTimeout(() => setStatus(""), 3500);
    }
  }

  async function testProvider(providerId: string) {
    const provider = providerMap.get(providerId);
    const providerConfig = provider ? providerConfigFor(provider, settings) : undefined;
    if (providerNeedsKey(provider) && !hasProviderKey(providerConfig)) {
      setTestResults((current) => ({
        ...current,
        [providerId]: { ok: false, models: [], error: "Cole uma chave de API antes de testar este provedor." },
      }));
      return;
    }

    setTesting((current) => ({ ...current, [providerId]: true }));
    try {
      const res = await fetch("/api/test/connection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          providerId,
          capability: provider?.capabilities.includes("text") ? "text" : "image",
          apiKey: providerConfig?.apiKey,
          baseUrl: providerConfig?.baseUrl,
          models: providerConfig?.models,
          extra: providerConfig?.extra,
          customHeaders: providerConfig?.customHeaders,
        }),
      });
      const data = await res.json();
      setTestResults((current) => ({ ...current, [providerId]: data }));
      if (Array.isArray(data.models) && data.models.length && provider) {
        const capability = primaryCapability(provider);
        mergeProviderModels(providerId, capability, data.models, data.modelsDetailed);
      }
    } catch {
      setTestResults((current) => ({
        ...current,
        [providerId]: { ok: false, models: [], error: "Falha de rede ao testar o provedor." },
      }));
    } finally {
      setTesting((current) => ({ ...current, [providerId]: false }));
    }
  }

  async function fetchProviderModels(providerId: string) {
    const provider = providerMap.get(providerId);
    const providerConfig = provider ? providerConfigFor(provider, settings) : undefined;
    setTesting((current) => ({ ...current, [`models:${providerId}`]: true }));
    try {
      const res = await fetch("/api/provider/models", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          providerId,
          capability: provider?.capabilities.includes("text") ? "text" : "image",
          apiKey: providerConfig?.apiKey,
          baseUrl: providerConfig?.baseUrl,
          models: providerConfig?.models,
          extra: providerConfig?.extra,
          customHeaders: providerConfig?.customHeaders,
        }),
      });
      const data = await res.json();
      setTestResults((current) => ({
        ...current,
        [providerId]: data.ok
          ? { ok: true, models: data.models ?? [], modelsDetailed: data.modelsDetailed, source: data.source, stale: data.stale }
          : { ok: false, models: [], error: data.error || "Não consegui buscar modelos." },
      }));
      if (provider && Array.isArray(data.models) && data.models.length) {
        const capability = primaryCapability(provider);
        mergeProviderModels(providerId, capability, data.models, data.modelsDetailed);
      }
    } catch {
      setTestResults((current) => ({
        ...current,
        [providerId]: { ok: false, models: [], error: "Falha de rede ao buscar modelos." },
      }));
    } finally {
      setTesting((current) => ({ ...current, [`models:${providerId}`]: false }));
    }
  }

  async function testSelectedAgent() {
    if (!selectedAgent) return;
    setAgentTest(null);
    setTesting((current) => ({ ...current, [`agent:${selectedAgent.id}`]: true }));
    try {
      const res = await fetch("/api/agents/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentId: selectedAgent.id,
          model: selectedAgentChoice.model,
          reasoning: selectedAgentChoice.reasoning,
          agentCliEnv: settings.agentCliEnv,
        }),
      });
      const data = await res.json();
      const fallbackError =
        data.kind === "agent_not_installed"
          ? `${selectedAgent.name} não foi encontrado no PATH nem nos diretórios locais de toolchain.`
          : data.kind === "timeout"
            ? `${selectedAgent.name} demorou demais no teste.`
            : data.kind === "not_found_model"
              ? `Modelo não encontrado para ${selectedAgent.name}.`
              : data.error || `${selectedAgent.name} não conectou.`;
      setAgentTest({
        ok: Boolean(data.ok),
        message: data.ok ? `${selectedAgent.name} conectado.` : fallbackError,
      });
    } catch {
      setAgentTest({ ok: false, message: "Falha ao chamar o daemon de agentes." });
    } finally {
      setTesting((current) => ({ ...current, [`agent:${selectedAgent.id}`]: false }));
    }
  }

  function renderExecutionSection() {
    const provider = selectedByokProvider;
    const config = selectedByokConfig;
    const modelCapability = primaryCapability(provider);
    const models = provider ? getModelOptions(provider, modelCapability, config?.models?.[modelCapability]) : [];
    const testResult = provider ? testResults[provider.id] : undefined;

    return (
      <div className="space-y-5">
        <div className="grid grid-cols-1 gap-3 rounded-[16px] border border-line bg-card p-2 sm:grid-cols-2">
          <button
            type="button"
            aria-pressed={settings.executionMode === "cli"}
            onClick={() => selectExecutionMode("cli")}
            className={cx(
              "rounded-[12px] border px-5 py-4 text-left transition",
              settings.executionMode === "cli" ? "border-accent/45 bg-accent/[0.08] text-ink" : "border-transparent bg-card-hi text-ink-2 hover:border-line-hi",
            )}
          >
            <span className="block text-[15px] font-semibold">CLI local</span>
            <span className="mt-1 block text-[12px] text-ink-3">
              {installedCount} {installedCount === 1 ? "instalada" : "instaladas"}
            </span>
          </button>
          <button
            type="button"
            aria-pressed={settings.executionMode === "byok"}
            onClick={() => selectExecutionMode("byok")}
            className={cx(
              "rounded-[12px] border px-5 py-4 text-left transition",
              settings.executionMode === "byok" ? "border-accent/45 bg-accent/[0.08] text-ink" : "border-transparent bg-card-hi text-ink-2 hover:border-line-hi",
            )}
          >
            <span className="block text-[15px] font-semibold">BYOK</span>
            <span className="mt-1 block text-[12px] text-ink-3">Provedor de API</span>
          </button>
        </div>

        {settings.executionMode === "cli" ? (
          <section className="rounded-[16px] border border-line bg-card p-5 shadow-[0_18px_48px_rgba(0,0,0,0.16)]">
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-[18px] font-semibold text-ink">CLI local</h2>
                <p className="mt-1 max-w-3xl text-[13px] leading-relaxed text-ink-2">
                  Detectado no PATH e nos diretórios locais de toolchain. Escolha a CLI por onde as gerações agentic devem passar.
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => void testSelectedAgent()}
                  disabled={!selectedAgent || Boolean(testing[`agent:${selectedAgent?.id}`])}
                  className="inline-flex h-10 items-center gap-2 rounded-[10px] border border-line bg-white/[0.025] px-4 text-[13px] font-medium text-ink-2 transition hover:bg-hover hover:text-ink disabled:opacity-50"
                >
                  {testing[`agent:${selectedAgent?.id}`] ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wifi className="h-4 w-4" />}
                  Testar
                </button>
                <button
                  type="button"
                  onClick={() => void loadAgents({ rescan: true, showNotice: true })}
                  disabled={agentLoading}
                  className="inline-flex h-10 items-center gap-2 rounded-[10px] border border-line bg-white/[0.025] px-4 text-[13px] font-medium text-ink-2 transition hover:bg-hover hover:text-ink disabled:opacity-50"
                >
                  {agentLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                  Reescanear
                </button>
              </div>
            </div>

            {agentTest ? (
              <div className={cx("mb-4 rounded-[10px] border px-3 py-2 text-[12px]", agentTest.ok ? "border-ok/20 bg-ok-soft text-ok" : "border-danger/20 bg-danger-soft text-danger")}>
                {agentTest.message}
              </div>
            ) : null}

            {agentScanNotice ? (
              <div className="mb-4 rounded-[10px] border border-ok/20 bg-ok-soft px-3 py-2 text-[12px] text-ok">{agentScanNotice}</div>
            ) : null}

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {agents.map((agent) => {
                const active = settings.agentId === agent.id;
                return (
                  <button
                    key={agent.id}
                    type="button"
                    aria-pressed={active}
                    onClick={() => selectAgent(agent.id)}
                    className={cx(
                      "flex min-h-[62px] items-center gap-3 rounded-[10px] border p-3 text-left transition",
                      active ? "border-accent/55 bg-accent/[0.07]" : "border-line bg-card-hi hover:border-line-hi",
                      !agent.available && "opacity-55",
                    )}
                  >
                    <span className={cx("grid h-10 w-10 shrink-0 place-items-center rounded-[10px] border", active ? "border-accent/20 bg-accent/15 text-accent" : "border-line bg-white/[0.025] text-ink-3")}>
                      <Terminal className="h-5 w-5" strokeWidth={1.7} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-semibold text-ink">{agent.name}</span>
                      <span className="mt-0.5 block truncate text-[11px] text-ink-3">
                        {agent.available
                          ? `detectado${agent.pathSource ? ` via ${agentPathSourceLabels[agent.pathSource]}` : ""}`
                          : "não encontrado"}
                      </span>
                      {agent.available && agent.version ? <span className="mt-0.5 block truncate text-[10px] text-ink-3">{agent.version}</span> : null}
                    </span>
                    <span className={cx("h-2 w-2 rounded-full", active ? "bg-accent" : agent.available ? "bg-ink-3" : "bg-line-hi")} />
                  </button>
                );
              })}
            </div>

            {selectedAgent ? (
              <div className="mt-5 grid grid-cols-1 gap-4 rounded-[12px] border border-line bg-white/[0.02] p-4 lg:grid-cols-2">
                <label className="block">
                  <span className="mb-1.5 block text-[12px] font-medium text-ink-2">Modelo do agente</span>
                  <SelectField value={selectedAgentChoice.model ?? DEFAULT_MODEL} onChange={(model) => updateAgentChoice(selectedAgent.id, { model })}>
                    {(selectedAgent.models ?? selectedAgent.fallbackModels.map((id) => ({ id, label: id }))).map((model) => (
                      <option key={model.id} value={model.id}>
                        {model.label}
                      </option>
                    ))}
                  </SelectField>
                </label>
                {selectedAgent.reasoningOptions?.length ? (
                  <label className="block">
                    <span className="mb-1.5 block text-[12px] font-medium text-ink-2">Raciocínio</span>
                    <SelectField value={selectedAgentChoice.reasoning ?? DEFAULT_MODEL} onChange={(reasoning) => updateAgentChoice(selectedAgent.id, { reasoning })}>
                      {selectedAgent.reasoningOptions.map((option) => (
                        <option key={option.id} value={option.id}>
                          {option.label}
                        </option>
                      ))}
                    </SelectField>
                  </label>
                ) : null}
                <div className="lg:col-span-2">
                  <p className="text-[12px] leading-relaxed text-ink-3">
                    Permissões locais seguem o padrão power local: workspace-write, network quando suportado, bypass/dangerous/accept hooks em CLIs compatíveis. Prompts longos vão por stdin quando a CLI permite.
                  </p>
                  {!selectedAgent.available && (selectedAgent.installUrl || selectedAgent.docsUrl) ? (
                    <a
                      href={selectedAgent.installUrl ?? selectedAgent.docsUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 inline-flex text-[12px] font-semibold text-accent hover:text-accent-hi"
                    >
                      Abrir instruções de instalação
                    </a>
                  ) : null}
                </div>
              </div>
            ) : null}

            <div className="mt-5 rounded-[12px] border border-line bg-white/[0.02] p-4">
              <h3 className="text-[14px] font-semibold text-ink">Executáveis customizados</h3>
              <p className="mt-1 text-[12px] text-ink-3">Use quando a CLI não aparece no scan automático ou usa um wrapper específico.</p>
              <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                {agentEnvFields.map((field) => (
                  <label key={`${field.agentId}-${field.envKey}`} className="block">
                    <span className="mb-1.5 block text-[11px] font-medium text-ink-2">{field.label}</span>
                    <input
                      value={settings.agentCliEnv[field.agentId]?.[field.envKey] ?? ""}
                      onChange={(event) => updateAgentEnv(field.agentId, field.envKey, event.target.value)}
                      placeholder={field.placeholder}
                      className={fieldBase}
                    />
                  </label>
                ))}
              </div>
            </div>
          </section>
        ) : (
          <section className="rounded-[16px] border border-line bg-card p-5 shadow-[0_18px_48px_rgba(0,0,0,0.16)]">
            <div className="mb-5 flex flex-wrap gap-2" role="tablist" aria-label="Protocolos BYOK">
              {byokTabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={activeByokTab === tab.id}
                  onClick={() => {
                    setActiveByokTab(tab.id);
                    setSelectedByokProviderId(tab.providerIds[0]);
                  }}
                  className={cx(
                    "rounded-full border px-4 py-2 text-[13px] font-semibold transition",
                    activeByokTab === tab.id ? "border-accent/60 bg-accent/[0.08] text-ink" : "border-line bg-card-hi text-ink-3 hover:border-line-hi hover:text-ink",
                  )}
                >
                  {tab.title}
                </button>
              ))}
            </div>

            {provider && config ? (
              <div className="space-y-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="text-[18px] font-semibold text-ink">{provider.name} API</h2>
                    <p className="mt-1 max-w-3xl text-[13px] leading-relaxed text-ink-2">
                      As chamadas passam pelo proxy do daemon local até a Base URL definida. A chave fica neste navegador e é enviada apenas ao provedor escolhido.
                    </p>
                  </div>
                  <Toggle enabled={Boolean(config.enabled)} onClick={() => updateProvider(provider.id, { enabled: !config.enabled })} label={`Ativar ${provider.name}`} />
                </div>

                <label className="block">
                  <span className="mb-1.5 block text-[12px] font-medium text-ink-2">Preencher provedor</span>
                  <SelectField value={provider.id} onChange={(providerId) => setSelectedByokProviderId(providerId)}>
                    {byokProviders.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </SelectField>
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-[12px] font-medium text-ink-2">Chave de API</span>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-3" />
                    <input
                      type={showKeys[provider.id] ? "text" : "password"}
                      value={config.apiKey ?? ""}
                      onChange={(event) => updateProvider(provider.id, { apiKey: event.target.value })}
                      placeholder={hasProviderKey(config) ? `salva localmente${config.apiKeyTail ? ` ...${config.apiKeyTail}` : ""}` : "Cole a API key"}
                      className={cx(fieldBase, "pl-10 pr-28")}
                      autoComplete="off"
                    />
                    <button
                      type="button"
                      onClick={() => setShowKeys((current) => ({ ...current, [provider.id]: !current[provider.id] }))}
                      className="absolute right-2 top-1/2 inline-flex h-8 -translate-y-1/2 items-center gap-1 rounded-[8px] border border-line px-3 text-[12px] text-ink-2 transition hover:bg-hover hover:text-ink"
                    >
                      {showKeys[provider.id] ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      {showKeys[provider.id] ? "Ocultar" : "Mostrar"}
                    </button>
                  </div>
                </label>

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  <label className="block">
                    <span className="mb-1.5 block text-[12px] font-medium text-ink-2">{provider.id === "azure-openai" ? "Nome do deployment" : "Modelo"}</span>
                    <SelectField value={config.models?.[modelCapability] ?? provider.defaultModels[modelCapability] ?? ""} onChange={(model) => updateProvider(provider.id, { models: { [modelCapability]: model } })}>
                      {models.map((model) => (
                        <option key={model} value={model}>
                          {model}
                        </option>
                      ))}
                      <option value="custom">Personalizado (digite abaixo)</option>
                    </SelectField>
                  </label>
                  <label className="block">
                    <span className="mb-1.5 block text-[12px] font-medium text-ink-2">URL base</span>
                    <div className="relative">
                      <Globe2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-3" />
                      <input value={config.baseUrl ?? provider.defaultBaseUrl} onChange={(event) => updateProvider(provider.id, { baseUrl: event.target.value })} className={cx(fieldBase, "pl-10")} />
                    </div>
                  </label>
                </div>

                <label className="block">
                  <span className="mb-1.5 block text-[12px] font-medium text-ink-2">
                    {provider.id === "azure-openai" ? "Id do modelo personalizado" : "Modelo personalizado"}
                  </span>
                  <input
                    value={config.models?.[modelCapability] ?? ""}
                    onChange={(event) => updateProvider(provider.id, { models: { [modelCapability]: event.target.value } })}
                    placeholder={provider.id === "azure-openai" ? "ex.: deployment-prod-gpt-4o" : "Cole um id de modelo que não aparece na lista"}
                    className={fieldBase}
                  />
                </label>

                {provider.id === "azure-openai" ? (
                  <label className="block">
                    <span className="mb-1.5 block text-[12px] font-medium text-ink-2">Versão da API</span>
                    <input value={config.extra?.apiVersion ?? ""} onChange={(event) => updateProvider(provider.id, { extra: { apiVersion: event.target.value } })} placeholder="2024-10-21" className={fieldBase} />
                  </label>
                ) : null}

                {testResult ? (
                  <div className={cx("rounded-[10px] border px-3 py-2 text-[12px]", testResult.ok ? "border-ok/20 bg-ok-soft text-ok" : "border-danger/20 bg-danger-soft text-danger")}>
                    <div className="flex items-center gap-2">
                      {testResult.ok ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                      <span>{testResult.ok ? "Conexão realizada. Modelos retornados foram anexados quando disponíveis." : testResult.error || "Não foi possível conectar."}</span>
                    </div>
                  </div>
                ) : null}

                <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <button
                      type="button"
                      onClick={() => void testProvider(provider.id)}
                      disabled={testing[provider.id]}
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-[10px] border border-line bg-white/[0.025] px-4 text-[13px] font-medium text-ink-2 transition hover:border-line-hi hover:bg-hover hover:text-ink disabled:opacity-50"
                    >
                      {testing[provider.id] ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wifi className="h-4 w-4" />}
                      Testar conexão
                    </button>
                    <button
                      type="button"
                      onClick={() => void fetchProviderModels(provider.id)}
                      disabled={testing[`models:${provider.id}`]}
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-[10px] border border-line bg-white/[0.025] px-4 text-[13px] font-medium text-ink-2 transition hover:border-line-hi hover:bg-hover hover:text-ink disabled:opacity-50"
                    >
                      {testing[`models:${provider.id}`] ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                      Buscar modelos
                    </button>
                  </div>
                  <button type="button" onClick={() => void handleSave()} disabled={saving} className="inline-flex h-10 items-center justify-center gap-2 rounded-[10px] btn-brand px-5 text-[13px] font-semibold disabled:opacity-50">
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Salvar
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-[13px] text-ink-2">Nenhum provedor disponível para este protocolo.</p>
            )}
          </section>
        )}

        <section className="rounded-[16px] border border-line bg-card p-5 shadow-[0_18px_48px_rgba(0,0,0,0.16)]">
          <div className="mb-4 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-accent" strokeWidth={1.7} />
            <h2 className="text-[16px] font-semibold text-ink">Padrões de geração</h2>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {capabilityCards.map((capability) => (
              <DefaultCard key={capability.id} capability={capability} settings={settings} providers={providers} onDefaultChange={updateDefault} />
            ))}
          </div>
        </section>
      </div>
    );
  }

  if (loading) {
    return (
      <main className="relative flex flex-1 items-center justify-center overflow-y-auto">
        <Loader2 className="h-6 w-6 animate-spin text-ink-2" />
      </main>
    );
  }

  return (
    <main className="flex-1 overflow-y-auto overflow-x-hidden">
      <div className="mx-auto flex w-full max-w-[1480px] flex-col px-6 py-8 lg:px-10 xl:px-12">
        <header className="mb-6">
          <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-accent">Configurações</span>
          <h1 className="mt-2 text-[30px] font-semibold tracking-[-0.01em] text-ink">Execução e modelo</h1>
          <p className="mt-2 max-w-3xl text-[14px] leading-relaxed text-ink-2">
            Escolha entre CLI local e BYOK. Suas chaves ficam salvas neste navegador por padrão e só passam pelo daemon local quando você gera ou testa.
          </p>
        </header>

        <section className="mb-5 flex items-start gap-4 rounded-[15px] border border-accent/28 bg-accent/[0.055] p-5">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[12px] border border-accent/20 bg-accent/8 text-accent">
            <ShieldCheck className="h-6 w-6" strokeWidth={1.7} />
          </span>
          <div>
            <h2 className="text-[15px] font-semibold text-ink">Modo local-first</h2>
            <p className="mt-1 max-w-5xl text-[13px] leading-relaxed text-ink-2">
              Os padrões abaixo escolhem quem gera texto e imagem. API key não troca modelos sozinha; ela só habilita o provedor selecionado para teste e geração real.
            </p>
          </div>
        </section>

        {status ? (
          <div className={cx("mb-5 rounded-[12px] border px-4 py-3 text-[13px]", status.includes("salv") ? "border-ok/20 bg-ok-soft text-ok" : "border-danger/20 bg-danger-soft text-danger")}>
            {status}
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[240px_minmax(0,1fr)]">
          <aside className="rounded-[16px] border border-line bg-card p-2 shadow-[0_18px_48px_rgba(0,0,0,0.16)] xl:sticky xl:top-6 xl:self-start">
            {sectionItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveSection(item.id)}
                  className={cx(
                    "flex w-full items-start gap-3 rounded-[12px] px-3 py-3 text-left transition",
                    activeSection === item.id ? "border border-accent/40 bg-accent/[0.07] text-ink" : "text-ink-3 hover:bg-hover hover:text-ink",
                  )}
                >
                  <Icon className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.7} />
                  <span>
                    <span className="block text-[12px] font-semibold leading-tight">{item.title}</span>
                    <span className="mt-0.5 block text-[11px] leading-tight text-ink-3">{item.subtitle}</span>
                  </span>
                </button>
              );
            })}
          </aside>

          <div className="min-w-0">
            {activeSection === "execution" ? renderExecutionSection() : null}
            {activeSection === "language" ? (
              <PlaceholderSection title="Idioma" body="Preferência atual salva no settings local. A próxima etapa é ligar i18n real para evitar mistura de português, espanhol e inglês nas rotas." />
            ) : null}
            {activeSection === "appearance" ? (
              <PlaceholderSection title="Aparência" body="Tema escuro segue como padrão de produto. Controles finos de tema ficam registrados aqui, mas não devem mexer no visual principal sem revisão de design." />
            ) : null}
          </div>
        </div>

        <footer className="mt-8 flex items-center justify-center gap-2 text-center text-[13px] text-ink-3">
          <Lock className="h-4 w-4" strokeWidth={1.7} />
          <span>Chaves ficam locais por padrão; exports e assets continuam em `.open-studio/`.</span>
        </footer>
      </div>
    </main>
  );
}

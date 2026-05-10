"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Cpu,
  Globe,
  Key,
  Loader2,
  Plug,
  Radio,
  RefreshCw,
  Save,
  Settings2,
  Trash2,
  XCircle,
} from "lucide-react";
import { useT } from "@/lib/i18n";
import type { ProviderCapability, ProviderManifest, ProviderStoredConfig } from "@/lib/providers/types";

type SafeProviderConfig = Omit<ProviderStoredConfig, "apiKey"> & {
  apiKey: string;
  hasApiKey?: boolean;
};

interface AppSettings {
  providers: Record<string, SafeProviderConfig>;
  defaults: Record<ProviderCapability, { providerId: string; model: string }>;
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
}

const capabilities: ProviderCapability[] = ["text", "image", "audio", "video"];

const inputClass =
  "w-full px-3 py-2.5 rounded-xl bg-card-hi border border-line text-ink text-sm focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-all";
const selectClass =
  "w-full px-3 py-2.5 rounded-xl bg-card-hi border border-line text-ink text-sm focus:border-accent/50 transition-all appearance-none cursor-pointer";
const sectionClass = "p-5 rounded-2xl bg-card border border-line mb-4";
const labelClass = "block text-xs font-medium text-ink-2 mb-1.5";

function emptySettings(): AppSettings {
  return {
    providers: {},
    defaults: {
      text: { providerId: "minimax", model: "MiniMax-M2.7" },
      image: { providerId: "minimax", model: "image-01" },
      audio: { providerId: "minimax", model: "music-2.6" },
      video: { providerId: "minimax", model: "" },
    },
    demoMode: false,
    debugMode: false,
    exportDirectory: "",
    language: "en",
    updatedAt: "",
  };
}

function capabilityLabel(capability: ProviderCapability): string {
  return {
    text: "Text",
    image: "Image",
    audio: "Audio",
    video: "Video",
  }[capability];
}

export default function SettingsPage() {
  const { t } = useT();
  const [settings, setSettings] = useState<AppSettings>(() => emptySettings());
  const [providers, setProviders] = useState<ProviderResponseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [testing, setTesting] = useState<Record<string, boolean>>({});
  const [testResults, setTestResults] = useState<Record<string, { ok: boolean; models: string[]; error?: string }>>({});

  const providerMap = useMemo(() => new Map(providers.map((provider) => [provider.id, provider])), [providers]);

  async function loadData() {
    try {
      const [settingsRes, providersRes] = await Promise.all([
        fetch("/api/settings"),
        fetch("/api/providers"),
      ]);
      const [settingsData, providersData] = await Promise.all([
        settingsRes.json(),
        providersRes.json(),
      ]);

      if (providersData.ok) setProviders(providersData.providers);
      if (settingsData.ok) {
        const nextSettings = settingsData.settings as AppSettings;
        const providersWithEditableKeys = Object.fromEntries(
          Object.entries(nextSettings.providers).map(([providerId, config]) => [
            providerId,
            { ...config, apiKey: "" },
          ])
        );
        setSettings({ ...nextSettings, providers: providersWithEditableKeys });
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  function updateProvider(providerId: string, partial: Partial<SafeProviderConfig>) {
    setSettings((current) => ({
      ...current,
      providers: {
        ...current.providers,
        [providerId]: {
          ...current.providers[providerId],
          ...partial,
          models: {
            ...current.providers[providerId]?.models,
            ...partial.models,
          },
          extra: {
            ...current.providers[providerId]?.extra,
            ...partial.extra,
          },
        },
      },
    }));
  }

  function updateDefault(capability: ProviderCapability, providerId: string, model?: string) {
    const manifest = providerMap.get(providerId);
    const configuredModel =
      model ??
      settings.providers[providerId]?.models?.[capability] ??
      manifest?.defaultModels[capability] ??
      "";

    setSettings((current) => ({
      ...current,
      defaults: {
        ...current.defaults,
        [capability]: { providerId, model: configuredModel },
      },
    }));
  }

  async function handleSave() {
    setSaving(true);
    setSaveMessage("");
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Failed to save settings");
      setSaveMessage(t("settings.saved"));
      await loadData();
    } catch (error) {
      setSaveMessage(`Error: ${error instanceof Error ? error.message : "Failed to save settings"}`);
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMessage(""), 3000);
    }
  }

  async function testProvider(providerId: string) {
    setTesting((current) => ({ ...current, [providerId]: true }));
    try {
      await handleSave();
      const res = await fetch(`/api/providers/${providerId}/test`);
      const data = await res.json();
      setTestResults((current) => ({ ...current, [providerId]: data }));
    } catch (error) {
      setTestResults((current) => ({
        ...current,
        [providerId]: {
          ok: false,
          models: [],
          error: error instanceof Error ? error.message : "Connection failed",
        },
      }));
    } finally {
      setTesting((current) => ({ ...current, [providerId]: false }));
    }
  }

  async function handleClearAssets() {
    if (!confirm(t("settings.clearConfirm"))) return;
    await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "clear_assets" }),
    });
    setSaveMessage(t("settings.clearSuccess"));
    setTimeout(() => setSaveMessage(""), 3000);
  }

  async function handleResetSettings() {
    if (!confirm(t("settings.resetConfirm"))) return;
    const res = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "reset" }),
    });
    const data = await res.json();
    if (data.ok) {
      setSaveMessage(t("settings.resetSuccess"));
      await loadData();
      setTimeout(() => setSaveMessage(""), 3000);
    }
  }

  if (loading) {
    return (
      <main className="flex-1 overflow-y-auto relative flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-ink-2 animate-spin" />
      </main>
    );
  }

  return (
    <main className="flex-1 overflow-y-auto overflow-x-hidden">
      <div className="flex flex-col px-6 py-6 lg:px-8 lg:py-8 max-w-[1040px]">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-ink mb-1">{t("settings.title")}</h1>
          <p className="text-sm text-ink-2">{t("settings.subtitle")}</p>
        </div>

        <div className="flex items-start gap-3 p-4 rounded-xl bg-card border border-warn/20 mb-6">
          <AlertTriangle className="w-5 h-5 text-warn mt-0.5 flex-shrink-0" strokeWidth={1.5} />
          <div>
            <p className="text-sm text-ink font-medium mb-1">{t("settings.securityNotice")}</p>
            <p className="text-xs text-ink-2 leading-relaxed">{t("settings.securityText")}</p>
          </div>
        </div>

        {saveMessage && (
          <div
            className={`mb-4 p-3 rounded-xl text-xs ${
              saveMessage.startsWith("Error")
                ? "bg-danger-soft border border-danger/20 text-danger"
                : "bg-ok-soft border border-ok/20 text-ok"
            }`}
          >
            {saveMessage}
          </div>
        )}

        <div className={sectionClass}>
          <div className="flex items-center gap-2 mb-4">
            <Cpu className="w-4 h-4 text-accent" strokeWidth={1.5} />
            <h2 className="text-sm font-semibold text-ink">{t("settings.defaults")}</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {capabilities.map((capability) => {
              const eligibleProviders = providers.filter((provider) => provider.capabilities.includes(capability));
              const selected = settings.defaults[capability];
              return (
                <div key={capability} className="rounded-xl border border-line bg-card-hi p-4">
                  <label className={labelClass}>{capabilityLabel(capability)}</label>
                  <select
                    value={selected.providerId}
                    onChange={(event) => updateDefault(capability, event.target.value)}
                    className={selectClass}
                  >
                    {eligibleProviders.map((provider) => (
                      <option key={provider.id} value={provider.id}>
                        {provider.name}
                      </option>
                    ))}
                  </select>
                  <input
                    value={selected.model}
                    onChange={(event) => updateDefault(capability, selected.providerId, event.target.value)}
                    placeholder={t("settings.notConfigured")}
                    className={`${inputClass} mt-2`}
                  />
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {providers.map((provider) => {
            const config = settings.providers[provider.id];
            const result = testResults[provider.id];
            const isTesting = testing[provider.id];
            const hasKey = Boolean(config?.hasApiKey) || Boolean(config?.apiKey?.trim());
            const showKey = Boolean(showKeys[provider.id]);

            return (
              <section key={provider.id} className="rounded-2xl bg-card border border-line p-5">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <Plug className="w-4 h-4 text-accent" strokeWidth={1.5} />
                      <h2 className="text-sm font-semibold text-ink">{provider.name}</h2>
                      {hasKey && (
                        <span className="inline-flex items-center gap-1 rounded-md bg-ok-soft px-2 py-0.5 text-[10px] text-ok">
                          <CheckCircle2 className="w-3 h-3" />
                          key saved
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-ink-2">{provider.description}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => updateProvider(provider.id, { enabled: !config?.enabled })}
                    className={`relative w-10 h-5 rounded-full transition-colors ${
                      config?.enabled ? "bg-accent" : "bg-line-hi"
                    }`}
                    aria-label={`Toggle ${provider.name}`}
                  >
                    <span
                      className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-transform ${
                        config?.enabled ? "left-6" : "left-1"
                      }`}
                    />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className={labelClass}>{t("settings.apiKey")}</label>
                    <div className="relative">
                      <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-3" />
                      <input
                        type={showKey ? "text" : "password"}
                        value={config?.apiKey ?? ""}
                        onChange={(event) => updateProvider(provider.id, { apiKey: event.target.value })}
                        placeholder={hasKey ? "Leave blank to keep saved key" : provider.authHeader}
                        className={`${inputClass} pl-9 pr-14`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowKeys((current) => ({ ...current, [provider.id]: !showKey }))}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-ink-2 hover:text-ink"
                      >
                        {showKey ? t("settings.hide") : t("settings.show")}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className={labelClass}>{t("settings.baseUrl")}</label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-3" />
                      <input
                        value={config?.baseUrl ?? provider.defaultBaseUrl}
                        onChange={(event) => updateProvider(provider.id, { baseUrl: event.target.value })}
                        className={`${inputClass} pl-9`}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {provider.capabilities.map((capability) => (
                      <div key={capability}>
                        <label className={labelClass}>{capabilityLabel(capability)} model</label>
                        <input
                          value={config?.models?.[capability] ?? ""}
                          onChange={(event) =>
                            updateProvider(provider.id, {
                              models: { [capability]: event.target.value },
                            })
                          }
                          placeholder={provider.defaultModels[capability] || t("settings.notConfigured")}
                          className={inputClass}
                        />
                      </div>
                    ))}
                  </div>

                  {provider.id === "elevenlabs" && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className={labelClass}>Voice ID</label>
                        <input
                          value={config?.extra?.voiceId ?? ""}
                          onChange={(event) => updateProvider(provider.id, { extra: { voiceId: event.target.value } })}
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className={labelClass}>Output format</label>
                        <input
                          value={config?.extra?.outputFormat ?? ""}
                          onChange={(event) => updateProvider(provider.id, { extra: { outputFormat: event.target.value } })}
                          className={inputClass}
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-3 pt-1">
                    <a
                      href={provider.docsUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-ink-2 hover:text-ink"
                    >
                      Docs
                    </a>
                    <button
                      type="button"
                      onClick={() => testProvider(provider.id)}
                      disabled={isTesting}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg btn-brand text-xs font-medium transition-all disabled:opacity-50"
                    >
                      {isTesting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Radio className="w-3.5 h-3.5" />}
                      {t("settings.testConnection")}
                    </button>
                  </div>

                  {result && (
                    <div
                      className={`p-3 rounded-xl ${
                        result.ok ? "bg-ok-soft border border-ok/20" : "bg-danger-soft border border-danger/20"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {result.ok ? <CheckCircle2 className="w-4 h-4 text-ok" /> : <XCircle className="w-4 h-4 text-danger" />}
                        <span className={`text-sm font-medium ${result.ok ? "text-ok" : "text-danger"}`}>
                          {result.ok ? t("settings.connectionSuccess") : t("settings.connectionFailed")}
                        </span>
                      </div>
                      {result.error && <p className="mt-1 text-xs text-danger/80">{result.error}</p>}
                      {result.models.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {result.models.slice(0, 12).map((model) => (
                            <span key={model} className="px-2 py-0.5 rounded bg-hover text-xs text-ink-2">
                              {model}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </section>
            );
          })}
        </div>

        <div className="mt-5 grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-4">
          <div className={sectionClass}>
            <div className="flex items-center gap-2 mb-3">
              <Settings2 className="w-4 h-4 text-accent" strokeWidth={1.5} />
              <h2 className="text-sm font-semibold text-ink">{t("settings.options")}</h2>
            </div>
            <div className="space-y-3">
              {[
                { titleKey: "settings.demoMode", descKey: "settings.demoModeDesc", key: "demoMode" as const },
                { titleKey: "settings.debugMode", descKey: "settings.debugModeDesc", key: "debugMode" as const },
              ].map(({ titleKey, descKey, key }) => (
                <label key={key} className="flex items-center justify-between cursor-pointer">
                  <div>
                    <p className="text-sm text-ink">{t(titleKey)}</p>
                    <p className="text-xs text-ink-2">{t(descKey)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSettings((current) => ({ ...current, [key]: !current[key] }))}
                    className={`relative w-10 h-5 rounded-full transition-colors ${
                      settings[key] ? "bg-accent" : "bg-line-hi"
                    }`}
                  >
                    <span
                      className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-transform ${
                        settings[key] ? "left-6" : "left-1"
                      }`}
                    />
                  </button>
                </label>
              ))}
            </div>
          </div>

          <div className="flex lg:flex-col items-center justify-between gap-2">
            <button
              onClick={handleClearAssets}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-danger-soft border border-danger/20 text-danger text-xs hover:bg-danger/20 transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" />
              {t("settings.clearAssets")}
            </button>
            <button
              onClick={handleResetSettings}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-hover border border-line text-ink-2 text-xs hover:bg-line hover:text-ink transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              {t("settings.resetSettings")}
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl btn-brand text-sm font-medium transition-all disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {t("settings.saveSettings")}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

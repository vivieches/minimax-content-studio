"use client";

import { useState, useEffect } from "react";
import {
  Key, Radio, Globe, Cpu, AlertTriangle, CheckCircle2,
  XCircle, Loader2, Trash2, RefreshCw,
} from "lucide-react";
import { useT } from "@/lib/i18n";

interface AppSettings {
  apiKey: string;
  apiKeyType: "pay_as_you_go" | "token_plan";
  baseUrl: string;
  textModel: string;
  textModelFast: string;
  imageModel: string;
  musicModel: string;
  videoModel: string;
  providerMode: "official-text-v2" | "openai-compatible" | "anthropic-compatible";
  demoMode: boolean;
  debugMode: boolean;
  exportDirectory: string;
  updatedAt: string;
  hasApiKey?: boolean;
}

const defaultSettings: AppSettings = {
  apiKey: "",
  apiKeyType: "pay_as_you_go",
  baseUrl: "https://api.minimax.io",
  textModel: "MiniMax-M2.7",
  textModelFast: "MiniMax-M2.7-highspeed",
  imageModel: "image-01",
  musicModel: "music-2.6",
  videoModel: "",
  providerMode: "official-text-v2",
  demoMode: false,
  debugMode: false,
  exportDirectory: "",
  updatedAt: "",
};

const inputClass =
  "w-full px-3 py-2.5 rounded-xl bg-card-hi border border-line text-ink text-sm focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-all";
const selectClass =
  "w-full px-3 py-2.5 rounded-xl bg-card-hi border border-line text-ink text-sm focus:border-accent/50 transition-all appearance-none cursor-pointer";
const labelClass = "block text-xs font-medium text-ink-2 mb-1.5";
const sectionClass = "p-5 rounded-2xl bg-card border border-line mb-4";

export default function SettingsPage() {
  const { t } = useT();
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; models: string[]; error?: string } | null>(null);
  const [models, setModels] = useState<string[]>([]);
  const [saveMessage, setSaveMessage] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [hasStoredApiKey, setHasStoredApiKey] = useState(false);

  async function loadSettings() {
    try {
      const res = await fetch("/api/settings");
      const data = await res.json();
      if (data.ok) {
        setHasStoredApiKey(Boolean(data.settings.hasApiKey));
        setSettings({ ...defaultSettings, ...data.settings, apiKey: "" });
      }
    } catch { } finally { setLoading(false); }
  }

  useEffect(() => {
    void Promise.resolve().then(loadSettings);
  }, []);

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
      if (data.ok) {
        setHasStoredApiKey(Boolean(settings.apiKey.trim()) || Boolean(data.settings.hasApiKey));
        setSettings((prev) => ({ ...prev, apiKey: "" }));
        setSaveMessage(t("settings.saved"));
        setTimeout(() => setSaveMessage(""), 3000);
      } else {
        setSaveMessage(`Error: ${data.error}`);
      }
    } catch (e) {
      setSaveMessage(`Error: ${e instanceof Error ? e.message : "Failed to save"}`);
    } finally {
      setSaving(false);
    }
  }

  async function handleTestConnection() {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/minimax/test-connection");
      const data = await res.json();
      setTestResult(data);
      if (data.ok) setModels(data.models);
    } catch (e) {
      setTestResult({ ok: false, models: [], error: e instanceof Error ? e.message : "Connection test failed" });
    } finally {
      setTesting(false);
    }
  }

  async function handleRefreshModels() {
    setRefreshing(true);
    try {
      const res = await fetch("/api/minimax/models");
      const data = await res.json();
      if (data.ok) setModels(data.models);
    } catch { } finally { setRefreshing(false); }
  }

  async function handleClearAssets() {
    if (!confirm(t("settings.clearConfirm"))) return;
    try {
      await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "clear_assets" }),
      });
      setSaveMessage(t("settings.clearSuccess"));
      setTimeout(() => setSaveMessage(""), 3000);
    } catch (e) {
      setSaveMessage(`Error: ${e instanceof Error ? e.message : "Failed to clear assets"}`);
    }
  }

  async function handleResetSettings() {
    if (!confirm(t("settings.resetConfirm"))) return;
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset" }),
      });
      const data = await res.json();
      if (data.ok) {
        setHasStoredApiKey(Boolean(data.settings.hasApiKey));
        setSettings({ ...defaultSettings, ...data.settings, apiKey: "" });
        setSaveMessage(t("settings.resetSuccess"));
        setTimeout(() => setSaveMessage(""), 3000);
      }
    } catch (e) {
      setSaveMessage(`Error: ${e instanceof Error ? e.message : "Failed to reset"}`);
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
      <div className="flex flex-col px-6 py-6 lg:px-8 lg:py-8 max-w-[720px]">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-ink mb-1">{t("settings.title")}</h1>
          <p className="text-sm text-ink-2">{t("settings.subtitle")}</p>
        </div>

        {/* Security notice */}
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

        {/* API Section */}
        <div className={sectionClass}>
          <div className="flex items-center gap-2 mb-4">
            <Key className="w-4 h-4 text-accent" strokeWidth={1.5} />
            <h2 className="text-sm font-semibold text-ink">{t("settings.apiSection")}</h2>
          </div>

          <div className="mb-4">
            <label className={labelClass}>{t("settings.apiKey")}</label>
            {hasStoredApiKey && !settings.apiKey && (
              <div className="mb-2 inline-flex items-center gap-1.5 rounded-lg border border-ok/20 bg-ok-soft px-2 py-1 text-[11px] text-ok">
                <CheckCircle2 className="w-3 h-3" />
                API key saved
              </div>
            )}
            <div className="relative">
              <input
                type={showKey ? "text" : "password"}
                value={settings.apiKey}
                onChange={(e) => setSettings({ ...settings, apiKey: e.target.value })}
                placeholder={hasStoredApiKey ? "Leave blank to keep saved key" : "sk-cp-..."}
                className={inputClass}
              />
              <button
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-2 hover:text-ink text-xs transition-colors"
              >
                {showKey ? t("settings.hide") : t("settings.show")}
              </button>
            </div>
          </div>

          <div className="mb-4">
            <label className={labelClass}>{t("settings.keyType")}</label>
            <select
              value={settings.apiKeyType}
              onChange={(e) => setSettings({ ...settings, apiKeyType: e.target.value as AppSettings["apiKeyType"] })}
              className={selectClass}
            >
              <option value="pay_as_you_go">Pay-as-you-go</option>
              <option value="token_plan">Token Plan</option>
            </select>
          </div>

          <div className="mb-4">
            <label className={labelClass}>{t("settings.baseUrl")}</label>
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-ink-2 flex-shrink-0" strokeWidth={1.5} />
              <input
                type="text"
                value={settings.baseUrl}
                onChange={(e) => setSettings({ ...settings, baseUrl: e.target.value })}
                className="flex-1 px-3 py-2.5 rounded-xl bg-card-hi border border-line text-ink text-sm focus:border-accent/50 transition-all"
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>{t("settings.providerMode")}</label>
            <select
              value={settings.providerMode}
              onChange={(e) => setSettings({ ...settings, providerMode: e.target.value as AppSettings["providerMode"] })}
              className={selectClass}
            >
              <option value="official-text-v2">Official MiniMax (chatcompletion_v2)</option>
              <option value="openai-compatible">OpenAI Compatible</option>
              <option value="anthropic-compatible">Anthropic Compatible</option>
            </select>
          </div>
        </div>

        {/* Models */}
        <div className={sectionClass}>
          <div className="flex items-center gap-2 mb-4">
            <Cpu className="w-4 h-4 text-accent" strokeWidth={1.5} />
            <h2 className="text-sm font-semibold text-ink">{t("settings.models")}</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { label: t("settings.textModel"), key: "textModel" as const },
              { label: t("settings.fastTextModel"), key: "textModelFast" as const },
              { label: t("settings.imageModel"), key: "imageModel" as const },
              { label: t("settings.musicModel"), key: "musicModel" as const },
            ].map(({ label, key }) => (
              <div key={key}>
                <label className={labelClass}>{label}</label>
                <input
                  type="text"
                  value={settings[key]}
                  onChange={(e) => setSettings({ ...settings, [key]: e.target.value })}
                  className={inputClass}
                />
              </div>
            ))}
            <div>
              <label className={labelClass}>{t("settings.videoModel")}</label>
              <input
                type="text"
                value={settings.videoModel}
                onChange={(e) => setSettings({ ...settings, videoModel: e.target.value })}
                placeholder={t("settings.notConfigured")}
                className={inputClass}
              />
            </div>
          </div>
        </div>

        {/* Connection Test */}
        <div className={sectionClass}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-accent" strokeWidth={1.5} />
              <h2 className="text-sm font-semibold text-ink">{t("settings.connectionTest")}</h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleRefreshModels}
                disabled={refreshing}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-hover border border-line text-ink-2 text-xs hover:bg-line hover:text-ink transition-all disabled:opacity-50"
              >
                <RefreshCw className={`w-3 h-3 ${refreshing ? "animate-spin" : ""}`} />
                {t("settings.refreshModels")}
              </button>
              <button
                onClick={handleTestConnection}
                disabled={testing}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg btn-brand text-xs font-medium transition-all disabled:opacity-50"
              >
                {testing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                {t("settings.testConnection")}
              </button>
            </div>
          </div>

          {testResult && (
            <div
              className={`p-3 rounded-xl ${
                testResult.ok
                  ? "bg-ok-soft border border-ok/20"
                  : "bg-danger-soft border border-danger/20"
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                {testResult.ok
                  ? <CheckCircle2 className="w-4 h-4 text-ok" />
                  : <XCircle className="w-4 h-4 text-danger" />}
                <span className={`text-sm font-medium ${testResult.ok ? "text-ok" : "text-danger"}`}>
                  {testResult.ok ? t("settings.connectionSuccess") : t("settings.connectionFailed")}
                </span>
              </div>
              {testResult.error && (
                <p className="text-xs text-danger/80 mt-1">{testResult.error}</p>
              )}
              {testResult.models.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs text-ink-2 mb-1">{t("settings.availableModels")} ({testResult.models.length}):</p>
                  <div className="flex flex-wrap gap-1">
                    {testResult.models.map((m) => (
                      <span key={m} className="px-2 py-0.5 rounded bg-hover text-xs text-ink-2">{m}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Options */}
        <div className={sectionClass}>
          <h2 className="text-sm font-semibold text-ink mb-3">{t("settings.options")}</h2>
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
                  onClick={() => setSettings({ ...settings, [key]: !settings[key] })}
                  className={`relative w-10 h-5 rounded-full transition-colors ${
                    settings[key] ? "bg-accent" : "bg-line-hi"
                  }`}
                >
                  <div
                    className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-transform ${
                      settings[key] ? "left-6" : "left-1"
                    }`}
                  />
                </button>
              </label>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
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
              {t("settings.resetSettings")}
            </button>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl btn-brand text-sm font-medium transition-all disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {t("settings.saveSettings")}
          </button>
        </div>
      </div>
    </main>
  );
}

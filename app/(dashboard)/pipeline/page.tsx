import {
  ArrowRight,
  Bell,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock3,
  FileText,
  Info,
  Plus,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  TextCursorInput,
  UsersRound,
  WandSparkles,
} from "lucide-react";
import type { ReactNode } from "react";

const steps = [
  "Idea",
  "Guion",
  "Miniatura",
  "Leyenda",
  "Descripción",
  "Hashtags",
  "Assets",
  "Exportación",
];

const variables = [
  {
    icon: TextCursorInput,
    label: "Tema del video",
    value: "Lanzamiento de Open Studio",
  },
  {
    icon: UsersRound,
    label: "Audiencia objetivo",
    value: "Creadores de contenido",
  },
  {
    icon: SlidersHorizontal,
    label: "Tono de voz",
    value: "Profesional, inspirador",
  },
  {
    icon: Clock3,
    label: "Duración estimada",
    value: "60–90 segundos",
  },
];

const versionHistory = [
  { label: "Versión 3", time: "Hace 2 min", current: true },
  { label: "Versión 2", time: "Hace 1 h" },
  { label: "Versión 1", time: "Ayer, 18:42" },
];

const activity = [
  { label: "Guion generado", time: "Hace 2 min" },
  { label: "Variables actualizadas", time: "Hace 15 min" },
  { label: "Referencias agregadas", time: "Hace 1 h" },
];

function Panel({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-[14px] border border-[rgba(255,255,255,0.07)] bg-[#151516] ${className}`}
    >
      {children}
    </section>
  );
}

function PanelHeader({
  title,
  action,
}: {
  title: string;
  action?: string;
}) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <h2 className="text-[15px] font-semibold leading-none text-[#F5F2F4]">
        {title}
      </h2>
      {action ? (
        <button className="text-[12px] font-medium text-[#A0A3AD] transition hover:text-white">
          {action}
        </button>
      ) : null}
    </div>
  );
}

function Topbar() {
  return (
    <header className="flex h-auto min-h-[64px] shrink-0 flex-col items-stretch gap-3 border-b border-[rgba(255,255,255,0.07)] px-4 py-3 md:h-[64px] md:flex-row md:items-center md:justify-between md:gap-0 md:px-9 md:py-0 xl:px-10">
      <div className="flex min-w-0 items-center gap-3 pl-12 md:gap-5 md:pl-0">
        <h1 className="text-[23px] font-bold tracking-[-0.02em] text-[#F5F2F4]">
          Pipeline
        </h1>
        <ChevronRight
          className="hidden h-4 w-4 text-[#5F6472] sm:block"
          strokeWidth={1.7}
        />
        <button className="hidden min-w-0 items-center gap-1.5 text-[15px] text-[#A0A3AD] transition-colors duration-150 hover:text-white sm:flex">
          <span className="truncate">Video Lanzamiento Open Studio</span>
          <ChevronDown className="h-3.5 w-3.5 text-[#5F6472]" />
        </button>
        <span className="hidden h-2.5 w-2.5 rounded-full bg-[#D06FA7] sm:block" />
      </div>

      <div className="flex items-center justify-end gap-2 md:gap-5">
        <div className="hidden items-center gap-2 text-[13px] text-[#A0A3AD] lg:flex">
          <CheckCircle2 className="h-4 w-4" strokeWidth={1.8} />
          <span>Guardado hace 2 min</span>
        </div>
        <button className="hidden h-10 items-center gap-2 rounded-[8px] border border-[rgba(255,255,255,0.07)] bg-white/[0.025] px-5 text-[14px] font-semibold text-[#F5F2F4] transition hover:border-[rgba(255,255,255,0.12)] hover:bg-white/[0.05] sm:flex">
          <ShieldCheck className="h-4 w-4 text-[#A0A3AD]" strokeWidth={1.7} />
          Vista previa
        </button>
        <button className="flex h-10 items-center gap-2 rounded-[8px] bg-[#D06FA7] px-5 text-[14px] font-semibold text-[#F9F5F8] transition hover:brightness-110 md:px-7">
          Continuar
          <ArrowRight className="h-4 w-4" strokeWidth={1.8} />
        </button>
        <button
          className="relative grid h-9 w-9 place-items-center rounded-full text-[#A0A3AD] transition hover:bg-white/[0.05] hover:text-white"
          aria-label="Notificaciones"
        >
          <Bell className="h-5 w-5" strokeWidth={1.55} />
          <span className="absolute right-2 top-1 h-2.5 w-2.5 rounded-full bg-[#D06FA7] ring-2 ring-[#0a0a0d]" />
        </button>
      </div>
    </header>
  );
}

function PipelineSteps() {
  return (
    <aside className="relative h-full border-r border-[rgba(255,255,255,0.07)] px-11 py-12">
      <ol className="space-y-8">
        {steps.map((step, index) => {
          const isDone = index === 0;
          const isActive = index === 1;

          return (
            <li key={step} className="relative flex items-center gap-4">
              {index < steps.length - 1 ? (
                <span className="absolute left-[16px] top-[36px] h-[30px] border-l border-dashed border-[rgba(255,255,255,0.07)]" />
              ) : null}
              <span
                className={[
                  "relative z-10 grid h-8 w-8 shrink-0 place-items-center rounded-full border text-[14px] font-medium transition-colors duration-200",
                  isDone
                    ? "border-[rgba(208,111,167,0.3)] bg-[rgba(208,111,167,0.1)] text-[#D06FA7]"
                    : isActive
                      ? "border-[#D06FA7] bg-[rgba(208,111,167,0.1)] text-[#D06FA7]"
                      : "border-[rgba(255,255,255,0.07)] bg-[#151516] text-[#5F6472]",
                ].join(" ")}
              >
                {index + 1}
              </span>
              <span
                className={[
                  "text-[15px] font-medium transition-colors duration-200",
                  isActive
                    ? "text-[#D06FA7]"
                    : isDone
                      ? "text-[#A0A3AD]"
                      : "text-[#5F6472]",
                ].join(" ")}
              >
                {step}
              </span>
            </li>
          );
        })}
      </ol>
    </aside>
  );
}

function InstructionsCard() {
  const chips = [
    { label: "Tema del video", icon: TextCursorInput },
    { label: "Audiencia objetivo", icon: UsersRound },
    { label: "Tono de voz", icon: SlidersHorizontal },
    { label: "Duración estimada", icon: Clock3 },
  ];

  return (
    <Panel className="mt-6 px-6 py-5">
      <div className="relative min-h-[185px]">
        <div className="mb-4 flex items-start justify-between gap-4">
          <label
            htmlFor="script-instructions"
            className="text-[14px] font-medium text-[#F5F2F4]"
          >
            Instrucciones
          </label>
          <Sparkles
            className="mt-1 h-5 w-5 text-[#D06FA7]"
            strokeWidth={1.7}
          />
        </div>
        <textarea
          id="script-instructions"
          maxLength={2000}
          placeholder="Describe el tema, el enfoque, el tono y los puntos clave que debe cubrir el guion..."
          className="h-[118px] w-full resize-none bg-transparent text-[14px] leading-6 text-[#F5F2F4] placeholder:text-[#5F6472] focus-visible:outline-none"
        />
        <p className="text-[14px] text-[#A0A3AD]">0 / 2000</p>
      </div>

      <div className="mt-4 border-t border-[rgba(255,255,255,0.07)] pt-5">
        <div className="mb-4 flex items-center gap-1.5 text-[14px] font-medium text-[#A0A3AD]">
          Contexto y variables
          <Info className="h-3.5 w-3.5 text-[#5F6472]" strokeWidth={1.8} />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {chips.map((chip) => {
            const Icon = chip.icon;
            return (
              <button
                key={chip.label}
                className="flex h-9 items-center gap-2 rounded-[7px] border border-[rgba(255,255,255,0.07)] bg-white/[0.02] px-3.5 text-[13px] text-[#A0A3AD] transition duration-150 hover:border-[rgba(255,255,255,0.12)] hover:text-[#F5F2F4]"
              >
                <Icon className="h-4 w-4" strokeWidth={1.55} />
                {chip.label}
              </button>
            );
          })}
          <button className="flex h-9 items-center gap-2 rounded-[7px] border border-dashed border-[rgba(255,255,255,0.12)] bg-transparent px-3.5 text-[13px] text-[#A0A3AD] transition duration-150 hover:border-[#D06FA7] hover:text-[#D06FA7]">
            <Plus className="h-4 w-4" strokeWidth={1.6} />
            Variable
          </button>

          <button className="ml-auto flex h-10 min-w-[196px] items-center justify-center gap-2 rounded-[8px] bg-[#D06FA7] px-8 text-[14px] font-semibold text-[#F9F5F8] transition hover:brightness-110">
            <WandSparkles className="h-4 w-4" strokeWidth={1.7} />
            Generar
          </button>
        </div>
      </div>
    </Panel>
  );
}

function ResultCard() {
  return (
    <section className="mt-7">
      <div className="mb-3 flex items-center gap-3">
        <Sparkles className="h-5 w-5 text-[#D06FA7]" strokeWidth={1.7} />
        <h2 className="text-[16px] font-semibold text-[#F5F2F4]">Resultado</h2>
      </div>

      <Panel className="relative grid min-h-[220px] place-items-center overflow-hidden">
        <div className="relative flex flex-col items-center text-center">
          <div className="relative mb-5 text-[#5F6472]">
            <FileText className="h-14 w-14" strokeWidth={1.35} />
            <Sparkles
              className="absolute -right-2 bottom-1 h-5 w-5 text-[#A0A3AD]"
              strokeWidth={1.55}
            />
          </div>
          <p className="text-[14px] font-medium text-[#F5F2F4]">
            Tu guion generado aparecerá aquí.
          </p>
          <p className="mt-2 text-[13px] text-[#A0A3AD]">
            Completa las instrucciones y presiona Generar.
          </p>
        </div>
      </Panel>
    </section>
  );
}

function VariablesCard() {
  return (
    <Panel className="p-5">
      <PanelHeader title="Variables" action="Ver todas" />
      <div className="space-y-5">
        {variables.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="flex gap-4">
              <Icon
                className="mt-0.5 h-[18px] w-[18px] shrink-0 text-[#A0A3AD]"
                strokeWidth={1.55}
              />
              <div>
                <p className="text-[13px] font-medium leading-none text-[#F5F2F4]">
                  {item.label}
                </p>
                <p className="mt-2 text-[13px] leading-none text-[#A0A3AD]">
                  {item.value}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}

function BrandVoiceCard() {
  return (
    <Panel className="p-5">
      <PanelHeader title="Voz de marca" action="Editar" />
      <div className="flex items-center gap-4">
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full border border-[rgba(208,111,167,0.3)] bg-[rgba(208,111,167,0.1)] text-[17px] font-bold text-[#D06FA7]">
          OS
        </div>
        <div>
          <p className="text-[14px] font-semibold leading-none text-[#F5F2F4]">
            Open Studio
          </p>
          <p className="mt-3 max-w-[260px] text-[13px] leading-5 text-[#A0A3AD]">
            Profesional, cercana y creativa.
            <br />
            Enfocada en empoderar a creadores.
          </p>
        </div>
      </div>
    </Panel>
  );
}

function ReferencesCard() {
  return (
    <Panel className="p-5">
      <PanelHeader title="Referencias" />
      <button className="grid min-h-[70px] w-full place-items-center rounded-[8px] border border-dashed border-[rgba(255,255,255,0.07)] bg-white/[0.015] text-center transition duration-150 hover:border-[rgba(208,111,167,0.3)] hover:bg-[rgba(208,111,167,0.04)]">
        <div>
          <div className="mb-2 flex items-center justify-center gap-2 text-[13px] font-medium text-[#A0A3AD]">
            <Sparkles className="h-4 w-4" strokeWidth={1.45} />
            Agregar referencia
          </div>
          <p className="text-[12px] text-[#5F6472]">
            Arrastra archivos o pega enlaces aquí.
          </p>
        </div>
      </button>
    </Panel>
  );
}

function VersionHistoryCard() {
  return (
    <Panel className="p-5">
      <PanelHeader title="Historial de versiones" action="Ver todas" />
      <div className="space-y-4">
        {versionHistory.map((item) => (
          <div key={item.label} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[13px] text-[#F5F2F4]">{item.label}</span>
              {item.current ? (
                <span className="rounded-[5px] bg-[rgba(208,111,167,0.13)] px-2 py-0.5 text-[11px] font-semibold text-[#D06FA7]">
                  Actual
                </span>
              ) : null}
            </div>
            <span className="text-[13px] text-[#5F6472]">{item.time}</span>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function ActivityCard() {
  return (
    <Panel className="p-5">
      <PanelHeader title="Actividad" action="Ver toda" />
      <div className="space-y-4">
        {activity.map((item) => (
          <div key={item.label} className="flex items-center justify-between">
            <span className="text-[13px] text-[#F5F2F4]">{item.label}</span>
            <span className="text-[13px] text-[#5F6472]">{item.time}</span>
          </div>
        ))}
      </div>
    </Panel>
  );
}

export default function PipelinePage() {
  return (
    <div className="relative flex h-full min-h-0 flex-1 overflow-hidden bg-transparent text-[#F5F2F4]">
      <div className="relative z-10 flex min-w-0 flex-1 flex-col">
        <Topbar />

        <div className="grid min-h-0 flex-1 grid-cols-1 overflow-y-auto xl:grid-cols-[300px_minmax(580px,1fr)_454px] xl:overflow-hidden">
          <PipelineSteps />

          <main className="min-h-0 min-w-0 overflow-hidden px-8 py-8 xl:px-14">
            <div className="mx-auto max-w-[980px]">
              <h2 className="text-[28px] font-bold tracking-[-0.025em] text-[#F5F2F4]">
                Guion
              </h2>
              <p className="mt-3 text-[15px] leading-6 text-[#A0A3AD]">
                Escribe las instrucciones para generar el guion de tu video.
              </p>

              <InstructionsCard />
              <ResultCard />
            </div>
          </main>

          <aside className="min-w-0 space-y-3.5 px-5 pb-8 xl:overflow-y-auto xl:px-6 xl:py-7">
            <VariablesCard />
            <BrandVoiceCard />
            <ReferencesCard />
            <VersionHistoryCard />
            <ActivityCard />
          </aside>
        </div>
      </div>
    </div>
  );
}


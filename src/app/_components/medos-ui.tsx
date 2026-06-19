import type { ReactNode, SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

export function DashboardIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="1.5" />
    </svg>
  );
}

export function QueueIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <path d="M7 7h12" />
      <path d="M7 12h12" />
      <path d="M7 17h12" />
      <path d="M3.5 7h.01" />
      <path d="M3.5 12h.01" />
      <path d="M3.5 17h.01" />
    </svg>
  );
}

export function PatientsIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <circle cx="8" cy="8" r="3" />
      <circle cx="16.5" cy="9.5" r="2.5" />
      <path d="M3.5 19.5c.8-3 3.2-4.5 6-4.5s5.2 1.5 6 4.5" />
      <path d="M13.5 18.5c.5-1.9 2-3 4.2-3 1.3 0 2.3.3 3 .9" />
    </svg>
  );
}

export function ReportIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <path d="M7 3.5h7l4 4V20a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 6 20V5A1.5 1.5 0 0 1 7.5 3.5Z" />
      <path d="M14 3.5V8h4" />
      <path d="M9 12h6" />
      <path d="M9 16h6" />
    </svg>
  );
}

export function PillIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <path d="M8.5 5.5a4.24 4.24 0 0 1 6 0l1 1a4.24 4.24 0 0 1 0 6l-5 5a4.24 4.24 0 0 1-6 0l-1-1a4.24 4.24 0 0 1 0-6Z" />
      <path d="m9 15 6-6" />
    </svg>
  );
}

export function SettingsIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <path d="M12 8.5A3.5 3.5 0 1 0 12 15.5 3.5 3.5 0 1 0 12 8.5Z" />
      <path d="M19 12a7.6 7.6 0 0 0-.1-1l2-1.6-2-3.4-2.4 1a7.8 7.8 0 0 0-1.7-1l-.3-2.6H10l-.3 2.6a7.8 7.8 0 0 0-1.7 1l-2.4-1-2 3.4 2 1.6a7.6 7.6 0 0 0 0 2l-2 1.6 2 3.4 2.4-1a7.8 7.8 0 0 0 1.7 1l.3 2.6h4l.3-2.6a7.8 7.8 0 0 0 1.7-1l2.4 1 2-3.4-2-1.6c.1-.3.1-.7.1-1Z" />
    </svg>
  );
}

export function SearchIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4 4" />
    </svg>
  );
}

export function PlusIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  );
}

export function SparkIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8Z" />
    </svg>
  );
}

export function StatusPulse() {
  return (
    <span className="relative inline-flex h-4 w-4 items-center justify-center">
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
      <span className="absolute h-1.5 w-1.5 animate-ping rounded-full bg-emerald-400/70" />
    </span>
  );
}

export function MedosPage(props: {
  sectionNumber: string;
  sectionTitle: string;
  title: string;
  description: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  const { title, description, action, children } = props;

  return (
    <div className="mx-auto max-w-[1200px] space-y-8">
      <div className="rounded-[24px] border border-slate-200/80 bg-white px-6 py-6 shadow-[0_10px_30px_rgba(15,23,42,0.05)] sm:px-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3">
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              {title}
              </h1>
              <p className="max-w-2xl text-[15px] leading-7 text-slate-500">
              {description}
              </p>
            </div>
          </div>
          {action ? <div className="pt-1">{action}</div> : null}
        </div>
      </div>
      {children}
    </div>
  );
}

export function PrimaryButton({
  children,
  subtle = false,
  icon,
  onClick,
  disabled = false,
}: {
  children: ReactNode;
  subtle?: boolean;
  icon?: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-medium shadow-sm transition ${
        subtle
          ? "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          : "bg-sky-700 text-white hover:bg-sky-800 disabled:cursor-not-allowed disabled:bg-sky-400"
      }`}
    >
      {icon}
      {children}
    </button>
  );
}

export function Panel({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`overflow-hidden rounded-[24px] border border-slate-200/80 bg-white shadow-[0_12px_34px_rgba(15,23,42,0.06)] ${className}`}
    >
      {children}
    </section>
  );
}

export function PanelHeader({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5">
      <div>
        <h2 className="text-[15px] font-semibold text-slate-950">{title}</h2>
        {subtitle ? <p className="mt-1 text-sm text-slate-500">{subtitle}</p> : null}
      </div>
      {right}
    </div>
  );
}

export function DataPill({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "blue" | "green" | "red" | "amber";
}) {
  const tones = {
    neutral: "bg-slate-100 text-slate-600",
    blue: "bg-sky-50 text-sky-700",
    green: "bg-emerald-50 text-emerald-700",
    red: "bg-rose-50 text-rose-700",
    amber: "bg-amber-50 text-amber-700",
  };

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

export function MetricCard({
  label,
  value,
  subtext,
  tone = "slate",
}: {
  label: string;
  value: string;
  subtext: string;
  tone?: "slate" | "red" | "green";
}) {
  const accentTone =
    tone === "red"
      ? "bg-rose-500"
      : tone === "green"
        ? "bg-emerald-500"
        : "bg-sky-700";
  const valueTone =
    tone === "red"
      ? "text-rose-600"
      : tone === "green"
        ? "text-emerald-600"
        : "text-slate-950";

  return (
    <Panel>
      <div className={`h-1 w-full ${accentTone}`} />
      <div className="space-y-3 px-6 py-5">
        <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-slate-500">
          {label}
        </p>
        <p className={`text-4xl font-semibold tracking-tight ${valueTone}`}>{value}</p>
        <p className="text-sm text-slate-500">{subtext}</p>
      </div>
    </Panel>
  );
}

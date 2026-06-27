"use client";

import type { ReactNode, SVGProps } from "react";
import { useEffect, useState } from "react";

type IconProps = SVGProps<SVGSVGElement>;

export function buttonClassName({
  subtle = false,
  fullWidth = false,
}: {
  subtle?: boolean;
  fullWidth?: boolean;
} = {}) {
  return [
    "ice-button group relative inline-flex h-11 items-center justify-center gap-2 overflow-hidden rounded-2xl px-4 text-sm font-semibold transition-[transform,box-shadow,background-color,color,border-color] duration-200",
    fullWidth ? "w-full" : "",
    subtle
      ? "ice-button--subtle border border-[color:var(--border-subtle)] bg-[color:var(--surface-elevated)] text-[color:var(--foreground)] shadow-[var(--shadow-soft)] hover:-translate-y-0.5 hover:border-[color:var(--border-strong)] hover:bg-[color:var(--surface-strong)] disabled:cursor-not-allowed disabled:opacity-60"
      : "border border-[color:var(--accent-strong)] bg-[linear-gradient(135deg,var(--accent),var(--accent-strong))] text-white shadow-[0_18px_40px_rgba(8,47,73,0.22)] hover:-translate-y-0.5 hover:shadow-[0_24px_56px_rgba(8,47,73,0.28)] disabled:cursor-not-allowed disabled:border-transparent disabled:opacity-60",
  ]
    .filter(Boolean)
    .join(" ");
}

export function ButtonFx() {
  return (
    <>
      <span aria-hidden className="ice-button__glow" />
      <span aria-hidden className="ice-button__crystal ice-button__crystal--one" />
      <span aria-hidden className="ice-button__crystal ice-button__crystal--two" />
      <span aria-hidden className="ice-button__crystal ice-button__crystal--three" />
    </>
  );
}

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

export function BellIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <path d="M6.5 9.5a5.5 5.5 0 1 1 11 0c0 5.5 2 6.5 2 6.5h-15s2-1 2-6.5Z" />
      <path d="M10 19a2 2 0 0 0 4 0" />
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

export function CalendarIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <path d="M7 3.5v3" />
      <path d="M17 3.5v3" />
      <rect x="3.5" y="5.5" width="17" height="15" rx="2" />
      <path d="M3.5 9.5h17" />
      <path d="M8 13h3" />
      <path d="M13 13h3" />
      <path d="M8 17h3" />
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
  const { sectionNumber, sectionTitle, title, description, action, children } = props;

  return (
    <div className="mx-auto max-w-[1200px] space-y-6">
      <div className="med-hero rounded-[30px] px-6 py-6 sm:px-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-[color:var(--border-subtle)] bg-[color:var(--surface-elevated)] px-3 py-1.5">
              <span className="med-kicker">{sectionNumber}</span>
              <span className="text-xs font-medium text-[color:var(--muted)]">{sectionTitle}</span>
            </div>
            <div className="space-y-3">
              <h1 className="text-3xl font-extrabold tracking-[-0.04em] text-[color:var(--foreground-soft)] sm:text-[2.8rem]">
                {title}
              </h1>
              <p className="max-w-2xl text-[15px] leading-7 text-[color:var(--muted)] sm:text-base">
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
  type = "button",
  className = "",
}: {
  children: ReactNode;
  subtle?: boolean;
  icon?: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit";
  className?: string;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${buttonClassName({ subtle })} ${className}`.trim()}
    >
      <ButtonFx />
      <span className="relative z-10 inline-flex items-center gap-2">
        {icon}
        {children}
      </span>
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
  return <section className={`med-surface overflow-hidden rounded-[28px] ${className}`}>{children}</section>;
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
    <div className="flex items-start justify-between gap-4 border-b border-[color:var(--border-subtle)] px-6 py-5">
      <div>
        <h2 className="text-[15px] font-semibold text-[color:var(--foreground-soft)]">{title}</h2>
        {subtitle ? <p className="mt-1 text-sm text-[color:var(--muted)]">{subtitle}</p> : null}
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
  const toneClass = {
    neutral: "border-[color:var(--border-subtle)] bg-[color:var(--surface-elevated)] text-[color:var(--foreground)]",
    blue: "border border-sky-200/70 bg-sky-500/10 text-sky-700",
    green: "border border-emerald-200/70 bg-emerald-500/10 text-emerald-700",
    red: "border border-rose-200/70 bg-rose-500/10 text-rose-700",
    amber: "border border-amber-200/70 bg-amber-500/10 text-amber-700",
  }[tone];

  return <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium ${toneClass}`}>{children}</span>;
}

export function Modal({
  open,
  title,
  description,
  children,
  footer,
  onClose,
}: {
  open: boolean;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [open, onClose]);

  return (
    <div
      inert={!open ? true : undefined}
      className={`fixed inset-0 z-50 overflow-y-auto p-4 transition-opacity duration-200 sm:p-6 ${
        open ? "opacity-100" : "pointer-events-none opacity-0"
      }`}
      aria-hidden={!open}
    >
      <button
        type="button"
        aria-label="Close modal"
        onClick={onClose}
        className={`absolute inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity duration-200 ${
          open ? "opacity-100" : "opacity-0"
        }`}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`med-surface-strong relative z-10 mx-auto my-4 flex max-h-[calc(100vh-2rem)] w-full max-w-2xl flex-col overflow-hidden rounded-[30px] transition-all duration-200 sm:my-8 sm:max-h-[calc(100vh-4rem)] ${
          open ? "translate-y-0 scale-100 opacity-100" : "translate-y-6 scale-[0.985] opacity-0"
        }`}
      >
        <div className="shrink-0 flex items-start justify-between gap-4 border-b border-[color:var(--border-subtle)] px-6 py-5">
          <div>
            <h2 className="text-xl font-semibold text-[color:var(--foreground-soft)]">{title}</h2>
            {description ? <p className="mt-1 text-sm text-[color:var(--muted)]">{description}</p> : null}
          </div>
          <button type="button" onClick={onClose} className={`${buttonClassName({ subtle: true })} h-10 px-3 shadow-none`}>
            <ButtonFx />
            <span className="relative z-10">Close</span>
          </button>
        </div>
        <div className="min-h-0 overflow-y-auto px-6 py-5">{children}</div>
        {footer ? <div className="shrink-0 flex flex-wrap items-center justify-end gap-3 border-t border-[color:var(--border-subtle)] px-6 py-5">{footer}</div> : null}
      </div>
    </div>
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
        : "text-[color:var(--foreground-soft)]";

  return (
    <Panel>
      <div className={`h-1 w-full ${accentTone}`} />
      <div className="space-y-3 px-6 py-5">
        <p className="med-label">{label}</p>
        <p className={`text-4xl font-semibold tracking-tight ${valueTone}`}>{value}</p>
        <p className="text-sm text-[color:var(--muted)]">{subtext}</p>
      </div>
    </Panel>
  );
}

export function Toast({
  message,
  duration = 3000,
  onClose,
}: {
  message: string;
  duration?: number;
  onClose?: () => void;
}) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      onClose?.();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  if (!visible) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-slide-in">
      <div className="med-surface-strong flex items-center gap-3 rounded-2xl border-emerald-200/60 px-4 py-3">
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500">
          <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="text-sm font-medium text-[color:var(--foreground)]">{message}</p>
      </div>
    </div>
  );
}

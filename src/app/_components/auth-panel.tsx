"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { ButtonFx, buttonClassName } from "@/app/_components/medos-ui";
import {
  getWorkspaceSession,
  signInWorkspaceUser,
  signUpWorkspaceUser,
} from "@/lib/workspace-data";

type AuthMode = "login" | "signup";

const roleOptions = ["Admin", "Doctor", "Nurse", "Receptionist"];

export function AuthPanel({ mode }: { mode: AuthMode }) {
  const router = useRouter();
  const isSignup = mode === "signup";
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState(roleOptions[0]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    getWorkspaceSession().then((session) => {
      if (active && session) {
        router.replace("/dashboard");
      }
    });

    return () => {
      active = false;
    };
  }, [router]);

  const title = useMemo(
    () => (isSignup ? "Create a clinical workspace account" : "Welcome back to the command center"),
    [isSignup]
  );
  const description = useMemo(
    () =>
      isSignup
        ? "Set up your hospital role and open the workspace with a calmer, more focused intake experience."
        : "Sign in to continue with triage, reports, prescriptions, and patient operations.",
    [isSignup]
  );

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);

    if (isSignup && password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      if (isSignup) {
        await signUpWorkspaceUser({
          email,
          password,
          fullName,
          role,
        });
        router.replace("/dashboard");
        return;
      }

      await signInWorkspaceUser({
        email,
        password,
      });

      router.replace("/dashboard");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Authentication failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen px-4 py-8 sm:px-6">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-7xl gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="med-hero relative hidden rounded-[34px] px-8 py-8 lg:flex lg:flex-col lg:justify-between">
          <div className="space-y-8">
            <div className="flex items-center gap-4">
              <div className="relative h-18 w-18 shrink-0">
                <Image
                  src="/djed-ice.svg"
                  alt="Djed Ice logo"
                  fill
                  className="object-contain"
                  sizes="72px"
                  priority
                />
              </div>
              <div>
                <p className="text-[1.6rem] font-extrabold tracking-[-0.04em] text-[color:var(--foreground-soft)]">
                  Djed Ice
                </p>
                <p className="med-label mt-1">Med and Clinical AI</p>
              </div>
            </div>

            <div className="max-w-xl space-y-5">
              <p className="med-kicker">Secure Clinical Workspace</p>
              <h1 className="text-5xl font-extrabold leading-[1.04] tracking-[-0.05em] text-[color:var(--foreground-soft)]">
                Hospital operations with better focus, hierarchy, and calm.
              </h1>
              <p className="max-w-lg text-base leading-8 text-[color:var(--muted)]">
                Built for patient intake, reports, medication guidance, and daily clinical coordination without the visual clutter.
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <FeatureStat label="Live Modules" value="6" detail="Queue, records, reports, and more" />
            <FeatureStat label="Theme Ready" value="2" detail="Light and dark workspace modes" />
            <FeatureStat label="Role Aware" value="4" detail="Admin, doctor, nurse, receptionist" />
          </div>
        </section>

        <section className="med-surface-strong flex rounded-[34px] px-5 py-6 sm:px-7 sm:py-8 lg:px-8">
          <div className="mx-auto w-full max-w-md">
            <div className="flex items-center gap-3 lg:hidden">
              <div className="relative h-12 w-12 shrink-0">
                <Image
                  src="/djed-ice.svg"
                  alt="Djed Ice logo"
                  fill
                  className="object-contain"
                  sizes="48px"
                  priority
                />
              </div>
              <div>
                <p className="text-xl font-extrabold tracking-[-0.04em] text-[color:var(--foreground-soft)]">
                  Djed Ice
                </p>
                <p className="med-label mt-1">Clinical AI</p>
              </div>
            </div>

            <div className="mt-8 space-y-3">
              <p className="med-kicker">{isSignup ? "Sign up" : "Login"}</p>
              <h2 className="text-3xl font-extrabold tracking-[-0.04em] text-[color:var(--foreground-soft)]">
                {title}
              </h2>
              <p className="text-sm leading-7 text-[color:var(--muted)]">{description}</p>
            </div>

            <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
              {isSignup ? (
                <Field label="Full name">
                  <input
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                    required
                    className="med-input"
                  />
                </Field>
              ) : null}

              {isSignup ? (
                <Field label="Role">
                  <select
                    value={role}
                    onChange={(event) => setRole(event.target.value)}
                    className="med-select"
                  >
                    {roleOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </Field>
              ) : null}

              <Field label="Email">
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  className="med-input"
                />
              </Field>

              <Field label="Password">
                <PasswordField
                  value={password}
                  onChange={setPassword}
                  visible={showPassword}
                  onToggle={() => setShowPassword((value) => !value)}
                />
              </Field>

              {isSignup ? (
                <Field label="Confirm password">
                  <PasswordField
                    value={confirmPassword}
                    onChange={setConfirmPassword}
                    visible={showConfirmPassword}
                    onToggle={() => setShowConfirmPassword((value) => !value)}
                  />
                </Field>
              ) : null}

              {error ? (
                <div className="rounded-2xl border border-rose-200 bg-rose-500/10 px-4 py-3 text-sm text-rose-700">
                  {error}
                </div>
              ) : null}

              {message ? (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700">
                  {message}
                </div>
              ) : null}

              <button type="submit" disabled={loading} className={buttonClassName({ fullWidth: true })}>
                <ButtonFx />
                <span className="relative z-10 inline-flex items-center justify-center gap-2">
                  {loading
                    ? isSignup
                      ? "Creating account..."
                      : "Signing in..."
                    : isSignup
                      ? "Create account"
                      : "Sign in"}
                </span>
              </button>
            </form>

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              <InfoPill title="Protected access" detail="Role-based routing and session checks." />
              <InfoPill title="Focused UI" detail="Cleaner dashboards and more readable forms." />
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-between gap-3 text-sm text-[color:var(--muted)]">
              <span>{isSignup ? "Already have an account?" : "No account yet?"}</span>
              <Link href={isSignup ? "/login" : "/signup"} className={buttonClassName({ subtle: true })}>
                <ButtonFx />
                <span className="relative z-10 inline-flex items-center gap-2">
                  {isSignup ? "Go to login" : "Create one"}
                </span>
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="med-label mb-2 block">{label}</span>
      {children}
    </label>
  );
}

function PasswordField({
  value,
  onChange,
  visible,
  onToggle,
}: {
  value: string;
  onChange: (value: string) => void;
  visible: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="relative">
      <input
        type={visible ? "text" : "password"}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required
        className="med-input pr-14"
      />
      <button
        type="button"
        onClick={onToggle}
        className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-[color:var(--muted)] transition hover:text-[color:var(--foreground)]"
      >
        {visible ? "Hide" : "Show"}
      </button>
    </div>
  );
}

function FeatureStat({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="med-surface-strong rounded-[24px] px-4 py-4">
      <p className="med-label">{label}</p>
      <p className="mt-3 text-3xl font-extrabold tracking-[-0.04em] text-[color:var(--foreground-soft)]">
        {value}
      </p>
      <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">{detail}</p>
    </div>
  );
}

function InfoPill({
  title,
  detail,
}: {
  title: string;
  detail: string;
}) {
  return (
    <div className="med-surface rounded-[22px] px-4 py-4">
      <p className="text-sm font-semibold text-[color:var(--foreground-soft)]">{title}</p>
      <p className="mt-2 text-xs leading-5 text-[color:var(--muted)]">{detail}</p>
    </div>
  );
}

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
    () => (isSignup ? "Create your account" : "Welcome back"),
    [isSignup]
  );

  const description = useMemo(
    () =>
      isSignup
        ? "Create your account to access the workspace."
        : "Sign in with your account to continue.",
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
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#dbeafe,transparent_32%),linear-gradient(180deg,#f8fbff_0%,#eef4f8_100%)] px-4 py-10">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-6xl items-center justify-center">
        <div className="grid w-full overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_24px_60px_rgba(15,23,42,0.12)] lg:grid-cols-[1.05fr_0.95fr]">
          <section className="relative hidden overflow-hidden bg-slate-950 px-10 py-12 text-white lg:flex lg:flex-col lg:justify-between">
            <div className="absolute inset-0">
              <Image
                src="/ice-background.svg"
                alt=""
                fill
                className="object-cover opacity-25"
                sizes="50vw"
                priority
              />
              <div className="absolute inset-0 bg-slate-950/80" />
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-4">
                <div className="relative h-20 w-20 shrink-0">
                  <Image
                    src="/djed-ice.svg"
                    alt="Djed Ice logo"
                    fill
                    className="object-contain"
                    sizes="80px"
                    priority
                  />
                </div>
                <div>
                  <p className="text-3xl font-semibold leading-none text-white">
                    Djed Ice
                  </p>
                  <p className="mt-2 text-xs uppercase tracking-[0.3em] text-sky-300">
                    Med &amp; Clinical
                  </p>
                  <p className="mt-1 text-xs uppercase tracking-[0.3em] text-slate-400">
                    AI Assistant
                  </p>
                </div>
              </div>

              <div className="mt-14 max-w-xl space-y-5">
                <p className="text-xs font-medium uppercase tracking-[0.3em] text-sky-300">
                  Secure clinical workspace
                </p>
                <h1 className="text-4xl font-semibold tracking-tight text-white">
                  Authenticated access for the hospital AI workflow.
                </h1>
              </div>
            </div>
          </section>

          <section className="px-6 py-8 sm:px-10 sm:py-10">
            <div className="mx-auto max-w-md">
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
                  <p className="text-xl font-semibold leading-none text-slate-950">
                    Djed Ice
                  </p>
                  <p className="mt-1 text-[10px] uppercase tracking-[0.28em] text-slate-500">
                    Med &amp; Clinical
                  </p>
                  <p className="mt-1 text-[10px] uppercase tracking-[0.28em] text-slate-400">
                    AI Assistant
                  </p>
                </div>
              </div>

              <div className="mt-10 space-y-2">
                <p className="text-xs font-medium uppercase tracking-[0.28em] text-sky-700">
                  {isSignup ? "Sign up" : "Login"}
                </p>
                <h2 className="text-3xl font-semibold tracking-tight text-slate-950">
                  {title}
                </h2>
                <p className="text-sm leading-7 text-slate-500">{description}</p>
              </div>

              <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
                {isSignup ? (
                  <Field label="Full name">
                    <input
                      value={fullName}
                      onChange={(event) => setFullName(event.target.value)}
                      required
                      className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white"
                    />
                  </Field>
                ) : null}

                {isSignup ? (
                  <Field label="Role">
                    <select
                      value={role}
                      onChange={(event) => setRole(event.target.value)}
                      className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white"
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
                    className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white"
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
                  <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    {error}
                  </div>
                ) : null}

                {message ? (
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                    {message}
                  </div>
                ) : null}

                <button
                  type="submit"
                  disabled={loading}
                  className={buttonClassName({ fullWidth: true })}
                >
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

              <div className="mt-8 flex items-center justify-between gap-3 text-sm text-slate-500">
                <span>
                  {isSignup ? "Already have an account?" : "No account yet?"}
                </span>
                <Link
                  href={isSignup ? "/login" : "/signup"}
                  className={buttonClassName({ subtle: true })}
                >
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
      <span className="mb-2 block text-sm font-medium text-slate-700">{label}</span>
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
        className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 pr-14 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white"
      />
      <button
        type="button"
        onClick={onToggle}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-500 transition hover:text-slate-800"
      >
        {visible ? "Hide" : "Show"}
      </button>
    </div>
  );
}

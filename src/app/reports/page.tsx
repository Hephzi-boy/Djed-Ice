"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import {
  DataPill,
  Modal,
  Panel,
  PrimaryButton,
  ReportIcon,
  SparkIcon,
  Toast,
  buttonClassName,
} from "../_components/medos-ui";
import {
  fetchReportsWorkspaceData,
  generateReportDraft,
  type ReportWorkspaceData,
} from "@/lib/workspace-data";

const reportTypes = ["Discharge", "Referral", "Summary"] as const;

export default function ReportsPage() {
  const [workspace, setWorkspace] = useState<ReportWorkspaceData | null>(null);
  const [selectedPatient, setSelectedPatient] = useState("");
  const [reportType, setReportType] = useState<(typeof reportTypes)[number]>(reportTypes[0]);
  const [symptoms, setSymptoms] = useState("");
  const [treatment, setTreatment] = useState("");
  const [generatedDraft, setGeneratedDraft] = useState<string | null>(null);
  const [generatedDraftTitle, setGeneratedDraftTitle] = useState<string | null>(null);
  const [generatedIdentifier, setGeneratedIdentifier] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isDraftModalOpen, setIsDraftModalOpen] = useState(false);
  const [attachmentName, setAttachmentName] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const attachmentInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    let active = true;

    fetchReportsWorkspaceData().then((result) => {
      if (!active) {
        return;
      }

      setWorkspace(result);
      const initialPatient = result.patients[0];

      if (initialPatient) {
        setSelectedPatient(initialPatient.id);
        applyPatientPrefill(initialPatient);
      }
    });

    return () => {
      active = false;
    };
  }, []);

  const selectedPatientRecord = useMemo(
    () => workspace?.patients.find((patient) => patient.id === selectedPatient) || null,
    [selectedPatient, workspace]
  );
  const selectedPatientLabel = selectedPatientRecord?.label || "";
  const previewTitle =
    reportType && selectedPatientLabel ? `${reportType} - ${selectedPatientLabel}` : "AI draft preview";
  const activeDraft = generatedDraft || workspace?.latestDraft?.content || null;
  const activeDraftTitle =
    (generatedDraft ? generatedDraftTitle : workspace?.latestDraft?.title) || previewTitle;
  const activeIdentifier =
    (generatedDraft ? generatedIdentifier : workspace?.latestDraft?.identifier) || "No identifier";
  const activeConfidence = workspace?.latestDraft?.confidence || "92%";
  const draftSourceLabel = generatedDraft ? "Live draft preview" : "Saved draft preview";
  const draftUpdatedLabel = generatedDraft ? "Updated just now" : "Updated 2m ago";
  const insightText = buildClinicalInsight(symptoms, treatment);

  function applyPatientPrefill(
    patient:
      | {
          symptoms: string | null;
          treatment: string | null;
        }
      | undefined
  ) {
    setSymptoms(patient?.symptoms || "");
    setTreatment(patient?.treatment || "");
  }

  function handlePatientChange(patientId: string) {
    setSelectedPatient(patientId);
    const patient = workspace?.patients.find((item) => item.id === patientId);
    applyPatientPrefill(patient);
  }

  async function handleGenerateDraft() {
    setLoading(true);
    const nextPreviewTitle =
      reportType && selectedPatientLabel ? `${reportType} - ${selectedPatientLabel}` : "AI draft preview";

    const draft = await generateReportDraft({
      symptoms,
      treatment,
      patientId: selectedPatient || null,
      patientLabel: selectedPatientLabel || null,
      reportType,
    });

    setGeneratedDraft(draft);

    if (draft) {
      setGeneratedDraftTitle(nextPreviewTitle);
      setIsDraftModalOpen(true);
      const refreshed = await fetchReportsWorkspaceData();
      setWorkspace(refreshed);
      setGeneratedIdentifier(refreshed.latestDraft?.identifier || null);
      setToastMessage("AI report generated and preview refreshed.");
    } else {
      setGeneratedDraftTitle(null);
      setGeneratedIdentifier(null);
    }

    setLoading(false);
  }

  function handleDownloadDraft() {
    if (!activeDraft) {
      return;
    }

    const blob = new Blob([activeDraft], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${activeDraftTitle.replace(/\s+/g, "-").toLowerCase() || "clinical-report"}.txt`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  }

  function handleSendToPatient() {
    if (!activeDraft) {
      return;
    }

    setToastMessage("Patient-ready draft queued for sharing.");
  }

  return (
    <div className="mx-auto max-w-[1220px] space-y-5">
      <section className="rounded-[24px] border border-slate-200/80 bg-white px-5 py-5 shadow-[0_12px_34px_rgba(15,23,42,0.06)] sm:px-7">
        <h1 className="text-[30px] font-semibold tracking-tight text-slate-950">Medical Report Generator</h1>
        <p className="mt-2 text-[15px] leading-7 text-slate-600">
          Select a patient, enter clinical details, and generate a high-fidelity diagnostic draft with Gemini AI.
        </p>
      </section>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.08fr)_360px]">
        <Panel className="border-slate-200/80 bg-white">
          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-700">
                <ReportIcon className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-950">Patient Case Entry</p>
              </div>
            </div>
            <DataPill tone="neutral">Input Mode</DataPill>
          </div>

          <div className="space-y-6 px-6 py-6">
            <Field label="Patient selection">
              <select
                value={selectedPatient}
                onChange={(event) => handlePatientChange(event.target.value)}
                className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-[15px] text-slate-800 outline-none"
              >
                <option value="">Select a patient</option>
                {(workspace?.patients || []).map((patient) => (
                  <option key={patient.id} value={patient.id}>
                    {patient.label}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Report classification">
              <div className="grid gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-1 sm:grid-cols-3">
                {reportTypes.map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setReportType(type)}
                    className={`h-11 rounded-xl text-sm font-medium transition ${
                      reportType === type
                        ? "bg-sky-700 text-white shadow-sm"
                        : "text-slate-600 hover:bg-white"
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </Field>

            <Field label="Clinical symptoms">
              <textarea
                value={symptoms}
                onChange={(event) => setSymptoms(event.target.value)}
                placeholder="Describe patient symptoms, severity, and timeline."
                className="min-h-32 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-[15px] leading-7 text-slate-800 outline-none placeholder:text-slate-400"
              />
            </Field>

            <Field label="Treatment protocol">
              <textarea
                value={treatment}
                onChange={(event) => setTreatment(event.target.value)}
                placeholder="Document the current treatment protocol, monitoring plan, and follow-up."
                className="min-h-32 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-[15px] leading-7 text-slate-800 outline-none placeholder:text-slate-400"
              />
            </Field>

            <div className="flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <input
                  ref={attachmentInputRef}
                  type="file"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    setAttachmentName(file?.name || "");
                  }}
                />
                <button
                  type="button"
                  onClick={() => attachmentInputRef.current?.click()}
                  className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-sky-700"
                >
                  <span className="text-base">+</span>
                  Attach labs
                </button>
                {attachmentName ? (
                  <span className="truncate text-sm text-slate-500">{attachmentName}</span>
                ) : null}
              </div>

              <PrimaryButton icon={<SparkIcon className="h-4 w-4" />} onClick={handleGenerateDraft} disabled={loading}>
                {loading ? "Generating..." : "Generate AI Report"}
              </PrimaryButton>
            </div>
          </div>
        </Panel>

        <div className="space-y-4">
          <Panel className="border-slate-200/80 bg-white">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-50 text-sky-700">
                  <SparkIcon className="h-3.5 w-3.5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-950">Live Draft Preview</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-slate-400">Auto-saving</span>
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
              </div>
            </div>

            <div className="space-y-5 px-5 py-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[28px] font-semibold leading-8 tracking-tight text-slate-950">{activeDraftTitle}</p>
                  <p className="mt-2 text-sm text-slate-500">
                    {activeIdentifier} • {draftUpdatedLabel}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-semibold tracking-tight text-sky-700">{activeConfidence}</p>
                  <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-slate-400">Confidence</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsDraftModalOpen(true)}
                disabled={!activeDraft}
                className="block w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left transition hover:border-sky-300 hover:bg-sky-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-950">Review AI report</p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      The draft has been enhanced with clinical codification and structured recommendations based on recent guidelines.
                    </p>
                  </div>
                  <span className="text-lg text-slate-400">→</span>
                </div>
                <div className="mt-4 h-1.5 rounded-full bg-slate-200">
                  <div className="h-1.5 rounded-full bg-sky-700" style={{ width: `${parseConfidence(activeConfidence)}%` }} />
                </div>
              </button>

              <div className="space-y-2">
                {activeDraft ? (
                  <DraftPreviewSnippet content={activeDraft} />
                ) : (
                  <>
                    <PreviewSkeleton />
                    <PreviewSkeleton />
                    <PreviewSkeleton />
                    <PreviewSkeleton short />
                  </>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={handleDownloadDraft}
                  disabled={!activeDraft}
                  className={`${buttonClassName({ subtle: true, fullWidth: true })} h-12 text-sm shadow-none disabled:opacity-50`}
                >
                  Download PDF
                </button>
                <PrimaryButton
                  icon={<SparkIcon className="h-4 w-4" />}
                  onClick={handleSendToPatient}
                  disabled={!activeDraft}
                  className="h-12"
                >
                  Send to Patient
                </PrimaryButton>
              </div>
            </div>
          </Panel>

          <div className="grid grid-cols-2 gap-3">
            <MiniStatCard
              label="AI Processing"
              value={loading ? "..." : "1.2s"}
              detail={loading ? "Running generation" : "↘ -0.3s"}
            />
            <MiniStatCard label="Drafts Today" value="14" detail="↗ +15%" />
          </div>

          <Panel className="border-slate-200/80 bg-[#eef4ff]">
            <div className="px-5 py-4">
              <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-sky-700">Clinical Insight</p>
              <p className="mt-3 text-sm leading-6 text-slate-700">{insightText}</p>
            </div>
          </Panel>
        </div>
      </div>

      <Modal
        open={isDraftModalOpen && Boolean(activeDraft)}
        onClose={() => setIsDraftModalOpen(false)}
        title={activeDraftTitle}
        description={`${draftSourceLabel} for clinician review.`}
      >
        {activeDraft ? <DraftBody content={activeDraft} /> : null}
      </Modal>

      {toastMessage ? <Toast message={toastMessage} onClose={() => setToastMessage(null)} /> : null}
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
      <span className="mb-2 block text-[10px] font-medium uppercase tracking-[0.24em] text-slate-500">
        {label}
      </span>
      {children}
    </label>
  );
}

function DraftBody({ content }: { content: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-[15px] leading-7 text-slate-700 whitespace-pre-wrap">
      {content}
    </div>
  );
}

function DraftPreviewSnippet({ content }: { content: string }) {
  const lines = content
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 4);

  return (
    <div className="space-y-2">
      {lines.map((line) => (
        <div key={line} className="h-3 rounded-full bg-slate-100" style={{ width: `${Math.min(100, Math.max(52, line.length * 1.8))}%` }} />
      ))}
    </div>
  );
}

function PreviewSkeleton({ short = false }: { short?: boolean }) {
  return <div className={`h-3 rounded-full bg-slate-100 ${short ? "w-2/3" : "w-full"}`} />;
}

function MiniStatCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white px-4 py-4 shadow-[0_12px_30px_rgba(15,23,42,0.04)]">
      <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-slate-500">{label}</p>
      <p className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">{value}</p>
      <p className="mt-2 text-xs text-slate-500">{detail}</p>
    </div>
  );
}

function parseConfidence(value: string) {
  const numeric = Number.parseInt(value.replace("%", ""), 10);
  return Number.isNaN(numeric) ? 0 : Math.max(0, Math.min(100, numeric));
}

function buildClinicalInsight(symptoms: string, treatment: string) {
  if (symptoms && treatment) {
    return `Patient history suggests ${symptoms.toLowerCase().slice(0, 82)}. Consider confirming treatment escalation against the documented protocol and follow-up window.`;
  }

  if (symptoms) {
    return `Symptoms indicate the case should be reviewed for supporting labs, recurrence risk, and a structured follow-up plan before patient discharge.`;
  }

  return "Populate symptoms and treatment details to receive a clearer AI-driven clinical insight panel.";
}

"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import {
  DataPill,
  MedosPage,
  Modal,
  Panel,
  PanelHeader,
  PrimaryButton,
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
    <MedosPage
      sectionNumber="04"
      sectionTitle="AI Documentation"
      title="Medical Report Generator"
      description="Select a patient, enter clinical details, and generate a high-fidelity diagnostic draft with Gemini AI."
    >
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.08fr)_360px]">
        <Panel>
          <PanelHeader
            title="Patient case entry"
            subtitle="Write the clinical story once, then let the draft preview tighten the structure."
            right={<DataPill tone="neutral">Input mode</DataPill>}
          />

          <div className="space-y-6 px-6 py-6">
            <Field label="Patient selection">
              <select
                value={selectedPatient}
                onChange={(event) => handlePatientChange(event.target.value)}
                className="med-select"
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
              <div className="grid gap-2 rounded-[22px] border border-[color:var(--border-subtle)] bg-[color:var(--surface-muted)] p-1 sm:grid-cols-3">
                {reportTypes.map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setReportType(type)}
                    className={`h-11 rounded-2xl text-sm font-semibold transition ${
                      reportType === type
                        ? "bg-[linear-gradient(135deg,var(--accent),var(--accent-strong))] text-white shadow-[var(--shadow-soft)]"
                        : "text-[color:var(--muted)] hover:bg-[color:var(--surface-strong)]"
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
                className="med-textarea min-h-32"
              />
            </Field>

            <Field label="Treatment protocol">
              <textarea
                value={treatment}
                onChange={(event) => setTreatment(event.target.value)}
                placeholder="Document the current treatment protocol, monitoring plan, and follow-up."
                className="med-textarea min-h-32"
              />
            </Field>

            <div className="flex flex-col gap-3 border-t border-[color:var(--border-subtle)] pt-4 sm:flex-row sm:items-center sm:justify-between">
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
                  className="rounded-full border border-[color:var(--border-subtle)] bg-[color:var(--surface-elevated)] px-4 py-2 text-sm font-semibold text-[color:var(--foreground)]"
                >
                  Attach labs
                </button>
                {attachmentName ? (
                  <span className="truncate text-sm text-[color:var(--muted)]">{attachmentName}</span>
                ) : null}
              </div>

              <PrimaryButton icon={<SparkIcon className="h-4 w-4" />} onClick={handleGenerateDraft} disabled={loading}>
                {loading ? "Generating..." : "Generate AI report"}
              </PrimaryButton>
            </div>
          </div>
        </Panel>

        <div className="space-y-4">
          <Panel>
            <PanelHeader
              title="Live draft preview"
              subtitle={`${draftSourceLabel} | ${draftUpdatedLabel}`}
              right={<DataPill tone="green">Auto-saving</DataPill>}
            />

            <div className="space-y-5 px-5 py-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[1.7rem] font-bold leading-8 tracking-[-0.04em] text-[color:var(--foreground-soft)]">
                    {activeDraftTitle}
                  </p>
                  <p className="mt-2 text-sm text-[color:var(--muted)]">{activeIdentifier}</p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold tracking-[-0.04em] text-[color:var(--accent-strong)]">{activeConfidence}</p>
                  <p className="med-label mt-1">Confidence</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsDraftModalOpen(true)}
                disabled={!activeDraft}
                className="med-surface-muted block w-full rounded-[24px] p-4 text-left transition hover:border-[color:var(--border-strong)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-[color:var(--foreground-soft)]">Review AI report</p>
                    <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">
                      The draft has been enhanced with clinical codification and structured recommendations based on recent guidelines.
                    </p>
                  </div>
                  <span className="text-lg text-[color:var(--muted)]">&gt;</span>
                </div>
                <div className="mt-4 h-1.5 rounded-full bg-[color:var(--surface-strong)]">
                  <div className="h-1.5 rounded-full bg-[linear-gradient(90deg,var(--accent),var(--accent-strong))]" style={{ width: `${parseConfidence(activeConfidence)}%` }} />
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
                  Download draft
                </button>
                <PrimaryButton
                  icon={<SparkIcon className="h-4 w-4" />}
                  onClick={handleSendToPatient}
                  disabled={!activeDraft}
                  className="h-12"
                >
                  Send to patient
                </PrimaryButton>
              </div>
            </div>
          </Panel>

          <div className="grid grid-cols-2 gap-3">
            <MiniStatCard
              label="AI processing"
              value={loading ? "..." : "1.2s"}
              detail={loading ? "Running generation" : "0.3s faster"}
            />
            <MiniStatCard label="Drafts today" value="14" detail="15% higher" />
          </div>

          <Panel className="bg-[linear-gradient(135deg,rgba(14,165,233,0.12),rgba(37,99,235,0.1))]">
            <div className="px-5 py-5">
              <p className="med-kicker">Clinical insight</p>
              <p className="mt-3 text-sm leading-7 text-[color:var(--foreground)]">{insightText}</p>
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
    </MedosPage>
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

function DraftBody({ content }: { content: string }) {
  return (
    <div className="med-surface-muted rounded-[24px] p-4 whitespace-pre-wrap text-[15px] leading-7 text-[color:var(--foreground)]">
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
        <div key={line} className="h-3 rounded-full bg-[color:var(--surface-muted)]" style={{ width: `${Math.min(100, Math.max(52, line.length * 1.8))}%` }} />
      ))}
    </div>
  );
}

function PreviewSkeleton({ short = false }: { short?: boolean }) {
  return <div className={`h-3 rounded-full bg-[color:var(--surface-muted)] ${short ? "w-2/3" : "w-full"}`} />;
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
    <div className="med-surface-strong rounded-[24px] px-4 py-4">
      <p className="med-label">{label}</p>
      <p className="mt-3 text-2xl font-bold tracking-[-0.04em] text-[color:var(--foreground-soft)]">{value}</p>
      <p className="mt-2 text-xs text-[color:var(--muted)]">{detail}</p>
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
    return "Symptoms indicate the case should be reviewed for supporting labs, recurrence risk, and a structured follow-up plan before patient discharge.";
  }

  return "Populate symptoms and treatment details to receive a clearer AI-driven clinical insight panel.";
}

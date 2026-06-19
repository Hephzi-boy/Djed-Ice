"use client";

import { useEffect, useMemo, useState } from "react";

import {
  DataPill,
  MedosPage,
  Panel,
  PrimaryButton,
  SparkIcon,
} from "../_components/medos-ui";
import {
  fetchReportsWorkspaceData,
  generateReportDraft,
  type ReportWorkspaceData,
} from "@/lib/workspace-data";

const reportTypes = ["Discharge", "Referral", "Summary"];

export default function ReportsPage() {
  const [workspace, setWorkspace] = useState<ReportWorkspaceData | null>(null);
  const [selectedPatient, setSelectedPatient] = useState("");
  const [reportType, setReportType] = useState(reportTypes[0]);
  const [symptoms, setSymptoms] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [treatment, setTreatment] = useState("");
  const [generatedDraft, setGeneratedDraft] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;

    fetchReportsWorkspaceData().then((result) => {
      if (active) {
        setWorkspace(result);
        setSelectedPatient(result.patients[0]?.id || "");
      }
    });

    return () => {
      active = false;
    };
  }, []);

  const selectedPatientLabel = useMemo(
    () => workspace?.patients.find((patient) => patient.id === selectedPatient)?.label || "",
    [selectedPatient, workspace]
  );

  async function handleGenerateDraft() {
    setLoading(true);
    const draft = await generateReportDraft({
      symptoms,
      diagnosis,
      treatment,
    });
    setGeneratedDraft(draft);
    setLoading(false);
  }

  const previewTitle =
    reportType && selectedPatientLabel ? `${reportType} - ${selectedPatientLabel}` : "AI draft preview";

  return (
    <MedosPage
      sectionNumber="04"
      sectionTitle="AI Generator"
      title="Medical Report Generator"
      description="Select a patient, enter clinical details, and generate a draft with Gemini."
    >
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(430px,0.98fr)]">
        <Panel className="bg-white/95">
          <div className="border-b border-slate-200 px-6 py-4">
            <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-slate-500">
              Input
            </p>
            <h2 className="mt-2 text-xl font-semibold text-slate-950">Clinical data</h2>
          </div>

          <div className="space-y-5 px-6 py-5">
            <Field label="Patient">
              <select
                value={selectedPatient}
                onChange={(event) => setSelectedPatient(event.target.value)}
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-[15px] text-slate-800 outline-none"
              >
                <option value="">Select a patient</option>
                {(workspace?.patients || []).map((patient) => (
                  <option key={patient.id} value={patient.id}>
                    {patient.label}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Report type">
              <div className="grid gap-2 md:grid-cols-3">
                {reportTypes.map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setReportType(type)}
                    className={`h-11 rounded-xl border text-sm font-medium transition ${
                      reportType === type
                        ? "border-sky-700 bg-sky-700 text-white shadow-sm"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </Field>

            <Field label="Symptoms">
              <textarea
                value={symptoms}
                onChange={(event) => setSymptoms(event.target.value)}
                placeholder="Enter symptoms from intake or clinician review"
                className="min-h-20 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-[15px] text-slate-800 outline-none placeholder:text-slate-400"
              />
            </Field>

            <Field label="Diagnosis">
              <textarea
                value={diagnosis}
                onChange={(event) => setDiagnosis(event.target.value)}
                placeholder="Enter the working diagnosis"
                className="min-h-20 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-[15px] text-slate-800 outline-none placeholder:text-slate-400"
              />
            </Field>

            <Field label="Treatment">
              <textarea
                value={treatment}
                onChange={(event) => setTreatment(event.target.value)}
                placeholder="Enter treatment details for Gemini to structure"
                className="min-h-24 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-[15px] text-slate-800 outline-none placeholder:text-slate-400"
              />
            </Field>

            <PrimaryButton icon={<SparkIcon className="h-4 w-4" />} onClick={handleGenerateDraft} disabled={loading}>
              {loading ? "Generating..." : "Generate draft"}
            </PrimaryButton>
          </div>
        </Panel>

        <Panel className="bg-white/95">
          <div className="flex items-start justify-between border-b border-slate-200 px-6 py-4">
            <div>
              <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-slate-500">
                Draft for review
              </p>
              <h2 className="mt-2 text-xl font-semibold text-slate-950">{previewTitle}</h2>
            </div>
            {workspace?.latestDraft?.confidence ? (
              <DataPill tone="blue">{workspace.latestDraft.confidence}</DataPill>
            ) : null}
          </div>

          <div className="space-y-5 px-6 py-6">
            {generatedDraft ? (
              <DraftBody content={generatedDraft} />
            ) : workspace?.latestDraft?.content ? (
              <>
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-slate-500">
                    Latest saved draft
                  </p>
                  <h3 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                    {workspace.latestDraft.title || "Saved report"}
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    {workspace.latestDraft.identifier || "No identifier"}
                    {workspace.latestDraft.clinician
                      ? ` - ${workspace.latestDraft.clinician}`
                      : ""}
                  </p>
                </div>
                <DraftBody content={workspace.latestDraft.content} />
              </>
            ) : (
              <p className="text-sm text-slate-500">
                No saved report drafts were found and no Gemini draft has been generated yet.
              </p>
            )}
          </div>
        </Panel>
      </div>
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
      <span className="mb-2 block text-[10px] font-medium uppercase tracking-[0.28em] text-slate-500">
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

"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

import {
  MedosPage,
  Modal,
  Panel,
  PanelHeader,
  PillIcon,
  PrimaryButton,
  Toast,
  buttonClassName,
} from "../_components/medos-ui";
import {
  fetchPrescriptionData,
  updateAppointmentCheckupStatus,
  type PrescriptionData,
} from "@/lib/workspace-data";
import { useWorkspaceUser } from "../_components/user-session-context";

interface AiTreatmentReport {
  prescription: string;
  reasoning: string;
  treatmentPlan: string;
  followUp: string;
  patientInfo: {
    name: string;
    age: string;
    symptoms: string;
  };
}

export default function PrescriptionsPage() {
  const searchParams = useSearchParams();
  const [data, setData] = useState<PrescriptionData | null>(null);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isExplanationModalOpen, setIsExplanationModalOpen] = useState(false);
  const [aiReport, setAiReport] = useState<AiTreatmentReport | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCheckupClosed, setIsCheckupClosed] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [explanationView, setExplanationView] = useState<"doctor" | "patient">("doctor");
  const { role } = useWorkspaceUser();
  const selectedPatientId = searchParams.get("patientId");
  const selectedPatientName = searchParams.get("patientName");
  const selectedIllness = searchParams.get("illness");
  const visitReason = searchParams.get("visitReason");
  const appointmentId = searchParams.get("appointmentId");
  const [drug, setDrug] = useState("");
  const [frequency, setFrequency] = useState("");
  const [duration, setDuration] = useState("");
  const resolvedExplanation = resolvePrescriptionExplanation({
    data,
    drug,
    frequency,
    duration,
    illness: selectedIllness,
    visitReason,
  });

  useEffect(() => {
    let active = true;

    fetchPrescriptionData().then((result) => {
      if (active) {
        setData(result);
        setDrug(result.drug || "");
        setFrequency(result.frequency || "");
        setDuration(result.duration || "");
      }
    });

    if (selectedPatientId && selectedPatientName) {
      setTimeout(() => {
        if (active) {
          const symptoms = visitReason || selectedIllness || "General consultation";
          const aiRecommendation = getAiRecommendationForIllness(selectedIllness || symptoms, visitReason);
          const mockAiReport: AiTreatmentReport = {
            prescription: aiRecommendation.prescription,
            reasoning: aiRecommendation.reasoning,
            treatmentPlan: aiRecommendation.treatmentPlan,
            followUp: aiRecommendation.followUp,
            patientInfo: {
              name: selectedPatientName,
              age: "35",
              symptoms,
            },
          };
          setAiReport(mockAiReport);
          setDrug(aiRecommendation.drug);
          setFrequency(aiRecommendation.frequency);
          setDuration(aiRecommendation.duration);
        }
      }, 2000);
    }

    return () => {
      active = false;
    };
  }, [selectedPatientId, selectedPatientName, selectedIllness, visitReason]);

  const canUseAiPrescription =
    role === "doctor" || role === "admin" || role === "nurse" || role === "receptionist";
  const patientHeading = selectedPatientName || "Prescription Explainer";
  const safetyReady = Boolean(drug && frequency && duration);

  async function handleGenerateAiPrescription() {
    setIsGenerating(true);
    setAiReport(null);

    setTimeout(() => {
      const prescriptionText =
        drug && frequency && duration
          ? `${drug} - Take as prescribed: ${frequency} for ${duration}\n\nThis medication is prescribed based on the current clinical assessment.`
          : "No medication details specified. Please enter drug, frequency, and duration.";

      setAiReport({
        prescription: prescriptionText,
        reasoning: `Based on the patient's symptoms and clinical assessment, the AI analysis suggests the prescribed treatment. ${drug ? `${drug} is recommended` : "Consult with clinical guidelines"} for the presenting condition.`,
        treatmentPlan:
          "1. Rest and hydration - Ensure adequate fluid intake\n2. Symptom management - Use over-the-counter pain relievers as needed\n3. Monitor temperature - Check every 4 hours\n4. Isolation - Avoid close contact with others until fever-free for 24 hours",
        followUp:
          "Schedule follow-up appointment in 7 days to assess treatment response. Seek immediate medical attention if symptoms worsen or new symptoms develop.",
        patientInfo: {
          name: selectedPatientName || "Current Patient",
          age: "35",
          symptoms: visitReason || "Fever, sore throat, difficulty swallowing",
        },
      });
      setIsGenerating(false);
    }, 2000);
  }

  function handleDownloadReport(report: AiTreatmentReport) {
    const reportContent = `
PATIENT TREATMENT REPORT
========================

PATIENT INFORMATION
-------------------
Name: ${report.patientInfo.name}
Age: ${report.patientInfo.age}
Symptoms: ${report.patientInfo.symptoms}

PRESCRIPTION
------------
${report.prescription}

CLINICAL REASONING
------------------
${report.reasoning}

TREATMENT PLAN
--------------
${report.treatmentPlan}

FOLLOW-UP INSTRUCTIONS
----------------------
${report.followUp}
    `.trim();

    const blob = new Blob([reportContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `patient-treatment-report-${report.patientInfo.name.replace(/\s+/g, "-")}.txt`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  }

  function handleDownloadPdfReport(report: AiTreatmentReport) {
    const reportContent = `
PATIENT TREATMENT REPORT
========================

PATIENT INFORMATION
-------------------
Name: ${report.patientInfo.name}
Age: ${report.patientInfo.age}
Symptoms: ${report.patientInfo.symptoms}

PRESCRIPTION
------------
${report.prescription}

CLINICAL REASONING
------------------
${report.reasoning}

TREATMENT PLAN
--------------
${report.treatmentPlan}

FOLLOW-UP INSTRUCTIONS
----------------------
${report.followUp}
    `.trim();

    const blob = createPdfBlob(reportContent);
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `patient-treatment-report-${report.patientInfo.name.replace(/\s+/g, "-")}.pdf`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  }

  async function handleCloseCheckup() {
    setIsCheckupClosed(true);
    setToastMessage(
      "Checkup has been closed and results have been uploaded to the system for nurses, admins, and receptionists."
    );

    if (appointmentId) {
      await updateAppointmentCheckupStatus(appointmentId, "completed");
    }
  }

  return (
    <MedosPage
      sectionNumber="05"
      sectionTitle="Medication Guidance"
      title="Prescription Explainer"
      description="Review medication explanations and supporting guidance with a cleaner handoff between clinician context and patient-friendly language."
    >
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <Panel>
          <PanelHeader
            title="Medication details"
            subtitle="Enter the current medication details to unlock explanations and interaction guidance."
          />

          <div className="space-y-5 px-6 py-6">
            <Field label="Drug" value={drug} onChange={setDrug} placeholder="E.g. Lisinopril 10mg" />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Frequency" value={frequency} onChange={setFrequency} placeholder="E.g. Once daily" />
              <Field label="Duration" value={duration} onChange={setDuration} placeholder="E.g. 30 days" />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <PrimaryButton onClick={() => setIsExplanationModalOpen(true)} className="w-full">
                Load explanation
              </PrimaryButton>
              {canUseAiPrescription ? (
                <button
                  type="button"
                  onClick={() => setIsAiModalOpen(true)}
                  className={`${buttonClassName({ subtle: true, fullWidth: true })} h-12 shadow-none`}
                >
                  Open treatment plan
                </button>
              ) : null}
            </div>

            <div className="rounded-[24px] border border-amber-200 bg-amber-500/10 px-4 py-4">
              <p className="med-label text-amber-700">AI interaction check</p>
              <p className="mt-2 text-sm leading-7 text-amber-950">
                {resolvedExplanation.interactionWarning || "No interaction warning is available yet. Please complete the medication details to run the automated safety analysis."}
              </p>
            </div>

            {aiReport && (role === "nurse" || role === "admin" || role === "receptionist") ? (
              <div className="med-surface-muted rounded-[24px] px-4 py-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-[color:var(--foreground-soft)]">{aiReport.patientInfo.name}</p>
                    <p className="mt-1 text-xs text-[color:var(--muted)]">{aiReport.patientInfo.symptoms}</p>
                  </div>
                  <span className="text-xs font-medium text-[color:var(--muted)]">
                    {isCheckupClosed ? "Checkup completed" : "In progress"}
                  </span>
                </div>
                <div className="mt-4 flex gap-2">
                  <PrimaryButton subtle onClick={() => handleDownloadReport(aiReport)} className="h-10 px-4 shadow-none">
                    View report
                  </PrimaryButton>
                  <PrimaryButton onClick={() => handleDownloadPdfReport(aiReport)} className="h-10 px-4">
                    Download PDF
                  </PrimaryButton>
                </div>
              </div>
            ) : null}
          </div>
        </Panel>

        <div className="space-y-4">
          <Panel className="bg-[linear-gradient(135deg,rgba(14,165,233,0.12),rgba(37,99,235,0.1))]">
            <div className="px-5 py-5">
              <h2 className="text-[18px] font-semibold tracking-[-0.03em] text-[color:var(--foreground-soft)]">How it works</h2>
              <div className="mt-4 space-y-4">
                {[
                  "Enter the drug name, prescribed frequency, and the intended duration.",
                  "Our AI engine analyzes the latest clinical guidelines and interaction patterns.",
                  "Receive a role-aware explanation and a comprehensive safety interaction check.",
                ].map((step, index) => (
                  <div key={step} className="flex gap-3">
                    <span className="text-xs font-semibold text-[color:var(--accent-strong)]">{String(index + 1).padStart(2, "0")}.</span>
                    <p className="text-sm leading-7 text-[color:var(--muted)]">{step}</p>
                  </div>
                ))}
              </div>
            </div>
          </Panel>

          <Panel>
            <div className="px-5 py-5">
              <p className="text-sm font-semibold text-[color:var(--foreground-soft)]">Precision Scan v2.4</p>
              <p className="mt-1 text-xs text-[color:var(--muted)]">Latest update 21 Aug</p>
              <button
                type="button"
                onClick={() => setIsExplanationModalOpen(true)}
                className="mt-4 text-sm font-semibold text-[color:var(--accent-strong)]"
              >
                View release notes
              </button>
            </div>
          </Panel>

          <div className="overflow-hidden rounded-[28px] border border-[color:var(--border-subtle)] bg-[#07192a] shadow-[var(--shadow-strong)]">
            <div className="min-h-[180px] bg-[linear-gradient(180deg,rgba(14,165,233,0.2),rgba(7,25,42,0.8)),url('/ice-background.svg')] bg-cover bg-center px-5 py-5">
              <div className="flex h-full flex-col justify-end">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 text-white">
                  <PillIcon className="h-4 w-4" />
                </div>
                <p className="mt-4 text-sm font-semibold text-white">{patientHeading}</p>
                <p className="mt-2 max-w-[24ch] text-xs leading-6 text-slate-200">
                  Patient safety first. AI-assisted triage and medication logic remain active during review.
                </p>
                <div className="mt-4 inline-flex w-fit rounded-full bg-white/10 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.18em] text-white/80">
                  {safetyReady ? "Ready for analysis" : "Awaiting medication details"}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Modal
        open={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        title="AI treatment plan generator"
        description="Generate comprehensive AI-powered treatment plans with prescriptions, reasoning, and follow-up instructions for patient care."
        footer={
          aiReport ? undefined : (
            <>
              <PrimaryButton subtle onClick={() => setIsAiModalOpen(false)}>
                Cancel
              </PrimaryButton>
              <PrimaryButton onClick={handleGenerateAiPrescription} disabled={isGenerating}>
                {isGenerating ? "Generating..." : "Generate treatment plan"}
              </PrimaryButton>
            </>
          )
        }
      >
        <div className="space-y-4">
          {aiReport ? (
            <>
              <InfoCard title="Patient information">
                <p><strong>Name:</strong> {aiReport.patientInfo.name}</p>
                <p><strong>Age:</strong> {aiReport.patientInfo.age}</p>
                <p><strong>Symptoms:</strong> {aiReport.patientInfo.symptoms}</p>
              </InfoCard>
              <InfoCard title="AI-generated prescription">
                <div className="whitespace-pre-line">{aiReport.prescription}</div>
              </InfoCard>
              <InfoCard title="AI reasoning">{aiReport.reasoning}</InfoCard>
              <InfoCard title="Treatment plan">
                <div className="whitespace-pre-line">{aiReport.treatmentPlan}</div>
              </InfoCard>
              <InfoCard title="Follow-up instructions">{aiReport.followUp}</InfoCard>
              <div className="flex flex-wrap gap-3">
                <PrimaryButton onClick={() => handleDownloadReport(aiReport)}>
                  Download report
                </PrimaryButton>
                <PrimaryButton onClick={() => handleDownloadPdfReport(aiReport)}>
                  Download PDF
                </PrimaryButton>
              </div>
              {role === "doctor" && !isCheckupClosed ? (
                <PrimaryButton onClick={handleCloseCheckup}>Close checkup</PrimaryButton>
              ) : isCheckupClosed ? (
                <div className="text-sm font-medium text-emerald-600">Checkup completed</div>
              ) : null}
            </>
          ) : (
            <p className="text-sm text-[color:var(--muted)]">
              Click &quot;Generate Treatment Plan&quot; to create a comprehensive AI-powered treatment plan with prescriptions, reasoning, and follow-up instructions.
            </p>
          )}
        </div>
      </Modal>

      <Modal
        open={isExplanationModalOpen}
        onClose={() => setIsExplanationModalOpen(false)}
        title={resolvedExplanation.title}
        description="Review the medication explanation in the view that fits the current conversation."
      >
        <div className="space-y-5">
          <div className="inline-flex rounded-2xl border border-[color:var(--border-subtle)] bg-[color:var(--surface-muted)] p-1">
            <button
              type="button"
              onClick={() => setExplanationView("doctor")}
              className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${
                explanationView === "doctor"
                  ? "bg-[linear-gradient(135deg,var(--accent),var(--accent-strong))] text-white"
                  : "text-[color:var(--muted)]"
              }`}
            >
              Doctor view
            </button>
            <button
              type="button"
              onClick={() => setExplanationView("patient")}
              className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${
                explanationView === "patient"
                  ? "bg-[linear-gradient(135deg,var(--accent),var(--accent-strong))] text-white"
                  : "text-[color:var(--muted)]"
              }`}
            >
              Patient view
            </button>
          </div>

          <div className="space-y-6 text-[15px] leading-7 text-[color:var(--foreground)]">
            {resolvedExplanation.details.length ? (
              resolvedExplanation.details.map((detail) => (
                <ExplanationBlock
                  key={detail.label}
                  label={detail.label}
                  text={
                    explanationView === "doctor"
                      ? detail.text
                      : getPatientExplanation(detail.label, detail.text)
                  }
                />
              ))
            ) : (
              <p className="text-sm text-[color:var(--muted)]">
                No prescription explanation fields are available yet.
              </p>
            )}
          </div>
        </div>
      </Modal>

      {toastMessage ? <Toast message={toastMessage} onClose={() => setToastMessage(null)} /> : null}
    </MedosPage>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <label className="block">
      <span className="med-label mb-2 block">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="med-input"
      />
    </label>
  );
}

function ExplanationBlock({ label, text }: { label: string; text: string }) {
  return (
    <div>
      <p className="med-label">{label}</p>
      <p className="mt-2 text-[15px] text-[color:var(--foreground)]">{text}</p>
    </div>
  );
}

function InfoCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="med-label mb-2 block">{title}</p>
      <div className="med-surface-muted rounded-2xl p-4 text-sm text-[color:var(--foreground)]">{children}</div>
    </div>
  );
}

function getPatientExplanation(label: string, text: string) {
  switch (label) {
    case "Class":
      return "This medicine is an antibiotic used to treat infections caused by bacteria.";
    case "Indication":
      return "It may be used when your clinician believes a bacterial infection is likely.";
    case "Monitoring":
      return "Watch how you feel over the next two to three days and report any allergy signs quickly.";
    case "Notable adverse effects":
      return "Possible side effects include rash, nausea, stomach upset, or other reaction symptoms.";
    case "Contraindications":
      return "Do not use this medicine if you have had a serious allergy to penicillin-type antibiotics.";
    default:
      return text;
  }
}

function resolvePrescriptionExplanation({
  data,
  drug,
  frequency,
  duration,
  illness,
  visitReason,
}: {
  data: PrescriptionData | null;
  drug: string;
  frequency: string;
  duration: string;
  illness: string | null;
  visitReason: string | null;
}) {
  const storedDetails = data?.details ?? [];

  if (storedDetails.length) {
    return {
      title: data?.title || "Medication explanation",
      interactionWarning: data?.interactionWarning || "",
      details: storedDetails,
    };
  }

  if (!drug && !frequency && !duration) {
    return {
      title: data?.title || "Medication explanation",
      interactionWarning: data?.interactionWarning || "",
      details: [],
    };
  }

  const context = [illness, visitReason].filter(Boolean).join(". ");

  return {
    title: data?.title || `${drug || "Medication"} explanation`,
    interactionWarning: data?.interactionWarning || buildInteractionWarning(drug, illness),
    details: [
      {
        label: "Medication",
        text: drug || "No drug specified yet.",
      },
      {
        label: "Frequency",
        text: frequency || "No dosing frequency specified yet.",
      },
      {
        label: "Duration",
        text: duration || "No duration specified yet.",
      },
      {
        label: "Indication",
        text: context
          ? `This prescription appears to support the current clinical context: ${context}.`
          : "This prescription should be reviewed against the current symptoms and clinician assessment.",
      },
      {
        label: "Monitoring",
        text: "Check symptom response, tolerance, and any adverse reactions during the treatment window.",
      },
    ],
  };
}

function buildInteractionWarning(drug: string, illness: string | null) {
  const drugLower = drug.toLowerCase();
  const illnessLower = illness?.toLowerCase() || "";

  if (drugLower.includes("amoxicillin")) {
    return "Check for penicillin allergy before use and monitor for rash, diarrhea, or worsening symptoms.";
  }

  if (drugLower.includes("metformin")) {
    return "Review renal status, gastrointestinal tolerance, and concurrent diabetes medications before continuing therapy.";
  }

  if (drugLower.includes("amlodipine")) {
    return "Monitor blood pressure response and watch for dizziness, ankle swelling, or symptomatic hypotension.";
  }

  if (drugLower.includes("sumatriptan") || illnessLower.includes("migraine")) {
    return "Confirm migraine suitability and screen for cardiovascular risk factors before repeated dosing.";
  }

  if (drugLower.includes("paracetamol")) {
    return "Avoid exceeding the total daily dose and check for other acetaminophen-containing medicines.";
  }

  return "No interaction warning is available yet. Please complete the medication details to run the automated safety analysis.";
}

function getAiRecommendationForIllness(illness: string, visitReason?: string | null) {
  const illnessLower = illness.toLowerCase();
  const visitReasonLower = visitReason?.toLowerCase() || "";
  const combinedSymptoms = visitReason ? `${illness} - ${visitReason}` : illness;

  if (
    illnessLower.includes("bacterial") ||
    illnessLower.includes("respiratory") ||
    illnessLower.includes("infection") ||
    visitReasonLower.includes("fever") ||
    visitReasonLower.includes("sore throat") ||
    visitReasonLower.includes("fatigue")
  ) {
    return {
      drug: "Amoxicillin 500mg",
      frequency: "Every 8 hours",
      duration: "7 days",
      prescription: `Amoxicillin 500mg - Take 1 capsule every 8 hours for 7 days\n\nThis antibiotic is prescribed for ${combinedSymptoms}.`,
      reasoning: `Based on the patient's presenting symptoms (${visitReason || illness}) and medical history, the AI analysis suggests a bacterial infection requiring antibiotic treatment. Amoxicillin is the first-line choice due to its effectiveness against common upper respiratory pathogens and favorable safety profile.`,
      treatmentPlan:
        "1. Rest and hydration - Ensure adequate fluid intake\n2. Symptom management - Use over-the-counter pain relievers as needed\n3. Monitor temperature - Check every 4 hours\n4. Isolation - Avoid close contact with others until fever-free for 24 hours",
      followUp:
        "Schedule follow-up appointment in 7 days to assess treatment response. Seek immediate medical attention if symptoms worsen or new symptoms develop.",
    };
  }

  if (
    illnessLower.includes("hypertension") ||
    illnessLower.includes("diabetes") ||
    visitReasonLower.includes("blood pressure") ||
    visitReasonLower.includes("medication")
  ) {
    return {
      drug: "Amlodipine 5mg + Metformin 500mg",
      frequency: "Amlodipine once daily, Metformin twice daily",
      duration: "Ongoing maintenance",
      prescription: `Amlodipine 5mg - Take 1 tablet once daily for blood pressure control\nMetformin 500mg - Take 1 tablet twice daily with meals for blood sugar management\n\nThese medications help manage ${combinedSymptoms} and prevent complications.`,
      reasoning: `Based on the patient's diagnosis (${illness}) and visit reason (${visitReason || "routine review"}), the AI analysis recommends a combination of antihypertensive and antidiabetic medications. Amlodipine helps control blood pressure while Metformin manages blood glucose levels.`,
      treatmentPlan:
        "1. Daily blood pressure monitoring - Record readings twice daily\n2. Blood sugar monitoring - Check fasting and post-meal glucose\n3. Dietary modifications - Low sodium and controlled carbohydrate intake\n4. Regular exercise - 30 minutes of moderate activity daily\n5. Medication adherence - Take medications at consistent times",
      followUp:
        "Schedule follow-up appointment in 14 days to review medication effectiveness and lab results. Seek immediate medical attention for blood pressure above 180/120 or severe hypoglycemia symptoms.",
    };
  }

  if (
    illnessLower.includes("migraine") ||
    illnessLower.includes("headache") ||
    visitReasonLower.includes("headache") ||
    visitReasonLower.includes("pain")
  ) {
    return {
      drug: "Sumatriptan 50mg",
      frequency: "As needed at onset",
      duration: "As needed basis",
      prescription: `Sumatriptan 50mg - Take 1 tablet at migraine onset, may repeat after 2 hours if needed (max 200mg/day)\n\nThis medication helps relieve ${combinedSymptoms} and associated symptoms.`,
      reasoning: `Based on the patient's diagnosis (${illness}) and presenting symptoms (${visitReason || "headache episodes"}), the AI analysis recommends Sumatriptan as an abortive treatment. It's effective for acute migraine attacks and has a well-established safety profile.`,
      treatmentPlan:
        "1. Identify triggers - Keep a headache diary to identify patterns\n2. Stress management - Practice relaxation techniques and adequate sleep\n3. Hydration - Maintain consistent water intake\n4. Dark quiet environment - Rest in a calm space during attacks\n5. Preventive measures - Consider lifestyle modifications to reduce frequency",
      followUp:
        "Schedule follow-up appointment in 30 days to assess migraine frequency and treatment effectiveness. Seek immediate medical attention for sudden severe headache or neurological symptoms.",
    };
  }

  return {
    drug: "Paracetamol 500mg",
    frequency: "Every 6 hours as needed",
    duration: "3 days",
    prescription: `Paracetamol 500mg - Take 1-2 tablets every 6 hours as needed for pain relief\n\nThis medication helps manage ${combinedSymptoms}.`,
    reasoning: `Based on the patient's presenting condition (${visitReason || illness || "general symptoms"}), the AI analysis suggests symptomatic relief with Paracetamol. This is a safe first-line option for pain and fever management.`,
    treatmentPlan:
      "1. Rest and recovery - Allow adequate time for healing\n2. Symptom monitoring - Track temperature and pain levels\n3. Hydration - Maintain fluid intake\n4. Avoid triggers - Identify and minimize aggravating factors",
    followUp:
      "Schedule follow-up appointment in 5 days if symptoms persist. Seek immediate medical attention if symptoms worsen significantly.",
  };
}

function createPdfBlob(content: string) {
  const linesPerPage = 44;
  const normalizedLines = content.replace(/\r\n/g, "\n").split("\n");
  const pages = chunkLines(normalizedLines, linesPerPage);
  const objects: string[] = [];

  objects.push("<< /Type /Catalog /Pages 2 0 R >>");

  const pageObjectNumbers = pages.map((_, index) => 4 + index * 2);
  objects.push(
    `<< /Type /Pages /Count ${pages.length} /Kids [${pageObjectNumbers
      .map((number) => `${number} 0 R`)
      .join(" ")}] >>`
  );

  objects.push("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");

  pages.forEach((pageLines, index) => {
    const pageObjectNumber = 4 + index * 2;
    const contentObjectNumber = pageObjectNumber + 1;
    const stream = buildPdfStream(pageLines);

    objects.push(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 3 0 R >> >> /Contents ${contentObjectNumber} 0 R >>`
    );
    objects.push(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`);
  });

  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [0];

  objects.forEach((object, index) => {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });

  const xrefStart = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";

  offsets.slice(1).forEach((offset) => {
    pdf += `${offset.toString().padStart(10, "0")} 00000 n \n`;
  });

  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;

  return new Blob([pdf], { type: "application/pdf" });
}

function buildPdfStream(lines: string[]) {
  const commands = [
    "BT",
    "/F1 11 Tf",
    "50 760 Td",
    "14 TL",
  ];

  lines.forEach((line, index) => {
    const escaped = escapePdfText(line);
    commands.push(`(${escaped}) Tj`);

    if (index < lines.length - 1) {
      commands.push("T*");
    }
  });

  commands.push("ET");

  return commands.join("\n");
}

function escapePdfText(value: string) {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

function chunkLines(lines: string[], size: number) {
  const chunks: string[][] = [];

  for (let index = 0; index < lines.length; index += size) {
    chunks.push(lines.slice(index, index + size));
  }

  return chunks;
}

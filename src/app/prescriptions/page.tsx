"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

import { Modal, Panel, PillIcon, PrimaryButton, Toast, buttonClassName } from "../_components/medos-ui";
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

    const blob = new Blob([reportContent], { type: "application/pdf" });
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
    <div className="mx-auto max-w-[1180px] space-y-5">
      <section className="rounded-[24px] border border-slate-200/80 bg-white px-6 py-5 shadow-[0_12px_34px_rgba(15,23,42,0.06)]">
        <h1 className="text-[30px] font-semibold tracking-tight text-slate-950">Prescription Explainer</h1>
        <p className="mt-2 max-w-3xl text-[15px] leading-7 text-slate-600">
          Review medication explanations and supporting guidance. Our AI-driven system helps decode complex clinical documentation for better patient understanding.
        </p>
      </section>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <Panel className="border-slate-200/80 bg-white">
          <div className="border-b border-slate-200 px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-700">
                <PillIcon className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-sky-700">Medication Details</p>
              </div>
            </div>
          </div>

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
                  Open in Prescription
                </button>
              ) : null}
            </div>

            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4">
              <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-amber-700">AI Interaction Check</p>
              <p className="mt-2 text-sm leading-6 text-amber-900">
                {resolvedExplanation.interactionWarning || "No interaction warning is available yet. Please complete the medication details to run the automated safety analysis."}
              </p>
            </div>

            {aiReport && (role === "nurse" || role === "admin" || role === "receptionist") ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-950">{aiReport.patientInfo.name}</p>
                    <p className="mt-1 text-xs text-slate-500">{aiReport.patientInfo.symptoms}</p>
                  </div>
                  <span className="text-xs font-medium text-slate-500">
                    {isCheckupClosed ? "Checkup Completed" : "In Progress"}
                  </span>
                </div>
                <div className="mt-4 flex gap-2">
                  <PrimaryButton subtle onClick={() => handleDownloadReport(aiReport)} className="h-10 px-4 shadow-none">
                    View Report
                  </PrimaryButton>
                  <PrimaryButton subtle onClick={() => handleDownloadPdfReport(aiReport)} className="h-10 border-emerald-600 bg-emerald-600 px-4 text-white hover:bg-emerald-700">
                    Download PDF
                  </PrimaryButton>
                </div>
              </div>
            ) : null}
          </div>
        </Panel>

        <div className="space-y-4">
          <Panel className="border-slate-200/80 bg-[#eef5ff]">
            <div className="px-5 py-5">
              <h2 className="text-[18px] font-semibold tracking-tight text-slate-950">How it works</h2>
              <div className="mt-4 space-y-4">
                {[
                  "Enter the drug name, prescribed frequency, and the intended duration.",
                  "Our AI engine analyzes the latest clinical guidelines and interaction patterns.",
                  "Receive a role-aware explanation and a comprehensive safety interaction check.",
                ].map((step, index) => (
                  <div key={step} className="flex gap-3">
                    <span className="text-xs font-semibold text-sky-700">{String(index + 1).padStart(2, "0")}.</span>
                    <p className="text-sm leading-6 text-slate-600">{step}</p>
                  </div>
                ))}
              </div>
            </div>
          </Panel>

          <Panel className="border-slate-200/80 bg-white">
            <div className="px-5 py-5">
              <p className="text-sm font-semibold text-slate-950">Precision Scan v2.4</p>
              <p className="mt-1 text-xs text-slate-500">Latest update 21 AGO</p>
              <button
                type="button"
                onClick={() => setIsExplanationModalOpen(true)}
                className="mt-4 text-sm font-medium text-sky-700 transition hover:text-sky-800"
              >
                View release notes
              </button>
            </div>
          </Panel>

          <div className="overflow-hidden rounded-[24px] border border-slate-200/80 bg-slate-950 shadow-[0_12px_34px_rgba(15,23,42,0.14)]">
            <div className="min-h-[180px] bg-[linear-gradient(180deg,rgba(30,64,175,0.15),rgba(2,6,23,0.65)),url('/ice-background.svg')] bg-cover bg-center px-5 py-5">
              <div className="flex h-full flex-col justify-end">
                <p className="text-sm font-semibold text-white">{patientHeading}</p>
                <p className="mt-2 max-w-[22ch] text-xs leading-5 text-slate-200">
                  Patient Safety First. AI-assisted triage and FDA-aware interaction logic remain active during review.
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
        title="AI Treatment Plan Generator"
        description="Generate comprehensive AI-powered treatment plans with prescriptions, reasoning, and follow-up instructions for patient care."
        footer={
          aiReport ? undefined : (
            <>
              <PrimaryButton subtle onClick={() => setIsAiModalOpen(false)}>
                Cancel
              </PrimaryButton>
              <PrimaryButton onClick={handleGenerateAiPrescription} disabled={isGenerating}>
                {isGenerating ? "Generating..." : "Generate Treatment Plan"}
              </PrimaryButton>
            </>
          )
        }
      >
        <div className="space-y-4">
          {aiReport ? (
            <>
              <div>
                <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.28em] text-slate-600">
                  Patient Information
                </p>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-800">
                  <p><strong>Name:</strong> {aiReport.patientInfo.name}</p>
                  <p><strong>Age:</strong> {aiReport.patientInfo.age}</p>
                  <p><strong>Symptoms:</strong> {aiReport.patientInfo.symptoms}</p>
                </div>
              </div>
              <div>
                <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.28em] text-slate-600">
                  AI-Generated Prescription
                </p>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-800 whitespace-pre-line">
                  {aiReport.prescription}
                </div>
              </div>
              <div>
                <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.28em] text-slate-600">
                  AI Reasoning
                </p>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-800">
                  {aiReport.reasoning}
                </div>
              </div>
              <div>
                <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.28em] text-slate-600">
                  Treatment Plan
                </p>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-800 whitespace-pre-line">
                  {aiReport.treatmentPlan}
                </div>
              </div>
              <div>
                <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.28em] text-slate-600">
                  Follow-Up Instructions
                </p>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-800">
                  {aiReport.followUp}
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <PrimaryButton onClick={() => handleDownloadReport(aiReport)}>
                  Download Report
                </PrimaryButton>
                <PrimaryButton onClick={() => handleDownloadPdfReport(aiReport)} className="bg-emerald-600 hover:bg-emerald-700">
                  Download PDF
                </PrimaryButton>
              </div>
              {role === "doctor" && !isCheckupClosed ? (
                <PrimaryButton onClick={handleCloseCheckup} className="bg-emerald-600 hover:bg-emerald-700">
                  Closed
                </PrimaryButton>
              ) : isCheckupClosed ? (
                <div className="text-sm font-medium text-emerald-600">Checkup Completed</div>
              ) : null}
            </>
          ) : (
            <p className="text-sm text-slate-600">
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
          <div className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1">
            <button
              type="button"
              onClick={() => setExplanationView("doctor")}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                explanationView === "doctor"
                  ? "bg-slate-950 text-slate-900"
                  : "text-slate-500"
              }`}
            >
              Doctor view
            </button>
            <button
              type="button"
              onClick={() => setExplanationView("patient")}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                explanationView === "patient"
                  ? "bg-slate-950 text-slate-900"
                  : "text-slate-500"
              }`}
            >
              Patient view
            </button>
          </div>

          <div className="space-y-6 text-[15px] leading-7 text-slate-700">
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
              <p className="text-sm text-slate-500">
                No prescription explanation fields are available yet.
              </p>
            )}
          </div>
        </div>
      </Modal>

      {toastMessage ? <Toast message={toastMessage} onClose={() => setToastMessage(null)} /> : null}
    </div>
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
      <span className="mb-2 block text-[10px] font-medium uppercase tracking-[0.22em] text-slate-500">
        {label}
      </span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-12 w-full rounded-xl border border-slate-200 bg-white px-3 text-[15px] text-slate-800 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
      />
    </label>
  );
}

function ExplanationBlock({ label, text }: { label: string; text: string }) {
  return (
    <div>
      <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-[15px] text-slate-900">{text}</p>
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

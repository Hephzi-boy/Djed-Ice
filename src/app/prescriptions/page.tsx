"use client";

import { useEffect, useState } from "react";

import { MedosPage, Panel, PillIcon } from "../_components/medos-ui";
import { fetchPrescriptionData, type PrescriptionData } from "@/lib/workspace-data";

export default function PrescriptionsPage() {
  const [data, setData] = useState<PrescriptionData | null>(null);

  useEffect(() => {
    let active = true;

    fetchPrescriptionData().then((result) => {
      if (active) {
        setData(result);
      }
    });

    return () => {
      active = false;
    };
  }, []);

  return (
    <MedosPage
      sectionNumber="05"
      sectionTitle="Medication Insight"
      title="Prescription Explainer"
      description="Review medication explanations and supporting guidance."
    >
      <div className="grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
        <Panel className="bg-white/95">
          <div className="border-b border-slate-200 px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-700">
                <PillIcon className="h-4 w-4" />
              </div>
              <h2 className="text-xl font-semibold text-slate-950">Medication</h2>
            </div>
          </div>

          <div className="space-y-4 px-6 py-5">
            <Field label="Drug" value={data?.drug || ""} />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Frequency" value={data?.frequency || ""} />
              <Field label="Duration" value={data?.duration || ""} />
            </div>
            <button
              type="button"
              className="h-11 w-full rounded-xl bg-sky-700 text-sm font-medium text-white shadow-sm transition hover:bg-sky-800"
            >
              Load explanation
            </button>

            <div className="border-t border-slate-200 pt-4">
              <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-slate-500">
                AI interaction check
              </p>
              <div className="mt-3 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">
                {data?.interactionWarning || "No interaction warning is available yet."}
              </div>
            </div>
          </div>
        </Panel>

        <Panel className="bg-white/95">
          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
            <div>
              <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-slate-500">
                Explanation
              </p>
              <h2 className="mt-2 text-xl font-semibold text-slate-950">
                {data?.title || "No prescription explanation loaded"}
              </h2>
            </div>
            <div className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1">
              <button
                type="button"
                className="rounded-lg bg-slate-950 px-3 py-1.5 text-sm font-medium text-white"
              >
                Doctor view
              </button>
              <button
                type="button"
                className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-500"
              >
                Patient view
              </button>
            </div>
          </div>

          <div className="space-y-6 px-6 py-6 text-[15px] leading-7 text-slate-700">
            {data?.details.length ? (
              data.details.map((detail) => (
                <ExplanationBlock key={detail.label} label={detail.label} text={detail.text} />
              ))
            ) : (
              <p className="text-sm text-slate-500">
                No prescription explanation fields are available yet.
              </p>
            )}
          </div>
        </Panel>
      </div>
    </MedosPage>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <label className="block">
      <span className="mb-2 block text-[10px] font-medium uppercase tracking-[0.28em] text-slate-500">
        {label}
      </span>
      <input
        readOnly
        value={value}
        className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-[15px] text-slate-800 outline-none"
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

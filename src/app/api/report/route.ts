import { getAiClient } from "@/lib/gemini";

type ReportRequestBody = {
    patientLabel?: string;
    reportType?: string;
    symptoms?: string;
    treatment?: string;
};

export async function POST(req: Request) {
    let body: ReportRequestBody = {};

    try {
        body = (await req.json()) as ReportRequestBody;
        
        // Check if API key is available
        const geminiApiKey = process.env.GEMINI_API_KEY;
        
        if (!geminiApiKey) {
            // Return a mock response when API key is not configured
            const mockReport = generateMockReport(body);
            return Response.json({
                report: mockReport
            });
        }

        const ai = getAiClient();

        const prompt = `
 Generate a professional hospital report.

 Symptoms:
 ${body.symptoms}

 Treatment Plan:
 ${body.treatment}
 `;

        const result = await ai.models.generateContent({
            model: "gemini-2.5-pro",
            contents: prompt,
        });

        return Response.json({
            report: result.text
        });
    } catch {
        // Fallback to mock response on error
        const mockReport = generateMockReport(body);
        return Response.json({
            report: mockReport
        });
    }
}

function generateMockReport(body: ReportRequestBody): string {
    const patientName = body.patientLabel || "Patient";
    const reportType = body.reportType || "Summary";
    const symptoms = body.symptoms || "No symptoms provided";
    const treatment = body.treatment || "No treatment provided";

    return `${reportType} Report

Patient: ${patientName}

CLINICAL SUMMARY
================

Presenting Symptoms:
${symptoms}

Treatment Plan:
${treatment}

RECOMMENDATIONS
===============

1. Continue monitoring of symptoms as outlined in treatment plan
2. Follow up appointment recommended within 7-14 days
3. Patient should report any worsening of symptoms immediately
4. Medication compliance is essential for optimal outcomes

ASSESSMENT
==========

Patient condition appears stable based on current clinical presentation. 
Treatment plan has been established and patient education provided.

Generated: ${new Date().toLocaleDateString()}
Status: Draft - Requires clinician review and signature`;
}

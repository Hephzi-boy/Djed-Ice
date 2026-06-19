import { ai } from "@/lib/gemini";

export async function POST(req: Request) {

    const body = await req.json();

    const prompt = `
 Generate a professional hospital report.

 Symptoms:
 ${body.symptoms}

 Diagnosis:
 ${body.diagnosis}

 Treatment:
 ${body.treatment}
 `;

    const result = await ai.models.generateContent({
        model: "gemini-2.5-pro",
        contents: prompt,
    });

    return Response.json({
        report: result.text
    });
}
import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { mockApi } from "@/lib/mock-api";

export async function POST(req: Request) {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        console.error("CRITICAL: GEMINI_API_KEY is missing from environment variables.");
        return NextResponse.json(
            { error: "Gemini API key not configured. Please add it to your .env.local file." },
            { status: 500 }
        );
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    try {
        const { message, field_id } = await req.json();

        // 1. Fetch context if a site is selected
        let contextPrompt = "";
        if (field_id) {
            try {
                const [site, alerts] = await Promise.all([
                    mockApi.getSite(field_id),
                    mockApi.getAlerts()
                ]);

                const siteAlerts = alerts.filter(a => a.site_id === field_id);

                contextPrompt = `
You are Atlas, an expert AI assistant for high-precision agriculture and forestry monitoring.
Your analysis is based on the following context for the selected site:
- Site Name: ${site.name}
- Type: ${site.site_type}
- Area: ${site.area_hectares} hectares
- ${site.site_type === "FIELD" ? `Crop: ${site.crop_type}` : `Forest Type: ${site.forest_type}`}
- Recent Alerts: ${siteAlerts.length > 0 ? siteAlerts.map(a => `[${a.severity}] ${a.title}: ${a.message}`).join("; ") : "No active alerts."}
- Latest Health Score: ${site.health_score}%

When answering, specifically address this site's data if relevant. Keep your advice technical, professional, and data-driven.
`;
            } catch (err) {
                console.error("Context fetch error:", err);
            }
        } else {
            contextPrompt = `You are Atlas, a professional AI assistant specialized in satellite-based precision agriculture and forestry management. Provide expert, data-driven advice.`;
        }

        // 2. Initialize Gemini models
        const primaryModel = "gemini-3-flash-preview";
        const fallbackModel = "gemini-1.5-flash";

        const generateWithRetry = async (modelName: string, maxRetries = 3) => {
            console.log(`Attempting generation with ${modelName}...`);
            const model = genAI.getGenerativeModel({ model: modelName });
            const prompt = `${contextPrompt}\n\nUser Question: ${message}`;

            for (let i = 0; i < maxRetries; i++) {
                try {
                    const result = await model.generateContent(prompt);
                    const response = await result.response;
                    return response.text();
                } catch (err: any) {
                    const isOverloaded = err.message?.includes("503") || err.status === 503 || err.message?.toLowerCase().includes("overloaded");

                    if (isOverloaded && i < maxRetries - 1) {
                        const delay = Math.pow(2, i) * 1000;
                        console.warn(`Gemini overloaded (503). Retrying in ${delay}ms... (Attempt ${i + 1}/${maxRetries})`);
                        await new Promise(resolve => setTimeout(resolve, delay));
                        continue;
                    }
                    throw err; // Re-throw if not a 503 or max retries reached
                }
            }
        };

        try {
            // 3. Try primary model first
            try {
                const text = await generateWithRetry(primaryModel);
                console.log("Gemini response received from primary model.");
                return NextResponse.json({ response: text });
            } catch (primaryError: any) {
                console.error(`Primary model (${primaryModel}) failed:`, primaryError.message);

                // 4. Fallback to a more stable model
                console.log(`Switching to fallback model: ${fallbackModel}...`);
                const text = await generateWithRetry(fallbackModel, 2);
                console.log("Gemini response received from fallback model.");
                return NextResponse.json({
                    response: text,
                    note: "Response generated using stable fallback model due to high load."
                });
            }
        } catch (genError: any) {
            console.error("Gemini Final Error:", genError);
            return NextResponse.json(
                {
                    error: "The AI service is currently under heavy load (Google 503).",
                    details: genError.message || "Model overloaded",
                    suggestion: "Please wait a few seconds and try your question again."
                },
                { status: 503 }
            );
        }
    } catch (error: any) {
        console.error("Route Logic Error:", error);
        return NextResponse.json(
            { error: error.message || "Internal server error" },
            { status: 500 }
        );
    }
}

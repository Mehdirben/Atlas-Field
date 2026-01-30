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

        // 2. Initialize Gemini - using gemini-3-flash-preview as requested
        console.log("Initializing Gemini model (gemini-3-flash-preview)...");
        const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

        // 3. Generate response
        const prompt = `${contextPrompt}\n\nUser Question: ${message}`;
        console.log("Sending prompt to Gemini. Length:", prompt.length);

        try {
            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();
            console.log("Gemini response received. Characters:", text.length);
            return NextResponse.json({ response: text });
        } catch (genError: any) {
            console.error("Gemini Generation Error:", genError);
            return NextResponse.json(
                { error: `Gemini API Error: ${genError.message || "Unknown error"}` },
                { status: 500 }
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

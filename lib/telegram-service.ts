export interface TelegramSettings {
    botToken: string;
    chatId: string;
    enabled: boolean;
}

export const getTelegramSettings = (): TelegramSettings => {
    if (typeof window === "undefined") {
        return { botToken: "", chatId: "", enabled: false };
    }
    const stored = localStorage.getItem("atlas_telegram_settings");
    if (stored) {
        try {
            return JSON.parse(stored);
        } catch (e) {
            console.error("Failed to parse telegram settings", e);
        }
    }
    return { botToken: "", chatId: "", enabled: false };
};

export const saveTelegramSettings = (settings: TelegramSettings) => {
    if (typeof window !== "undefined") {
        localStorage.setItem("atlas_telegram_settings", JSON.stringify(settings));
    }
};

const escapeHTML = (text: string): string => {
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
};

export const sendTelegramMessage = async (message: string): Promise<boolean> => {
    const { botToken, chatId, enabled } = getTelegramSettings();

    if (!enabled || !botToken || !chatId) {
        console.log("Telegram notifications are disabled or not configured.");
        return false;
    }

    try {
        const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                chat_id: chatId,
                text: message,
                parse_mode: "HTML",
            }),
        });

        if (!response.ok) {
            const status = response.status;
            const statusText = response.statusText;
            let errorData;
            try {
                errorData = await response.json();
            } catch (e) {
                errorData = "Could not parse error response as JSON";
            }
            console.error(`Telegram API Error (${status} ${statusText}):`, errorData);
            if (status === 403) {
                console.warn("Troubleshooting 403 Forbidden: 1. Ensure you have started the bot (/start). 2. Verify the Chat ID. 3. Ensure the bot is not blocked.");
            }
            return false;
        }

        return true;
    } catch (error) {
        console.error("Failed to send Telegram message:", error);
        return false;
    }
};

export const formatAnalysisAlert = (siteName: string, analysisType: string, result: any): string => {
    const healthScore = (result.mean_value * 100).toFixed(0);
    const date = new Date().toLocaleString();
    const problems = result.data?.detailed_report?.problems?.length || 0;

    return `<b>🚀 Analysis Complete: ${escapeHTML(siteName)}</b>\n\n` +
        `📅 Date: ${date}\n` +
        `🔍 Type: ${escapeHTML(analysisType)}\n` +
        `❤️ Health Score: ${healthScore}%\n` +
        `⚠️ Issues Detected: ${problems}\n\n` +
        `<i>${escapeHTML(result.interpretation || "No interpretation available.")}</i>`;
};

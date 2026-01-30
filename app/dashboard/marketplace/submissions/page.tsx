"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { marketplaceApi } from "@/lib/marketplace";
import { InvestmentSubmission } from "@/types/api";
import { cn } from "@/lib/utils";

export default function SubmissionsPage() {
    const [submissions, setSubmissions] = useState<InvestmentSubmission[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<"all" | "unread" | "contacted">("all");

    useEffect(() => {
        loadSubmissions();
    }, []);

    async function loadSubmissions() {
        try {
            const data = await marketplaceApi.getInvestmentSubmissions();
            setSubmissions(data);
        } catch (error) {
            console.error("Failed to load submissions:", error);
        } finally {
            setLoading(false);
        }
    }

    async function handleMarkRead(id: number) {
        await marketplaceApi.markSubmissionRead(id);
        await loadSubmissions();
    }

    async function handleMarkContacted(id: number) {
        await marketplaceApi.markSubmissionContacted(id);
        await loadSubmissions();
    }

    const filteredSubmissions = submissions.filter(s => {
        if (filter === "unread") return !s.is_read;
        if (filter === "contacted") return s.is_contacted;
        return true;
    });

    const getInvestmentTypeLabel = (type: string) => {
        switch (type) {
            case "CO2_CREDITS": return "🌍 CO₂ Credits";
            case "SITE_INVESTMENT": return "🌾 Site Investment";
            case "BOTH": return "✨ Both";
            default: return type;
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
                <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-slate-500">Loading submissions...</p>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <Link
                        href="/dashboard/marketplace"
                        className="text-emerald-600 hover:text-emerald-700 text-sm font-medium flex items-center gap-1 mb-2"
                    >
                        ← Back to Marketplace
                    </Link>
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
                        Investment Submissions
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">
                        {submissions.filter(s => !s.is_read).length} unread • {submissions.length} total
                    </p>
                </div>
            </div>

            {/* Filters */}
            <div className="flex gap-2">
                {[
                    { key: "all", label: "All" },
                    { key: "unread", label: "Unread" },
                    { key: "contacted", label: "Contacted" },
                ].map((f) => (
                    <button
                        key={f.key}
                        onClick={() => setFilter(f.key as any)}
                        className={cn(
                            "px-4 py-2 rounded-xl text-sm font-medium transition-all",
                            filter === f.key
                                ? "bg-emerald-600 text-white shadow-lg shadow-emerald-500/25"
                                : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                        )}
                    >
                        {f.label}
                    </button>
                ))}
            </div>

            {/* Submissions List */}
            {filteredSubmissions.length === 0 ? (
                <div className="text-center py-16 bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/60">
                    <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-emerald-100 to-cyan-100 flex items-center justify-center">
                        <span className="text-4xl">📭</span>
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">No submissions yet</h3>
                    <p className="text-slate-500">
                        When investors express interest in your sites, their submissions will appear here.
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredSubmissions.map((submission) => (
                        <div
                            key={submission.id}
                            className={cn(
                                "bg-white/80 backdrop-blur-sm rounded-2xl border overflow-hidden transition-all hover:shadow-md",
                                !submission.is_read ? "border-emerald-300 bg-emerald-50/50" : "border-slate-200/60"
                            )}
                        >
                            <div className="p-5">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            {!submission.is_read && (
                                                <span className="w-2 h-2 bg-emerald-600 rounded-full" />
                                            )}
                                            <h3 className="font-semibold text-slate-900">
                                                {submission.investor_name}
                                            </h3>
                                            <span className="text-sm text-slate-500">
                                                for {submission.site_name}
                                            </span>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600 mb-3">
                                            <span className="flex items-center gap-1">
                                                📧 {submission.investor_email}
                                            </span>
                                            {submission.investor_phone && (
                                                <span className="flex items-center gap-1">
                                                    📱 {submission.investor_phone}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex flex-wrap gap-2 mb-3">
                                            <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-full">
                                                {getInvestmentTypeLabel(submission.investment_type)}
                                            </span>
                                            {submission.proposed_amount_dh && (
                                                <span className="px-3 py-1 bg-cyan-100 text-cyan-700 text-xs font-semibold rounded-full">
                                                    💰 {submission.proposed_amount_dh.toLocaleString()} DH
                                                </span>
                                            )}
                                            {submission.is_contacted && (
                                                <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                                                    ✓ Contacted
                                                </span>
                                            )}
                                        </div>
                                        {submission.message && (
                                            <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg">
                                                "{submission.message}"
                                            </p>
                                        )}
                                    </div>
                                    <div className="text-right text-xs text-slate-500 shrink-0">
                                        {new Date(submission.submitted_at).toLocaleDateString()}
                                        <br />
                                        {new Date(submission.submitted_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>
                            </div>
                            <div className="border-t border-slate-100 px-5 py-3 bg-slate-50/50 flex gap-3">
                                {!submission.is_read && (
                                    <button
                                        onClick={() => handleMarkRead(submission.id)}
                                        className="px-4 py-2 rounded-lg text-sm font-medium border border-slate-200 text-slate-600 hover:bg-white transition-colors"
                                    >
                                        Mark as Read
                                    </button>
                                )}
                                {!submission.is_contacted && (
                                    <button
                                        onClick={() => handleMarkContacted(submission.id)}
                                        className="px-4 py-2 rounded-lg text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
                                    >
                                        ✓ Mark as Contacted
                                    </button>
                                )}
                                <a
                                    href={`mailto:${submission.investor_email}?subject=Investment Inquiry for ${submission.site_name}`}
                                    className="px-4 py-2 rounded-lg text-sm font-medium bg-slate-700 text-white hover:bg-slate-800 transition-colors ml-auto"
                                >
                                    📧 Send Email
                                </a>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

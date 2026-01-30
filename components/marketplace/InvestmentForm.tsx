"use client";

import { useState } from "react";
import { MarketplaceListing } from "@/types/api";

interface InvestmentFormProps {
    listing: MarketplaceListing;
    onSubmit: (data: InvestmentFormData) => Promise<void>;
    onCancel?: () => void;
}

export interface InvestmentFormData {
    investor_name: string;
    investor_email: string;
    investor_phone: string;
    investment_type: "CO2_CREDITS" | "SITE_INVESTMENT" | "BOTH";
    proposed_amount_dh: number;
    message: string;
}

export function InvestmentForm({ listing, onSubmit, onCancel }: InvestmentFormProps) {
    const [formData, setFormData] = useState<InvestmentFormData>({
        investor_name: "",
        investor_email: "",
        investor_phone: "",
        investment_type: "SITE_INVESTMENT",
        proposed_amount_dh: Math.min(50000, listing.investor_score.investment_potential_dh),
        message: "",
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!formData.investor_name || !formData.investor_email) {
            setError("Please fill in all required fields");
            return;
        }

        setLoading(true);
        try {
            await onSubmit(formData);
        } catch (err) {
            setError("Failed to submit. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const maxInvestment = listing.investor_score.investment_potential_dh;

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-600 via-emerald-500 to-cyan-500 text-white p-5 rounded-xl -mx-1 -mt-1">
                <h3 className="text-lg font-semibold">Express Investment Interest</h3>
                <p className="text-sm text-white/80 mt-1">
                    Invest in {listing.site_name} • Potential ROI: {listing.investor_score.estimated_roi_min}-{listing.investor_score.estimated_roi_max}%
                </p>
            </div>

            {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
                    {error}
                </div>
            )}

            {/* Contact Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        value={formData.investor_name}
                        onChange={(e) => setFormData({ ...formData, investor_name: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                        placeholder="Your name"
                        required
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        Email <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="email"
                        value={formData.investor_email}
                        onChange={(e) => setFormData({ ...formData, investor_email: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                        placeholder="you@example.com"
                        required
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Phone (optional)
                </label>
                <input
                    type="tel"
                    value={formData.investor_phone}
                    onChange={(e) => setFormData({ ...formData, investor_phone: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                    placeholder="+212 600 000 000"
                />
            </div>

            {/* Investment Type */}
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                    Investment Type
                </label>
                <div className="grid grid-cols-3 gap-2">
                    {[
                        { value: "SITE_INVESTMENT", label: "🌾 Site", desc: "Farm/Forest" },
                        { value: "CO2_CREDITS", label: "🌍 CO₂", desc: "Carbon" },
                        { value: "BOTH", label: "✨ Both", desc: "Combined" },
                    ].map((type) => (
                        <button
                            key={type.value}
                            type="button"
                            onClick={() => setFormData({ ...formData, investment_type: type.value as any })}
                            className={`p-3 rounded-xl border-2 text-center transition-all ${formData.investment_type === type.value
                                    ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                                    : "border-slate-200 hover:border-slate-300"
                                }`}
                        >
                            <span className="text-lg block">{type.label}</span>
                            <span className="text-xs text-slate-500">{type.desc}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Investment Amount */}
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                    Proposed Investment Amount
                </label>
                <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-500">10,000 DH</span>
                        <span className="text-lg font-bold text-emerald-600">
                            {formData.proposed_amount_dh.toLocaleString()} DH
                        </span>
                        <span className="text-slate-500">{maxInvestment.toLocaleString()} DH</span>
                    </div>
                    <input
                        type="range"
                        min={10000}
                        max={maxInvestment}
                        step={5000}
                        value={formData.proposed_amount_dh}
                        onChange={(e) => setFormData({ ...formData, proposed_amount_dh: parseInt(e.target.value) })}
                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                    />
                </div>
            </div>

            {/* Message */}
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Message (optional)
                </label>
                <textarea
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all resize-none"
                    placeholder="Tell us about your investment goals..."
                />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
                {onCancel && (
                    <button
                        type="button"
                        onClick={onCancel}
                        className="flex-1 px-5 py-3 rounded-xl border border-slate-200 text-slate-700 font-medium hover:bg-slate-50 transition-colors"
                    >
                        Cancel
                    </button>
                )}
                <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-medium hover:shadow-lg hover:shadow-emerald-500/25 transition-all disabled:opacity-50"
                >
                    {loading ? (
                        <span className="flex items-center justify-center gap-2">
                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Submitting...
                        </span>
                    ) : (
                        "Submit Interest"
                    )}
                </button>
            </div>
        </form>
    );
}

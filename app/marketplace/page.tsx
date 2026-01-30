"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { marketplaceApi } from "@/lib/marketplace";
import { MarketplaceListing } from "@/types/api";
import { InvestorScoreCard, InvestmentForm, InvestmentFormData } from "@/components/marketplace";
import { DashboardNav } from "@/components/dashboard";
import { cn } from "@/lib/utils";

export default function InvestorPortalPage() {
    const { data: session } = useSession();
    const [listings, setListings] = useState<MarketplaceListing[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedListing, setSelectedListing] = useState<MarketplaceListing | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [filter, setFilter] = useState<"all" | "field" | "forest">("all");
    const [sortBy, setSortBy] = useState<"score" | "area" | "recent">("score");

    useEffect(() => {
        loadListings();
    }, []);

    async function loadListings() {
        try {
            const data = await marketplaceApi.getMarketplaceListings();
            setListings(data);
        } catch (error) {
            console.error("Failed to load listings:", error);
        } finally {
            setLoading(false);
        }
    }

    async function handleSubmitInterest(data: InvestmentFormData) {
        if (!selectedListing) return;

        await marketplaceApi.submitInvestmentInterest({
            listing_id: selectedListing.id,
            site_id: selectedListing.site_id,
            site_name: selectedListing.site_name,
            investor_name: data.investor_name,
            investor_email: data.investor_email,
            investor_phone: data.investor_phone || undefined,
            investment_type: data.investment_type,
            proposed_amount_dh: data.proposed_amount_dh,
            message: data.message || undefined,
        });

        setShowForm(false);
        setSubmitted(true);
    }

    const filteredListings = listings
        .filter(l => {
            if (filter === "field") return l.site_type === "FIELD";
            if (filter === "forest") return l.site_type === "FOREST";
            return true;
        })
        .sort((a, b) => {
            if (sortBy === "score") return b.investor_score.total_score - a.investor_score.total_score;
            if (sortBy === "area") return (b.area_hectares || 0) - (a.area_hectares || 0);
            return new Date(b.published_at).getTime() - new Date(a.published_at).getTime();
        });

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-slate-500">Loading investment opportunities...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30">
            {/* Header */}
            <DashboardNav user={session?.user} />

            {/* Hero */}
            <div className="relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 via-emerald-500 to-cyan-500" />
                <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.05%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-50" />
                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 text-white">
                    <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
                        Invest in Sustainable Agriculture
                    </h1>
                    <p className="text-lg sm:text-xl text-white/80 max-w-2xl mb-6">
                        Browse satellite-verified farms and forests. Get data-driven investment insights
                        with our AI-powered Investor Attractiveness Score.
                    </p>
                    <div className="flex flex-wrap gap-4">
                        <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg text-sm sm:text-base">
                            <span className="text-xl sm:text-2xl">📊</span>
                            <span>Score-based ratings</span>
                        </div>
                        <div className="flex items-center gap-1.5 sm:gap-2 bg-white/20 backdrop-blur-sm px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-sm sm:text-base">
                            <span className="text-xl sm:text-2xl">🌍</span>
                            <span>CO₂ Credits available</span>
                        </div>
                        <div className="flex items-center gap-1.5 sm:gap-2 bg-white/20 backdrop-blur-sm px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-sm sm:text-base">
                            <span className="text-xl sm:text-2xl">🛰️</span>
                            <span>Satellite verified</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Filters */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div className="flex gap-2">
                        {[
                            { key: "all", label: "All Sites", icon: "🗺️" },
                            { key: "field", label: "Fields", icon: "🌾" },
                            { key: "forest", label: "Forests", icon: "🌲" },
                        ].map((f) => (
                            <button
                                key={f.key}
                                onClick={() => setFilter(f.key as any)}
                                className={cn(
                                    "px-3 sm:px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2",
                                    filter === f.key
                                        ? "bg-emerald-600 text-white shadow-lg shadow-emerald-500/25"
                                        : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                                )}
                            >
                                <span>{f.icon}</span>
                                <span className="hidden sm:inline">{f.label}</span>
                                <span className="sm:hidden">{f.label.split(' ')[0]}</span>
                            </button>
                        ))}
                    </div>
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as any)}
                        className="px-4 py-2 rounded-xl border border-slate-200 text-sm text-slate-600 bg-white focus:ring-2 focus:ring-emerald-500"
                    >
                        <option value="score">Sort by Score</option>
                        <option value="area">Sort by Area</option>
                        <option value="recent">Most Recent</option>
                    </select>
                </div>

                {/* Listings */}
                {filteredListings.length === 0 ? (
                    <div className="text-center py-20 bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/60">
                        <div className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-emerald-100 to-cyan-100 flex items-center justify-center">
                            <span className="text-5xl">🌱</span>
                        </div>
                        <h3 className="text-xl font-semibold text-slate-900 mb-2">No listings available</h3>
                        <p className="text-slate-500 max-w-md mx-auto">
                            There are currently no investment opportunities matching your criteria.
                            Check back soon for new listings.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">
                        {filteredListings.map((listing) => (
                            <div
                                key={listing.id}
                                className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/60 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group"
                            >
                                {/* Visual Header */}
                                <div className="relative h-32 bg-gradient-to-br from-emerald-400 via-cyan-500 to-emerald-600 overflow-hidden">
                                    <div className="absolute inset-0 opacity-30">
                                        {listing.site_type === "FOREST" ? (
                                            <div className="grid grid-cols-8 gap-1 p-2">
                                                {Array.from({ length: 24 }).map((_, i) => (
                                                    <span key={i} className="text-lg">🌲</span>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-8 gap-1 p-2">
                                                {Array.from({ length: 24 }).map((_, i) => (
                                                    <span key={i} className="text-lg">🌾</span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between text-white">
                                        <div>
                                            <span className="text-[10px] uppercase font-bold tracking-wider opacity-80 block">Investor Score</span>
                                            <span className="text-3xl font-bold drop-shadow-md">
                                                {listing.investor_score.total_score}
                                            </span>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-[10px] uppercase font-bold tracking-wider opacity-80 block">ROI</span>
                                            <span className="text-lg font-bold drop-shadow-md">
                                                {listing.investor_score.estimated_roi_min}-{listing.investor_score.estimated_roi_max}%
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="p-5">
                                    <div className="flex items-start justify-between mb-4">
                                        <div>
                                            <h3 className="font-bold text-lg text-slate-900 group-hover:text-emerald-600 transition-colors line-clamp-1">
                                                {listing.site_name}
                                            </h3>
                                            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                                                {listing.site_type === "FOREST" ? listing.forest_type : listing.crop_type}
                                            </p>
                                        </div>
                                        <span className="text-2xl p-2 bg-slate-50 rounded-xl">{listing.site_type === "FOREST" ? "🌲" : "🌾"}</span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 mb-4">
                                        <div className="bg-slate-50/50 rounded-xl p-3 border border-slate-100">
                                            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Area</span>
                                            <span className="text-base font-bold text-slate-900">
                                                {listing.area_hectares?.toFixed(1)} ha
                                            </span>
                                        </div>
                                        <div className="bg-emerald-50/50 rounded-xl p-3 border border-emerald-100">
                                            <span className="text-[10px] uppercase font-bold text-emerald-600/60 block mb-1">Investment</span>
                                            <span className="text-base font-bold text-emerald-700">
                                                {(listing.investor_score.investment_potential_dh / 1000).toFixed(0)}K DH
                                            </span>
                                        </div>
                                    </div>

                                    {listing.co2_credits_available && (
                                        <div className="bg-gradient-to-r from-cyan-50 to-emerald-50 rounded-xl p-3 mb-5 flex items-center justify-between border border-cyan-100">
                                            <span className="flex items-center gap-2 text-xs font-semibold text-cyan-700">
                                                <span className="text-base">🌍</span>
                                                CO₂ Credits
                                            </span>
                                            <span className="text-xs font-bold text-cyan-700">
                                                {listing.co2_credits_available}t @ {listing.co2_price_per_ton} DH/t
                                            </span>
                                        </div>
                                    )}

                                    <button
                                        onClick={() => {
                                            setSelectedListing(listing);
                                            setShowForm(true);
                                            setSubmitted(false);
                                        }}
                                        className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 hover:-translate-y-0.5 transition-all duration-200"
                                    >
                                        Express Interest
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {/* Investment Form Modal */}
            {showForm && selectedListing && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-auto border border-white/20 animate-in fade-in zoom-in duration-300">
                        {submitted ? (
                            <div className="p-8 sm:p-12 text-center">
                                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-xl shadow-emerald-500/30">
                                    <span className="text-4xl text-white">✓</span>
                                </div>
                                <h3 className="text-2xl font-bold text-slate-900 mb-3">Interest Received!</h3>
                                <p className="text-slate-500 mb-8 leading-relaxed">
                                    Thank you for your interest in **{selectedListing.site_name}**. The site owner has been notified and will reach out to you via email.
                                </p>
                                <button
                                    onClick={() => {
                                        setShowForm(false);
                                        setSelectedListing(null);
                                    }}
                                    className="w-full py-4 rounded-2xl bg-slate-900 text-white font-bold hover:bg-slate-800 transition-all shadow-lg"
                                >
                                    Done
                                </button>
                            </div>
                        ) : (
                            <div className="p-1 sm:p-2">
                                <InvestmentForm
                                    listing={selectedListing}
                                    onSubmit={handleSubmitInterest}
                                    onCancel={() => setShowForm(false)}
                                />
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

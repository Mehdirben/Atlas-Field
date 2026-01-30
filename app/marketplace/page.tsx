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
    const [searchTerm, setSearchTerm] = useState("");

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
            const matchesFilter = filter === "all" ||
                (filter === "field" && l.site_type === "FIELD") ||
                (filter === "forest" && l.site_type === "FOREST");

            const matchesSearch = searchTerm === "" ||
                l.site_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (l.site_type === "FIELD" ? l.crop_type : l.forest_type)?.toLowerCase().includes(searchTerm.toLowerCase());

            return matchesFilter && matchesSearch;
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

    const totalInvestment = listings.reduce((sum, l) => sum + l.investor_score.investment_potential_dh, 0);
    const avgROI = Math.round(listings.reduce((sum, l) => sum + (l.investor_score.estimated_roi_min + l.investor_score.estimated_roi_max) / 2, 0) / listings.length) || 0;
    const totalCO2 = listings.reduce((sum, l) => sum + (l.co2_credits_available || 0), 0);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30">
            {/* Header */}
            <DashboardNav user={session?.user} />

            {/* Hero */}
            <div className="relative min-h-[500px] flex items-center justify-center overflow-hidden">
                {/* Background Image with Parallax-like effect */}
                <div className="absolute inset-0 z-0">
                    <img
                        src="/marketplace-hero.png"
                        alt="Moroccan sustainable estate"
                        className="w-full h-full object-cover scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-slate-900/60 via-slate-900/40 to-slate-900/80 backdrop-blur-[2px]" />
                </div>

                <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 backdrop-blur-md border border-emerald-400/30 text-emerald-300 text-xs font-bold tracking-widest uppercase mb-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        Satellite Verified Opportunities
                    </div>

                    <h1 className="text-4xl sm:text-5xl lg:text-7xl font-extrabold text-white mb-6 tracking-tight drop-shadow-2xl">
                        Invest in <span className="bg-gradient-to-r from-emerald-400 to-emerald-200 bg-clip-text text-transparent">Sustainable</span> Agriculture
                    </h1>

                    <p className="text-lg sm:text-xl text-white/80 max-w-3xl mx-auto mb-10 leading-relaxed font-medium">
                        Direct access to high-yield agricultural and forest assets.
                        Data-driven insights powered by high-resolution satellite analysis and AI scores.
                    </p>

                    {/* Integrated Search Bar */}
                    <div className="max-w-2xl mx-auto relative group mb-12">
                        <div className="absolute inset-0 bg-emerald-500/20 blur-2xl group-hover:bg-emerald-500/30 transition-all duration-500 rounded-full" />
                        <div className="relative flex items-center bg-white/10 backdrop-blur-xl border border-white/20 p-2 rounded-2xl shadow-2xl overflow-hidden focus-within:ring-2 focus-within:ring-emerald-500/50 transition-all">
                            <div className="pl-4 text-emerald-400">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search by name, crop, or location..."
                                className="w-full bg-transparent border-none text-white placeholder-white/50 px-4 py-3 focus:outline-none text-lg font-medium"
                            />
                            <button className="hidden sm:flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg active:scale-95">
                                Browse
                            </button>
                        </div>
                    </div>

                    {/* Market Stats Bar */}
                    <div className="flex flex-wrap justify-center gap-4 sm:gap-8">
                        <div className="flex flex-col items-center">
                            <span className="text-2xl sm:text-3xl font-black text-white">{(totalInvestment / 1000000).toFixed(1)}M+</span>
                            <span className="text-[10px] sm:text-xs font-bold text-emerald-400 uppercase tracking-widest">DH Verified</span>
                        </div>
                        <div className="w-[1px] h-10 bg-white/10 hidden sm:block" />
                        <div className="flex flex-col items-center">
                            <span className="text-2xl sm:text-3xl font-black text-emerald-400">{avgROI}%</span>
                            <span className="text-[10px] sm:text-xs font-bold text-white/50 uppercase tracking-widest">Avg. Annual ROI</span>
                        </div>
                        <div className="w-[1px] h-10 bg-white/10 hidden sm:block" />
                        <div className="flex flex-col items-center">
                            <span className="text-2xl sm:text-3xl font-black text-white">{totalCO2.toLocaleString()}t</span>
                            <span className="text-[10px] sm:text-xs font-bold text-emerald-400 uppercase tracking-widest">CO₂ Offsets</span>
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
                        <div className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-emerald-100 to-emerald-200 flex items-center justify-center">
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
                                <div className="relative h-32 bg-gradient-to-br from-emerald-500 via-emerald-600 to-emerald-700 overflow-hidden">
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
                                        <div className="bg-gradient-to-r from-emerald-50 to-emerald-100/50 rounded-xl p-3 mb-5 flex items-center justify-between border border-emerald-100">
                                            <span className="flex items-center gap-2 text-xs font-semibold text-emerald-700">
                                                <span className="text-base">🌍</span>
                                                CO₂ Credits
                                            </span>
                                            <span className="text-xs font-bold text-emerald-700">
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

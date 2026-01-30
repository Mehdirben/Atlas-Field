"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getSites, Site } from "@/lib/api";
import { marketplaceApi } from "@/lib/marketplace";
import { InvestorScore, MarketplaceListing } from "@/types/api";
import { InvestorScoreCard } from "@/components/marketplace";
import { cn } from "@/lib/utils";

interface SiteWithScore {
    site: Site;
    score: InvestorScore | null;
    listing: MarketplaceListing | null;
}

export default function MarketplaceDashboardPage() {
    const [sitesWithScores, setSitesWithScores] = useState<SiteWithScore[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedSite, setSelectedSite] = useState<SiteWithScore | null>(null);
    const [publishingId, setPublishingId] = useState<number | null>(null);
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        try {
            const sites = await getSites();
            const listings = await marketplaceApi.getMarketplaceListings();
            const unread = await marketplaceApi.getUnreadSubmissionCount();
            setUnreadCount(unread);

            const withScores: SiteWithScore[] = await Promise.all(
                sites.map(async (site) => {
                    const score = await marketplaceApi.getInvestorScore(site);
                    const listing = listings.find(l => l.site_id === site.id) || null;
                    return { site, score, listing };
                })
            );
            setSitesWithScores(withScores);
        } catch (error) {
            console.error("Failed to load marketplace data:", error);
        } finally {
            setLoading(false);
        }
    }

    async function handlePublish(siteWithScore: SiteWithScore) {
        setPublishingId(siteWithScore.site.id);
        try {
            await marketplaceApi.publishToMarketplace(
                siteWithScore.site,
                Math.round(siteWithScore.site.area_hectares || 10) * 5,
                150
            );
            await loadData();
        } catch (error) {
            console.error("Failed to publish:", error);
        } finally {
            setPublishingId(null);
        }
    }

    async function handleUnpublish(siteId: number) {
        setPublishingId(siteId);
        try {
            await marketplaceApi.unpublishFromMarketplace(siteId);
            await loadData();
        } catch (error) {
            console.error("Failed to unpublish:", error);
        } finally {
            setPublishingId(null);
        }
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
                <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-slate-500">Loading marketplace data...</p>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Marketplace</h1>
                    <p className="text-sm sm:text-base text-slate-500 mt-1">
                        Publish your sites for investment and manage investor interest
                    </p>
                </div>
                <Link
                    href="/dashboard/marketplace/submissions"
                    className="relative px-4 sm:px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-medium rounded-xl hover:shadow-lg hover:shadow-emerald-500/25 hover:-translate-y-0.5 transition-all duration-200 text-center text-sm sm:text-base"
                >
                    📬 View Submissions
                    {unreadCount > 0 && (
                        <span className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                            {unreadCount}
                        </span>
                    )}
                </Link>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                {[
                    { label: "Total Sites", value: sitesWithScores.length, icon: "🗺️", color: "from-blue-500 to-blue-600" },
                    { label: "Published", value: sitesWithScores.filter(s => s.listing).length, icon: "✅", color: "from-emerald-500 to-emerald-600" },
                    { label: "Avg. Score", value: Math.round(sitesWithScores.reduce((sum, s) => sum + (s.score?.total_score || 0), 0) / sitesWithScores.length || 0), icon: "📊", color: "from-cyan-500 to-cyan-600" },
                    { label: "Submissions", value: unreadCount, icon: "📬", color: "from-amber-500 to-amber-600" },
                ].map((stat, i) => (
                    <div key={i} className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl p-3 sm:p-5 border border-slate-200/60 shadow-sm">
                        <div className="flex items-center gap-2 sm:gap-4">
                            <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-lg shrink-0`}>
                                <span className="text-base sm:text-xl text-white drop-shadow">{stat.icon}</span>
                            </div>
                            <div className="min-w-0">
                                <span className="block text-lg sm:text-2xl font-bold text-slate-900">{stat.value}</span>
                                <span className="text-xs sm:text-sm text-slate-500 truncate block">{stat.label}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Sites Grid */}
            <div>
                <h2 className="text-lg font-semibold text-slate-900 mb-4">Your Sites</h2>
                {sitesWithScores.length === 0 ? (
                    <div className="text-center py-16 bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/60">
                        <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-emerald-100 to-cyan-100 flex items-center justify-center">
                            <span className="text-4xl">🌱</span>
                        </div>
                        <h3 className="text-lg font-semibold text-slate-900 mb-2">No sites yet</h3>
                        <p className="text-slate-500 mb-6">Add a site first to list it on the marketplace.</p>
                        <Link
                            href="/dashboard/sites/new"
                            className="inline-block px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-medium rounded-xl hover:shadow-lg hover:shadow-emerald-500/25 transition-all"
                        >
                            Add Your First Site
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {sitesWithScores.map(({ site, score, listing }) => (
                            <div
                                key={site.id}
                                className={cn(
                                    "bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/60 overflow-hidden transition-all hover:shadow-lg",
                                    listing && "ring-2 ring-emerald-500"
                                )}
                            >
                                {/* Site Header */}
                                <div className="p-5 border-b border-slate-100">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3">
                                            <span className="text-2xl">{site.site_type === "FOREST" ? "🌲" : "🌾"}</span>
                                            <div>
                                                <h3 className="font-semibold text-slate-900">{site.name}</h3>
                                                <p className="text-sm text-slate-500">
                                                    {site.site_type === "FOREST" ? site.forest_type : site.crop_type} • {site.area_hectares?.toFixed(1)} ha
                                                </p>
                                            </div>
                                        </div>
                                        {listing ? (
                                            <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-full">
                                                ✓ Published
                                            </span>
                                        ) : (
                                            <span className="px-3 py-1 bg-slate-100 text-slate-600 text-xs font-semibold rounded-full">
                                                Not Listed
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Investor Score */}
                                {score && (
                                    <div className="p-5">
                                        <InvestorScoreCard score={score} compact />
                                    </div>
                                )}

                                {/* Actions */}
                                <div className="px-5 pb-5 flex gap-3">
                                    <button
                                        onClick={() => setSelectedSite({ site, score, listing })}
                                        className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-medium hover:bg-slate-50 transition-colors text-sm"
                                    >
                                        View Details
                                    </button>
                                    {listing ? (
                                        <button
                                            onClick={() => handleUnpublish(site.id)}
                                            disabled={publishingId === site.id}
                                            className="flex-1 px-4 py-2.5 rounded-xl bg-red-50 border border-red-200 text-red-600 font-medium hover:bg-red-100 transition-colors text-sm disabled:opacity-50"
                                        >
                                            {publishingId === site.id ? "..." : "Unpublish"}
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => handlePublish({ site, score, listing })}
                                            disabled={publishingId === site.id}
                                            className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-medium hover:shadow-lg hover:shadow-emerald-500/25 transition-all text-sm disabled:opacity-50"
                                        >
                                            {publishingId === site.id ? "..." : "Publish"}
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Detail Modal */}
            {selectedSite && selectedSite.score && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-auto">
                        <div className="sticky top-0 bg-white border-b border-slate-100 p-4 flex items-center justify-between">
                            <h3 className="font-semibold text-lg">{selectedSite.site.name}</h3>
                            <button
                                onClick={() => setSelectedSite(null)}
                                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center"
                            >
                                ✕
                            </button>
                        </div>
                        <div className="p-4">
                            <InvestorScoreCard score={selectedSite.score} />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

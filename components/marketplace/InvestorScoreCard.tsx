"use client";

import { InvestorScore } from "@/types/api";
import { cn } from "@/lib/utils";

interface InvestorScoreCardProps {
    score: InvestorScore;
    compact?: boolean;
}

export function InvestorScoreCard({ score, compact = false }: InvestorScoreCardProps) {
    const getScoreColor = (value: number) => {
        if (value >= 80) return "text-emerald-600";
        if (value >= 60) return "text-green-600";
        if (value >= 40) return "text-amber-600";
        return "text-red-600";
    };

    const getScoreBgColor = (value: number) => {
        if (value >= 80) return "from-emerald-500 to-emerald-600";
        if (value >= 60) return "from-green-500 to-green-600";
        if (value >= 40) return "from-amber-500 to-amber-600";
        return "from-red-500 to-red-600";
    };

    const factors = [
        { label: "Yield Stability", value: score.breakdown.yield_stability, max: 30, icon: "📈" },
        { label: "Crop Diversity", value: score.breakdown.crop_diversification, max: 20, icon: "🌿" },
        { label: "Farm Area", value: score.breakdown.farm_surface_area, max: 15, icon: "📐" },
        { label: "Climate Resilience", value: score.breakdown.climate_resilience, max: 25, icon: "🌤️" },
        { label: "Historical Perf.", value: score.breakdown.historical_performance, max: 10, icon: "📊" },
    ];

    if (compact) {
        return (
            <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-emerald-50 to-cyan-50 rounded-xl border border-emerald-100">
                <div className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center bg-gradient-to-br shadow-lg",
                    getScoreBgColor(score.total_score)
                )}>
                    <span className="text-lg font-bold text-white">{score.total_score}</span>
                </div>
                <div>
                    <p className="text-sm font-semibold text-slate-900">Investor Score</p>
                    <p className="text-xs text-slate-500">
                        Up to {(score.investment_potential_dh / 1000).toFixed(0)}K DH • {score.estimated_roi_min}-{score.estimated_roi_max}% ROI
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
            {/* Header with circular score */}
            <div className="bg-gradient-to-r from-emerald-600 via-emerald-500 to-cyan-500 p-6 text-white">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                            💼 Investor Attractiveness Score
                        </h3>
                        <p className="text-white/80 text-sm mt-1">
                            Based on satellite data analysis
                        </p>
                    </div>
                    <div className="relative">
                        {/* Circular progress indicator */}
                        <svg className="w-24 h-24 -rotate-90">
                            <circle
                                cx="48"
                                cy="48"
                                r="40"
                                fill="none"
                                stroke="rgba(255,255,255,0.2)"
                                strokeWidth="8"
                            />
                            <circle
                                cx="48"
                                cy="48"
                                r="40"
                                fill="none"
                                stroke="white"
                                strokeWidth="8"
                                strokeLinecap="round"
                                strokeDasharray={`${(score.total_score / 100) * 251.2} 251.2`}
                            />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-2xl font-bold">{score.total_score}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Score breakdown */}
            <div className="p-5 space-y-4">
                <h4 className="font-semibold text-slate-700 text-sm">Score Breakdown</h4>
                {factors.map((factor) => (
                    <div key={factor.label} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                            <span className="flex items-center gap-2 text-slate-600">
                                <span>{factor.icon}</span>
                                {factor.label}
                            </span>
                            <span className="font-medium text-slate-900">
                                {factor.value}/{factor.max}
                            </span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div
                                className={cn(
                                    "h-full rounded-full bg-gradient-to-r transition-all duration-500",
                                    factor.value / factor.max >= 0.8 ? "from-emerald-400 to-emerald-500" :
                                        factor.value / factor.max >= 0.6 ? "from-green-400 to-green-500" :
                                            factor.value / factor.max >= 0.4 ? "from-amber-400 to-amber-500" :
                                                "from-red-400 to-red-500"
                                )}
                                style={{ width: `${(factor.value / factor.max) * 100}%` }}
                            />
                        </div>
                    </div>
                ))}
            </div>

            {/* Investment potential */}
            <div className="border-t border-slate-100 p-5 bg-gradient-to-r from-emerald-50 to-cyan-50">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <p className="text-xs text-slate-500 mb-1">Investment Potential</p>
                        <p className="text-xl font-bold text-emerald-700">
                            {score.investment_potential_dh.toLocaleString()} DH
                        </p>
                    </div>
                    <div>
                        <p className="text-xs text-slate-500 mb-1">Estimated ROI</p>
                        <p className="text-xl font-bold text-emerald-700">
                            {score.estimated_roi_min}-{score.estimated_roi_max}%
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

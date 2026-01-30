"use client";

import { useState } from "react";
import { SignalType } from "@/lib/api";
import { cn } from "@/lib/utils";
import { CloseIcon, CheckIcon } from "@/components/icons";

interface SignalModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (type: SignalType, description: string) => void;
    latitude: number;
    longitude: number;
}

const SIGNAL_TYPES: { type: SignalType; label: string; icon: string; color: string }[] = [
    { type: "DANGER", label: "Danger", icon: "⚠️", color: "bg-red-500" },
    { type: "ANIMAL", label: "Animal", icon: "🦌", color: "bg-amber-500" },
    { type: "FIRE", label: "Fire", icon: "🔥", color: "bg-orange-600" },
    { type: "ROAD_BLOCK", label: "Obstacle", icon: "🚧", color: "bg-yellow-600" },
    { type: "OTHER", label: "Other", icon: "📍", color: "bg-blue-500" },
];

export default function SignalModal({ isOpen, onClose, onSubmit, latitude, longitude }: SignalModalProps) {
    const [selectedType, setSelectedType] = useState<SignalType>("DANGER");
    const [description, setDescription] = useState("");

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[100] p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200 border border-slate-200">
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <div>
                        <h3 className="text-lg font-bold text-slate-900">Report Hazard</h3>
                        <p className="text-[10px] text-slate-500 font-mono">
                            {latitude.toFixed(4)}, {longitude.toFixed(4)}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 hover:bg-slate-200 rounded-lg transition-colors"
                    >
                        <CloseIcon className="w-5 h-5 text-slate-400" />
                    </button>
                </div>

                <div className="p-4 space-y-4">
                    <div className="grid grid-cols-3 gap-2">
                        {SIGNAL_TYPES.map((item) => (
                            <button
                                key={item.type}
                                onClick={() => setSelectedType(item.type)}
                                className={cn(
                                    "flex flex-col items-center justify-center p-2 rounded-xl border-2 transition-all gap-1",
                                    selectedType === item.type
                                        ? "border-emerald-500 bg-emerald-50 ring-2 ring-emerald-500/10"
                                        : "border-slate-100 hover:border-slate-200 bg-slate-50/50"
                                )}
                            >
                                <span className="text-xl">{item.icon}</span>
                                <span className={cn(
                                    "font-bold text-[10px] uppercase tracking-wider",
                                    selectedType === item.type ? "text-emerald-700" : "text-slate-500"
                                )}>
                                    {item.label}
                                </span>
                            </button>
                        ))}
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-tight px-1">What did you see?</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Short description..."
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all outline-none resize-none h-20 text-sm"
                        />
                    </div>
                </div>

                <div className="p-4 pt-0 flex gap-2">
                    <button
                        onClick={() => onSubmit(selectedType, description)}
                        className="flex-1 py-2.5 px-4 rounded-xl font-bold bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 text-sm"
                    >
                        <CheckIcon className="w-4 h-4" />
                        Send Report
                    </button>
                </div>
            </div>
        </div>
    );
}

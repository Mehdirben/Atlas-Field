import {
    Site,
    Analysis,
    Alert,
    ChatHistory,
    UserProfile,
    SiteType,
    FieldTrends,
    ForestTrends,
    ChatMessage
} from "../types/api";

const STORAGE_KEYS = {
    SITES: "atlas_sites",
    ANALYSES: "atlas_analyses",
    ALERTS: "atlas_alerts",
    CHAT_HISTORY: "atlas_chat_history",
    USER: "atlas_user",
};

// --- Mock Data Generators ---

const generateDetailedReport = (site: Site, isForest: boolean) => {
    const healthScore = 75 + Math.floor(Math.random() * 20);
    const area = site.area_hectares || 10;

    const base = {
        metadata: {
            field_name: site.name,
            generated_at: new Date().toISOString(),
            area_hectares: area,
            crop_type: site.crop_type,
            forest_type: site.forest_type,
            analysis_type: isForest ? "FOREST" : "COMPLETE"
        },
        summary: {
            overall_health_score: healthScore,
            health_status: healthScore >= 85 ? "Excellent" : healthScore >= 70 ? "Good" : "Fair",
            index_name: isForest ? "Forest Health Index (FHI)" : "Complete Field Analysis",
            description: isForest
                ? `Comprehensive evaluation of ${site.name} reveals a stable ecosystem with high canopy density. Carbon sequestration remains above baseline levels, though minor moisture stress is noted in younger stands.`
                : `The vegetative development in ${site.name} is progressing optimally. Current NDVI values suggest strong biomass accumulation, while moisture levels are being maintained within the target threshold.`
        },
        environmental_factors: {
            data_quality: "High",
            cloud_coverage_percent: 2,
            satellite_data_age: "2 days",
            seasonal_context: isForest ? "Peak Growth Season" : "Mid-Vegetative Phase",
        },
        spatial_analysis: {
            uniformity_score: 88 + Math.floor(Math.random() * 10),
            uniformity_status: "Excellent Uniformity",
            affected_area_estimate: {
                healthy_area_percent: 94,
                healthy_area_hectares: (area * 0.94).toFixed(1),
            }
        },
        problems: [
            {
                severity: "MEDIUM",
                title: isForest ? "Canopy Thinning Detected" : "Nitrogen Deficiency Risk",
                description: isForest
                    ? "Slight decrease in canopy density observed in the north-eastern quadrant."
                    : "Spectral signature suggests potential localized nitrogen leaching following recent rainfall.",
                urgent_actions: [
                    isForest ? "On-site monitoring of affected block" : "Localized soil sampling",
                    "Compare with historical moisture data"
                ],
            }
        ],
        recommendations: [
            {
                priority: "HIGH",
                category: "Optimization",
                title: isForest ? "Selective Thinning Strategy" : "Variable Rate Application",
                description: isForest
                    ? "Implementing a selective thinning plan will improve growth rates in the primary block."
                    : "Adjusting fertilization based on spatial variability could increase yield by up to 8%.",
                actions: ["Review management plan", "Calibrate equipment"],
            }
        ],
        monitoring_schedule: [
            { task: "Daily Satellite Pass", recommended_interval: "24h", urgency: "MEDIUM" },
            { task: "UAV Multispectral Survey", recommended_interval: "Bi-weekly", urgency: "LOW" },
            { task: "Soil Moisture Probe Check", recommended_interval: "Weekly", urgency: "HIGH" },
        ]
    };

    if (isForest) {
        return {
            ...base,
            fire_risk_assessment: {
                fire_risk_level: "LOW",
                fire_risk_score: 12,
                nbr_value: 0.45 + (Math.random() * 0.1),
                ndmi_value: 0.38 + (Math.random() * 0.1),
                burn_severity: "None Detected",
                moisture_status: "Adequate",
                fire_prevention_priority: "Normal"
            },
            carbon_sequestration: {
                total_carbon_tonnes: (area * 145).toFixed(0),
                total_carbon_t_ha: 145.2,
                carbon_status: "Above Baseline",
                sequestration_potential: "High",
                carbon_change_percent: 2.4,
                annual_absorption: 5.8,
            },
            canopy_health: {
                canopy_cover_percent: 88,
                canopy_density: "High",
                vegetation_vigor: "Strong",
                health_status: "Excellent",
            },
            deforestation_monitoring: {
                deforestation_risk: "LOW",
                canopy_loss_indicator: "Stable",
                forest_fragmentation: "Low",
                change_detection_confidence: "98%",
            },
            vegetation_health: {
                ndvi_mean: 0.78,
                vegetation_density: "Dense Canopy",
                chlorophyll_activity: "High",
                growth_stage: "Mature",
                health_status: "Excellent",
            }
        };
    } else {
        return {
            ...base,
            vegetation_health: {
                ndvi_mean: 0.68,
                evi_mean: 0.72,
                ndwi_mean: 0.15,
                ndre_mean: 0.42,
                vegetation_density: "Moderate-High",
                chlorophyll_activity: "Active",
                growth_stage: "Late Vegetative",
                health_status: "Good",
            },
            moisture_assessment: {
                moisture_status: "Optimal",
                irrigation_need: "None",
                water_stress_risk: "LOW",
                estimated_moisture: 0.72,
                ndwi_value: 0.15,
            },
            biomass_analysis: {
                mean_biomass_t_ha: 14.2,
                biomass_level: "High",
                canopy_structure: "Uniform",
                total_carbon_t_ha: 42.5,
                evi_value: 0.72,
            },
            nitrogen_analysis: {
                chlorophyll_content: "Optimal",
                nitrogen_status: "Sufficient",
                ndre_value: 0.42,
            },
            yield_prediction: {
                total_yield_tonnes: (area * 7.2).toFixed(1),
                yield_per_ha: 7.2,
                yield_potential: "HIGH",
                confidence_level: "92%",
            }
        };
    }
};

const initialSites: Site[] = [
    {
        id: 1,
        name: "North Valley - Block A1",
        description: "Primary winter wheat production zone. High precision irrigation enabled.",
        geometry: {
            type: "Polygon",
            coordinates: [[[-122.084, 37.422], [-122.083, 37.422], [-122.083, 37.421], [-122.084, 37.421], [-122.084, 37.422]]]
        } as any,
        area_hectares: 12.5,
        site_type: "FIELD",
        crop_type: "Winter Wheat",
        planting_date: "2023-11-15",
        created_at: "2023-11-01T10:00:00Z",
        updated_at: new Date().toISOString(),
        latest_ndvi: 0.68,
        health_score: 88,
        latest_analysis_date: "2024-01-25",
        alert_count: 1,
    },
    {
        id: 2,
        name: "Pine Ridge - Sector 7G",
        description: "Mature coniferous forest block. Carbon sequestration monitoring focus.",
        geometry: {
            type: "Polygon",
            coordinates: [[[-122.088, 37.425], [-122.087, 37.425], [-122.087, 37.424], [-122.088, 37.424], [-122.088, 37.425]]]
        } as any,
        area_hectares: 45.2,
        site_type: "FOREST",
        forest_type: "Coniferous",
        tree_species: "Ponderosa Pine",
        protected_status: "Private Reserve",
        created_at: "2023-10-15T08:30:00Z",
        updated_at: new Date().toISOString(),
        latest_nbr: 0.45,
        fire_risk_level: "LOW",
        health_score: 94,
        latest_analysis_date: "2024-01-20",
        alert_count: 0,
    },
    {
        id: 3,
        name: "Riverside - Zone Delta",
        description: "High-yield maize production zone on river alluvial soil.",
        geometry: {
            type: "Polygon",
            coordinates: [[[-122.092, 37.418], [-122.091, 37.418], [-122.091, 37.417], [-122.092, 37.417], [-122.092, 37.418]]]
        } as any,
        area_hectares: 8.3,
        site_type: "FIELD",
        crop_type: "Maize",
        planting_date: "2024-04-10",
        created_at: "2024-03-20T14:45:00Z",
        updated_at: new Date().toISOString(),
        latest_ndvi: 0.45,
        health_score: 72,
        latest_analysis_date: "2024-05-15",
        alert_count: 2,
    },
    {
        id: 4,
        name: "Amazonian Buffer - Block F",
        description: "Tropical mixed forest edge. High biodiversity monitoring zone.",
        geometry: {
            type: "Polygon",
            coordinates: [[[-122.080, 37.430], [-122.078, 37.430], [-122.078, 37.428], [-122.080, 37.428], [-122.080, 37.430]]]
        } as any,
        area_hectares: 120.7,
        site_type: "FOREST",
        forest_type: "Mixed Tropical",
        tree_species: "Mahogany, Kapok, Cedar",
        protected_status: "National Park Buffer",
        created_at: "2023-01-10T12:00:00Z",
        updated_at: new Date().toISOString(),
        latest_nbr: 0.58,
        fire_risk_level: "MEDIUM",
        health_score: 82,
        latest_analysis_date: "2024-01-18",
        alert_count: 1,
    }
];

const initialAlerts: Alert[] = [
    {
        id: 1,
        site_id: 1,
        site_name: "North Valley - Block A1",
        alert_type: "MOISTURE",
        severity: "MEDIUM",
        title: "Soil Moisture Below Target",
        message: "Moisture levels in Block A1 have dropped to 0.72, approaching the irrigation threshold. Monitoring recommended.",
        is_read: false,
        created_at: "2024-01-26T15:20:00Z",
    },
    {
        id: 2,
        site_id: 3,
        site_name: "Riverside - Zone Delta",
        alert_type: "PEST_DISEASE",
        severity: "HIGH",
        title: "Pest Signature Detected",
        message: "Multispectral imagery confirms localized pest activity in Zone Delta. Immediate targeted treatment recommended.",
        is_read: false,
        created_at: "2024-05-16T09:15:00Z",
    },
    {
        id: 3,
        site_id: 4,
        site_name: "Amazonian Buffer - Block F",
        alert_type: "FIRE_RISK",
        severity: "CRITICAL",
        title: "Severe Fire Risk Level",
        message: "NDMI values in Block F indicate extreme canopy dryness. Fire risk index has peaked at 85/100.",
        is_read: false,
        created_at: "2024-01-19T11:40:00Z",
    }
];

const initialAnalyses: Analysis[] = [
    {
        id: 101,
        site_id: 1,
        analysis_type: "COMPLETE",
        satellite_date: "2024-01-25T10:30:00Z",
        data: {
            detailed_report: generateDetailedReport(initialSites[0], false)
        },
        mean_value: 0.68,
        interpretation: "Analysis of Block A1 shows robust vegetative growth. Yield potential is high.",
        created_at: "2024-01-25T11:00:00Z",
    },
    {
        id: 102,
        site_id: 2,
        analysis_type: "FOREST",
        satellite_date: "2024-01-20T09:15:00Z",
        data: {
            detailed_report: generateDetailedReport(initialSites[1], true),
            forest_data: { fire_risk_level: "LOW", ndmi: 0.45, carbon_estimate_tonnes_ha: 145.2 }
        },
        mean_value: 0.45,
        interpretation: "Sector 7G remains stable. Carbon sequestration is trending positive.",
        created_at: "2024-01-20T10:15:00Z",
    },
    {
        id: 103,
        site_id: 3,
        analysis_type: "COMPLETE",
        satellite_date: "2024-05-15T12:00:00Z",
        data: {
            detailed_report: generateDetailedReport(initialSites[2], false)
        },
        mean_value: 0.45,
        interpretation: "Zone Delta is showing early signs of moisture stress in the riverbend sector.",
        created_at: "2024-05-15T13:00:00Z",
    },
    {
        id: 104,
        site_id: 4,
        analysis_type: "FOREST",
        satellite_date: "2024-01-18T14:30:00Z",
        data: {
            detailed_report: generateDetailedReport(initialSites[3], true),
            forest_data: { fire_risk_level: "MEDIUM", ndmi: 0.28, carbon_estimate_tonnes_ha: 182.5 }
        },
        mean_value: 0.58,
        interpretation: "Block F monitoring indicates elevated fire risk due to abnormal dryness.",
        created_at: "2024-01-18T15:30:00Z",
    }
];

const initialChatHistory: ChatHistory[] = [
    {
        id: 1,
        field_id: 1,
        messages: [
            { role: "user", content: "Atlas, give me a status update on Block A1.", timestamp: "2024-01-26T10:00:00Z" },
            { role: "assistant", content: "Block A1 is currently performing exceptionally well with an NDVI of 0.68. My latest analysis confirms high yield potential, though I recommend monitoring the slight moisture dip in the south-west sector.", timestamp: "2024-01-26T10:00:05Z" }
        ],
        created_at: "2024-01-26T10:00:00Z",
        updated_at: "2024-01-26T10:00:05Z",
    },
    {
        id: 2,
        field_id: null,
        messages: [
            { role: "user", content: "Assess global fire risk across all forest blocks.", timestamp: "2024-01-27T14:00:00Z" },
            { role: "assistant", content: "The global fire risk is currently 'Moderate'. While Pine Ridge (Sector 7G) is low risk, Amazonian Block F is trending towards 'Critical' due to a sustained NDMI drop. I recommend focusing suppression assets there.", timestamp: "2024-01-27T14:00:10Z" }
        ],
        created_at: "2024-01-27T14:00:00Z",
        updated_at: "2024-01-27T14:00:10Z",
    }
];

// --- Store Logic ---

const getStore = <T>(key: string, initialData: T): T => {
    if (typeof window === "undefined") return initialData;
    const stored = localStorage.getItem(key);
    if (!stored) {
        localStorage.setItem(key, JSON.stringify(initialData));
        return initialData;
    }
    return JSON.parse(stored);
};

const setStore = <T>(key: string, data: T) => {
    if (typeof window !== "undefined") {
        localStorage.setItem(key, JSON.stringify(data));
    }
};

// --- Mock API Implementation ---

export const mockApi = {
    // Sites
    getSites: async (siteType?: SiteType): Promise<Site[]> => {
        let sites = getStore(STORAGE_KEYS.SITES, initialSites);
        if (siteType) {
            sites = sites.filter(s => s.site_type === siteType);
        }
        return sites;
    },

    getSite: async (id: number): Promise<Site> => {
        const sites = getStore(STORAGE_KEYS.SITES, initialSites);
        const site = sites.find(s => s.id === id);
        if (!site) throw new Error("Site not found");
        return site;
    },

    createSite: async (data: any): Promise<Site> => {
        const sites = getStore(STORAGE_KEYS.SITES, initialSites);
        const newSite: Site = {
            ...data,
            id: Math.max(...sites.map(s => s.id), 0) + 1,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            health_score: 75, // Default score
        };
        setStore(STORAGE_KEYS.SITES, [...sites, newSite]);
        return newSite;
    },

    updateSite: async (id: number, data: Partial<Site>): Promise<Site> => {
        const sites = getStore(STORAGE_KEYS.SITES, initialSites);
        const index = sites.findIndex(s => s.id === id);
        if (index === -1) throw new Error("Site not found");
        const updatedSite = { ...sites[index], ...data, updated_at: new Date().toISOString() };
        sites[index] = updatedSite;
        setStore(STORAGE_KEYS.SITES, sites);
        return updatedSite;
    },

    deleteSite: async (id: number): Promise<void> => {
        const sites = getStore(STORAGE_KEYS.SITES, initialSites);
        setStore(STORAGE_KEYS.SITES, sites.filter(s => s.id !== id));
    },

    // Analysis
    runAnalysis: async (siteId: number, analysisType: string): Promise<Analysis> => {
        await new Promise(resolve => setTimeout(resolve, 1500));
        const sites = getStore(STORAGE_KEYS.SITES, initialSites);
        const site = sites.find(s => s.id === siteId);
        const isForest = site?.site_type === "FOREST";

        const report = generateDetailedReport(site!, isForest);

        const interpretations: Record<string, string> = {
            NDVI: isForest ? "High canopy density confirmed. Chlorophyll activity is uniform across the block." : "Vegetation health is robust. NDVI values indicate peak biomass density for the current growth stage.",
            EVI: "Enhanced vegetation index shows strong biomass development, particularly in high-density areas.",
            NDWI: "Water stress analysis indicates optimal hydration levels. No immediate irrigation required.",
            NDRE: "Chlorophyll and nitrogen content analysis shows healthy nutrient uptake across the field.",
            NDMI: "Moisture levels are stable. No significant water stress detected in the central sectors.",
            NBR: "Burn ratio analysis confirms no fire activity. Regeneration patterns are consistent with historical data.",
            CARBON: "Carbon stock remains high. Annual sequestration rates are exceeding targets by 12%.",
            YIELD: "Yield prediction suggests a 15% increase compared to the previous season's baseline.",
            BIOMASS: "Above-ground biomass estimate is 14.2 tonnes per hectare, reflecting optimal management.",
            COMPLETE: isForest ? "Comprehensive forest ecosystem assessment complete. All health indicators are in range." : "Full agricultural zone analysis complete. No major anomalies or stress factors identified.",
            FOREST: "Detailed forest block evaluation complete. Biodiversity and canopy integrity are protected.",
            FUSION: "Multi-sensor fusion confirms high correlation between moisture distribution and growth vigor."
        };

        const newAnalysis: Analysis = {
            id: Date.now(),
            site_id: siteId,
            analysis_type: analysisType as any,
            satellite_date: new Date().toISOString(),
            data: {
                mock: true,
                detailed_report: report,
                forest_data: isForest ? {
                    fire_risk_level: (report as any).fire_risk_assessment?.fire_risk_level,
                    ndmi: (report as any).fire_risk_assessment?.ndmi_value,
                    carbon_estimate_tonnes_ha: (report as any).carbon_sequestration?.total_carbon_t_ha
                } : undefined
            },
            mean_value: 0.4 + Math.random() * 0.4,
            interpretation: interpretations[analysisType] || interpretations["COMPLETE"],
            created_at: new Date().toISOString(),
        };
        const history = getStore<Analysis[]>(STORAGE_KEYS.ANALYSES, initialAnalyses);
        setStore(STORAGE_KEYS.ANALYSES, [newAnalysis, ...history]);
        return newAnalysis;
    },

    getAnalysisHistory: async (siteId: number, analysisType?: string): Promise<Analysis[]> => {
        let history = getStore<Analysis[]>(STORAGE_KEYS.ANALYSES, initialAnalyses);
        history = history.filter(a => a.site_id === siteId);
        if (analysisType) {
            history = history.filter(a => a.analysis_type === analysisType);
        }
        return history;
    },

    getYieldPrediction: async (siteId: number): Promise<any> => {
        const history = getStore<Analysis[]>(STORAGE_KEYS.ANALYSES, initialAnalyses);
        const siteHistory = history.filter(a => a.site_id === siteId);
        const latestComplete = siteHistory.find(a => a.analysis_type === "COMPLETE" || a.analysis_type === "YIELD");

        if (latestComplete?.data?.detailed_report) {
            const report = latestComplete.data.detailed_report as any;
            return report.yield_prediction;
        }

        return {
            total_yield_tonnes: 85,
            yield_per_ha: 6.8,
            yield_potential: "HIGH",
            confidence_level: "88%",
        };
    },

    getBiomassEstimate: async (siteId: number): Promise<any> => {
        const history = getStore<Analysis[]>(STORAGE_KEYS.ANALYSES, initialAnalyses);
        const siteHistory = history.filter(a => a.site_id === siteId);
        const latestComplete = siteHistory.find(a => a.analysis_type === "COMPLETE" || a.analysis_type === "BIOMASS" || a.analysis_type === "FOREST");

        if (latestComplete?.data?.detailed_report) {
            const report = latestComplete.data.detailed_report as any;
            return report.biomass_analysis;
        }

        return {
            mean_biomass_t_ha: 12.4,
            biomass_level: "Healthy",
            canopy_structure: "Uniform",
            total_carbon_t_ha: 45.2,
        };
    },

    // Trends (Mocked with high quality random data)
    getFieldTrends: async (siteId: number): Promise<FieldTrends> => {
        const dates = Array.from({ length: 12 }, (_, i) => {
            const d = new Date();
            d.setMonth(d.getMonth() - (11 - i));
            return d.toISOString().split('T')[0];
        });

        return {
            analyses: dates.map((date, i) => ({
                analysis_id: i,
                date,
                ndvi: 0.4 + (Math.sin(i / 2) * 0.2) + (Math.random() * 0.05),
                evi: 0.45 + (Math.sin(i / 2) * 0.25) + (Math.random() * 0.05),
                ndwi: 0.1 + (Math.cos(i / 2) * 0.1) + (Math.random() * 0.02),
                ndre: 0.35 + (Math.sin(i / 3) * 0.15) + (Math.random() * 0.03),
                yield_per_ha: 6 + (Math.sin(i / 2) * 1) + (Math.random() * 0.5),
                biomass_t_ha: 15 + (i * 0.5) + (Math.random() * 2),
            })),
            overall_trend: "IMPROVING",
            avg_ndvi_change: 12.5,
            has_sufficient_data: true,
        };
    },

    getForestTrends: async (siteId: number): Promise<ForestTrends> => {
        const dates = Array.from({ length: 12 }, (_, i) => {
            const d = new Date();
            d.setMonth(d.getMonth() - (11 - i));
            return d.toISOString().split('T')[0];
        });

        return {
            analyses: dates.map((date, i) => ({
                analysis_id: i,
                date,
                ndvi: 0.7 + (Math.random() * 0.1),
                nbr: 0.5 + (Math.random() * 0.1),
                ndmi: 0.3 + (Math.random() * 0.1),
                carbon_stock_t_ha: 120 + (i * 0.2),
                canopy_cover_percent: 85 + (Math.random() * 5),
                fire_risk_level: "LOW",
                deforestation_risk: "LOW",
            })),
            overall_trend: "STABLE",
            has_sufficient_data: true,
        };
    },

    // Alerts
    getAlerts: async (unreadOnly = false): Promise<Alert[]> => {
        const alerts = getStore(STORAGE_KEYS.ALERTS, initialAlerts);
        return unreadOnly ? alerts.filter(a => !a.is_read) : alerts;
    },

    markAlertRead: async (id: number): Promise<Alert> => {
        const alerts = getStore(STORAGE_KEYS.ALERTS, initialAlerts);
        const index = alerts.findIndex(a => a.id === id);
        if (index !== -1) {
            alerts[index].is_read = true;
            setStore(STORAGE_KEYS.ALERTS, alerts);
            return alerts[index];
        }
        throw new Error("Alert not found");
    },

    // Chat
    sendChatMessage: async (message: string, fieldId?: number): Promise<{ response: string }> => {
        await new Promise(resolve => setTimeout(resolve, 1000));
        const response = "This is a mock response from the Atlas AI. I've reviewed your data for " + (fieldId ? `Site #${fieldId}` : "all sites") + " and I suggest focusing on the recent moisture alerts. Query: " + message;

        const history = getStore<ChatHistory[]>(STORAGE_KEYS.CHAT_HISTORY, initialChatHistory);
        const sessionIndex = history.findIndex(h => h.field_id === (fieldId || null));

        const newMessage: ChatMessage = { role: "user", content: message, timestamp: new Date().toISOString() };
        const botMessage: ChatMessage = { role: "assistant", content: response, timestamp: new Date().toISOString() };

        if (sessionIndex !== -1) {
            history[sessionIndex].messages.push(newMessage, botMessage);
            history[sessionIndex].updated_at = new Date().toISOString();
        } else {
            history.push({
                id: Date.now(),
                field_id: fieldId || null,
                messages: [newMessage, botMessage],
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            });
        }
        setStore(STORAGE_KEYS.CHAT_HISTORY, history);

        return { response };
    },

    getChatHistory: async (fieldId?: number): Promise<ChatHistory[]> => {
        const history = getStore<ChatHistory[]>(STORAGE_KEYS.CHAT_HISTORY, initialChatHistory);
        if (fieldId !== undefined) {
            return history.filter(h => h.field_id === fieldId);
        }
        return history;
    },

    deleteChatHistory: async (id: number): Promise<void> => {
        const history = getStore<ChatHistory[]>(STORAGE_KEYS.CHAT_HISTORY, initialChatHistory);
        setStore(STORAGE_KEYS.CHAT_HISTORY, history.filter(h => h.id !== id));
    },

    // Auth
    getCurrentUser: async (): Promise<UserProfile> => {
        return {
            id: 1,
            email: "demo@atlas.io",
            full_name: "Demo User",
            subscription_tier: "PRO",
            is_active: true,
            is_verified: true,
            created_at: new Date().toISOString(),
        };
    }
};

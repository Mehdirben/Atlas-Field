export type SiteType = "FIELD" | "FOREST";

export interface UserProfile {
    id: number;
    email: string;
    full_name?: string;
    subscription_tier: "FREE" | "PRO" | "ENTERPRISE";
    is_active: boolean;
    is_verified: boolean;
    created_at: string;
}

export interface Site {
    id: number;
    name: string;
    description?: string;
    geometry: GeoJSON.Polygon;
    area_hectares?: number;
    site_type: SiteType;
    // Field-specific
    crop_type?: string;
    planting_date?: string;
    // Forest-specific
    forest_type?: string;
    tree_species?: string;
    protected_status?: string;
    // Timestamps
    created_at: string;
    updated_at: string;
    // Analysis data
    latest_ndvi?: number;
    health_score?: number;
    latest_analysis_date?: string;
    alert_count?: number;
    // Forest-specific analysis
    latest_nbr?: number;
    fire_risk_level?: string;
}

export type Field = Site;

export type SentinelSource = "Sentinel-1" | "Sentinel-2" | "Sentinel-2 L1C" | "Sentinel-2 L2A";

export interface Analysis {
    id: number;
    site_id: number;
    analysis_type: "NDVI" | "EVI" | "NDWI" | "NDRE" | "RVI" | "MOISTURE" | "FUSION" | "YIELD" | "BIOMASS" | "COMPLETE" | "FOREST";
    satellite_date?: string;
    sentinel_info?: {
        source: SentinelSource;
        resolution: string;
        orbit_number?: number;
        tile_id?: string;
    };
    data: Record<string, unknown>;
    mean_value?: number;
    min_value?: number;
    max_value?: number;
    cloud_coverage?: number;
    interpretation?: string;
    created_at: string;
}

export interface ForestAnalysisData {
    analysis_id: number;
    date: string;
    ndvi: number;
    nbr: number;
    dnbr?: number;
    ndmi: number;
    msi?: number;
    ndre?: number;
    evi?: number;
    savi?: number;
    carbon_stock_t_ha: number;
    canopy_cover_percent: number;
    fire_risk_level: string;
    deforestation_risk: string;
    ndvi_change_pct?: number;
    nbr_change_pct?: number;
    carbon_change_pct?: number;
    canopy_change_pct?: number;
}

export interface ForestTrends {
    analyses: ForestAnalysisData[];
    overall_trend: "IMPROVING" | "STABLE" | "DECLINING" | "UNKNOWN";
    avg_ndvi_change?: number;
    avg_carbon_change?: number;
    baseline_comparison?: any;
    has_sufficient_data: boolean;
    message?: string;
}

export interface FieldAnalysisData {
    analysis_id: number;
    date: string;
    ndvi: number;
    evi?: number;
    ndwi?: number;
    ndre?: number;
    yield_per_ha?: number;
    biomass_t_ha?: number;
    moisture_pct?: number;
    ndvi_change_pct?: number;
    yield_change_pct?: number;
}

export interface FieldTrends {
    analyses: FieldAnalysisData[];
    overall_trend: "IMPROVING" | "STABLE" | "DECLINING" | "UNKNOWN";
    avg_ndvi_change?: number;
    avg_yield_change?: number;
    baseline_comparison?: any;
    has_sufficient_data: boolean;
    message?: string;
}

export interface ChatMessage {
    role: "user" | "assistant";
    content: string;
    timestamp?: string;
}

export interface ChatHistory {
    id: number;
    field_id: number | null;
    messages: ChatMessage[];
    created_at: string;
    updated_at: string;
}

export interface Alert {
    id: number;
    site_id: number;
    site_name?: string;
    field_id?: number;
    field_name?: string;
    alert_type?: "VEGETATION_HEALTH" | "MOISTURE" | "FIRE_RISK" | "DEFORESTATION" | "DROUGHT_STRESS" | "PEST_DISEASE";
    severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    title: string;
    message: string;
    is_read: boolean;
    created_at: string;
}

// Investor Score & Marketplace Types

export interface InvestorScoreBreakdown {
    yield_stability: number;        // max 30 pts - based on 12-month NDVI history
    crop_diversification: number;   // max 20 pts
    farm_surface_area: number;      // max 15 pts
    climate_resilience: number;     // max 25 pts
    historical_performance: number; // max 10 pts
}

export interface InvestorScore {
    site_id: number;
    total_score: number;            // 0-100
    breakdown: InvestorScoreBreakdown;
    investment_potential_dh: number; // up to 200,000 DH
    estimated_roi_min: number;      // 12%
    estimated_roi_max: number;      // 25%
    calculated_at: string;
}

export interface MarketplaceListing {
    id: number;
    site_id: number;
    site_name: string;
    site_type: SiteType;
    area_hectares?: number;
    crop_type?: string;
    forest_type?: string;
    investor_score: InvestorScore;
    co2_credits_available?: number;  // tons
    co2_price_per_ton?: number;      // DH
    is_active: boolean;
    published_at: string;
}

export interface InvestmentSubmission {
    id: number;
    listing_id: number;
    site_id: number;
    site_name: string;
    investor_name: string;
    investor_email: string;
    investor_phone?: string;
    investment_type: "CO2_CREDITS" | "SITE_INVESTMENT" | "BOTH";
    proposed_amount_dh?: number;
    message?: string;
    is_read: boolean;
    is_contacted: boolean;
    submitted_at: string;
}

export type SignalType = "DANGER" | "ANIMAL" | "FIRE" | "ROAD_BLOCK" | "OTHER";

export interface CommunitySignal {
    id: number;
    type: SignalType;
    description?: string;
    latitude: number;
    longitude: number;
    created_at: string;
    user_id?: number;
    user_name?: string;
}

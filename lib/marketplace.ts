import {
    InvestorScore,
    InvestorScoreBreakdown,
    MarketplaceListing,
    InvestmentSubmission,
    Site
} from "../types/api";

// Storage keys for mock data persistence
const STORAGE_KEYS = {
    LISTINGS: "atlas_marketplace_listings",
    SUBMISSIONS: "atlas_investment_submissions",
};

// Helper functions for localStorage
function getStore<T>(key: string, initialData: T): T {
    if (typeof window === "undefined") return initialData;
    try {
        const stored = localStorage.getItem(key);
        return stored ? JSON.parse(stored) : initialData;
    } catch {
        return initialData;
    }
}

function setStore<T>(key: string, data: T): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(key, JSON.stringify(data));
}

/**
 * Calculate Investor Attractiveness Score based on satellite data
 * 
 * Factors:
 * - Yield stability (12-month NDVI history) - 30 pts
 * - Crop diversification - 20 pts
 * - Farm surface area - 15 pts
 * - Climate resilience - 25 pts
 * - Historical performance - 10 pts
 */
export function calculateInvestorScore(site: Site, ndviHistory?: number[]): InvestorScore {
    const breakdown: InvestorScoreBreakdown = {
        yield_stability: 0,
        crop_diversification: 0,
        farm_surface_area: 0,
        climate_resilience: 0,
        historical_performance: 0,
    };

    // Yield Stability (30 pts) - based on NDVI variance over 12 months
    if (ndviHistory && ndviHistory.length >= 3) {
        const mean = ndviHistory.reduce((a, b) => a + b, 0) / ndviHistory.length;
        const variance = ndviHistory.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / ndviHistory.length;
        const stability = Math.max(0, 1 - variance * 10); // Lower variance = higher stability
        breakdown.yield_stability = Math.round(stability * 30);
    } else if (site.latest_ndvi) {
        // Fallback: use current NDVI as proxy
        breakdown.yield_stability = Math.round((site.latest_ndvi / 1) * 25);
    }

    // Crop Diversification (20 pts)
    if (site.site_type === "FIELD") {
        // In real implementation, would check multiple crops
        breakdown.crop_diversification = site.crop_type ? 15 : 10;
    } else {
        // Forests get full diversification points (natural ecosystems)
        breakdown.crop_diversification = 20;
    }

    // Farm Surface Area (15 pts) - larger farms = more investment potential
    const area = site.area_hectares || 0;
    if (area >= 100) breakdown.farm_surface_area = 15;
    else if (area >= 50) breakdown.farm_surface_area = 12;
    else if (area >= 20) breakdown.farm_surface_area = 9;
    else if (area >= 10) breakdown.farm_surface_area = 6;
    else breakdown.farm_surface_area = 3;

    // Climate Resilience (25 pts) - based on fire risk and health indicators
    if (site.site_type === "FOREST") {
        const fireRisk = site.fire_risk_level?.toUpperCase();
        if (fireRisk === "LOW") breakdown.climate_resilience = 25;
        else if (fireRisk === "MODERATE" || fireRisk === "MEDIUM") breakdown.climate_resilience = 15;
        else breakdown.climate_resilience = 5;
    } else {
        const health = site.health_score || (site.latest_ndvi ? site.latest_ndvi * 100 : 50);
        breakdown.climate_resilience = Math.round((health / 100) * 25);
    }

    // Historical Performance (10 pts) - based on health score
    const healthScore = site.health_score || (site.latest_ndvi ? site.latest_ndvi * 100 : 50);
    breakdown.historical_performance = Math.round((healthScore / 100) * 10);

    // Calculate total
    const total_score =
        breakdown.yield_stability +
        breakdown.crop_diversification +
        breakdown.farm_surface_area +
        breakdown.climate_resilience +
        breakdown.historical_performance;

    // Calculate investment potential (up to 200,000 DH based on score)
    const investment_potential_dh = Math.round((total_score / 100) * 200000);

    // Estimated ROI based on score (12-25%)
    const estimated_roi_min = 12;
    const estimated_roi_max = Math.round(12 + (total_score / 100) * 13); // 12-25%

    return {
        site_id: site.id,
        total_score,
        breakdown,
        investment_potential_dh,
        estimated_roi_min,
        estimated_roi_max,
        calculated_at: new Date().toISOString(),
    };
}

// Mock Marketplace API
export const marketplaceApi = {
    // Get investor score for a site
    async getInvestorScore(site: Site): Promise<InvestorScore> {
        // Simulate NDVI history with some variance
        const baseNdvi = site.latest_ndvi || 0.55;
        const ndviHistory = Array.from({ length: 12 }, () =>
            baseNdvi + (Math.random() - 0.5) * 0.15
        );
        return calculateInvestorScore(site, ndviHistory);
    },

    // Publish a site to the marketplace
    async publishToMarketplace(
        site: Site,
        co2Credits?: number,
        co2Price?: number
    ): Promise<MarketplaceListing> {
        const listings = getStore<MarketplaceListing[]>(STORAGE_KEYS.LISTINGS, []);
        const score = await this.getInvestorScore(site);

        // Check if already listed
        const existingIndex = listings.findIndex(l => l.site_id === site.id);

        const listing: MarketplaceListing = {
            id: existingIndex >= 0 ? listings[existingIndex].id : Date.now(),
            site_id: site.id,
            site_name: site.name,
            site_type: site.site_type,
            area_hectares: site.area_hectares,
            crop_type: site.crop_type,
            forest_type: site.forest_type,
            investor_score: score,
            co2_credits_available: co2Credits,
            co2_price_per_ton: co2Price,
            is_active: true,
            published_at: new Date().toISOString(),
        };

        if (existingIndex >= 0) {
            listings[existingIndex] = listing;
        } else {
            listings.push(listing);
        }

        setStore(STORAGE_KEYS.LISTINGS, listings);
        return listing;
    },

    // Remove from marketplace
    async unpublishFromMarketplace(siteId: number): Promise<void> {
        const listings = getStore<MarketplaceListing[]>(STORAGE_KEYS.LISTINGS, []);
        const filtered = listings.filter(l => l.site_id !== siteId);
        setStore(STORAGE_KEYS.LISTINGS, filtered);
    },

    // Get all active listings (for investors)
    async getMarketplaceListings(): Promise<MarketplaceListing[]> {
        return getStore<MarketplaceListing[]>(STORAGE_KEYS.LISTINGS, [])
            .filter(l => l.is_active);
    },

    // Get listing for a specific site
    async getListingBySiteId(siteId: number): Promise<MarketplaceListing | null> {
        const listings = getStore<MarketplaceListing[]>(STORAGE_KEYS.LISTINGS, []);
        return listings.find(l => l.site_id === siteId) || null;
    },

    // Submit investment interest (investor action)
    async submitInvestmentInterest(data: {
        listing_id: number;
        site_id: number;
        site_name: string;
        investor_name: string;
        investor_email: string;
        investor_phone?: string;
        investment_type: "CO2_CREDITS" | "SITE_INVESTMENT" | "BOTH";
        proposed_amount_dh?: number;
        message?: string;
    }): Promise<InvestmentSubmission> {
        const submissions = getStore<InvestmentSubmission[]>(STORAGE_KEYS.SUBMISSIONS, []);

        const submission: InvestmentSubmission = {
            id: Date.now(),
            ...data,
            is_read: false,
            is_contacted: false,
            submitted_at: new Date().toISOString(),
        };

        submissions.push(submission);
        setStore(STORAGE_KEYS.SUBMISSIONS, submissions);
        return submission;
    },

    // Get all submissions for owner (optionally filter by site)
    async getInvestmentSubmissions(siteId?: number): Promise<InvestmentSubmission[]> {
        const submissions = getStore<InvestmentSubmission[]>(STORAGE_KEYS.SUBMISSIONS, []);
        if (siteId) {
            return submissions.filter(s => s.site_id === siteId);
        }
        return submissions.sort((a, b) =>
            new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime()
        );
    },

    // Mark submission as read
    async markSubmissionRead(submissionId: number): Promise<InvestmentSubmission | null> {
        const submissions = getStore<InvestmentSubmission[]>(STORAGE_KEYS.SUBMISSIONS, []);
        const index = submissions.findIndex(s => s.id === submissionId);
        if (index >= 0) {
            submissions[index].is_read = true;
            setStore(STORAGE_KEYS.SUBMISSIONS, submissions);
            return submissions[index];
        }
        return null;
    },

    // Mark submission as contacted
    async markSubmissionContacted(submissionId: number): Promise<InvestmentSubmission | null> {
        const submissions = getStore<InvestmentSubmission[]>(STORAGE_KEYS.SUBMISSIONS, []);
        const index = submissions.findIndex(s => s.id === submissionId);
        if (index >= 0) {
            submissions[index].is_contacted = true;
            submissions[index].is_read = true;
            setStore(STORAGE_KEYS.SUBMISSIONS, submissions);
            return submissions[index];
        }
        return null;
    },

    // Get unread submission count
    async getUnreadSubmissionCount(): Promise<number> {
        const submissions = getStore<InvestmentSubmission[]>(STORAGE_KEYS.SUBMISSIONS, []);
        return submissions.filter(s => !s.is_read).length;
    },
};

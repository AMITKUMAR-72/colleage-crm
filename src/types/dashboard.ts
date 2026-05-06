export interface LeadCycle {
    period: string;
    leads: number;
    applicants: number;
}

export interface CampaignSource {
    name: string;
    leads: number;
    applicants: number;
}

export interface CityStat {
    city: string;
    count: number;
}

export interface DailyTrend {
    date: string;
    leads: number;
    conversions: number;
}

export interface AdminDashboardStatsDTO {
    totalLeads: number;
    totalApplicants: number;
    leadCycle: LeadCycle[];
    campaignStats: CampaignSource[];
    cityStats: CityStat[];
    dailyTrends: DailyTrend[];
    generatedAt: string;
}

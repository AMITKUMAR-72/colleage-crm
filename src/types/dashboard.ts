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
    leads: number;
    applicants: number;
}

export interface DailyTrend {
    date: string;
    leads: number;
    conversions: number;
}

export interface CourseStat {
    course: string;
    leads: number;
    applicants: number;
}

export interface CounselorContact {
    counselorName: string;
    contactedToday: number;
    totalAssigned: number;
}

export interface CounselorScore {
    counselorName: string;
    hot: number;
    warm: number;
    cold: number;
    interested: number;
    discarded: number;
}

export interface AdminDashboardStatsDTO {
    totalLeads: number;
    totalApplicants: number;
    leadCycle: LeadCycle[];
    campaignStats: CampaignSource[];
    cityStats: CityStat[];
    dailyTrends: DailyTrend[];
    courseStats: CourseStat[];
    counselorContacts: CounselorContact[];
    counselorScores: CounselorScore[];
    generatedAt: string;
}

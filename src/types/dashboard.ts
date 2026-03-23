// ─── Admin Dashboard Stats DTO ────────────────────────────────────────────────
// Matches the shape returned by: GET /api/admin/dashboard/stats

export interface TopCampaign {
    name: string;
    count: number;
}

export interface TopCounselor {
    name: string;
    totalLeads: number;
}

export interface AdminDashboardStatsDTO {
    // ── Lead Counts ──────────────────────────────────────────
    /** 1. Total leads ever recorded */
    totalLeads: number;

    /** 2. Leads created today */
    leadsToday: number;

    /** 3. Leads created this week (Mon–Sun) */
    leadsThisWeek: number;

    /** 4. Leads created this month */
    leadsThisMonth: number;

    /** 5. New leads not yet assigned */
    newUnassignedLeads: number;

    /** 6. Leads currently queued */
    queuedLeads: number;

    // ── Lead Status Breakdown ────────────────────────────────
    /** 7. Leads actively assigned to a counselor */
    assignedLeads: number;

    /** 8. Leads that have been contacted at least once */
    contactedLeads: number;

    /** 9. Leads whose SLA has expired (TIMED_OUT) */
    timedOutLeads: number;

    /** 10. Leads with status ADMISSION_IN_PROCESS */
    admissionInProcess: number;

    /** 11. Leads with status ADMISSION_DONE (converted) */
    admissionDone: number;

    /** 12. Leads marked as LOST */
    lostLeads: number;

    // ── Conversion & Performance ─────────────────────────────
    /** 13. Conversion rate: admissionDone / totalLeads × 100 (%) */
    conversionRate: number;

    /** 14. SLA breach rate: timedOutLeads / totalLeads × 100 (%) */
    slaBreachRate: number;

    // ── Counselor Stats ──────────────────────────────────────
    /** 15. Total counselors registered */
    totalCounselors: number;

    /** 16. Counselors currently AVAILABLE */
    availableCounselors: number;

    /** 17. Average leads handled per counselor */
    avgLeadsPerCounselor: number;

    // ── Campaign & Source Stats ──────────────────────────────
    /** 18. Total number of unique campaigns / lead sources */
    totalCampaigns: number;

    /** 19. Top 3 campaigns by lead count */
    topCampaigns: TopCampaign[];

    // ── Session Stats ────────────────────────────────────────
    /** 20. Upcoming sessions scheduled (startTime > now) */
    upcomingSessions: number;

    // ── Meta ─────────────────────────────────────────────────
    /** ISO timestamp of when this snapshot was generated */
    generatedAt: string;
}

'use client';

import { useState, useEffect, useCallback } from 'react';
import { DashboardService } from '@/services/dashboardService';
import { AdminDashboardStatsDTO, TopCampaign } from '@/types/dashboard';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

// ─── Inline SVG Icons ──────────────────────────────────────────────────────────
const Ico = ({ d, cls = 'w-5 h-5' }: { d: string; cls?: string }) => (
    <svg className={cls} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d={d} />
    </svg>
);

const PATHS = {
    leads:     'M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z',
    today:     'M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5',
    week:      'M3.75 3v11.25A2.25 2.25 0 0 0 6 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0 1 18 16.5h-2.25m-7.5 0h7.5m-7.5 0-1 3m8.5-3 1 3',
    month:     'M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941',
    unassigned:'M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z',
    queued:    'M6 6.878V6a2.25 2.25 0 0 1 2.25-2.25h7.5A2.25 2.25 0 0 1 18 6v.878m-12 0c.235-.083.487-.128.75-.128h10.5c.263 0 .515.045.75.128m-12 0A2.25 2.25 0 0 0 3.75 9v.75m16.5-2.872A2.25 2.25 0 0 1 20.25 9v.75m0 0v6.75a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 16.5V9.75m16.5 0h-16.5',
    assigned:  'M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z',
    contacted: 'M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z',
    timeout:   'M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z',
    admission: 'M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 3.741-1.342',
    done:      'M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z',
    lost:      'M9.75 9.75l4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z',
    rate:      'M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941',
    breach:    'M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z',
    counselors:'M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z',
    available: 'M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z',
    avg:       'M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z',
    campaigns: 'M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 1 1 0-9h.75c.704 0 1.402-.03 2.09-.09m0 9.18c.253.962.584 1.892.985 2.783.247.55.06 1.21-.463 1.511l-.657.38c-.551.318-1.26.117-1.527-.461a20.845 20.845 0 0 1-1.44-4.282m3.102.069a18.03 18.03 0 0 1-.59-4.59c0-1.586.205-3.124.59-4.59',
    sessions:  'M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5m-9-6h.008v.008H12v-.008ZM12 15h.008v.008H12V15Zm0 2.25h.008v.008H12v-.008ZM9.75 15h.008v.008H9.75V15Zm0 2.25h.008v.008H9.75v-.008ZM7.5 15h.008v.008H7.5V15Zm0 2.25h.008v.008H7.5v-.008ZM12 9h.008v.008H12V9ZM9.75 9h.008v.008H9.75V9ZM7.5 9h.008v.008H7.5V9Z',
    refresh:   'M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99',
};

// ─── Colour palettes per category ────────────────────────────────────────────
const C = {
    red:    { bg: '#fef2f2', icon: '#4d0101', text: '#991b1b', border: '#fecaca' },
    amber:  { bg: '#fffbeb', icon: '#b45309', text: '#92400e', border: '#fde68a' },
    blue:   { bg: '#eff6ff', icon: '#1d4ed8', text: '#1e40af', border: '#bfdbfe' },
    green:  { bg: '#f0fdf4', icon: '#15803d', text: '#166534', border: '#bbf7d0' },
    purple: { bg: '#faf5ff', icon: '#7c3aed', text: '#6d28d9', border: '#ddd6fe' },
    slate:  { bg: '#f8fafc', icon: '#475569', text: '#334155', border: '#e2e8f0' },
    rose:   { bg: '#fff1f2', icon: '#be123c', text: '#9f1239', border: '#fecdd3' },
    teal:   { bg: '#f0fdfa', icon: '#0f766e', text: '#115e59', border: '#99f6e4' },
};

// ─── Skeleton shimmer ─────────────────────────────────────────────────────────
function Skeleton({ h = 100 }: { h?: number }) {
    return (
        <div
            className="animate-pulse rounded-2xl bg-gradient-to-r from-slate-100 via-slate-200 to-slate-100"
            style={{ height: h }}
        />
    );
}

// ─── Single Stat Card ─────────────────────────────────────────────────────────
interface StatCardProps {
    label: string;
    value: string | number;
    icon: string;
    color: typeof C[keyof typeof C];
    sub?: string;
    suffix?: string;
}

function StatCard({ label, value, icon, color, sub, suffix }: StatCardProps) {
    return (
        <div
            className="rounded-2xl border p-5 flex items-start gap-4 hover:shadow-md transition-all duration-200 group"
            style={{ background: color.bg, borderColor: color.border }}
        >
            <div
                className="w-11 h-11 flex-shrink-0 rounded-xl flex items-center justify-center"
                style={{ background: color.icon }}
            >
                <Ico d={icon} cls="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0 flex-1">
                <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: color.text, opacity: 0.7 }}>
                    {label}
                </p>
                <p className="text-3xl font-black leading-none mt-1" style={{ color: color.icon }}>
                    {value}{suffix && <span className="text-base ml-0.5 font-bold opacity-60">{suffix}</span>}
                </p>
                {sub && <p className="text-[11px] font-medium mt-1.5" style={{ color: color.text, opacity: 0.6 }}>{sub}</p>}
            </div>
        </div>
    );
}

// ─── Section Header ───────────────────────────────────────────────────────────
function SectionTitle({ title, icon }: { title: string; icon: string }) {
    return (
        <div className="flex items-center gap-2 mb-4 mt-2">
            <Ico d={icon} cls="w-4 h-4 text-slate-400" />
            <h2 className="text-xs font-black uppercase tracking-widest text-slate-400">{title}</h2>
            <hr className="flex-1 border-slate-200" />
        </div>
    );
}

// ─── Mini Bar chart for campaigns ────────────────────────────────────────────
function CampaignBar({ campaigns }: { campaigns: TopCampaign[] }) {
    if (!campaigns?.length) return <p className="text-slate-400 text-sm italic">No campaign data</p>;
    const max = Math.max(...campaigns.map(c => c.count), 1);
    return (
        <div className="space-y-3">
            {campaigns.map((c, i) => (
                <div key={i}>
                    <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1">
                        <span className="truncate max-w-[60%]">{c.name}</span>
                        <span className="font-black text-[#4d0101]">{c.count}</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{
                                width: `${(c.count / max) * 100}%`,
                                background: i === 0 ? '#4d0101' : i === 1 ? '#b45309' : '#1d4ed8',
                            }}
                        />
                    </div>
                </div>
            ))}
        </div>
    );
}

// ─── Rate Gauge ───────────────────────────────────────────────────────────────
function RateGauge({ value, label, good }: { value: number; label: string; good: boolean }) {
    const pct = Math.min(100, Math.max(0, value));
    const color = good
        ? pct > 50 ? '#15803d' : '#b45309'
        : pct > 30 ? '#be123c' : '#15803d';
    return (
        <div className="flex flex-col items-center gap-2">
            <div className="relative w-24 h-24">
                <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                    <path
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none" stroke="#e2e8f0" strokeWidth="3"
                    />
                    <path
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none" stroke={color} strokeWidth="3"
                        strokeDasharray={`${pct}, 100`}
                        strokeLinecap="round"
                    />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                    <p className="text-xl font-black" style={{ color }}>{pct.toFixed(1)}%</p>
                </div>
            </div>
            <p className="text-[11px] font-black uppercase tracking-widest text-slate-500 text-center">{label}</p>
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AdminDashboardStats() {
    const [stats, setStats] = useState<AdminDashboardStatsDTO | null>(null);
    const [loading, setLoading] = useState(true);
    const [lastFetched, setLastFetched] = useState<Date | null>(null);

    const fetchStats = useCallback(async () => {
        setLoading(true);
        try {
            const data = await DashboardService.getAdminStats();
            setStats(data);
            setLastFetched(new Date());
        } catch (err) {
            console.error('[AdminDashboardStats] Failed to fetch:', err);
            toast.error('Could not load dashboard stats. The backend endpoint may not be ready yet.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchStats(); }, [fetchStats]);

    return (
        <div className="space-y-8 animate-in fade-in duration-500">

            {/* ── Top Bar ──────────────────────────────────────────────── */}
            <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">Live Dashboard</h2>
                    <p className="text-slate-400 text-sm font-medium mt-0.5">
                        {lastFetched
                            ? `Last updated: ${format(lastFetched, 'hh:mm:ss a')}`
                            : 'Fetching live data…'}
                    </p>
                </div>
                <button
                    onClick={fetchStats}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#4d0101] text-white text-xs font-black uppercase tracking-widest hover:bg-[#600202] transition disabled:opacity-50"
                >
                    <Ico d={PATHS.refresh} cls={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                </button>
            </div>

            {loading && !stats ? (
                // ── Loading Skeleton ──
                <div className="space-y-6">
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                        {Array(8).fill(0).map((_, i) => <Skeleton key={i} h={110} />)}
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                        {Array(6).fill(0).map((_, i) => <Skeleton key={i} h={110} />)}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {Array(3).fill(0).map((_, i) => <Skeleton key={i} h={90} />)}
                    </div>
                </div>
            ) : !stats ? (
                // ── Empty / Error state ──
                <div className="flex flex-col items-center justify-center py-24 gap-4 border-2 border-dashed border-slate-200 rounded-3xl">
                    <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center">
                        <Ico d={PATHS.breach} cls="w-8 h-8 text-slate-300" />
                    </div>
                    <p className="text-slate-500 font-bold text-center max-w-sm">
                        Dashboard data not available.<br />
                        <span className="text-[#4d0101] font-black">Backend endpoint not ready yet.</span><br />
                        <span className="text-xs text-slate-400">Expected: GET /api/admin/dashboard/stats</span>
                    </p>
                    <button
                        onClick={fetchStats}
                        className="px-6 py-2.5 rounded-xl bg-[#4d0101] text-white text-xs font-black uppercase tracking-widest hover:bg-[#600202] transition"
                    >
                        Retry
                    </button>
                </div>
            ) : (
                <>
                    {/* ── Section 1: Lead Volume ─────────────────────────────── */}
                    <section>
                        <SectionTitle title="Lead Volume" icon={PATHS.leads} />
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                            <StatCard label="Total Leads"     value={stats.totalLeads}      icon={PATHS.leads}     color={C.red}   sub="All time" />
                            <StatCard label="Leads Today"     value={stats.leadsToday}       icon={PATHS.today}     color={C.amber} sub="Since midnight" />
                            <StatCard label="This Week"       value={stats.leadsThisWeek}    icon={PATHS.week}      color={C.blue}  sub="Mon – Sun" />
                            <StatCard label="This Month"      value={stats.leadsThisMonth}   icon={PATHS.month}     color={C.green} sub="Current month" />
                        </div>
                    </section>

                    {/* ── Section 2: Lead Pipeline ───────────────────────────── */}
                    <section>
                        <SectionTitle title="Lead Pipeline" icon={PATHS.queued} />
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                            <StatCard label="Unassigned"      value={stats.newUnassignedLeads} icon={PATHS.unassigned} color={C.rose}   sub="Waiting for counselor" />
                            <StatCard label="Queued"          value={stats.queuedLeads}         icon={PATHS.queued}    color={C.amber}  sub="In assignment queue" />
                            <StatCard label="Assigned"        value={stats.assignedLeads}       icon={PATHS.assigned}  color={C.blue}   sub="With a counselor" />
                            <StatCard label="Contacted"       value={stats.contactedLeads}      icon={PATHS.contacted} color={C.teal}   sub="At least 1 contact made" />
                            <StatCard label="Timed Out"       value={stats.timedOutLeads}       icon={PATHS.timeout}   color={C.rose}   sub="SLA expired" />
                            <StatCard label="In Admission"    value={stats.admissionInProcess}  icon={PATHS.admission} color={C.purple} sub="Admission in process" />
                            <StatCard label="Converted"       value={stats.admissionDone}       icon={PATHS.done}      color={C.green}  sub="Admission completed" />
                            <StatCard label="Lost"            value={stats.lostLeads}           icon={PATHS.lost}      color={C.slate}  sub="Marked as lost" />
                        </div>
                    </section>

                    {/* ── Section 3: Rates & Counselors & Campaigns ─────────── */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                        {/* Conversion & SLA rates */}
                        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
                            <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6">Performance Rates</p>
                            <div className="flex justify-around gap-4">
                                <RateGauge value={stats.conversionRate} label="Conversion Rate" good={true} />
                                <RateGauge value={stats.slaBreachRate}  label="SLA Breach Rate" good={false} />
                            </div>
                        </div>

                        {/* Counselors */}
                        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-4">
                            <p className="text-xs font-black uppercase tracking-widest text-slate-400">Counselors</p>
                            <div className="grid grid-cols-3 gap-3">
                                <div className="flex flex-col items-center rounded-xl p-3" style={{ background: C.blue.bg }}>
                                    <p className="text-2xl font-black" style={{ color: C.blue.icon }}>{stats.totalCounselors}</p>
                                    <p className="text-[10px] font-bold text-center mt-1" style={{ color: C.blue.text, opacity: 0.7 }}>Total</p>
                                </div>
                                <div className="flex flex-col items-center rounded-xl p-3" style={{ background: C.green.bg }}>
                                    <p className="text-2xl font-black" style={{ color: C.green.icon }}>{stats.availableCounselors}</p>
                                    <p className="text-[10px] font-bold text-center mt-1" style={{ color: C.green.text, opacity: 0.7 }}>Available</p>
                                </div>
                                <div className="flex flex-col items-center rounded-xl p-3" style={{ background: C.amber.bg }}>
                                    <p className="text-2xl font-black" style={{ color: C.amber.icon }}>{stats.avgLeadsPerCounselor?.toFixed(1)}</p>
                                    <p className="text-[10px] font-bold text-center mt-1" style={{ color: C.amber.text, opacity: 0.7 }}>Avg Leads</p>
                                </div>
                            </div>
                        </div>

                        {/* Campaigns + Sessions */}
                        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-4">
                            <div className="flex items-center justify-between">
                                <p className="text-xs font-black uppercase tracking-widest text-slate-400">Top Campaigns</p>
                                <span className="text-xs font-bold text-slate-400">{stats.totalCampaigns} sources</span>
                            </div>
                            <CampaignBar campaigns={stats.topCampaigns} />
                            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Ico d={PATHS.sessions} cls="w-4 h-4 text-purple-500" />
                                    <p className="text-xs font-bold text-slate-500">Upcoming Sessions</p>
                                </div>
                                <p className="text-lg font-black text-purple-600">{stats.upcomingSessions}</p>
                            </div>
                        </div>
                    </div>

                    {/* ── Footer: generated at ──────────────────────────────── */}
                    {stats.generatedAt && (
                        <p className="text-center text-[11px] text-slate-300 font-medium">
                            Snapshot generated at {format(new Date(stats.generatedAt), 'PPP p')}
                        </p>
                    )}
                </>
            )}
        </div>
    );
}

'use client';

import { useState, useEffect, useCallback } from 'react';
import { DashboardService } from '@/services/dashboardService';
import { createWebSocketClient } from '@/services/websocketService';
import { AdminDashboardStatsDTO } from '@/types/dashboard';
import { format } from 'date-fns';
import { Users, Award, TrendingUp, Activity, MapPin, Target, RefreshCw, Wifi, WifiOff, BookOpen, UserCheck, Star } from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, Legend, LineChart, Line, AreaChart, Area
} from 'recharts';

// ── Custom Tooltip ───────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
        <div style={{
            background: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: '10px',
            padding: '10px 14px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            fontSize: '12px',
        }}>
            <p style={{ fontWeight: 700, color: '#374151', marginBottom: 6 }}>{label}</p>
            {payload.map((entry: any, i: number) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: entry.color }} />
                    <span style={{ color: '#6b7280', textTransform: 'capitalize' }}>{entry.name}:</span>
                    <span style={{ fontWeight: 700, color: '#111827' }}>{Number(entry.value).toLocaleString()}</span>
                </div>
            ))}
        </div>
    );
};

// ── KPI Card ────────────────────────────────────────────────────────────────
function KPICard({ label, value, icon: Icon, bgColor }: { label: string; value: string | number; icon: any; bgColor: string }) {
    return (
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 16, padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: bgColor, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon style={{ width: 22, height: 22, color: '#fff' }} />
            </div>
            <div>
                <p style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>{label}</p>
                <p style={{ fontSize: 28, fontWeight: 900, color: '#111827', lineHeight: 1 }}>
                    {typeof value === 'number' ? value.toLocaleString() : value}
                </p>
            </div>
        </div>
    );
}

// ── Chart Card ───────────────────────────────────────────────────────────────
function ChartCard({ title, icon: Icon, children, fullWidth }: { title: string; icon: any; children: React.ReactNode; fullWidth?: boolean }) {
    return (
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 16, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', gridColumn: fullWidth ? '1 / -1' : undefined }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                <Icon style={{ width: 15, height: 15, color: '#3b82f6' }} />
                <h3 style={{ fontSize: 11, fontWeight: 800, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{title}</h3>
            </div>
            {children}
        </div>
    );
}

const emptyState = (msg: string) => (
    <div style={{ height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#9ca3af', fontSize: 13, fontWeight: 600 }}>{msg}</p>
    </div>
);

const AXIS = { fontSize: 10, fontWeight: 700, fill: '#9ca3af' } as const;
const GRID = '#f3f4f6';
const TIP_CURSOR = { fill: '#f9fafb' };

export default function AdminDashboardStats() {
    const [stats, setStats] = useState<AdminDashboardStatsDTO | null>(null);
    const [loading, setLoading] = useState(true);
    const [lastFetched, setLastFetched] = useState<Date | null>(null);
    const [isConnected, setIsConnected] = useState(false);

    const fetchStats = useCallback(async () => {
        setLoading(true);
        try {
            const data = await DashboardService.getAdminStats();
            console.log('[Dashboard] API Response:', data);
            setStats(data);
            setLastFetched(new Date());
        } catch (err) {
            console.error('[AdminDashboardStats] Failed to fetch:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchStats();
        const client = createWebSocketClient(() => fetchStats());
        client.onConnect    = () => setIsConnected(true);
        client.onDisconnect = () => setIsConnected(false);
        client.activate();
        return () => client.deactivate();
    }, [fetchStats]);

    if (loading && !stats) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ width: 36, height: 36, border: '4px solid #e0e7ff', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
                    <p style={{ fontSize: 13, color: '#9ca3af', fontWeight: 600 }}>Loading dashboard data...</p>
                </div>
            </div>
        );
    }

    if (!stats) return null;

    const conversionRate = stats.totalLeads > 0
        ? `${((stats.totalApplicants / stats.totalLeads) * 100).toFixed(1)}%`
        : '0%';

    // Safe array access with fallbacks
    const leadCycle       = Array.isArray(stats.leadCycle)         ? stats.leadCycle         : [];
    const campaignStats    = Array.isArray(stats.campaignStats)     ? stats.campaignStats     : [];
    const cityStats        = Array.isArray(stats.cityStats)         ? stats.cityStats         : [];
    const dailyTrends      = Array.isArray(stats.dailyTrends)       ? stats.dailyTrends       : [];
    const courseStats      = Array.isArray(stats.courseStats)       ? stats.courseStats       : [];
    const counselorContacts= Array.isArray(stats.counselorContacts) ? stats.counselorContacts : [];
    const counselorScores  = Array.isArray(stats.counselorScores)   ? stats.counselorScores   : [];

    return (
        <div style={{ maxWidth: 1400, margin: '0 auto' }}>

            {/* ── Header ─────────────────────────────────────────────── */}
            <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 16, padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                <div>
                    <h2 style={{ fontSize: 20, fontWeight: 900, color: '#111827', margin: 0 }}>Live Dashboard</h2>
                    <p style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600, marginTop: 2 }}>
                        {lastFetched ? `Updated: ${format(lastFetched, 'hh:mm:ss a')}` : 'Fetching...'}
                    </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        padding: '6px 12px', borderRadius: 999, fontSize: 11, fontWeight: 700,
                        border: `1px solid ${isConnected ? '#bbf7d0' : '#e5e7eb'}`,
                        background: isConnected ? '#f0fdf4' : '#f9fafb',
                        color: isConnected ? '#16a34a' : '#9ca3af',
                    }}>
                        {isConnected
                            ? <Wifi style={{ width: 12, height: 12 }} />
                            : <WifiOff style={{ width: 12, height: 12 }} />}
                        {isConnected ? 'Real-time' : 'Offline'}
                    </div>
                    <button onClick={fetchStats} style={{
                        display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px',
                        borderRadius: 10, background: '#2563eb', color: '#fff', border: 'none',
                        fontSize: 12, fontWeight: 700, cursor: 'pointer'
                    }}>
                        <RefreshCw style={{ width: 13, height: 13, ...(loading ? { animation: 'spin 0.8s linear infinite' } : {}) }} />
                        Refresh
                    </button>
                </div>
            </div>

            {/* ── KPI Cards ───────────────────────────────────────────── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 20 }}>
                <KPICard label="Total Leads"      value={stats.totalLeads}      icon={Users}      bgColor="#3b82f6" />
                <KPICard label="Total Applicants" value={stats.totalApplicants}  icon={Award}      bgColor="#10b981" />
                <KPICard label="Conversion Rate"  value={conversionRate}         icon={TrendingUp} bgColor="#f59e0b" />
            </div>

            {/* ── Charts ──────────────────────────────────────────────── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))', gap: 16 }}>

                {/* 1. Lead Conversion Cycle */}
                <ChartCard title="Lead Conversion Cycle (Monthly)" icon={TrendingUp}>
                    {leadCycle.length === 0 ? emptyState('No monthly data available') : (
                        <ResponsiveContainer width="100%" height={280}>
                            <AreaChart data={leadCycle} margin={{ top: 4, right: 12, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="gL" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.15}/>
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                    </linearGradient>
                                    <linearGradient id="gA" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%"  stopColor="#10b981" stopOpacity={0.15}/>
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid stroke={GRID} vertical={false} />
                                <XAxis dataKey="period" tick={AXIS} tickLine={false} axisLine={false} dy={8} />
                                <YAxis tick={AXIS} tickLine={false} axisLine={false} />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend iconType="circle" wrapperStyle={{ fontSize: 11, fontWeight: 700, paddingTop: 12 }} />
                                <Area type="monotone" dataKey="leads"      stroke="#3b82f6" strokeWidth={2.5} fill="url(#gL)" dot={false} />
                                <Area type="monotone" dataKey="applicants" stroke="#10b981" strokeWidth={2.5} fill="url(#gA)" dot={false} />
                            </AreaChart>
                        </ResponsiveContainer>
                    )}
                </ChartCard>

                {/* 2. Campaign Source Performance */}
                <ChartCard title="Campaign Source Performance" icon={Target}>
                    {campaignStats.length === 0 ? emptyState('No campaign data available') : (
                        <ResponsiveContainer width="100%" height={280}>
                            <BarChart data={campaignStats} barGap={6} margin={{ top: 4, right: 12, left: 0, bottom: 0 }}>
                                <CartesianGrid stroke={GRID} vertical={false} />
                                <XAxis dataKey="name" tick={AXIS} tickLine={false} axisLine={false} dy={8} />
                                <YAxis tick={AXIS} tickLine={false} axisLine={false} />
                                <Tooltip content={<CustomTooltip />} cursor={TIP_CURSOR} />
                                <Legend wrapperStyle={{ fontSize: 11, fontWeight: 700, paddingTop: 12 }} />
                                <Bar dataKey="leads"      name="Leads"      fill="#3b82f6" radius={[4,4,0,0]} maxBarSize={28} />
                                <Bar dataKey="applicants" name="Applicants" fill="#06b6d4" radius={[4,4,0,0]} maxBarSize={28} />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </ChartCard>

                {/* 3. City-wise — pillar graph with name at bottom */}
                <ChartCard title="Geographic Distribution (City-wise)" icon={MapPin}>
                    {cityStats.length === 0 ? emptyState('No city data available') : (
                        <ResponsiveContainer width="100%" height={280}>
                            <BarChart data={cityStats} barGap={6} margin={{ top: 10, right: 12, left: 0, bottom: 40 }}>
                                <CartesianGrid stroke={GRID} vertical={false} />
                                <XAxis 
                                    dataKey="city" 
                                    tick={{ ...AXIS, textAnchor: 'end' }} 
                                    tickLine={false} 
                                    axisLine={false} 
                                    angle={-35} 
                                    dy={10} 
                                />
                                <YAxis tick={AXIS} tickLine={false} axisLine={false} />
                                <Tooltip content={<CustomTooltip />} cursor={TIP_CURSOR} />
                                <Legend wrapperStyle={{ fontSize: 11, fontWeight: 700, paddingTop: 12 }} />
                                <Bar dataKey="leads"      name="Leads"      fill="#f59e0b" radius={[4,4,0,0]} maxBarSize={28} />
                                <Bar dataKey="applicants" name="Applicants" fill="#8b5cf6" radius={[4,4,0,0]} maxBarSize={28} />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </ChartCard>

                {/* 4. Daily Trends */}
                <ChartCard title="Daily Performance Trend (Last 30 Days)" icon={Activity}>
                    {dailyTrends.length === 0 ? emptyState('No daily trend data available') : (
                        <ResponsiveContainer width="100%" height={280}>
                            <LineChart data={dailyTrends} margin={{ top: 4, right: 12, left: 0, bottom: 0 }}>
                                <CartesianGrid stroke={GRID} vertical={false} />
                                <XAxis dataKey="date" tick={AXIS} tickLine={false} axisLine={false} dy={8} />
                                <YAxis tick={AXIS} tickLine={false} axisLine={false} />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend wrapperStyle={{ fontSize: 11, fontWeight: 700, paddingTop: 12 }} />
                                <Line type="monotone" dataKey="leads"       name="Leads"       stroke="#8b5cf6" strokeWidth={2.5} dot={false} activeDot={{ r: 5 }} />
                                <Line type="monotone" dataKey="conversions" name="Conversions" stroke="#ec4899" strokeWidth={2.5} dot={false} activeDot={{ r: 5 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    )}
                </ChartCard>

                {/* 6. Counselor Performance — full width */}
                <div style={{ gridColumn: '1 / -1' }}>
                    <ChartCard title="Counselor Contact Performance (Total History vs Today)" icon={UserCheck}>
                        {counselorContacts.length === 0 ? emptyState('No counselor contact data available') : (
                            <ResponsiveContainer width="100%" height={320}>
                                <BarChart data={counselorContacts} barGap={6} margin={{ top: 4, right: 16, left: 0, bottom: 40 }}>
                                    <CartesianGrid stroke={GRID} vertical={false} />
                                    <XAxis
                                        dataKey="counselorName"
                                        tick={{ ...AXIS, textAnchor: 'end' }}
                                        tickLine={false} axisLine={false}
                                        angle={-35} dy={10}
                                    />
                                    <YAxis tick={AXIS} tickLine={false} axisLine={false} />
                                    <Tooltip content={<CustomTooltip />} cursor={TIP_CURSOR} />
                                    <Legend wrapperStyle={{ fontSize: 11, fontWeight: 700, paddingTop: 12 }} />
                                    <Bar dataKey="totalContacted" name="Total Contacted (History)" fill="#4f46e5" radius={[5,5,0,0]} maxBarSize={28} />
                                    <Bar dataKey="contactedToday" name="Contacted Today"         fill="#10b981" radius={[5,5,0,0]} maxBarSize={28} />
                                    <Bar dataKey="totalAssigned"  name="Total Leads Assigned"    fill="#e2e8f0" radius={[5,5,0,0]} maxBarSize={28} />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </ChartCard>
                </div>

                {/* 7. Counselor Lead Score Distribution — full width */}
                <div style={{ gridColumn: '1 / -1' }}>
                    <ChartCard title="Counselor Lead Score Distribution (HOT / WARM / COLD / INTERESTED / DISCARDED)" icon={Star}>
                        {counselorScores.length === 0 ? emptyState('No score data available') : (
                            <ResponsiveContainer width="100%" height={340}>
                                <BarChart data={counselorScores} barGap={4} margin={{ top: 4, right: 16, left: 0, bottom: 40 }}>
                                    <CartesianGrid stroke={GRID} vertical={false} />
                                    <XAxis
                                        dataKey="counselorName"
                                        tick={{ ...AXIS, textAnchor: 'end' }}
                                        tickLine={false} axisLine={false}
                                        angle={-35} dy={10}
                                    />
                                    <YAxis tick={AXIS} tickLine={false} axisLine={false} />
                                    <Tooltip content={<CustomTooltip />} cursor={TIP_CURSOR} />
                                    <Legend wrapperStyle={{ fontSize: 11, fontWeight: 700, paddingTop: 12 }} />
                                    <Bar dataKey="hot"        name="HOT"        fill="#ef4444" radius={[5,5,0,0]} maxBarSize={18} />
                                    <Bar dataKey="warm"       name="WARM"       fill="#f97316" radius={[5,5,0,0]} maxBarSize={18} />
                                    <Bar dataKey="cold"       name="COLD"       fill="#3b82f6" radius={[5,5,0,0]} maxBarSize={18} />
                                    <Bar dataKey="interested" name="INTERESTED" fill="#8b5cf6" radius={[5,5,0,0]} maxBarSize={18} />
                                    <Bar dataKey="discarded"  name="DISCARDED"  fill="#9ca3af" radius={[5,5,0,0]} maxBarSize={18} />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </ChartCard>
                </div>

            </div>
        </div>
    );
}

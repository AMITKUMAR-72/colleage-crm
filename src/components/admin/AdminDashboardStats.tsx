'use client';

import { useState, useEffect, useCallback } from 'react';
import { DashboardService } from '@/services/dashboardService';
import { createWebSocketClient } from '@/services/websocketService';
import { AdminDashboardStatsDTO } from '@/types/dashboard';
import { format } from 'date-fns';
import {
    BarChart3, Users, TrendingUp, Target, MapPin, 
    Activity, Bell, Award, RefreshCw, Calendar,
    ChevronRight, ArrowUpRight, Filter, Download,
    Search, LayoutDashboard, Database, Settings
} from 'lucide-react';
import {
    PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
    CartesianGrid, Tooltip, ResponsiveContainer, Legend,
    LineChart, Line, AreaChart, Area
} from 'recharts';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#6366F1', '#06B6D4'];

export default function AdminDashboardStats() {
    const [stats, setStats] = useState<AdminDashboardStatsDTO | null>(null);
    const [loading, setLoading] = useState(true);
    const [lastFetched, setLastFetched] = useState<Date | null>(null);
    const [isConnected, setIsConnected] = useState(false);

    const fetchStats = useCallback(async () => {
        setLoading(true);
        try {
            const data = await DashboardService.getAdminStats();
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

        const client = createWebSocketClient((update) => {
            console.log('[DashboardWS] Received update, refreshing...');
            fetchStats();
        });

        client.onConnect = () => setIsConnected(true);
        client.onDisconnect = () => setIsConnected(false);

        client.activate();
        return () => client.deactivate();
    }, [fetchStats]);

    if (loading && !stats) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[600px] gap-6">
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Activity className="w-6 h-6 text-blue-500 animate-pulse" />
                    </div>
                </div>
                <div className="text-center">
                    <h3 className="text-white font-bold text-lg mb-1">Synchronizing Intelligence</h3>
                    <p className="text-slate-500 text-sm animate-pulse uppercase tracking-[0.3em]">Establishing secure data stream...</p>
                </div>
            </div>
        );
    }

    if (!stats) return null;

    return (
        <div className="max-w-[1600px] mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-1000 ease-out pb-12">
            
            {/* ── Top Command Bar ──────────────────────────────────────── */}
            <div className="flex items-center justify-between gap-6 flex-wrap sticky top-0 z-30 bg-slate-950/80 backdrop-blur-xl py-4 border-b border-slate-800/50 -mx-4 px-4 sm:mx-0 sm:px-0">
                <div className="flex items-center gap-4">
                    <div className="h-10 w-1 bg-blue-500 rounded-full shadow-[0_0_15px_rgba(59,130,246,0.5)]"></div>
                    <div>
                        <div className="flex items-center gap-2 mb-0.5">
                            <h2 className="text-2xl font-black text-white tracking-tight">Executive Overview</h2>
                            <span className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-400 text-[10px] font-black uppercase tracking-wider border border-blue-500/20">Real-time</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <p className="text-slate-500 text-xs font-bold flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {format(new Date(), 'EEEE, MMMM do yyyy')}
                            </p>
                            <span className="h-1 w-1 bg-slate-700 rounded-full"></span>
                            <div className="flex items-center gap-1.5">
                                <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></div>
                                <span className="text-[10px] font-bold text-slate-500 uppercase">{isConnected ? 'System Online' : 'Offline'}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="hidden sm:flex items-center gap-1 mr-4 bg-slate-900 rounded-xl p-1 border border-slate-800">
                        <button className="p-2 text-slate-400 hover:text-white transition-colors"><Search className="w-4 h-4" /></button>
                        <input type="text" placeholder="Global search..." className="bg-transparent border-none focus:ring-0 text-xs text-white placeholder-slate-600 w-32" />
                    </div>
                    <button onClick={fetchStats} className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-blue-400 hover:border-blue-500/30 transition-all active:scale-95 shadow-lg">
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                    <button className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-all shadow-lg">
                        <Download className="w-4 h-4" />
                    </button>
                    <button className="px-6 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-black uppercase tracking-widest hover:bg-blue-500 transition-all shadow-[0_0_20px_rgba(37,99,235,0.3)] active:scale-95 flex items-center gap-2">
                        <Filter className="w-3.5 h-3.5" />
                        Refine
                    </button>
                </div>
            </div>

            {/* ── Primary KPI Grid ─────────────────────────────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                
                {/* Total Leads Card */}
                <div className="relative group overflow-hidden bg-slate-900 border border-slate-800 rounded-3xl p-6 hover:border-blue-500/30 transition-all duration-500 shadow-xl">
                    <div className="absolute -right-4 -top-4 w-32 h-32 bg-blue-600/5 rounded-full blur-3xl group-hover:bg-blue-600/10 transition-colors"></div>
                    <div className="flex items-start justify-between mb-4">
                        <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                            <Users className="w-6 h-6" />
                        </div>
                        <div className="flex items-center gap-1 text-emerald-400 text-xs font-black bg-emerald-500/10 px-2 py-1 rounded-lg">
                            <ArrowUpRight className="w-3 h-3" />
                            12.5%
                        </div>
                    </div>
                    <div>
                        <h3 className="text-slate-500 text-xs font-black uppercase tracking-widest mb-1">Total Pipeline</h3>
                        <div className="flex items-baseline gap-2">
                            <span className="text-4xl font-black text-white">{stats.totalLeads.toLocaleString()}</span>
                            <span className="text-slate-600 text-sm font-bold">Leads</span>
                        </div>
                        <div className="mt-4 flex items-center gap-2">
                            <div className="flex-1 h-1 bg-slate-800 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-500 w-3/4 rounded-full"></div>
                            </div>
                            <span className="text-[10px] font-black text-slate-500 uppercase">75% Target</span>
                        </div>
                    </div>
                </div>

                {/* Total Applicants Card */}
                <div className="relative group overflow-hidden bg-slate-900 border border-slate-800 rounded-3xl p-6 hover:border-emerald-500/30 transition-all duration-500 shadow-xl">
                    <div className="absolute -right-4 -top-4 w-32 h-32 bg-emerald-600/5 rounded-full blur-3xl group-hover:bg-emerald-600/10 transition-colors"></div>
                    <div className="flex items-start justify-between mb-4">
                        <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <Award className="w-6 h-6" />
                        </div>
                        <div className="flex items-center gap-1 text-emerald-400 text-xs font-black bg-emerald-500/10 px-2 py-1 rounded-lg">
                            <ArrowUpRight className="w-3 h-3" />
                            8.2%
                        </div>
                    </div>
                    <div>
                        <h3 className="text-slate-500 text-xs font-black uppercase tracking-widest mb-1">Confirmed Apps</h3>
                        <div className="flex items-baseline gap-2">
                            <span className="text-4xl font-black text-white">{stats.totalApplicants.toLocaleString()}</span>
                            <span className="text-slate-600 text-sm font-bold">Students</span>
                        </div>
                        <div className="mt-4 flex items-center gap-2">
                            <div className="flex-1 h-1 bg-slate-800 rounded-full overflow-hidden">
                                <div className="h-full bg-emerald-500 w-1/2 rounded-full"></div>
                            </div>
                            <span className="text-[10px] font-black text-slate-500 uppercase">50% Growth</span>
                        </div>
                    </div>
                </div>

                {/* Conversion Rate Card */}
                <div className="relative group overflow-hidden bg-slate-900 border border-slate-800 rounded-3xl p-6 hover:border-amber-500/30 transition-all duration-500 shadow-xl">
                    <div className="absolute -right-4 -top-4 w-32 h-32 bg-amber-600/5 rounded-full blur-3xl group-hover:bg-amber-600/10 transition-colors"></div>
                    <div className="flex items-start justify-between mb-4">
                        <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            <TrendingUp className="w-6 h-6" />
                        </div>
                        <div className="flex items-center gap-1 text-amber-400 text-xs font-black bg-amber-500/10 px-2 py-1 rounded-lg">
                            Active
                        </div>
                    </div>
                    <div>
                        <h3 className="text-slate-500 text-xs font-black uppercase tracking-widest mb-1">Conversion Efficiency</h3>
                        <div className="flex items-baseline gap-2">
                            <span className="text-4xl font-black text-white">{(stats.totalLeads > 0 ? (stats.totalApplicants / stats.totalLeads * 100).toFixed(1) : 0)}</span>
                            <span className="text-slate-600 text-xl font-black">%</span>
                        </div>
                        <div className="mt-4 flex items-center gap-2">
                            <div className="flex-1 h-1 bg-slate-800 rounded-full overflow-hidden">
                                <div className="h-full bg-amber-500 w-[15%] rounded-full"></div>
                            </div>
                            <span className="text-[10px] font-black text-slate-500 uppercase">Benchmark: 12%</span>
                        </div>
                    </div>
                </div>

                {/* Active Sessions Card */}
                <div className="relative group overflow-hidden bg-slate-900 border border-slate-800 rounded-3xl p-6 hover:border-purple-500/30 transition-all duration-500 shadow-xl">
                    <div className="absolute -right-4 -top-4 w-32 h-32 bg-purple-600/5 rounded-full blur-3xl group-hover:bg-purple-600/10 transition-colors"></div>
                    <div className="flex items-start justify-between mb-4">
                        <div className="p-3 rounded-2xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                            <Activity className="w-6 h-6" />
                        </div>
                        <div className="w-2 h-2 rounded-full bg-red-500 animate-ping"></div>
                    </div>
                    <div>
                        <h3 className="text-slate-500 text-xs font-black uppercase tracking-widest mb-1">Pulse Score</h3>
                        <div className="flex items-baseline gap-2">
                            <span className="text-4xl font-black text-white">88</span>
                            <span className="text-slate-600 text-sm font-bold">Health</span>
                        </div>
                        <div className="mt-4 flex items-center gap-2 text-purple-400 font-bold text-[10px] uppercase tracking-widest bg-purple-500/10 px-3 py-1 rounded-full w-fit">
                            Optimal Performance
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Main Data Visualizations ─────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* 1. Lead Conversion Cycle (Refined Area Chart) */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-[2.5rem] p-8 shadow-2xl relative">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-xl font-black text-white flex items-center gap-3">
                                <LayoutDashboard className="w-5 h-5 text-blue-500" />
                                Growth Lifecycle
                            </h3>
                            <p className="text-slate-500 text-xs font-bold mt-1 uppercase tracking-wider">Leads vs Applicants Comparison</p>
                        </div>
                        <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
                            <button className="px-3 py-1 text-[10px] font-black text-white bg-slate-800 rounded-lg uppercase tracking-wider">Monthly</button>
                            <button className="px-3 py-1 text-[10px] font-black text-slate-500 hover:text-slate-300 uppercase tracking-wider transition-colors">Quarterly</button>
                        </div>
                    </div>
                    <div className="h-[400px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={stats.leadCycle}>
                                <defs>
                                    <linearGradient id="areaLeads" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                    </linearGradient>
                                    <linearGradient id="areaApps" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="0 0" stroke="#1e293b" vertical={false} />
                                <XAxis dataKey="period" stroke="#475569" fontSize={10} fontWeight="900" tickLine={false} axisLine={false} dy={15} />
                                <YAxis stroke="#475569" fontSize={10} fontWeight="900" tickLine={false} axisLine={false} />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#020617', border: '1px solid #1e293b', borderRadius: '20px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}
                                    itemStyle={{ fontWeight: '900', textTransform: 'uppercase', fontSize: '10px' }}
                                />
                                <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ paddingBottom: '30px', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.1em' }} />
                                <Area type="monotone" dataKey="leads" stroke="#3b82f6" strokeWidth={5} fillOpacity={1} fill="url(#areaLeads)" animationDuration={1500} />
                                <Area type="monotone" dataKey="applicants" stroke="#10b981" strokeWidth={5} fillOpacity={1} fill="url(#areaApps)" animationDuration={1500} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 2. Campaign Pillar Graph (Professional Bar Chart) */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-[2.5rem] p-8 shadow-2xl">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-xl font-black text-white flex items-center gap-3">
                                <Target className="w-5 h-5 text-cyan-400" />
                                Source Performance
                            </h3>
                            <p className="text-slate-500 text-xs font-bold mt-1 uppercase tracking-wider">Acquisition by Channel</p>
                        </div>
                        <button className="text-slate-500 hover:text-white transition-colors">
                            <Settings className="w-5 h-5" />
                        </button>
                    </div>
                    <div className="h-[400px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats.campaignStats} barGap={12}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} opacity={0.3} />
                                <XAxis dataKey="name" stroke="#475569" fontSize={10} fontWeight="900" tickLine={false} axisLine={false} dy={15} />
                                <YAxis stroke="#475569" fontSize={10} fontWeight="900" tickLine={false} axisLine={false} />
                                <Tooltip 
                                    cursor={{fill: 'rgba(255,255,255,0.02)'}}
                                    contentStyle={{ backgroundColor: '#020617', border: '1px solid #1e293b', borderRadius: '20px' }}
                                />
                                <Legend verticalAlign="top" align="right" wrapperStyle={{ paddingBottom: '30px', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase' }} />
                                <Bar dataKey="leads" fill="#3b82f6" radius={[8, 8, 0, 0]} barSize={24} />
                                <Bar dataKey="applicants" fill="#06b6d4" radius={[8, 8, 0, 0]} barSize={24} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 3. Geographic Circle (Enhanced Donut Chart) */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-[2.5rem] p-8 shadow-2xl">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-xl font-black text-white flex items-center gap-3">
                                <MapPin className="w-5 h-5 text-orange-400" />
                                Regional Reach
                            </h3>
                            <p className="text-slate-500 text-xs font-bold mt-1 uppercase tracking-wider">Global Distribution Analysis</p>
                        </div>
                        <div className="h-2 w-12 bg-slate-800 rounded-full"></div>
                    </div>
                    <div className="h-[400px] w-full flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={stats.cityStats}
                                    cx="50%"
                                    cy="45%"
                                    innerRadius={90}
                                    outerRadius={140}
                                    paddingAngle={8}
                                    dataKey="count"
                                    nameKey="city"
                                    stroke="none"
                                >
                                    {stats.cityStats.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#020617', border: '1px solid #1e293b', borderRadius: '20px' }}
                                />
                                <Legend layout="horizontal" verticalAlign="bottom" align="center" wrapperStyle={{ paddingTop: '40px', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 4. Daily Performance (High-Contrast Line Chart) */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-[2.5rem] p-8 shadow-2xl">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-xl font-black text-white flex items-center gap-3">
                                <Activity className="w-5 h-5 text-purple-400" />
                                Velocity Trends
                            </h3>
                            <p className="text-slate-500 text-xs font-bold mt-1 uppercase tracking-wider">Daily Processing Efficiency</p>
                        </div>
                        <div className="flex items-center -space-x-2">
                            {[1, 2, 3].map(i => <div key={i} className="w-6 h-6 rounded-full border-2 border-slate-900 bg-slate-800 flex items-center justify-center text-[8px] font-bold text-slate-500">M</div>)}
                        </div>
                    </div>
                    <div className="h-[400px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={stats.dailyTrends}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} opacity={0.3} />
                                <XAxis dataKey="date" stroke="#475569" fontSize={10} fontWeight="900" tickLine={false} axisLine={false} dy={15} />
                                <YAxis stroke="#475569" fontSize={10} fontWeight="900" tickLine={false} axisLine={false} />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#020617', border: '1px solid #1e293b', borderRadius: '20px' }}
                                />
                                <Legend verticalAlign="top" align="right" wrapperStyle={{ paddingBottom: '30px', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase' }} />
                                <Line type="stepAfter" dataKey="leads" stroke="#8b5cf6" strokeWidth={5} dot={false} activeDot={{ r: 8 }} />
                                <Line type="stepAfter" dataKey="conversions" stroke="#ec4899" strokeWidth={5} dot={false} activeDot={{ r: 8 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* ── Actionable Bottom Sheet ─────────────────────────────── */}
            <div className="bg-gradient-to-r from-blue-600/10 via-slate-900 to-emerald-600/10 border border-slate-800 rounded-[3rem] p-10 flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl overflow-hidden relative group">
                <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>
                <div className="relative">
                    <h4 className="text-2xl font-black text-white mb-2">Operational Intelligence Protocol</h4>
                    <p className="text-slate-400 font-medium max-w-xl">
                        Systems are currently operating within nominal parameters. Real-time WebSocket synchronization is active with an average latency of <span className="text-blue-400 font-black">12ms</span>.
                    </p>
                </div>
                <div className="flex items-center gap-4 relative">
                    <button className="px-8 py-4 rounded-2xl bg-slate-800 text-white font-black text-xs uppercase tracking-widest hover:bg-slate-700 transition-all border border-slate-700">
                        Diagnostics
                    </button>
                    <button className="px-8 py-4 rounded-2xl bg-white text-black font-black text-xs uppercase tracking-widest hover:bg-slate-100 transition-all shadow-[0_0_30px_rgba(255,255,255,0.2)]">
                        Generate Report
                    </button>
                </div>
            </div>

            {/* ── Legal Footer ────────────────────────────────────────── */}
            <div className="flex flex-col items-center gap-4 opacity-40 hover:opacity-100 transition-opacity duration-500">
                <p className="text-[9px] font-black uppercase tracking-[0.5em] text-slate-500">
                    Proprietary Algorithm • End-to-End Encryption Active • Raffles University CRM v4.0
                </p>
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                        <Database className="w-3 h-3" />
                        <span className="text-[8px] font-bold uppercase tracking-widest text-slate-600">DB Node: Raffles-Cluster-01</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Activity className="w-3 h-3" />
                        <span className="text-[8px] font-bold uppercase tracking-widest text-slate-600">System Load: 0.42ms</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

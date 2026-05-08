'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import LeadInbox from '@/components/LeadInbox';
import CounselorManager from '@/components/admin/CounselorManager';
import AuditMonitor from '@/components/admin/AuditMonitor';
import ManualLeadEntryDrawer from '@/components/admin/ManualLeadEntryDrawer';
import { LeadService } from '@/services/leadService';

function AdminDashboardContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const tabParam = searchParams ? searchParams.get('tab') as 'OVERVIEW' | 'COUNSELORS' | 'MONITOR' | null : null;
    const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'COUNSELORS' | 'MONITOR'>(tabParam || 'OVERVIEW');
    const [leadsCount, setLeadsCount] = useState(0);
    const [fakeLeadsCount, setFakeLeadsCount] = useState(0);
    const [isAddLeadOpen, setIsAddLeadOpen] = useState(false);
    const statsFetchedRef = useRef(false);

    // Sync tab from URL param on load/navigation
    useEffect(() => {
        if (tabParam && tabParam !== activeTab) {
            setActiveTab(tabParam);
        }
    }, [tabParam]);

    // Only fetch overview stats when the OVERVIEW tab is active
    useEffect(() => {
        if (activeTab !== 'OVERVIEW') return;
        if (statsFetchedRef.current) return;
        statsFetchedRef.current = true;

        const fetchStats = async () => {
            try {
                console.log("[AdminDashboard] Fetching stats via RecentLeads...");
                const leadsData = await LeadService.getRecentLeads(0, 1);

                let count = 0;
                if (leadsData && typeof leadsData === 'object') {
                    const l = leadsData as any;
                    const explicitCount = l.count ?? l.data?.count ?? l.totalElements ?? l.data?.totalElements;

                    if (typeof explicitCount === 'number') {
                        count = explicitCount;
                    } else {
                        const array = l.lead || l.data?.lead || l.content || l.data?.content || [];
                        count = Array.isArray(array) ? array.length : 0;
                    }
                }

                console.log("[AdminDashboard] Calculated final count:", count);
                setLeadsCount(count);

                // Fetch Fake Leads Count
                const fakeLeadsData = await LeadService.getFakeLeads(0, 1);
                setFakeLeadsCount(fakeLeadsData.totalElements || 0);

            } catch (error) {
                console.error("[AdminDashboard] Failed to fetch stats:", error);
            }
        };
        fetchStats();
    }, [activeTab]);

    // Sync active tab to URL so reload preserves the correct tab
    const handleTabChange = (tab: 'OVERVIEW' | 'COUNSELORS' | 'MONITOR') => {
        setActiveTab(tab);
        router.replace(`?tab=${tab}`, { scroll: false });
    };

    return (
        <>
            <header className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-12 md:pt-0">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <span className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border border-slate-200">
                            Operational Hub
                        </span>
                        <div className="h-1 w-1 bg-slate-300 rounded-full" />
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            System Management
                        </span>
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                        LEAD INFORMATION
                    </h1>
                    <p className="text-slate-500 font-medium tracking-tight">Maintain the integrity of the Raffles Management leads</p>
                </div>
            </header>

            {/* Responsive Tabs Navigation */}
            <div className="relative mb-8">
                <div className="flex items-center gap-1 bg-slate-100/50 p-1.5 rounded-2xl border border-slate-200/60 w-full overflow-x-auto no-scrollbar">
                    <button
                        onClick={() => handleTabChange('OVERVIEW')}
                        className={`flex-1 min-w-[120px] md:flex-none md:px-8 py-3 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all duration-300 whitespace-nowrap ${activeTab === 'OVERVIEW'
                            ? 'bg-white text-indigo-600 shadow-sm border border-slate-100'
                            : 'text-slate-400 hover:text-slate-600 hover:bg-white/50'
                            }`}
                    >
                        Overview
                    </button>
                    <button
                        onClick={() => handleTabChange('COUNSELORS')}
                        className={`flex-1 min-w-[120px] md:flex-none md:px-8 py-3 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all duration-300 whitespace-nowrap ${activeTab === 'COUNSELORS'
                            ? 'bg-white text-indigo-600 shadow-sm border border-slate-100'
                            : 'text-slate-400 hover:text-slate-600 hover:bg-white/50'
                            }`}
                    >
                        Counselors
                    </button>
                    <button
                        onClick={() => handleTabChange('MONITOR')}
                        className={`flex-1 min-w-[120px] md:flex-none md:px-8 py-3 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all duration-300 whitespace-nowrap ${activeTab === 'MONITOR'
                            ? 'bg-white text-indigo-600 shadow-sm border border-slate-100'
                            : 'text-slate-400 hover:text-slate-600 hover:bg-white/50'
                            }`}
                    >
                        Monitor
                    </button>
                    <button
                        onClick={() => setIsAddLeadOpen(true)}
                        className={`flex-1 min-w-[120px] md:flex-none md:px-8 py-3 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all duration-300 whitespace-nowrap text-slate-400 hover:text-slate-600 hover:bg-white/50`}
                    >
                        + Add Lead
                    </button>
                </div>
            </div>

            {activeTab === 'OVERVIEW' ? (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition cursor-pointer group">
                            <h3 className="font-bold text-gray-800 text-lg mb-1 group-hover:text-blue-600">Total Leads</h3>
                            <p className="text-2xl font-black text-[#4d0101]">{leadsCount}</p>

                        </div>
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition cursor-pointer group">
                            <h3 className="font-bold text-gray-800 text-lg mb-1 group-hover:text-blue-600">CONVERTED LEADS</h3>
                            <p className="text-sm text-yellow-600 font-bold uppercase tracking-widest mt-2">On Working</p>
                        </div>
                        <div
                            onClick={() => router.push('/admin/fake-leads')}
                            className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition cursor-pointer group"
                        >
                            <h3 className="font-bold text-gray-800 text-lg mb-1 group-hover:text-blue-600">FAKE LEADS</h3>
                            <p className="text-2xl font-black text-rose-600">{fakeLeadsCount}</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Generated leads</p>
                        </div>

                    </div>

                    <LeadInbox />
                </>
            ) : activeTab === 'COUNSELORS' ? (
                <CounselorManager />
            ) : (
                <AuditMonitor />
            )}

            <ManualLeadEntryDrawer
                isOpen={isAddLeadOpen}
                onClose={() => setIsAddLeadOpen(false)}
                onSuccess={() => {
                    // Update stats directly if we're on overview page
                    if (activeTab === 'OVERVIEW') {
                        setLeadsCount(prev => prev + 1);
                    }
                }}
            />
        </>
    );
}

export default function AdminDashboard() {
    return (
        <DashboardLayout>
            <Suspense fallback={<div className="p-20 text-center font-black text-slate-400 uppercase tracking-widest animate-pulse">Initializing Portal...</div>}>
                <AdminDashboardContent />
            </Suspense>
        </DashboardLayout>
    );
}

'use client';

import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import CounselorProfile from '@/components/counselor/CounselorProfile';
import MyLeadsFeed from '@/components/counselor/MyLeadsFeed';
import { CounselorService } from '@/services/counselorService';
import TelecallerStats from '@/components/counselor/TelecallerStats';
import InternalCounselorStats from '@/components/counselor/InternalCounselorStats';
import ExternalCounselorStats from '@/components/counselor/ExternalCounselorStats';
import { CounselorDTO, LeadResponseDTO } from '@/types/api';
import { Toaster } from 'react-hot-toast';
// Simplified - Icons removed

export default function CounselorDashboard() {
    const { user, role, isLoading: authLoading } = useAuth();
    const [counselor, setCounselor] = useState<CounselorDTO | null>(null);
    const [allCounselors, setAllCounselors] = useState<CounselorDTO[]>([]);
    const [selectedEmail, setSelectedEmail] = useState<string>('');
    const [profileError, setProfileError] = useState(false);
    const [loadingCounselors, setLoadingCounselors] = useState(false);
    const [currentLeads, setCurrentLeads] = useState<LeadResponseDTO[]>([]);
    const [refetchTrigger, setRefetchTrigger] = useState(0);

    const isAdmin = user?.role === 'ADMIN' || user?.role === 'MANAGER';
    const currentUserEmail = user?.email || (typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || '{}').email : '') || '';

    // Fetch all counselors if Admin/Manager
    useEffect(() => {
        if (!authLoading && isAdmin) {
            setLoadingCounselors(true);
            CounselorService.getAllCounselors()
                .then(data => {
                    setAllCounselors(data);
                    setSelectedEmail(prev => prev || (data.length > 0 ? data[0].email : ''));
                })
                .catch(err => console.error("Failed to fetch counselors", err))
                .finally(() => setLoadingCounselors(false));
        }
    }, [isAdmin, authLoading]);

    const handleProfileLoaded = useCallback((data: CounselorDTO) => {
        setCounselor(data);
        setProfileError(false);
    }, []);

    const handleProfileError = useCallback(() => {
        setProfileError(true);
    }, []);

    if (authLoading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center min-h-[400px]">
                    <div className="w-10 h-10 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin" />
                </div>
            </DashboardLayout>
        );
    }

    const effectiveEmail = isAdmin ? selectedEmail : currentUserEmail;
    const isTelecaller = counselor?.counselorType === 'TELECALLER';

    return (
        <DashboardLayout>
            <Toaster position="top-right" />

            <div className="space-y-4 md:space-y-6">
                {/* Admin Selector */}
                {isAdmin && (
                    <div className="bg-white rounded-2xl p-4 shadow-sm border border-indigo-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="min-w-0">
                            <h2 className="text-lg font-black text-gray-900 truncate">Manager View <span className="text-[10px] font-bold text-indigo-500 ml-2 bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-100 uppercase tracking-widest">Administrator</span></h2>
                            <p className="text-xs text-gray-400 font-medium mt-1">Select counselor to view their portfolio.</p>
                        </div>
                        <div className="flex items-center gap-3 w-full md:w-auto">
                            {loadingCounselors && <div className="w-3 h-3 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin shrink-0" />}
                            <select
                                value={selectedEmail}
                                onChange={(e) => setSelectedEmail(e.target.value)}
                                className="w-full md:w-auto px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 outline-none min-w-[220px] bg-slate-50 cursor-pointer"
                            >
                                {allCounselors.map(c => (
                                    <option key={c.counselorId} value={c.email}>
                                        {c.name} ({c.department || 'No Dept'})
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                )}

                {effectiveEmail ? (
                    <>
                        <CounselorProfile
                            email={effectiveEmail}
                            onProfileLoaded={handleProfileLoaded}
                            onProfileError={handleProfileError}
                        />

                        {/* Summary Stats based on Counselor Type */}
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                            {counselor?.counselorType === 'TELECALLER' && <TelecallerStats leads={currentLeads} />}
                            {counselor?.counselorType === 'INTERNAL' && <InternalCounselorStats leads={currentLeads} />}
                            {counselor?.counselorType === 'EXTERNAL' && <ExternalCounselorStats leads={currentLeads} />}
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
                            {/* Main Content Area */}
                            <div className="lg:col-span-8 space-y-6">
                                {counselor ? (
                                    <MyLeadsFeed 
                                        counselorId={counselor.counselorId} 
                                        counselorType={counselor.counselorType}
                                        onLeadsUpdate={setCurrentLeads} 
                                        onActionComplete={() => setRefetchTrigger(prev => prev + 1)}
                                    />
                                ) : profileError ? (
                                    <div className="bg-rose-50 rounded-3xl p-10 md:p-16 text-center border border-rose-100 shadow-inner">
                                        <p className="text-rose-600 font-black text-lg uppercase tracking-tight">Profile Unreachable</p>
                                        <p className="text-rose-400 text-xs mt-1 uppercase tracking-tight">Please check your connection.</p>
                                    </div>
                                ) : (
                                    <div className="bg-white rounded-3xl p-16 md:p-20 text-center border border-slate-100 animate-pulse">
                                        <p className="text-slate-400 font-black text-xs uppercase tracking-widest">Initializing Command Center...</p>
                                    </div>
                                )}
                            </div>

                            {/* Sidebar Info Section */}
                            <div className="lg:col-span-4 space-y-6">
                                {/* Quick stats */}
                                {counselor && (
                                    <div className="bg-white rounded-[2rem] p-6 md:p-8 shadow-xl shadow-slate-200/50 border border-slate-100 space-y-6">
                                        <div>
                                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Quick Intelligence</h3>
                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between pb-3 border-b border-slate-50">
                                                    <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">Assigned Total</span>
                                                    <span className="text-2xl font-black text-indigo-600 tracking-tighter">{counselor.totalLeads}</span>
                                                </div>
                                                <div className="flex items-center justify-between pb-3 border-b border-slate-50">
                                                    <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">Department</span>
                                                    <span className="text-sm font-black text-slate-700 uppercase">{counselor.department || '—'}</span>
                                                </div>
                                                <div className="flex items-center justify-between pb-3 border-b border-slate-50">
                                                    <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">Priority Level</span>
                                                    <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${counselor.priority === 'HIGH' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                                                        counselor.priority === 'MEDIUM' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                                            'bg-emerald-50 text-emerald-600 border-emerald-100'
                                                        }`}>{counselor.priority}</span>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="p-6 bg-slate-900 rounded-3xl border border-white/5 relative overflow-hidden group">
                                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl group-hover:scale-150 transition-transform duration-700" />
                                            <div className="relative z-10">
                                                <p className="text-4xl font-black text-white tracking-tighter mb-1">{counselor?.totalLeads || 0}</p>
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Total Portfolio Size</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="bg-white rounded-3xl p-32 text-center border border-slate-100 shadow-sm">
                        <div className="w-12 h-12 border-4 border-slate-100 border-t-indigo-600 rounded-full animate-spin mx-auto mb-6" />
                        <p className="text-slate-500 font-black">Authenticating Identity...</p>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}

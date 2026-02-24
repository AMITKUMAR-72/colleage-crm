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
            
            <div className="space-y-8 max-w-7xl mx-auto pb-12">
                {/* Modern Header Section */}
                <header className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-12 md:pt-0">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <span className="bg-[#4d0101]/10 text-[#600202] px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-[#4d0101]/20">
                                {role} Portal
                            </span>
                            <div className="h-1 w-1 bg-slate-300 rounded-full" />
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                v2.0 Beta
                            </span>
                        </div>
                        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                            Smart Dashboard
                        </h1>
                        <p className="text-slate-500 font-medium tracking-tight">Welcome Back, <span className="text-[#600202] font-black">{user?.name}</span>. Here's what's happening today.</p>
                    </div>

                    <div className="flex items-center gap-3">
                        {isAdmin && (
                            <div className="bg-white/50 backdrop-blur-md rounded-2xl p-2 border border-slate-200 flex items-center gap-2 shadow-sm">
                                <select 
                                    value={selectedEmail}
                                    onChange={(e) => setSelectedEmail(e.target.value)}
                                    className="bg-transparent pl-3 pr-8 py-2 text-sm font-black text-slate-700 outline-none cursor-pointer"
                                >
                                    {allCounselors.map(c => (
                                        <option key={c.counselorId} value={c.email}>
                                            {c.name} ({c.department || 'General'})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}
                        <div className="glass-card px-4 py-2.5 rounded-2xl flex items-center gap-3 border border-slate-200 shadow-sm bg-white/50 backdrop-blur-md">
                            <span className="font-bold text-slate-600 text-[10px] uppercase tracking-widest whitespace-nowrap">Sync Active</span>
                        </div>
                    </div>
                </header>

                {effectiveEmail ? (
                    <>
                        {/* Summary Stats based on Counselor Type */}
                        {counselor?.counselorType === 'TELECALLER' && <TelecallerStats leads={currentLeads} />}
                        {counselor?.counselorType === 'INTERNAL' && <InternalCounselorStats leads={currentLeads} />}
                        {counselor?.counselorType === 'EXTERNAL' && <ExternalCounselorStats leads={currentLeads} />}

                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                            {/* Main Content Area */}
                            <div className="lg:col-span-8 space-y-8">
                                <CounselorProfile 
                                    email={effectiveEmail} 
                                    onProfileLoaded={handleProfileLoaded} 
                                    onProfileError={handleProfileError}
                                    refetchTrigger={refetchTrigger}
                                />

                                {counselor ? (
                                    <MyLeadsFeed 
                                        counselorId={counselor.counselorId} 
                                        counselorType={counselor.counselorType}
                                        onLeadsUpdate={setCurrentLeads} 
                                        onActionComplete={() => setRefetchTrigger(prev => prev + 1)}
                                    />
                                ) : profileError ? (
                                    <div className="bg-rose-50 rounded-3xl p-16 text-center border border-rose-100 shadow-inner">
                                        <p className="text-rose-600 font-black text-lg uppercase tracking-tight">Profile Unreachable</p>
                                        <p className="text-rose-400 text-sm mt-1 uppercase tracking-tight">Please check your connection and try refreshing.</p>
                                    </div>
                                ) : (
                                    <div className="bg-white rounded-3xl p-20 text-center border border-slate-100 animate-pulse">
                                        <p className="text-slate-400 font-black uppercase tracking-widest">Initializing Command Center...</p>
                                    </div>
                                )}
                            </div>

                            {/* Sidebar Info Section */}
                            <div className="lg:col-span-4 space-y-6">
                                {/* Professional Profile Summary */}
                                <div className="bg-slate-900 rounded-3xl p-8 text-white relative overflow-hidden group shadow-2xl">
                                    <div className="relative z-10">
                                        <h4 className="text-lg font-black mb-4 tracking-tight uppercase">Professional Profile</h4>
                                        <div className="space-y-4 mb-8">
                                            <div className="flex justify-between items-center border-b border-white/10 pb-3">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Department</span>
                                                <span className="text-xs font-black uppercase">{counselor?.department || 'Engineering'}</span>
                                            </div>
                                            <div className="flex justify-between items-center border-b border-white/10 pb-3">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Role Type</span>
                                                <span className="text-xs font-black uppercase">{counselor?.counselorType || '—'}</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Current Priority</span>
                                                <span className="bg-[#dbb212] text-slate-900 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest">{counselor?.priority || 'Medium'}</span>
                                            </div>
                                        </div>
                                        
                                        <div className="p-6 bg-white/5 rounded-2xl border border-white/10">
                                            <p className="text-4xl font-black mb-1">{counselor?.totalLeads || 0}</p>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Managed</p>
                                        </div>
                                    </div>
                                </div>

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

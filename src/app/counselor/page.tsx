'use client';

import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import CounselorProfile from '@/components/counselor/CounselorProfile';
import MyLeadsFeed from '@/components/counselor/MyLeadsFeed';
import { CounselorService } from '@/services/counselorService';

import { CounselorDTO } from '@/types/api';
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

            <div className="space-y-6">
                {/* Admin Selector */}
                {isAdmin && (
                    <div className="bg-white rounded-2xl p-4 shadow-sm border border-indigo-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h2 className="text-lg font-bold text-gray-900">Counselor Overview <span className="text-xs font-normal text-indigo-500 ml-2">ADMIN VIEW</span></h2>
                            <p className="text-sm text-gray-500">Select a counselor to view their specific dashboard and leads.</p>
                        </div>
                        <div className="flex items-center gap-3">
                            {loadingCounselors && <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />}
                            <select
                                value={selectedEmail}
                                onChange={(e) => setSelectedEmail(e.target.value)}
                                className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium focus:ring-2 focus:ring-[#dbb212] outline-none min-w-[200px]"
                            >
                                {allCounselors.map(c => (
                                    <option key={c.counselorId} value={c.email}>
                                        {c.name} ({c.department || 'No Dept'})
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </header>

                {effectiveEmail ? (
                    <>
                        <CounselorProfile
                            email={effectiveEmail}
                            onProfileLoaded={handleProfileLoaded}
                            onProfileError={handleProfileError}
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
                                <div className="hidden lg:block">
                                    {/* Counselor Dashboard Sidebar Space */}
                                </div>

                                {/* Quick stats */}
                                {counselor && (
                                    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                                        <h3 className="text-sm font-bold text-gray-600 uppercase tracking-wider mb-4">Quick Stats</h3>
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-gray-500">Total Leads</span>
                                                <span className="text-lg font-bold text-indigo-600">{counselor.totalLeads}</span>
                                            </div>
                                            <div className="flex justify-between items-center border-b border-white/10 pb-3">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Role Type</span>
                                                <span className="text-xs font-black uppercase">{counselor?.counselorType || '—'}</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-gray-500">Priority</span>
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${counselor.priority === 'HIGH' ? 'bg-red-100 text-red-700' :
                                                    counselor.priority === 'MEDIUM' ? 'bg-amber-100 text-amber-700' :
                                                        'bg-green-100 text-green-700'
                                                    }`}>{counselor.priority}</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-gray-500">Department</span>
                                                <span className="text-sm font-medium text-gray-700">{counselor.department || '—'}</span>
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

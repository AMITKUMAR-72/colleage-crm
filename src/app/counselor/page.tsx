'use client';

import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import CounselorProfile from '@/components/counselor/CounselorProfile';
import MyLeadsFeed from '@/components/counselor/MyLeadsFeed';
import { CounselorService } from '@/services/counselorService';
import SessionBooking from '@/components/SessionBooking';
import { CounselorDTO } from '@/types/api';
import { Toaster } from 'react-hot-toast';

export default function CounselorDashboard() {
    const { user, isLoading: authLoading } = useAuth();
    const [counselor, setCounselor] = useState<CounselorDTO | null>(null);
    const [allCounselors, setAllCounselors] = useState<CounselorDTO[]>([]);
    const [selectedEmail, setSelectedEmail] = useState<string>('');
    const [profileError, setProfileError] = useState(false);
    const [loadingCounselors, setLoadingCounselors] = useState(false);

    const isAdmin = user?.role === 'ADMIN' || user?.role === 'MANAGER';
    const currentUserEmail = user?.email || (typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || '{}').email : '') || '';

    // Fetch all counselors if Admin/Manager
    useEffect(() => {
        if (!authLoading && isAdmin) {
            setLoadingCounselors(true);
            CounselorService.getAllCounselors()
                .then(data => {
                    setAllCounselors(data);
                    // Only auto-select if nothing is currently selected
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
                    <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
                </div>
            </DashboardLayout>
        );
    }

    // Only set effective email if we are NOT an admin, OR if we ARE an admin and have selected someone
    const effectiveEmail = isAdmin ? selectedEmail : currentUserEmail;

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
                                className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none min-w-[200px]"
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

                {/* Profile Header */}
                {effectiveEmail ? (
                    <>
                        <CounselorProfile 
                            email={effectiveEmail} 
                            onProfileLoaded={handleProfileLoaded} 
                            onProfileError={handleProfileError}
                        />

                        {/* Main content grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                            {/* Lead Feed — primary content */}
                            <div className="lg:col-span-8">
                                {counselor ? (
                                    <MyLeadsFeed counselorId={counselor.counselorId} />
                                ) : profileError ? (
                                    <div className="bg-red-50 rounded-2xl p-12 text-center shadow-sm border border-red-100">
                                        <p className="text-red-600 font-medium">Failed to load profile. Please try refreshing.</p>
                                    </div>
                                ) : (
                                    <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-100">
                                        <div className="inline-block w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
                                        <p className="text-sm text-gray-500 mt-3">Loading profile to fetch leads...</p>
                                    </div>
                                )}
                            </div>

                            {/* Sidebar */}
                            <div className="lg:col-span-4 space-y-6">
                                <SessionBooking />

                                {/* Quick stats */}
                                {counselor && (
                                    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                                        <h3 className="text-sm font-bold text-gray-600 uppercase tracking-wider mb-4">Quick Stats</h3>
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-gray-500">Total Leads</span>
                                                <span className="text-lg font-bold text-indigo-600">{counselor.totalLeads}</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-gray-500">Type</span>
                                                <span className="text-sm font-medium text-gray-700">{counselor.counselorType}</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-gray-500">Priority</span>
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                                    counselor.priority === 'HIGH' ? 'bg-red-100 text-red-700' :
                                                    counselor.priority === 'MEDIUM' ? 'bg-amber-100 text-amber-700' :
                                                    'bg-green-100 text-green-700'
                                                }`}>{counselor.priority}</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-gray-500">Department</span>
                                                <span className="text-sm font-medium text-gray-700">{counselor.department || '—'}</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-100">
                        <div className="inline-block w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
                        <p className="text-sm text-gray-500 mt-3">Initializing dashboard...</p>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}

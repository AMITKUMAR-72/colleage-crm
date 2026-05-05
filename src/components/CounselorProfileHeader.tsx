'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { CounselorService } from '@/services/counselorService';
import { Mail, Phone, Hash, UserCheck, Activity, BarChart3, Star } from 'lucide-react';

export default function CounselorProfileHeader() {
    const { user } = useAuth();
    const [counselorProfile, setCounselorProfile] = useState<any | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchCounselorProfile = async () => {
            if (user?.role === 'COUNSELOR') {
                setLoading(true);
                try {
                    console.log("[CounselorProfileHeader] Hydrating for current counselor");
                    const profileRes: any = await CounselorService.getCounselorMe();
                    const profile = profileRes?.data || profileRes;
                    setCounselorProfile(profile);
                } catch (err) {
                    console.error("[CounselorProfileHeader] Hydration failed", err);
                } finally {
                    setLoading(false);
                }
            }
        };
        fetchCounselorProfile();
    }, [user]);

    if (user?.role !== 'COUNSELOR' || (!counselorProfile && !loading)) return null;

    return (
        <div className="bg-white rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/40 border border-slate-100 mb-8 animate-in fade-in slide-in-from-top-4 duration-700">
            <div className="flex flex-col xl:flex-row gap-8 items-start xl:items-center justify-between">
                
                {/* Primary Identity Section */}
                <div className="flex items-center gap-6">
                    <div className="relative">
                        <div className="w-20 h-20 rounded-[2rem] bg-slate-900 flex items-center justify-center text-white shadow-2xl shadow-slate-900/20 group hover:rotate-3 transition-transform duration-500">
                            <UserCheck className="w-8 h-8" />
                        </div>
                        {counselorProfile?.status === 'AVAILABLE' && (
                            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 border-4 border-white rounded-full animate-pulse" title="Available" />
                        )}
                    </div>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[8px] font-black uppercase tracking-widest rounded-md border border-slate-200">
                                {counselorProfile?.counselorId || 'COUN-ID'}
                            </span>
                            {counselorProfile?.status && (
                                <span className={`px-2 py-0.5 text-[8px] font-black uppercase tracking-widest rounded-md border ${counselorProfile.status === 'AVAILABLE' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>
                                    {counselorProfile.status}
                                </span>
                            )}
                        </div>
                        <h3 className="text-2xl font-black text-slate-900 tracking-tight leading-tight uppercase">
                            {loading ? 'Sycing Identity...' : (counselorProfile?.name || user?.name)}
                        </h3>
                        <div className="flex items-center gap-4 mt-2">
                             <div className="flex items-center gap-1.5 text-slate-400">
                                <Mail className="w-3.5 h-3.5" />
                                <span className="text-[11px] font-bold">{counselorProfile?.email || 'N/A'}</span>
                             </div>
                             <div className="flex items-center gap-1.5 text-slate-400">
                                <Phone className="w-3.5 h-3.5" />
                                <span className="text-[11px] font-bold">
                                    {Array.isArray(counselorProfile?.phone) ? counselorProfile.phone[0] : (counselorProfile?.phone || 'N/A')}
                                </span>
                             </div>
                        </div>
                    </div>
                </div>

                {/* Stats & Metadata Container */}
                <div className="flex flex-wrap items-center gap-4 w-full xl:w-auto border-t xl:border-t-0 xl:border-l border-slate-100 pt-6 xl:pt-0 xl:pl-8">
                    
                    {/* Departments & Types */}
                    <div className="flex flex-col gap-3">
                        {counselorProfile?.departments && counselorProfile.departments.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                                {counselorProfile.departments.map((dept: any) => (
                                    <span key={dept} className="px-2.5 py-1 bg-indigo-50 text-indigo-700 text-[9px] font-black uppercase tracking-widest rounded-lg border border-indigo-100">
                                        {dept}
                                    </span>
                                ))}
                            </div>
                        )}
                        {counselorProfile?.counselorTypes && counselorProfile.counselorTypes.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                                {counselorProfile.counselorTypes.map((type: any) => (
                                    <span key={type} className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-[9px] font-black uppercase tracking-widest rounded-lg border border-emerald-100">
                                        {type}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}

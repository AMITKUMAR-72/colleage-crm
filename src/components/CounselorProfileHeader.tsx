'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { UserService } from '@/services/userService';
import { CounselorService } from '@/services/counselorService';
import { CounselorDTO } from '@/types/api';

export default function CounselorProfileHeader() {
    const { user } = useAuth();
    const [counselorProfile, setCounselorProfile] = useState<CounselorDTO | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchCounselorProfile = async () => {
            if (user?.role === 'COUNSELOR') {
                setLoading(true);
                try {
                    console.log("[CounselorProfileHeader] Hydrating for current counselor");
                    // Fetch current counselor metadata using /me endpoint
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
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 flex flex-wrap items-center gap-8 mb-6 animate-in slide-in-from-top-2 duration-500">
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-[#4d0101]/10 flex items-center justify-center text-[#4d0101] shadow-inner">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
                    </svg>
                </div>
                <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Verified Identity</p>
                    <h3 className="text-base font-black text-slate-900 tracking-tight">{loading ? 'Syncing...' : (counselorProfile?.name || user?.name)}</h3>
                </div>
            </div>

            {counselorProfile?.departments && counselorProfile.departments.length > 0 && (
                <div className="flex flex-col gap-1.5">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Assigned Realm</p>
                    <div className="flex flex-wrap gap-2">
                        {counselorProfile.departments.map(dept => (
                            <span key={dept} className="px-3 py-1 bg-indigo-50 text-indigo-700 text-[10px] font-black uppercase tracking-widest rounded-xl border border-indigo-100 shadow-sm">
                                {dept}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {counselorProfile?.counselorTypes && counselorProfile.counselorTypes.length > 0 && (
                <div className="flex flex-col gap-1.5">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Specialization</p>
                    <div className="flex flex-wrap gap-2">
                        {counselorProfile.counselorTypes.map(type => (
                            <span key={type} className="px-3 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase tracking-widest rounded-xl border border-emerald-100 shadow-sm">
                                {type}
                            </span>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

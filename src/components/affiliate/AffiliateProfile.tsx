'use client';

import { useState, useEffect } from 'react';
import { AffiliateService } from '@/services/affiliateService';
import { AffiliateDTO } from '@/types/api';
import toast from 'react-hot-toast';

interface Props {
    email: string;
    onProfileLoaded?: (affiliate: AffiliateDTO) => void;
}

export default function AffiliateProfile({ email, onProfileLoaded }: Props) {
    const [affiliate, setAffiliate] = useState<AffiliateDTO | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const data = await AffiliateService.getAffiliateByEmail(email);
                setAffiliate(data);
                onProfileLoaded?.(data);
            } catch {
                toast.error('Failed to load affiliate profile');
            } finally {
                setLoading(false);
            }
        };
        if (email) load();
    }, [email, onProfileLoaded]);

    if (loading) {
        return (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 animate-pulse">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl bg-gray-200" />
                    <div className="space-y-2 flex-1">
                        <div className="h-5 bg-gray-200 rounded w-2/5" />
                        <div className="h-4 bg-gray-200 rounded w-1/3" />
                    </div>
                </div>
            </div>
        );
    }

    if (!affiliate) return null;

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 via-cyan-500 to-teal-400 h-20 relative">
                <div className="absolute -bottom-7 left-6">
                    <div className="w-14 h-14 rounded-xl bg-white shadow-lg flex items-center justify-center text-xl font-bold text-blue-600 border-4 border-white">
                        🏢
                    </div>
                </div>
            </div>

            <div className="pt-10 px-6 pb-6">
                <div className="flex items-start justify-between mb-4">
                    <div>
                        <h2 className="text-lg font-bold text-gray-900">{affiliate.companyName}</h2>
                        <p className="text-sm text-gray-500">{affiliate.email}</p>
                        <div className="flex items-center gap-2 mt-2">
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                                affiliate.active === 'ACTIVE'
                                    ? 'bg-green-100 text-green-700 border-green-200'
                                    : 'bg-red-100 text-red-700 border-red-200'
                            }`}>
                                {affiliate.active}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-blue-50 rounded-xl p-3 text-center">
                        <p className="text-2xl font-bold text-blue-600">{affiliate.commissionPercent ?? 0}%</p>
                        <p className="text-xs text-gray-500 mt-1">Commission</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-3 text-center">
                        <p className="text-sm font-medium text-gray-700">{affiliate.payoutMethod || '—'}</p>
                        <p className="text-xs text-gray-500 mt-1">Payout Method</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-3 text-center">
                        <p className="text-sm font-medium text-gray-700">ID: {affiliate.id}</p>
                        <p className="text-xs text-gray-500 mt-1">Affiliate ID</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-3 text-center">
                        <p className="text-sm font-medium text-gray-700">
                            {affiliate.createdAt ? new Date(affiliate.createdAt).toLocaleDateString() : '—'}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">Member Since</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

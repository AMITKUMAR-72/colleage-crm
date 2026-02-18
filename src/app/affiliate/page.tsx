'use client';

import { useState, useCallback } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import AffiliateProfile from '@/components/affiliate/AffiliateProfile';
import AffiliateLeadFeed from '@/components/affiliate/AffiliateLeadFeed';
import AffiliateApiPanel from '@/components/affiliate/AffiliateApiPanel';
import LeadFormModal from '@/components/LeadFormModal';
import { AffiliateDTO } from '@/types/api';
import { Toaster } from 'react-hot-toast';

export default function AffiliateDashboard() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [affiliate, setAffiliate] = useState<AffiliateDTO | null>(null);

    const email = typeof window !== 'undefined'
        ? localStorage.getItem('userEmail') || 'affiliate@example.com'
        : 'affiliate@example.com';

    const handleProfileLoaded = useCallback((data: AffiliateDTO) => {
        setAffiliate(data);
    }, []);

    return (
        <DashboardLayout>
            <Toaster position="top-right" />

            <div className="space-y-6">
                {/* Profile Header */}
                <AffiliateProfile email={email} onProfileLoaded={handleProfileLoaded} />

                {/* Action cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div
                        onClick={() => setIsModalOpen(true)}
                        className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition cursor-pointer group hover:border-blue-200 active:scale-[0.98]"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center text-lg group-hover:bg-blue-100 transition">
                                ✍️
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-800 group-hover:text-blue-600 transition">Submit New Lead</h3>
                                <p className="text-xs text-gray-500">Manual lead submission form</p>
                            </div>
                        </div>
                    </div>
                    <a
                        href="#api-panel"
                        className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition cursor-pointer group hover:border-orange-200"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-11 h-11 rounded-xl bg-orange-50 flex items-center justify-center text-lg group-hover:bg-orange-100 transition">
                                🔌
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-800 group-hover:text-orange-600 transition">API Documentation</h3>
                                <p className="text-xs text-gray-500">External sync & webhook setup</p>
                            </div>
                        </div>
                    </a>
                </div>

                {/* Main content grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    <div className="lg:col-span-8">
                        <AffiliateLeadFeed />
                    </div>
                    <div className="lg:col-span-4" id="api-panel">
                        <AffiliateApiPanel affiliateId={affiliate?.id} />
                    </div>
                </div>
            </div>

            <LeadFormModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={() => {
                    setIsModalOpen(false);
                    window.location.reload();
                }}
            />
        </DashboardLayout>
    );
}

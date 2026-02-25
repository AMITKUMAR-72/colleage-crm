'use client';

import { useAuth } from '@/context/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import MyLeadsFeed from '@/components/counselor/MyLeadsFeed';
import { Toaster } from 'react-hot-toast';

export default function MyLeadsPage() {
    const { user, isLoading } = useAuth();

    if (isLoading) return null;

    // Use user.id as counselorId if available, else assume we are in a session context 
    // or just pass a large number if we don't have it (service uses it mostly for logs/context in some cases, 
    // but the actual API endpoint /api/counselor/leads/all/... doesn't strictly need it in the path)
    const counselorId = user?.id || 0;

    return (
        <DashboardLayout>
            <Toaster position="top-right" />
            <div className="space-y-6">
                <div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">My Leads</h2>
                    <p className="text-sm text-slate-500 font-medium">Manage and update your assigned leads effectively.</p>
                </div>

                <MyLeadsFeed counselorId={counselorId} />
            </div>
        </DashboardLayout>
    );
}

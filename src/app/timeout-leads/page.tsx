'use client';

import DashboardLayout from '@/components/layout/DashboardLayout';
import TimeoutLeadInbox from '@/components/TimeoutLeadInbox';

export default function TimeoutLeadsPage() {
    return (
        <DashboardLayout>
            <div className="mb-8">
                <h1 className="text-3xl font-black text-gray-900 tracking-tight">Timed-Out Leads</h1>
                <p className="text-gray-500 mt-2 font-medium">Manage and reassign leads that have timed out.</p>
            </div>

            <div className="w-full">
                <TimeoutLeadInbox />
            </div>
        </DashboardLayout>
    );
}

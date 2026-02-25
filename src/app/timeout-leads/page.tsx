'use client';

import DashboardLayout from '@/components/layout/DashboardLayout';
import TimeoutLeadInbox from '@/components/TimeoutLeadInbox';

export default function TimeoutLeadsPage() {
    return (
        <DashboardLayout>
            <div className="mb-6">
                <h1 className="text-xl font-black text-slate-800 tracking-tight uppercase">Timed-Out Leads</h1>
            </div>

            <div className="w-full">
                <TimeoutLeadInbox />
            </div>
        </DashboardLayout>
    );
}

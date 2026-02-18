'use client';

import DashboardLayout from '@/components/layout/DashboardLayout';
import SessionBooking from '@/components/SessionBooking';

export default function SessionsPage() {
    return (
        <DashboardLayout>
            <div className="max-w-4xl mx-auto">
                <div className="mb-8">
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">Offline Session Management</h2>
                    <p className="text-slate-500">Schedule and manage face-to-face sessions with candidates.</p>
                </div>
                
                <SessionBooking />
            </div>
        </DashboardLayout>
    );
}

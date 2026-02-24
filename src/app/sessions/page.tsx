'use client';

import DashboardLayout from '@/components/layout/DashboardLayout';
import SessionManager from '@/components/admin/SessionManager';

export default function SessionsPage() {
    return (
        <DashboardLayout>
            <div className="max-w-6xl mx-auto">
                <div className="mb-8">
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">Offline Session Management</h2>
                    <p className="text-slate-500 font-medium tracking-wide">Schedule and manage face-to-face sessions with candidates.</p>
                </div>

                <SessionManager />
            </div>
        </DashboardLayout>
    );
}

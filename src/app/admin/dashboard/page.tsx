'use client';

import DashboardLayout from '@/components/layout/DashboardLayout';
import AdminDashboardStats from '@/components/admin/AdminDashboardStats';
import { Suspense } from 'react';

export default function DashboardPage() {
    return (
        <DashboardLayout>
            <div className="py-4 md:py-8">
                <Suspense fallback={<div className="p-20 text-center font-black text-slate-400 uppercase tracking-widest animate-pulse">Initializing Dashboard...</div>}>
                    <AdminDashboardStats />
                </Suspense>
            </div>
        </DashboardLayout>
    );
}

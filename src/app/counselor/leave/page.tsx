'use client';

import DashboardLayout from '@/components/layout/DashboardLayout';
import LeaveManagement from '@/components/counselor/LeaveManagement';
import { Toaster } from 'react-hot-toast';

export default function LeavePage() {
    return (
        <DashboardLayout>
            <Toaster position="top-right" />
            <div className="space-y-6">
                <LeaveManagement />
            </div>
        </DashboardLayout>
    );
}

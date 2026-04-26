'use client';

import DashboardLayout from '@/components/layout/DashboardLayout';
import ReminderDashboard from '@/components/counselor/ReminderDashboard';
import { Toaster } from 'react-hot-toast';

export default function RemindersPage() {
    return (
        <DashboardLayout>
            <Toaster position="top-right" />
            <div className="pt-12 md:pt-0">
                <ReminderDashboard />
            </div>
        </DashboardLayout>
    );
}

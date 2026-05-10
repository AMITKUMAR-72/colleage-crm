'use client';

import DashboardLayout from '@/components/layout/DashboardLayout';
import MultiStepRegistration from '@/components/admin/MultiStepRegistration';

export default function RegistrationPage() {
    return (
        <DashboardLayout>
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                <MultiStepRegistration />
            </div>
        </DashboardLayout>
    );
}

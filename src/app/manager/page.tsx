'use client';

import DashboardLayout from '@/components/layout/DashboardLayout';
import LeadInbox from '@/components/LeadInbox';
import CounselorHeatmap from '@/components/CounselorHeatmap';

export default function ManagerDashboard() {
    return (
        <DashboardLayout>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
                <div className="lg:col-span-3">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition cursor-pointer group text-center h-full flex flex-col justify-center">
                        <h3 className="font-bold text-gray-800 text-lg mb-1 group-hover:text-green-600">Lead Reassignment</h3>
                        <p className="text-sm text-gray-500">Quick actions for timed-out leads.</p>
                    </div>
                </div>
                <div className="lg:col-span-3">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition cursor-pointer group text-center h-full flex flex-col justify-center">
                        <h3 className="font-bold text-gray-800 text-lg mb-1 group-hover:text-green-600">Team Reports</h3>
                        <p className="text-sm text-gray-500">Weekly conversion metrics.</p>
                    </div>
                </div>
            </div>

            <div className="w-full">
                <LeadInbox />
            </div>
        </DashboardLayout>
    );
}

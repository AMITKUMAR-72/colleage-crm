'use client';

import DashboardLayout from '@/components/layout/DashboardLayout';
import LeadInbox from '@/components/LeadInbox';
import CounselorHeatmap from '@/components/CounselorHeatmap';

export default function ManagerDashboard() {
    return (
        <DashboardLayout>
            <header className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-12 md:pt-0">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <span className="bg-[#4d0101]/10 text-[#600202] px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-[#4d0101]/20">
                            Manager Portal
                        </span>
                        <div className="h-1 w-1 bg-slate-300 rounded-full" />
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-[#dbb212]">
                            Strategy Center
                        </span>
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                        Team Performance
                    </h1>
                    <p className="text-slate-500 font-medium tracking-tight">Optimizing counselor workflows and lead distribution.</p>
                </div>
            </header>

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

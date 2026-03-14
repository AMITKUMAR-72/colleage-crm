'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import DepartmentManager from '@/components/admin/DepartmentManager';
import CourseManager from '@/components/admin/CourseManager';
import CampaignManager from '@/components/admin/CampaignManager';
import RoleManager from '@/components/admin/RoleManager';
import CounselorManager from '@/components/admin/CounselorManager';
import AffiliateManager from '@/components/admin/AffiliateManager';
import MentorManager from '@/components/admin/MentorManager';
import AuditMonitor from '@/components/admin/AuditMonitor';
import SystemConfigPanel from '@/components/admin/SystemConfigPanel';

export default function ManagementHub() {
    const [activeTab, setActiveTab] = useState('courses');

    const tabs = [
        { id: 'departments', label: 'Departments', component: <DepartmentManager /> },
        { id: 'courses', label: 'Courses', component: <CourseManager /> },
        { id: 'counselors', label: 'Counselors', component: <CounselorManager /> },
        { id: 'affiliates', label: 'Affiliates', component: <AffiliateManager /> },
        { id: 'mentors', label: 'Mentors', component: <MentorManager /> },
        { id: 'campaigns', label: 'Campaign Sources', component: <CampaignManager /> },
        { id: 'roles', label: 'Roles', component: <RoleManager /> },
        { id: 'config', label: 'Config', component: <SystemConfigPanel /> },
        { id: 'audit', label: 'Monitor', component: <AuditMonitor /> },
    ];

    return (
        <DashboardLayout>
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-800">System Management</h1>
                <p className="text-gray-500">Configure global settings and master data.</p>
            </div>

            {/* Premium Responsive Tabs Navigation */}
            <div className="relative mb-8">
                <div className="flex items-center gap-1 bg-slate-100/50 p-1.5 rounded-2xl border border-slate-200/60 w-full overflow-x-auto no-scrollbar">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex-1 min-w-[130px] md:flex-none md:px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 whitespace-nowrap ${activeTab === tab.id
                                ? 'bg-white text-[#600202] shadow-lg shadow-rose-900/5 translate-y-[-1px]'
                                : 'text-slate-400 hover:text-slate-600 hover:bg-white/50'
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                {tabs.find(t => t.id === activeTab)?.component}
            </div>
        </DashboardLayout>
    );
}

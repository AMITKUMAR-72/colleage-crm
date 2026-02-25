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
        { id: 'audit', label: 'Monitor', component: <AuditMonitor /> },
    ];

    return (
        <DashboardLayout>
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-800">System Management</h1>
                <p className="text-gray-500">Configure global settings and master data.</p>
            </div>

            <div className="flex gap-2 border-b mb-6 overflow-x-auto">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-4 py-2 whitespace-nowrap font-medium transition-colors ${activeTab === tab.id
                            ? 'border-b-2 border-blue-600 text-blue-600'
                            : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                {tabs.find(t => t.id === activeTab)?.component}
            </div>
        </DashboardLayout>
    );
}

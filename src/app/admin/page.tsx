'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import LeadInbox from '@/components/LeadInbox';
import CounselorManager from '@/components/admin/CounselorManager';

export default function AdminDashboard() {
    const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'COUNSELORS'>('OVERVIEW');

    return (
        <DashboardLayout>
            <div className="flex gap-4 mb-6 border-b border-gray-100 pb-1">
                <button
                    onClick={() => setActiveTab('OVERVIEW')}
                    className={`pb-3 px-2 text-sm font-medium transition relative ${
                        activeTab === 'OVERVIEW' 
                            ? 'text-indigo-600 after:absolute after:bottom-[-5px] after:left-0 after:w-full after:h-0.5 after:bg-[#4d0101]' 
                            : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                    Overview
                </button>
                <button
                    onClick={() => setActiveTab('COUNSELORS')}
                    className={`pb-3 px-2 text-sm font-medium transition relative ${
                        activeTab === 'COUNSELORS'
                            ? 'text-indigo-600 after:absolute after:bottom-[-5px] after:left-0 after:w-full after:h-0.5 after:bg-[#4d0101]'
                            : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                    Counselors
                </button>
            </div>

            {activeTab === 'OVERVIEW' ? (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition cursor-pointer group">
                            <h3 className="font-bold text-gray-800 text-lg mb-1 group-hover:text-blue-600">User Management</h3>
                            <p className="text-sm text-gray-500">Manage roles and permissions.</p>
                        </div>
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition cursor-pointer group">
                            <h3 className="font-bold text-gray-800 text-lg mb-1 group-hover:text-blue-600">Global Analytics</h3>
                            <p className="text-sm text-gray-500">Track lead conversion globally.</p>
                        </div>
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition cursor-pointer group text-center" onClick={() => window.location.href = '/admin/manage'}>
                            <h3 className="font-bold text-gray-800 text-lg mb-1 group-hover:text-blue-600">System Management</h3>
                            <p className="text-sm text-gray-500">Configure campaigns, courses, & roles.</p>
                        </div>
                    </div>
                    
                    <LeadInbox />
                </>
            ) : (
                <CounselorManager />
            )}
        </DashboardLayout>
    );
}

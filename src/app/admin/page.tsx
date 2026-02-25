'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import LeadInbox from '@/components/LeadInbox';
import CounselorManager from '@/components/admin/CounselorManager';
import AuditMonitor from '@/components/admin/AuditMonitor';

function AdminDashboardContent() {
    const searchParams = useSearchParams();
    const tabParam = searchParams ? searchParams.get('tab') as 'OVERVIEW' | 'COUNSELORS' | 'MONITOR' | null : null;
    const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'COUNSELORS' | 'MONITOR'>(tabParam || 'OVERVIEW');

    useEffect(() => {
        if (tabParam) {
            setActiveTab(tabParam);
        }
    }, [tabParam]);

    return (
        <>
            <header className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-12 md:pt-0">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <span className="bg-[#4d0101]/10 text-[#600202] px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-[#4d0101]/20">
                            Admin Portal
                        </span>
                        <div className="h-1 w-1 bg-slate-300 rounded-full" />
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-[#dbb212]">
                            Premium Control
                        </span>
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                        System Management
                    </h1>
                    <p className="text-slate-500 font-medium tracking-tight">Maintain the integrity of the Raffles Management Ecosystem.</p>
                </div>
            </header>

            <div className="flex gap-4 mb-6 border-b border-gray-100 pb-1">
                <button
                    onClick={() => setActiveTab('OVERVIEW')}
                    className={`pb-3 px-2 text-sm font-medium transition relative ${activeTab === 'OVERVIEW'
                        ? 'text-indigo-600 after:absolute after:bottom-[-5px] after:left-0 after:w-full after:h-0.5 after:bg-[#4d0101]'
                        : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    Overview
                </button>
                <button
                    onClick={() => setActiveTab('COUNSELORS')}
                    className={`pb-3 px-2 text-sm font-medium transition relative ${activeTab === 'COUNSELORS'
                        ? 'text-indigo-600 after:absolute after:bottom-[-5px] after:left-0 after:w-full after:h-0.5 after:bg-[#4d0101]'
                        : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    Counselors
                </button>
                <button
                    onClick={() => setActiveTab('MONITOR')}
                    className={`pb-3 px-2 text-sm font-medium transition relative ${activeTab === 'MONITOR'
                        ? 'text-indigo-600 after:absolute after:bottom-[-5px] after:left-0 after:w-full after:h-0.5 after:bg-[#4d0101]'
                        : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    Monitor
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
            ) : activeTab === 'COUNSELORS' ? (
                <CounselorManager />
            ) : (
                <AuditMonitor />
            )}
        </>
    );
}

export default function AdminDashboard() {
    return (
        <DashboardLayout>
            <Suspense fallback={<div className="p-20 text-center font-black text-slate-400 uppercase tracking-widest animate-pulse">Initializing Portal...</div>}>
                <AdminDashboardContent />
            </Suspense>
        </DashboardLayout>
    );
}

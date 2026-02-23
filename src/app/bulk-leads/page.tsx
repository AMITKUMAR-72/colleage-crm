'use client';

import DashboardLayout from '@/components/layout/DashboardLayout';
import BulkUpload from '@/components/BulkUpload';
import { useAuth } from '@/context/AuthContext';
import { Upload, ShieldAlert } from 'lucide-react';

export default function SettingsPage() {
    const { role } = useAuth();

    if (role !== 'ADMIN' && role !== 'MANAGER' && role !== 'AFFILIATE') {
        return (
            <DashboardLayout>
                <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-dashed text-gray-400">
                    <ShieldAlert className="w-12 h-12 mb-4 text-amber-500" />
                    <h2 className="text-xl font-bold text-gray-700">Access Restricted</h2>
                    <p>Only administrators, managers, and partners can access this page.</p>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="space-y-10">
                <section>
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-[#4d0101] rounded-lg text-white shadow-lg shadow-blue-200">
                            <Upload className="w-5 h-5" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900">BULK LEADS UPLOAD</h2>
                    </div>

                </section>

                <hr className="border-gray-100" />

                <section className="max-w-2xl mx-auto w-full flex flex-col items-center">
                    <div className="mb-8 text-center">
                        <h2 className="text-2xl font-bold text-gray-900">Data Import</h2>
                        <p className="text-sm text-gray-500 max-w-md mx-auto">Import leads from external spreadsheets with automatic format validation and duplicate detection.</p>
                    </div>
                    <div className="w-full">
                        <BulkUpload />
                    </div>
                </section>
            </div>
        </DashboardLayout>
    );
}

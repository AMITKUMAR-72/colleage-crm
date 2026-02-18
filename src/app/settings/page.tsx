'use client';

import DashboardLayout from '@/components/layout/DashboardLayout';
import BulkUpload from '@/components/BulkUpload';
import CatalogManager from '@/components/CatalogManager';
import { useAuth } from '@/context/AuthContext';
import { Settings as SettingsIcon, ShieldAlert } from 'lucide-react';

export default function SettingsPage() {
    const { role } = useAuth();

    if (role !== 'ADMIN') {
        return (
            <DashboardLayout>
                <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-dashed text-gray-400">
                    <ShieldAlert className="w-12 h-12 mb-4 text-amber-500" />
                    <h2 className="text-xl font-bold text-gray-700">Access Restricted</h2>
                    <p>Only administrators can access system-wide settings.</p>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="space-y-10">
                <section>
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-blue-600 rounded-lg text-white shadow-lg shadow-blue-200">
                            <SettingsIcon className="w-5 h-5" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900">System Configuration</h2>
                    </div>
                    <CatalogManager />
                </section>

                <hr className="border-gray-100" />

                <section className="max-w-2xl">
                    <div className="mb-6">
                        <h2 className="text-xl font-bold text-gray-900">Data Import</h2>
                        <p className="text-sm text-gray-500">Import leads from external spreadsheets.</p>
                    </div>
                    <BulkUpload />
                </section>
            </div>
        </DashboardLayout>
    );
}

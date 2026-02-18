'use client';

import { useState, useEffect, useCallback } from 'react';
import { LeadService } from '@/services/leadService';
import { LeadResponseDTO } from '@/types/api';
import toast from 'react-hot-toast';

const STATUS_COLORS: Record<string, string> = {
    NEW: 'bg-blue-100 text-blue-700',
    TELECALLER_ASSIGNED: 'bg-cyan-100 text-cyan-700',
    QUALIFIED: 'bg-emerald-100 text-emerald-700',
    COUNSELOR_ASSIGNED: 'bg-indigo-100 text-indigo-700',
    EXTERNAL_ASSIGNED: 'bg-violet-100 text-violet-700',
    ADMISSION_IN_PROCESS: 'bg-amber-100 text-amber-700',
    ADMISSION_DONE: 'bg-green-100 text-green-800',
    LOST: 'bg-red-100 text-red-700',
    UNASSIGNED: 'bg-gray-100 text-gray-600',
    CONTACTED: 'bg-sky-100 text-sky-700',
    TIMED_OUT: 'bg-orange-100 text-orange-700',
    REASSIGNED: 'bg-pink-100 text-pink-700',
};

const SCORE_COLORS: Record<string, string> = {
    HOT: 'bg-red-500 text-white',
    WARM: 'bg-amber-400 text-white',
    COLD: 'bg-blue-400 text-white',
};

export default function AffiliateLeadFeed() {
    const [leads, setLeads] = useState<LeadResponseDTO[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [filter, setFilter] = useState<string>('');

    const loadLeads = useCallback(async () => {
        setLoading(true);
        try {
            const response = await LeadService.getRecentLeads(page, 10);
            setLeads(response.content || []);
            setTotalPages(response.totalPages || 1);
        } catch {
            toast.error('Failed to load leads');
            setLeads([]);
        } finally {
            setLoading(false);
        }
    }, [page]);

    useEffect(() => {
        loadLeads();
    }, [loadLeads]);

    const filteredLeads = filter
        ? leads.filter(l => l.status === filter)
        : leads;

    const statusCounts = leads.reduce((acc, l) => {
        acc[l.status] = (acc[l.status] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-bold text-gray-900">Submitted Leads</h3>
                    <p className="text-sm text-gray-500">Track your lead submissions</p>
                </div>
                <button
                    onClick={loadLeads}
                    className="p-2 rounded-lg hover:bg-gray-100 transition text-gray-400 hover:text-gray-600"
                    title="Refresh"
                >
                    🔄
                </button>
            </div>

            {/* Status filter pills */}
            <div className="px-6 py-3 border-b border-gray-50 flex flex-wrap gap-2">
                <button
                    onClick={() => setFilter('')}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                        !filter ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    }`}
                >
                    All ({leads.length})
                </button>
                {Object.entries(statusCounts).map(([status, count]) => (
                    <button
                        key={status}
                        onClick={() => setFilter(filter === status ? '' : status)}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                            filter === status
                                ? STATUS_COLORS[status]
                                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        }`}
                    >
                        {status.replace(/_/g, ' ')} ({count})
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="p-8 text-center">
                    <div className="inline-block w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
                    <p className="text-sm text-gray-500 mt-3">Loading leads...</p>
                </div>
            ) : filteredLeads.length === 0 ? (
                <div className="p-12 text-center">
                    <p className="text-4xl mb-3">📋</p>
                    <p className="text-gray-500 font-medium">No leads found</p>
                    <p className="text-sm text-gray-400 mt-1">Submit a lead to get started</p>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="text-left border-b border-gray-100">
                                <th className="px-6 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Name</th>
                                <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Email</th>
                                <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Phone</th>
                                <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Course</th>
                                <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Status</th>
                                <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Score</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filteredLeads.map(lead => (
                                <tr key={lead.id} className="hover:bg-gray-50/50 transition">
                                    <td className="px-6 py-3">
                                        <p className="text-sm font-medium text-gray-900">{lead.name}</p>
                                    </td>
                                    <td className="px-4 py-3">
                                        <p className="text-sm text-gray-600 truncate max-w-[180px]">{lead.email}</p>
                                    </td>
                                    <td className="px-4 py-3">
                                        <p className="text-sm text-gray-600">{lead.phone}</p>
                                    </td>
                                    <td className="px-4 py-3">
                                        <p className="text-sm text-gray-600">
                                            {typeof lead.course === 'object' ? lead.course?.course : lead.course || '—'}
                                        </p>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${STATUS_COLORS[lead.status] || 'bg-gray-100'}`}>
                                            {lead.status.replace(/_/g, ' ')}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${SCORE_COLORS[lead.score] || 'bg-gray-200'}`}>
                                            {lead.score}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
                    <button
                        onClick={() => setPage(p => Math.max(0, p - 1))}
                        disabled={page === 0}
                        className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 transition"
                    >
                        ← Previous
                    </button>
                    <span className="text-sm text-gray-500">Page {page + 1} of {totalPages}</span>
                    <button
                        onClick={() => setPage(p => p + 1)}
                        disabled={page >= totalPages - 1}
                        className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 transition"
                    >
                        Next →
                    </button>
                </div>
            )}
        </div>
    );
}

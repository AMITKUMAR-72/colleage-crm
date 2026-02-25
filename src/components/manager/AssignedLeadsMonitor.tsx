'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { ManagerService } from '@/services/managerService';
import { AssignedLeadDTO } from '@/types/api';
import {
    Users, Clock, UserCheck, Calendar, Search,
    RefreshCcw, ChevronRight, Filter, BookOpen
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';

export default function AssignedLeadsMonitor() {
    const [assignments, setAssignments] = useState<AssignedLeadDTO[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [searchTerm, setSearchTerm] = useState('');

    const loadAssignments = useCallback(async () => {
        setLoading(true);
        try {
            const data = await ManagerService.getAllAssignedLeads(page, 10);
            setAssignments(data.content);
            setTotalPages(data.totalPages);
        } catch (error) {
            toast.error('Failed to fetch lead assignments');
            setAssignments([]);
        } finally {
            setLoading(false);
        }
    }, [page]);

    useEffect(() => {
        loadAssignments();
    }, [loadAssignments]);

    return (
        <div className="space-y-6">
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                        <UserCheck className="w-6 h-6 text-green-600" />
                        Assignment Management
                    </h2>
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Monitor all lead-to-counselor distributions</p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Find counselor or lead..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs focus:ring-2 focus:ring-green-500 outline-none w-48 md:w-64"
                        />
                    </div>
                    <button
                        onClick={loadAssignments}
                        className="p-2.5 bg-slate-50 text-slate-400 hover:text-green-600 rounded-xl hover:bg-green-50 transition-all border border-slate-100"
                    >
                        <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Lead Details</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Counselor</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Assigned At</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading && assignments.length === 0 ? (
                                Array(5).fill(0).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={5} className="px-6 py-6">
                                            <div className="h-4 bg-slate-100 rounded-full w-full"></div>
                                        </td>
                                    </tr>
                                ))
                            ) : assignments.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center gap-2">
                                            <BookOpen className="w-10 h-10 text-slate-100" />
                                            <p className="text-slate-400 font-bold text-sm uppercase tracking-widest">No assignments found</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                assignments.filter(a =>
                                    a.lead?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                    a.counselor?.name?.toLowerCase().includes(searchTerm.toLowerCase())
                                ).map((a) => (
                                    <tr key={a.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center text-xs font-black border border-orange-100">
                                                    {a.lead?.name?.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-slate-700">{a.lead?.name}</span>
                                                    <span className="text-[10px] font-bold text-slate-400">{a.lead?.email}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <Users className="w-4 h-4 text-blue-400" />
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-slate-700">{a.counselor?.name}</span>
                                                    <span className="text-[10px] font-bold text-blue-500 uppercase tracking-tighter">ID: {a.counselor?.counselorId}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-slate-600">{format(new Date(a.assignedAt), 'MMM dd, yyyy')}</span>
                                                <span className="text-[10px] font-bold text-slate-400">{format(new Date(a.assignedAt), 'HH:mm')}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="px-2 py-1 rounded-lg bg-green-50 text-green-600 border border-green-100 text-[10px] font-black tracking-widest uppercase">
                                                Active
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button className="p-2 text-slate-300 hover:text-green-600 transition-colors">
                                                <ChevronRight className="w-5 h-5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {totalPages > 1 && (
                    <div className="px-6 py-4 border-t border-slate-50 flex items-center justify-between bg-slate-50/10">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            Page {page + 1} of {totalPages}
                        </p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setPage(p => Math.max(0, p - 1))}
                                disabled={page === 0}
                                className="px-4 py-2 text-[10px] font-black text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-40 transition-all font-mono"
                            >
                                PREV
                            </button>
                            <button
                                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                                disabled={page >= totalPages - 1}
                                className="px-4 py-2 text-[10px] font-black text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-40 transition-all font-mono"
                            >
                                NEXT
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

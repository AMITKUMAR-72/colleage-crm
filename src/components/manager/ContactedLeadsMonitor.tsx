'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { ManagerService } from '@/services/managerService';
import { ContactedLeadDTO } from '@/types/api';
import {
    PhoneCall, Clock, User, MessageSquare, Search,
    RefreshCcw, ChevronRight, Filter, BookOpen, UserPlus
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';

export default function ContactedLeadsMonitor() {
    const [contacts, setContacts] = useState<ContactedLeadDTO[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [searchTerm, setSearchTerm] = useState('');

    const loadContacts = useCallback(async () => {
        setLoading(true);
        try {
            const data = await ManagerService.getAllContactedLeads(page, 10);
            setContacts(data.content);
            setTotalPages(data.totalPages);
        } catch (error) {
            toast.error('Failed to fetch contacted leads');
            setContacts([]);
        } finally {
            setLoading(false);
        }
    }, [page]);

    useEffect(() => {
        loadContacts();
    }, [loadContacts]);

    return (
        <div className="space-y-6">
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                        <PhoneCall className="w-6 h-6 text-indigo-600" />
                        Engagement Tracking
                    </h2>
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Review all counselor-to-lead interactions</p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search by name or email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 outline-none w-48 md:w-64"
                        />
                    </div>
                    <button
                        onClick={loadContacts}
                        className="p-2.5 bg-slate-50 text-slate-400 hover:text-indigo-600 rounded-xl hover:bg-indigo-50 transition-all border border-slate-100"
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
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Lead Name</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Counselor</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Contact Date</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Outcome</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Notes</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading && contacts.length === 0 ? (
                                Array(5).fill(0).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={5} className="px-6 py-6">
                                            <div className="h-4 bg-slate-100 rounded-full w-full"></div>
                                        </td>
                                    </tr>
                                ))
                            ) : contacts.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center gap-2">
                                            <MessageSquare className="w-10 h-10 text-slate-100" />
                                            <p className="text-slate-400 font-bold text-sm uppercase tracking-widest">No contact history found</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                contacts.filter(c =>
                                    c.lead?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                    c.assignedTo?.name?.toLowerCase().includes(searchTerm.toLowerCase())
                                ).map((c) => (
                                    <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs font-black border border-indigo-100">
                                                    {c.lead?.name?.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-slate-700">{c.lead?.name}</span>
                                                    <span className="text-[10px] font-bold text-indigo-400 tracking-tight">{c.lead?.phone}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <UserPlus className="w-4 h-4 text-slate-300" />
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-slate-700">{c.assignedTo?.name}</span>
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{c.assignedTo?.department}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-slate-600">{format(new Date(c.contactedAt), 'MMM dd, yyyy')}</span>
                                                <span className="text-[10px] font-bold text-slate-400">{format(new Date(c.contactedAt), 'HH:mm')}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-lg text-[10px] font-black tracking-widest uppercase border ${c.status === 'QUALIFIED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                                    c.status === 'LOST' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                                                        'bg-amber-50 text-amber-600 border-amber-100'
                                                }`}>
                                                {c.status || 'CONTACTED'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="group relative inline-block">
                                                <button className="p-2 text-slate-300 hover:text-indigo-600 transition-colors">
                                                    <MessageSquare className="w-5 h-5" />
                                                </button>
                                                {c.notes && (
                                                    <div className="absolute bottom-full right-0 mb-2 w-48 p-2 bg-slate-800 text-white text-[10px] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                                                        {c.notes}
                                                    </div>
                                                )}
                                            </div>
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
                            {page + 1} / {totalPages}
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

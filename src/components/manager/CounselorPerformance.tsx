'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { CounselorService } from '@/services/counselorService';
import { ManagerService } from '@/services/managerService';
import { CounselorDTO, LeadResponseDTO } from '@/types/api';

import { format } from 'date-fns';
import { toast } from 'react-hot-toast';

export default function CounselorPerformance() {
    const [counselors, setCounselors] = useState<CounselorDTO[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCounselor, setSelectedCounselor] = useState<CounselorDTO | null>(null);
    const [recentLeads, setRecentLeads] = useState<LeadResponseDTO[]>([]);
    const [leadsLoading, setLeadsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const loadCounselors = useCallback(async () => {
        setLoading(true);
        try {
            const data = await CounselorService.getAllCounselors();
            setCounselors(data || []);
        } catch (error) {
            toast.error('Failed to fetch counselors');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadCounselors();
    }, [loadCounselors]);

    const fetchRecentLeads = async (counselor: CounselorDTO) => {
        setSelectedCounselor(counselor);
        setLeadsLoading(true);
        try {
            const data = await ManagerService.getCounselorRecentLeads(counselor.counselorId, 0, 10);
            // Handle the specific "lead" array key in the response
            const leads = data?.lead || data?.content || [];
            setRecentLeads(leads);
        } catch (error) {
            toast.error('Failed to fetch recent leads');
            setRecentLeads([]);
        } finally {
            setLeadsLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-black text-slate-800 tracking-tight uppercase">
                        Counselor Performance
                    </h2>
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Review team engagement and recent activity</p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Find counselor..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 outline-none w-48 md:w-64 font-bold"
                        />
                    </div>
                    <button
                        onClick={loadCounselors}
                        className="px-4 py-2.5 bg-slate-50 text-slate-400 hover:text-indigo-600 rounded-xl hover:bg-indigo-50 transition-all border border-slate-100 text-[10px] font-black uppercase tracking-widest"
                    >
                        {loading ? 'LOADING...' : 'REFRESH'}
                    </button>
                </div>
            </div>

            {/* Counselors Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Counselor Name</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Type</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Department</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="py-20">
                                        <div className="flex justify-center items-center w-full">
                                            <img src="/raffles-logo.png" alt="Loading" className="h-20 w-auto object-contain animate-spin-y-ease-in" />
                                        </div>
                                    </td>
                                </tr>
                            ) : counselors.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-10 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">
                                        No counselors found
                                    </td>
                                </tr>
                            ) : (
                                counselors.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase())).map((c) => (
                                    <tr
                                        key={c.counselorId}
                                        onClick={() => fetchRecentLeads(c)}
                                        className="hover:bg-slate-50/50 transition-colors cursor-pointer group"
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs font-black">
                                                    {c.name.charAt(0).toUpperCase()}
                                                </div>
                                                <span className="text-sm font-bold text-slate-700 group-hover:text-indigo-600 transition-colors">{c.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-xs font-bold text-slate-500">{c.counselorType}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-xs font-bold text-slate-400 uppercase tracking-tighter">{c.department || 'N/A'}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-0.5 rounded-md text-[9px] font-black tracking-widest uppercase border ${c.status === 'AVAILABLE' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-400 border-slate-100'
                                                }`}>
                                                {c.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button className="text-[10px] font-black text-slate-300 group-hover:text-indigo-600 uppercase tracking-widest">
                                                ACTIVITY
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Recent Leads Modal/Drawer */}
            {selectedCounselor && (
                <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="w-full max-w-2xl h-full bg-white shadow-2xl animate-in slide-in-from-right duration-500 overflow-hidden flex flex-col">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black">
                                    {selectedCounselor.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <h3 className="font-black text-xl text-slate-900">{selectedCounselor.name}</h3>
                                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Recent Lead Interactions</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedCounselor(null)}
                                className="px-4 py-2 bg-gray-100 text-gray-500 hover:bg-gray-200 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all shadow-sm"
                            >
                                CLOSE
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6">
                            {leadsLoading ? (
                                <div className="flex flex-col items-center justify-center h-48 gap-4">
                                    <img src="/raffles-logo.png" alt="Loading" className="h-20 w-auto object-contain animate-spin-y-ease-in" />
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest animate-pulse">Fetching latest leads...</p>
                                </div>
                            ) : recentLeads.length > 0 ? (
                                <div className="space-y-4">
                                    {recentLeads.map((lead) => (
                                        <div key={lead.id} className="p-4 rounded-2xl border border-slate-100 bg-white hover:border-indigo-100 transition-colors group">
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-600 flex items-center justify-center font-bold text-sm">
                                                        {lead.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-slate-800">{lead.name}</h4>
                                                        <div className="text-[10px] text-slate-400 font-medium">{lead.email}</div>
                                                    </div>
                                                </div>
                                                <span className={`px-2 py-1 rounded-lg text-[10px] font-black tracking-widest uppercase border ${lead.status === 'QUALIFIED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                                    lead.status === 'TELECALLER_ASSIGNED' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
                                                        'bg-amber-50 text-amber-600 border-amber-100'
                                                    }`}>
                                                    {lead.status}
                                                </span>
                                            </div>

                                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-4 pt-4 border-t border-slate-50">
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Course</span>
                                                    <span className="text-xs font-bold text-slate-700">
                                                        {typeof lead.course === 'object' ? (lead.course as any)?.course : (lead.course || 'N/A')}
                                                    </span>
                                                </div>
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Score</span>
                                                    <span className={`text-xs font-bold ${lead.score === 'HOT' ? 'text-rose-500' : lead.score === 'WARM' ? 'text-amber-500' : 'text-blue-500'
                                                        }`}>{lead.score}</span>
                                                </div>
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Source</span>
                                                    <span className="text-xs font-bold text-slate-700">{lead.campaign?.name || 'WALK-IN'}</span>
                                                </div>
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Created</span>
                                                    <span className="text-xs font-bold text-slate-700">
                                                        {(lead as any).createdAt ? format(new Date((lead as any).createdAt), 'MMM dd, HH:mm') : 'N/A'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-64 text-center">
                                    <h4 className="font-bold text-slate-400 uppercase tracking-widest text-sm">No recent leads found</h4>
                                    <p className="text-slate-300 text-xs mt-1">This counselor hasn't had any recent activity.</p>
                                </div>
                            )}
                        </div>

                        <div className="p-6 border-t border-slate-100 bg-slate-50/30 flex justify-between items-center">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Showing top 10 most recent</p>
                            <button
                                onClick={() => setSelectedCounselor(null)}
                                className="px-6 py-2.5 bg-slate-900 text-white text-xs font-black rounded-xl hover:bg-slate-800 transition-all shadow-md active:scale-95"
                            >
                                CLOSE PANEL
                            </button>
                        </div>
                    </div>
                </div>
            )
            }
        </div >
    );
}

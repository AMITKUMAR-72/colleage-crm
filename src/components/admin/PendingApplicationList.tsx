'use client';

import { useState, useEffect, useCallback } from 'react';
import { LeadService } from '@/services/leadService';
import { CounselorService } from '@/services/counselorService';
import toast from 'react-hot-toast';

const PAGE_SIZE = 10;

export default function PendingApplicationList() {
    const [applications, setApplications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [totalCount, setTotalCount] = useState(0);
    const [selectedApp, setSelectedApp] = useState<any | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [counselorName, setCounselorName] = useState<string | null>(null);
    const [fetchingCounselor, setFetchingCounselor] = useState(false);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const res = await LeadService.getAllStudentApplications(page, PAGE_SIZE);
            if (res && res.content) {
                setApplications(res.content);
                setTotalCount(res.totalElements || 0);
            } else {
                setApplications([]);
                setTotalCount(0);
            }
        } catch (err) {
            console.error('[PendingApplicationList] Failed to fetch applications', err);
            toast.error('Could not load pending applications');
        } finally {
            setLoading(false);
        }
    }, [page]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleRowClick = async (app: any) => {
        setSelectedApp(app);
        setIsModalOpen(true);
        setCounselorName(null);
        setFetchingCounselor(true);

        try {
            // New logic: find by email in assigned_leads table via the specific endpoint
            const name = await LeadService.getCounselorByEmail(app.email);
            if (name && name !== 'Not Found in Assignments') {
                setCounselorName(name);
            } else {
                setCounselorName('Not Assigned');
            }
        } catch (error) {
            console.error('Failed to fetch counselor info', error);
            setCounselorName('Lookup Failed');
        } finally {
            setFetchingCounselor(false);
        }
    };

    const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
    const showPagination = totalCount > PAGE_SIZE;

    return (
        <div className="flex-1 min-w-0 w-full rounded-2xl overflow-hidden bg-white shadow-sm border border-gray-100 h-fit">
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/40 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                    <h2 className="font-black text-slate-800 tracking-tight">Pending Applicants (Initial Inquiries)</h2>
                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mt-0.5">
                        {totalCount} Total Inquiries
                        {showPagination && ` • Page ${page + 1} of ${totalPages}`}
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={fetchData}
                        disabled={loading}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 text-[10px] font-black uppercase tracking-widest transition"
                    >
                        <svg className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                            <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" />
                            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                        </svg>
                        Refresh
                    </button>
                </div>
            </div>

            {/* Body */}
            <div className="overflow-x-auto">
                {loading ? (
                    <div className="py-20 flex flex-col justify-center items-center gap-3">
                        <div className="w-10 h-10 border-4 border-[#4d0101]/20 border-t-[#4d0101] rounded-full animate-spin" />
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest animate-pulse">Fetching Real-time Inquiries</p>
                    </div>
                ) : applications.length === 0 ? (
                    <div className="py-20 text-center bg-slate-50/30">
                        <h3 className="text-sm font-black text-slate-900 uppercase">No Pending Inquiries</h3>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">New applications will appear here</p>
                    </div>
                ) : (
                    <table className="w-full text-sm text-left">
                        <thead className="text-[10px] text-slate-400 uppercase bg-slate-50/60 border-b border-slate-200 tracking-widest font-black sticky top-0 z-10">
                            <tr>
                                <th className="px-5 py-3 font-black">Applicant</th>
                                <th className="px-5 py-3 font-black">Contact Info</th>
                                <th className="px-5 py-3 font-black">Course & School</th>
                                <th className="px-5 py-3 font-black">Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {applications.map((app, idx) => (
                                <tr 
                                    key={app.id || idx} 
                                    className="hover:bg-slate-50 transition-colors cursor-pointer group"
                                    onClick={() => handleRowClick(app)}
                                >
                                    <td className="px-5 py-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-indigo-500 text-white flex items-center justify-center font-black text-xs uppercase shadow-sm shrink-0 group-hover:scale-110 transition-transform">
                                                {app.studentName?.charAt(0) || '?'}
                                            </div>
                                            <div className="min-w-0">
                                                <div className="font-bold text-slate-800 text-sm truncate max-w-[140px]">{app.studentName || 'Anonymous'}</div>
                                                <div className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">#{app.id || 'N/A'}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-5 py-3">
                                        <div className="text-slate-600 text-xs font-medium">{app.email}</div>
                                        <div className="text-slate-400 text-[9px] font-bold mt-0.5">{app.mobile}</div>
                                    </td>
                                    <td className="px-5 py-3">
                                        <div className="text-xs font-bold text-slate-600">{app.course}</div>
                                        <div className="text-[9px] text-slate-400 font-bold uppercase truncate max-w-[150px]">{app.school}</div>
                                    </td>
                                    <td className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase">
                                        {app.createdAt ? new Date(app.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Pagination */}
            {showPagination && !loading && (
                <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/30 flex flex-col sm:flex-row items-center sm:justify-between gap-3 sm:gap-0">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center sm:text-left">
                        Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, totalCount)} of {totalCount}
                    </p>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setPage(p => Math.max(0, p - 1))}
                            disabled={page === 0}
                            className="px-4 py-1.5 text-[10px] font-black uppercase tracking-widest border rounded-lg hover:bg-gray-50 disabled:opacity-40 transition"
                        >
                            ← Prev
                        </button>
                        <span className="px-3 py-1.5 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                            {page + 1} / {totalPages}
                        </span>
                        <button
                            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                            disabled={page >= totalPages - 1}
                            className="px-4 py-1.5 text-[10px] font-black uppercase tracking-widest border rounded-lg hover:bg-gray-50 disabled:opacity-40 transition"
                        >
                            Next →
                        </button>
                    </div>
                </div>
            )}

            {/* Detail Modal */}
            {isModalOpen && selectedApp && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-300">
                        {/* Modal Header */}
                        <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                            <div>
                                <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                                    Applicant Details
                                    <span className="text-[10px] bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full uppercase tracking-widest font-black">
                                        Pending
                                    </span>
                                </h3>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Ref ID: {selectedApp.id}</p>
                            </div>
                            <button 
                                onClick={() => setIsModalOpen(false)}
                                className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-slate-600 hover:border-slate-300 transition-all shadow-sm"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                                    <path d="M18 6L6 18M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="px-8 py-8 max-h-[70vh] overflow-y-auto">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Basic Info */}
                                <div className="space-y-6">
                                    <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] border-b border-indigo-100 pb-2">Student Information</h4>
                                    
                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Full Name</label>
                                            <p className="text-sm font-bold text-slate-800">{selectedApp.studentName}</p>
                                        </div>
                                        <div>
                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Email Address</label>
                                            <p className="text-sm font-bold text-slate-800">{selectedApp.email}</p>
                                        </div>
                                        <div>
                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Mobile Number</label>
                                            <p className="text-sm font-bold text-slate-800">{selectedApp.mobile}</p>
                                        </div>
                                        <div>
                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Assigned Counselor</label>
                                            {fetchingCounselor ? (
                                                <div className="flex items-center gap-2">
                                                    <div className="w-3 h-3 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
                                                    <span className="text-[10px] font-bold text-slate-400 animate-pulse">Checking Assignment...</span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-2 h-2 rounded-full ${counselorName && counselorName !== 'Not Assigned' && counselorName !== 'No Lead Found' ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                                                    <p className={`text-sm font-black ${counselorName && counselorName !== 'Not Assigned' && counselorName !== 'No Lead Found' ? 'text-emerald-600' : 'text-slate-500 uppercase tracking-wider text-[10px]'}`}>
                                                        {counselorName || 'Not Found'}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Academic & Location */}
                                <div className="space-y-6">
                                    <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] border-b border-indigo-100 pb-2">Academic & Location</h4>
                                    
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="col-span-2">
                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Discipline & School</label>
                                            <p className="text-sm font-bold text-slate-800">{selectedApp.discipline} — {selectedApp.school}</p>
                                        </div>
                                        <div className="col-span-2">
                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Applied Course</label>
                                            <p className="text-sm font-black text-indigo-600">{selectedApp.course}</p>
                                        </div>
                                        <div>
                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Country</label>
                                            <p className="text-sm font-bold text-slate-800">{selectedApp.country || 'INDIA'}</p>
                                        </div>
                                        <div>
                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">State</label>
                                            <p className="text-sm font-bold text-slate-800">{selectedApp.state}</p>
                                        </div>
                                        <div>
                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">City</label>
                                            <p className="text-sm font-bold text-slate-800">{selectedApp.city}</p>
                                        </div>
                                        <div>
                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Inquiry Date</label>
                                            <p className="text-[11px] font-bold text-slate-600 uppercase tracking-tighter">
                                                {selectedApp.createdAt ? new Date(selectedApp.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '—'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="px-8 py-5 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
                            <button 
                                onClick={() => setIsModalOpen(false)}
                                className="px-6 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-500 text-[10px] font-black uppercase tracking-[0.1em] hover:bg-slate-100 transition shadow-sm w-full sm:w-auto"
                            >
                                Close Detail View
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

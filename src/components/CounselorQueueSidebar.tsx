import React, { useState, useEffect, useRef } from 'react';
import api from '@/services/api';
import toast from 'react-hot-toast';

interface QueuedLead {
    id: number;
    leadId: number;
    leadName: string;
    departmentName: string;
    queuedAt: string;
    requiredType: string;
    score: string;
    assignedById: number | null;
    assignedByName: string | null;
}

export default function CounselorQueueSidebar() {
    const [queue, setQueue] = useState<QueuedLead[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterOpen, setFilterOpen] = useState(false);
    const [types, setTypes] = useState<string[]>([]);
    const [selectedType, setSelectedType] = useState<string | null>(null);
    const filterRef = useRef<HTMLDivElement>(null);

    const fetchQueue = async (type?: string | null) => {
        setLoading(true);
        try {
            const url = type 
                ? `/api/counselor-queue/type/${encodeURIComponent(type)}` 
                : `/api/counselor-queue`;
            const response = await api.get(url);
            const data = response.data?.data || response.data || [];
            setQueue(data);
        } catch (error) {
            console.error('Failed to fetch counselor queue', error);
            toast.error('Could not load counselor queue');
            setQueue([]);
        } finally {
            setLoading(false);
        }
    };

    const loadTypes = async () => {
        try {
            const response = await api.get('/api/enum/counselor-type');
            const data = response.data?.data || response.data || [];
            if (Array.isArray(data)) setTypes(data);
        } catch (error) {
            console.error('Failed to load counselor types', error);
        }
    };

    useEffect(() => {
        fetchQueue(selectedType);
    }, [selectedType]);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
                setFilterOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const handleFilterToggle = async () => {
        const nowOpen = !filterOpen;
        setFilterOpen(nowOpen);
        if (nowOpen && types.length === 0) {
            await loadTypes();
        }
    };

    const handleTypeSelect = (type: string | null) => {
        setSelectedType(type);
        setFilterOpen(false);
    };

    return (
        <div className="w-full rounded-2xl overflow-hidden bg-white shadow-sm border border-gray-100 flex flex-col h-fit">
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/40 flex justify-between items-center relative gap-3">
                <div>
                    <h2 className="font-black text-slate-800 tracking-tight">Counselor Queue</h2>
                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mt-0.5">
                        {queue.length} Pending
                        {selectedType ? ` • ${selectedType}` : ''}
                    </p>
                </div>
                
                <div className="flex items-center gap-2" ref={filterRef}>
                    <button
                        onClick={handleFilterToggle}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 text-[10px] font-black uppercase tracking-widest transition"
                    >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
                        </svg>
                        Filter
                    </button>

                    {filterOpen && (
                        <div className="absolute right-5 top-full mt-1.5 w-48 bg-white border border-slate-200 rounded-xl shadow-xl z-40 overflow-hidden">
                            <div className="px-3 py-2 border-b border-slate-100 bg-slate-50">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Filter By Type</p>
                            </div>
                            <div className="max-h-48 overflow-y-auto">
                                <button
                                    onClick={() => handleTypeSelect(null)}
                                    className={`w-full text-left px-4 py-2.5 hover:bg-[#4d0101]/5 transition text-xs font-bold border-b border-slate-50 last:border-0 ${!selectedType ? 'text-[#4d0101] bg-[#4d0101]/5' : 'text-slate-800'}`}
                                >
                                    All Types
                                </button>
                                {types.map(t => (
                                    <button
                                        key={t}
                                        onClick={() => handleTypeSelect(t)}
                                        className={`w-full text-left px-4 py-2.5 hover:bg-[#4d0101]/5 transition text-xs font-bold border-b border-slate-50 last:border-0 uppercase ${selectedType === t ? 'text-[#4d0101] bg-[#4d0101]/5' : 'text-slate-800'}`}
                                    >
                                        {t}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
            </div>
        </div>

            <div style={{ maxHeight: '40vh' }} className="overflow-y-auto bg-slate-50/10">
                {loading ? (
                    <div className="py-16 flex justify-center items-center">
                        <div className="w-8 h-8 border-4 border-[#4d0101]/20 border-t-[#4d0101] rounded-full animate-spin" />
                    </div>
                ) : queue.length === 0 ? (
                    <div className="py-14 text-center">
                        <p className="text-slate-400 font-medium lowercase italic text-sm">queue is empty</p>
                    </div>
                ) : (
                    <table className="w-full text-sm text-left">
                        <thead className="text-[10px] text-slate-400 uppercase bg-slate-50/60 border-b border-slate-200 tracking-widest font-black sticky top-0 z-10">
                            <tr>
                                <th className="px-5 py-3 font-black">Lead Name</th>
                                <th className="px-5 py-3 font-black">Score</th>
                                <th className="px-5 py-3 font-black">Department</th>
                                <th className="px-5 py-3 font-black">Type Req.</th>
                                <th className="px-5 py-3 font-black text-right">Queued At</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {queue.map((item) => (
                                <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-5 py-3">
                                        <div className="font-bold text-slate-800 text-sm">{item.leadName || 'Unknown'}</div>
                                    </td>
                                    <td className="px-5 py-3">
                                        <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${item.score === 'HOT' ? 'bg-red-100 text-red-700' : item.score === 'WARM' ? 'bg-orange-100 text-orange-700' : 'bg-sky-100 text-sky-700'}`}>
                                            {item.score || '—'}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3">
                                        <div className="text-xs font-medium text-slate-600">{item.departmentName || '—'}</div>
                                    </td>
                                    <td className="px-5 py-3">
                                        <div className="text-xs font-bold text-slate-700">{item.requiredType || '—'}</div>
                                    </td>
                                    <td className="px-5 py-3 text-right">
                                        <div className="flex items-center justify-end gap-1 text-slate-400">
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                                                <circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline>
                                            </svg>
                                            <span className="text-[10px] font-bold tracking-wider">
                                                {item.queuedAt ? new Date(item.queuedAt).toLocaleString() : '—'}
                                            </span>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}

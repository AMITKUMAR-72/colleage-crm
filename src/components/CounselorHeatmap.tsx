'use client';

import { useState, useEffect } from 'react';
import { CounselorDTO } from '@/types/api';
import { CounselorService } from '@/services/counselorService';
import { UserCheck, AlertTriangle } from 'lucide-react';

export default function CounselorHeatmap() {
    const [counselors, setCounselors] = useState<CounselorDTO[]>([]);
    const [loading, setLoading] = useState(true);

    const MAX_LEADS = 50; // Mock threshold for heatmap calculation

    useEffect(() => {
        fetchCounselors();
    }, []);

    const fetchCounselors = async () => {
        try {
            setLoading(true);
            const data = await CounselorService.getAllCounselors();
            setCounselors(data);
        } catch (err) {
            console.error("Failed to fetch counselors", err);
        } finally {
            setLoading(false);
        }
    };

    const getLoadPercentage = (total: number) => Math.min((total / MAX_LEADS) * 100, 100);
    
    const getLoadColor = (total: number) => {
        const percentage = getLoadPercentage(total);
        if (percentage > 80) return 'bg-rose-500';
        if (percentage > 50) return 'bg-amber-500';
        return 'bg-emerald-500';
    };

    if (loading) return <div className="text-center py-10">Loading workload metrics...</div>;

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h2 className="font-bold text-gray-800 mb-6 flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-blue-600" />
                Counselor Workload Heatmap
            </h2>
            
            <div className="space-y-6">
                {counselors.map((counselor) => {
                    const percentage = getLoadPercentage(counselor.totalLeads);
                    return (
                        <div key={counselor.counselorId} className="group">
                            <div className="flex justify-between items-end mb-2">
                                <div>
                                    <p className="font-semibold text-gray-900 group-hover:text-blue-600 transition">{counselor.name}</p>
                                    <p className="text-xs text-gray-400 capitalize">{counselor.status.toLowerCase()} • {counselor.priority.toLowerCase()} Priority</p>
                                </div>
                                <div className="text-right">
                                    <span className="text-sm font-bold text-gray-700">{counselor.totalLeads} / {MAX_LEADS}</span>
                                    <p className="text-[10px] text-gray-400 uppercase tracking-tighter">Current Leads</p>
                                </div>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                                <div 
                                    className={`h-full transition-all duration-1000 ease-out ${getLoadColor(counselor.totalLeads)}`}
                                    style={{ width: `${percentage}%` }}
                                />
                            </div>
                            {percentage > 80 && (
                                <p className="text-[10px] text-rose-500 mt-1 flex items-center gap-1 font-medium">
                                    <AlertTriangle className="w-3 h-3" /> Over capacity - Reassignment recommended
                                </p>
                            )}
                        </div>
                    );
                })}
                
                {counselors.length === 0 && (
                    <div className="text-center py-6 text-gray-400 text-sm italic">
                        No counselor metrics available.
                    </div>
                )}
            </div>
        </div>
    );
}

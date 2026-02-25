'use client';

import { useState, useEffect, useCallback } from 'react';
import { CourseService } from '@/services/courseService';
import { CampaignService } from '@/services/campaignService';
import { CourseDTO, CampaignDTO, LeadStatus, LeadScore } from '@/types/api';

interface LeadFilters {
    email: string;
    status: string;
    course: string;
    campaign: string;
    score: string;
    startDate?: string;
    endDate?: string;
}

interface FilterProps {
    onFilterChange: (filters: LeadFilters) => void;
}

const ALL_STATUSES: LeadStatus[] = [
    'NEW', 'TELECALLER_ASSIGNED', 'QUALIFIED', 'COUNSELOR_ASSIGNED',
    'EXTERNAL_ASSIGNED', 'ADMISSION_IN_PROCESS', 'ADMISSION_DONE',
    'LOST', 'UNASSIGNED', 'CONTACTED', 'TIMED_OUT', 'REASSIGNED'
];

const ALL_SCORES: LeadScore[] = ['HOT', 'WARM', 'COLD'];

export default function LeadSearchFilters({ onFilterChange }: FilterProps) {
    const [courses, setCourses] = useState<CourseDTO[]>([]);
    const [campaigns, setCampaigns] = useState<CampaignDTO[]>([]);
    const [filterType, setFilterType] = useState<string>('EMAIL');
    const [filterValue, setFilterValue] = useState<string>('');

    useEffect(() => {
        const loadData = async () => {
            try {
                const [courseData, campaignData] = await Promise.all([
                    CourseService.getAllCourses(),
                    CampaignService.getAllSources()
                ]);
                setCourses(courseData);
                setCampaigns(campaignData);
            } catch (error) {
                console.error("Failed to load filter data", error);
            }
        };
        loadData();
    }, []);

    const handleApply = () => {
        const payload: LeadFilters = { email: '', status: '', course: '', campaign: '', score: '' };
        if (filterValue) {
            if (filterType === 'EMAIL') payload.email = filterValue;
            if (filterType === 'STATUS') payload.status = filterValue;
            if (filterType === 'PRIORITY') payload.score = filterValue;
            if (filterType === 'COURSE') payload.course = filterValue;
            if (filterType === 'CAMPAIGN') payload.campaign = filterValue;
        }
        onFilterChange(payload);
    };

    const handleClear = () => {
        setFilterValue('');
        onFilterChange({ email: '', status: '', course: '', campaign: '', score: '' });
    };

    return (
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 mb-6">
            <div className="flex flex-col md:flex-row items-center gap-4">
                <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-xl border border-slate-100">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Search Category</label>
                    <select
                        className="bg-transparent text-xs font-black uppercase tracking-widest text-[#600202] outline-none cursor-pointer"
                        value={filterType}
                        onChange={(e) => {
                            setFilterType(e.target.value);
                            setFilterValue('');
                        }}
                    >
                        <option value="EMAIL">Email Address</option>
                        <option value="STATUS">Lead Status</option>
                        <option value="PRIORITY">Lead Score</option>
                        <option value="COURSE">Target Program</option>
                        <option value="CAMPAIGN">Lead Source</option>
                    </select>
                </div>

                <div className="flex-1 w-full">
                    {filterType === 'EMAIL' && (
                        <input
                            placeholder="john@example.com"
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-4 focus:ring-rose-900/5 focus:border-[#600202] outline-none transition-all"
                            value={filterValue}
                            onChange={(e) => setFilterValue(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleApply()}
                        />
                    )}

                    {filterType === 'STATUS' && (
                        <select
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold uppercase tracking-widest outline-none cursor-pointer"
                            value={filterValue}
                            onChange={(e) => setFilterValue(e.target.value)}
                        >
                            <option value="">Choose Status...</option>
                            {ALL_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    )}

                    {filterType === 'PRIORITY' && (
                        <select
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold uppercase tracking-widest outline-none cursor-pointer"
                            value={filterValue}
                            onChange={(e) => setFilterValue(e.target.value)}
                        >
                            <option value="">Choose Priority...</option>
                            {ALL_SCORES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    )}

                    {filterType === 'COURSE' && (
                        <select
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none cursor-pointer"
                            value={filterValue}
                            onChange={(e) => setFilterValue(e.target.value)}
                        >
                            <option value="">Select Course Program...</option>
                            {courses.map(c => <option key={c.id} value={c.course}>{c.course}</option>)}
                        </select>
                    )}

                    {filterType === 'CAMPAIGN' && (
                        <select
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none cursor-pointer"
                            value={filterValue}
                            onChange={(e) => setFilterValue(e.target.value)}
                        >
                            <option value="">Select Lead Source...</option>
                            {campaigns.map(cp => <option key={cp.id} value={cp.name}>{cp.name}</option>)}
                        </select>
                    )}
                </div>

                <div className="flex gap-2 w-full md:w-auto">
                    <button
                        onClick={handleApply}
                        className="flex-1 md:w-32 bg-[#600202] text-white py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-rose-900/20 hover:bg-rose-950 transition-all active:scale-95"
                    >
                        Apply Filter
                    </button>
                    <button
                        onClick={handleClear}
                        className="px-4 py-3 bg-slate-50 text-slate-400 border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest hover:text-slate-600 transition-all"
                    >
                        Clear
                    </button>
                </div>
            </div>
        </div>
    );
}

'use client';

import { useState, useEffect } from 'react';
import { CourseService } from '@/services/courseService';
import { CampaignService } from '@/services/campaignService';
import { CourseDTO, CampaignDTO, LeadStatus, LeadScore } from '@/types/api';

interface LeadFilters {
    email: string;
    status: string;
    course: string;
    campaign: string;
    score: string;
    id?: string;
    phone?: string;
    name?: string;
    startDate?: string;
    endDate?: string;
}

interface FilterProps {
    onFilterChange: (filters: LeadFilters) => void;
}

const ALL_STATUSES: LeadStatus[] = [
    'NEW',
    'TELECALLER_ASSIGNED',
    'INTERESTED',
    'COUNSELOR_ASSIGNED',
    'EXTERNAL_ASSIGNED',
    'ADMISSION_IN_PROCESS',
    'ADMISSION_DONE',
    'LOST',
    'UNASSIGNED',
    'CONTACTED',
    'TIMED_OUT',
    'REASSIGNED',
    'IN_A_SESSION',
    'QUEUED'
];

const ALL_SCORES: LeadScore[] = ['HOT', 'WARM', 'COLD'];

export default function LeadSearchFilters({ onFilterChange }: FilterProps) {
    const [courses, setCourses] = useState<CourseDTO[]>([]);
    const [campaigns, setCampaigns] = useState<CampaignDTO[]>([]);
    const [filterType, setFilterType] = useState<string>('NAME');
    const [filterValue, setFilterValue] = useState<string>('');
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');

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
        if (filterType === 'DATE_RANGE') {
            if (startDate && endDate) {
                payload.startDate = startDate;
                payload.endDate = endDate;
            }
        } else if (filterValue) {
            if (filterType === 'EMAIL') payload.email = filterValue;
            if (filterType === 'STATUS') payload.status = filterValue;
            if (filterType === 'PRIORITY') payload.score = filterValue;
            if (filterType === 'COURSE') payload.course = filterValue;
            if (filterType === 'CAMPAIGN') payload.campaign = filterValue;
            if (filterType === 'NAME') payload.name = filterValue;
            if (filterType === 'ID') payload.id = filterValue;
            if (filterType === 'PHONE') payload.phone = filterValue;
        }
        onFilterChange(payload);
    };

    const handleClear = () => {
        setFilterValue('');
        setStartDate('');
        setEndDate('');
        onFilterChange({ email: '', status: '', course: '', campaign: '', score: '' });
    };

    return (
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 mb-6">
            <div className="flex flex-col lg:flex-row items-center gap-4">
                <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-xl border border-slate-100 w-full lg:w-auto">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none shrink-0">Search Category</label>
                    <select
                        className="bg-transparent text-xs font-black uppercase tracking-widest text-[#600202] outline-none cursor-pointer w-full"
                        value={filterType}
                        onChange={(e) => {
                            setFilterType(e.target.value);
                            setFilterValue('');
                            setStartDate('');
                            setEndDate('');
                        }}
                    >
                        <option value="NAME">Name</option>
                        <option value="EMAIL">Email</option>
                        <option value="PHONE">Phone</option>
                        <option value="ID">Lead ID</option>
                        <option value="STATUS">Status</option>
                        <option value="PRIORITY">Score</option>
                        <option value="COURSE">Course</option>
                        <option value="CAMPAIGN">Campaign</option>
                        <option value="DATE_RANGE">Date Range</option>
                    </select>
                </div>

                <div className="flex-1 w-full">
                    {filterType === 'DATE_RANGE' ? (
                        <div className="flex items-center gap-2">
                            <input
                                type="date"
                                className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-4 focus:ring-rose-900/5 transition-all"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                            />
                            <span className="text-slate-400 text-[10px] font-black">TO</span>
                            <input
                                type="date"
                                className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-4 focus:ring-rose-900/5 transition-all"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                            />
                        </div>
                    ) : filterType === 'STATUS' ? (
                        <select
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold uppercase tracking-widest outline-none cursor-pointer"
                            value={filterValue}
                            onChange={(e) => setFilterValue(e.target.value)}
                        >
                            <option value="">Choose Status...</option>
                            {ALL_STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                        </select>
                    ) : filterType === 'PRIORITY' ? (
                        <select
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold uppercase tracking-widest outline-none cursor-pointer"
                            value={filterValue}
                            onChange={(e) => setFilterValue(e.target.value)}
                        >
                            <option value="">Choose Score...</option>
                            {ALL_SCORES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    ) : filterType === 'COURSE' ? (
                        <select
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none cursor-pointer"
                            value={filterValue}
                            onChange={(e) => setFilterValue(e.target.value)}
                        >
                            <option value="">Select Course...</option>
                            {courses.map(c => <option key={c.id} value={c.course}>{c.course}</option>)}
                        </select>
                    ) : filterType === 'CAMPAIGN' ? (
                        <select
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none cursor-pointer"
                            value={filterValue}
                            onChange={(e) => setFilterValue(e.target.value)}
                        >
                            <option value="">Select Campaign...</option>
                            {campaigns.map(cp => <option key={cp.id} value={cp.name}>{cp.name}</option>)}
                        </select>
                    ) : (
                        <input
                            type={filterType === 'ID' || filterType === 'PHONE' ? 'text' : 'text'}
                            placeholder={`Enter ${filterType.toLowerCase()}...`}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-4 focus:ring-rose-900/5 focus:border-[#600202] outline-none transition-all"
                            value={filterValue}
                            onChange={(e) => setFilterValue(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleApply()}
                        />
                    )}
                </div>

                <div className="flex gap-2 w-full lg:w-auto">
                    <button
                        onClick={handleApply}
                        className="flex-1 lg:w-32 bg-[#600202] text-white py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-rose-900/20 hover:bg-rose-950 transition-all active:scale-95"
                    >
                        Apply
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

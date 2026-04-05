'use client';

import { useState, useEffect } from 'react';
import { CourseService } from '@/services/courseService';
import { CampaignService } from '@/services/campaignService';
import { EnumService } from '@/services/enumService';
import { CourseDTO, CampaignDTO, LeadFilters } from '@/types/api';

interface FilterProps {
    onFilterChange: (filters: LeadFilters) => void;
}

export default function LeadSearchFilters({ onFilterChange }: FilterProps) {
    const [courses, setCourses] = useState<CourseDTO[]>([]);
    const [campaigns, setCampaigns] = useState<CampaignDTO[]>([]);
    const [availableStatuses, setAvailableStatuses] = useState<string[]>([]);
    const [availableScores, setAvailableScores] = useState<string[]>([]);
    
    const [filterType, setFilterType] = useState<string>('NAME');
    const [filterValue, setFilterValue] = useState<string>('');
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');

    useEffect(() => {
        const loadData = async () => {
            try {
                const [courseData, campaignData, statusData, scoreData] = await Promise.all([
                    CourseService.getAllCourses(),
                    CampaignService.getAllSources(),
                    EnumService.getLeadStatuses(),
                    EnumService.getScores()
                ]);
                setCourses(courseData);
                setCampaigns(campaignData);
                setAvailableStatuses(statusData);
                setAvailableScores(scoreData);
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
        onFilterChange({ email: '', status: '', course: '', campaign: '', score: '', startDate: '', endDate: '' });
    };

    return (
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 mb-6 font-primary">
            <div className="flex flex-col lg:flex-row items-center gap-4">
                <div className="flex items-center gap-3 px-4 py-2.5 bg-slate-50 rounded-xl border border-slate-200 w-full lg:w-auto">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider leading-none shrink-0">Filter By</label>
                    <select
                        className="bg-transparent text-xs font-bold text-slate-700 outline-none cursor-pointer w-full"
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
                                className="flex-1 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                            />
                            <span className="text-slate-400 text-[10px] font-bold">TO</span>
                            <input
                                type="date"
                                className="flex-1 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                            />
                        </div>
                    ) : ( 
                        <div className="relative group">
                            {['STATUS', 'PRIORITY', 'COURSE', 'CAMPAIGN'].includes(filterType) ? (
                                <select
                                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none cursor-pointer focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all"
                                    value={filterValue}
                                    onChange={(e) => setFilterValue(e.target.value)}
                                >
                                    <option value="">Select {filterType.toLowerCase()}...</option>
                                    {filterType === 'STATUS' && availableStatuses.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                                    {filterType === 'PRIORITY' && availableScores.map(s => <option key={s} value={s}>{s}</option>)}
                                    {filterType === 'COURSE' && courses.map(c => (
                                        <option key={c.id} value={c.course}>
                                            {c.department ? `${c.department} - ${c.course}` : c.course}
                                        </option>
                                    ))}
                                    {filterType === 'CAMPAIGN' && campaigns.map(cp => <option key={cp.id} value={cp.name}>{cp.name}</option>)}
                                </select>
                            ) : (
                                <input
                                    type="text"
                                    placeholder={`Search by ${filterType.toLowerCase()}...`}
                                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none transition-all"
                                    value={filterValue}
                                    onChange={(e) => setFilterValue(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleApply()}
                                />
                            )}
                        </div>
                    )}
                </div>

                <div className="flex gap-2 w-full lg:w-auto">
                    <button
                        onClick={handleApply}
                        className="flex-1 lg:w-32 bg-slate-800 text-white py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-wider hover:bg-slate-900 transition-all active:scale-95 shadow-lg shadow-slate-200"
                    >
                        Apply Search
                    </button>
                    <button
                        onClick={handleClear}
                        className="px-6 py-2.5 bg-slate-100 text-slate-500 border border-slate-200 rounded-xl text-[11px] font-bold uppercase tracking-wider hover:bg-slate-200 transition-all active:scale-95"
                    >
                        Clear
                    </button>
                </div>
            </div>
        </div>
    );
}

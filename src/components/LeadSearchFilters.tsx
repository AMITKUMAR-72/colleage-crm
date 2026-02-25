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
    const [filterType, setFilterType] = useState<'' | 'email' | 'status' | 'course' | 'campaign' | 'score' | 'dateRange'>('');

    const [filters, setFilters] = useState<LeadFilters>({
        email: '',
        status: '',
        course: '',
        campaign: '',
        score: '',
        startDate: '',
        endDate: ''
    });

    const loadDropdowns = useCallback(async () => {
        try {
            // Load concurrently but handle failures individually to prevent one crash from blocking others
            const [courseResult, campaignResult] = await Promise.allSettled([
                CourseService.getAllCourses(),
                CampaignService.getAllSources()
            ]);

            if (courseResult.status === 'fulfilled') {
                setCourses(courseResult.value || []);
            } else {
                console.error('Failed to load courses:', courseResult.reason);
            }

            if (campaignResult.status === 'fulfilled') {
                setCampaigns(campaignResult.value || []);
            } else {
                console.error('Failed to load campaigns:', campaignResult.reason);
            }
        } catch (err) {
            console.error('Unexpected error loading filters:', err);
        }
    }, []);

    useEffect(() => {
        loadDropdowns();
    }, [loadDropdowns]);

    const handleChange = (key: keyof LeadFilters, value: string) => {
        const newFilters = { ...filters, [key]: value };
        setFilters(newFilters);
        onFilterChange(newFilters);
    };

    return (
        <div className="mb-6">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full">
                <div className="relative flex-1 animate-in fade-in duration-300 min-h-[44px] flex items-center">
                    {filterType === '' && (
                        <div className="text-gray-400 text-sm font-medium italic px-2">
                            Select a filter type to start searching...
                        </div>
                    )}
                    {filterType === 'email' && (
                        <div className="relative w-full">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <input
                                placeholder="Search by Email..."
                                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:border-[#dbb212] focus:ring-1 focus:ring-[#dbb212] outline-none shadow-sm transition-all text-gray-900 font-medium"
                                value={filters.email}
                                onChange={(e) => handleChange('email', e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && onFilterChange(filters)}
                            />
                        </div>
                    )}
                    {filterType === 'status' && (
                        <select
                            className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium focus:border-[#dbb212] focus:ring-1 focus:ring-[#dbb212] outline-none shadow-sm transition-all text-gray-900"
                            value={filters.status}
                            onChange={(e) => handleChange('status', e.target.value)}
                        >
                            <option value="">All Statuses</option>
                            {ALL_STATUSES.map(s => (
                                <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                            ))}
                        </select>
                    )}
                    {filterType === 'course' && (
                        <select
                            className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium focus:border-[#dbb212] focus:ring-1 focus:ring-[#dbb212] outline-none shadow-sm transition-all text-gray-900"
                            value={filters.course}
                            onChange={(e) => handleChange('course', e.target.value)}
                        >
                            <option value="">All Courses</option>
                            {Array.isArray(courses) && courses.map(c => <option key={c.id} value={c.course}>{c.course}</option>)}
                        </select>
                    )}
                    {filterType === 'campaign' && (
                        <select
                            className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium focus:border-[#dbb212] focus:ring-1 focus:ring-[#dbb212] outline-none shadow-sm transition-all text-gray-900"
                            value={filters.campaign}
                            onChange={(e) => handleChange('campaign', e.target.value)}
                        >
                            <option value="">All Campaigns</option>
                            {Array.isArray(campaigns) && campaigns.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                        </select>
                    )}
                    {filterType === 'score' && (
                        <select
                            className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium focus:border-[#dbb212] focus:ring-1 focus:ring-[#dbb212] outline-none shadow-sm transition-all text-gray-900"
                            value={filters.score}
                            onChange={(e) => handleChange('score', e.target.value)}
                        >
                            <option value="">All Scores</option>
                            {ALL_SCORES.map(s => (
                                <option key={s} value={s}>{s}</option>
                            ))}
                        </select>
                    )}
                    {filterType === 'dateRange' && (
                        <div className="flex flex-col sm:flex-row gap-3 w-full animate-in fade-in duration-300">
                            <div className="flex-1">
                                <label className="text-xs font-bold text-gray-500 mb-1 block">Start Date</label>
                                <input
                                    type="datetime-local"
                                    className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium focus:border-[#dbb212] focus:ring-1 focus:ring-[#dbb212] outline-none shadow-sm transition-all text-gray-900"
                                    value={filters.startDate || ''}
                                    onChange={(e) => handleChange('startDate', e.target.value)}
                                />
                            </div>
                            <div className="flex-1">
                                <label className="text-xs font-bold text-gray-500 mb-1 block">End Date</label>
                                <input
                                    type="datetime-local"
                                    className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium focus:border-[#dbb212] focus:ring-1 focus:ring-[#dbb212] outline-none shadow-sm transition-all text-gray-900"
                                    value={filters.endDate || ''}
                                    onChange={(e) => handleChange('endDate', e.target.value)}
                                />
                            </div>
                        </div>
                    )}
                </div>

                <div className="relative w-full sm:w-48">
                    <select
                        className="w-full appearance-none bg-[#4d0101] text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-md hover:bg-[#600202] active:scale-[0.98] transition-all cursor-pointer outline-none focus:ring-2 focus:ring-[#dbb212] text-left"
                        value={filterType}
                        onChange={(e) => {
                            setFilterType(e.target.value as any);
                            const resetFilters = { email: '', status: '', course: '', campaign: '', score: '', startDate: '', endDate: '' };
                            setFilters(resetFilters);
                            onFilterChange(resetFilters);
                        }}
                    >
                        <option value="" disabled className="bg-white text-gray-500">Select Filter Type</option>
                        <option value="email" className="bg-white text-gray-800">Filter Email</option>
                        <option value="status" className="bg-white text-gray-800">Filter Status</option>
                        <option value="course" className="bg-white text-gray-800">Filter Course</option>
                        <option value="campaign" className="bg-white text-gray-800">Filter Source</option>
                        <option value="score" className="bg-white text-gray-800">Filter Score</option>
                        <option value="dateRange" className="bg-white text-gray-800">Filter Date Range</option>
                    </select>
                </div>
            </div>
        </div>
    );
}

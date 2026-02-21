'use client';

import { useState, useEffect, useCallback } from 'react';
import { CourseService } from '@/services/courseService';
import { CampaignService } from '@/services/campaignService';
import { CourseDTO, CampaignDTO, LeadStatus, LeadScore } from '@/types/api';

interface LeadFilters {
    name: string;
    status: string;
    course: string;
    campaign: string;
    score: string;
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
    
    const [filters, setFilters] = useState<LeadFilters>({
        name: '',
        status: '',
        course: '',
        campaign: '',
        score: ''
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
        <div className="bg-white p-4 rounded-xl border border-gray-100 mb-6 grid grid-cols-1 md:grid-cols-5 gap-3">
            <input 
                placeholder="Search by Name" 
                className="p-2 border rounded-lg text-sm focus:border-[#dbb212] outline-none"
                value={filters.name}
                onChange={(e) => handleChange('name', e.target.value)}
            />
            
            <select 
                className="p-2 border rounded-lg text-sm bg-white focus:border-[#dbb212] outline-none"
                value={filters.status}
                onChange={(e) => handleChange('status', e.target.value)}
            >
                <option value="">All Statuses</option>
                {ALL_STATUSES.map(s => (
                    <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                ))}
            </select>

            <select 
                className="p-2 border rounded-lg text-sm bg-white focus:border-[#dbb212] outline-none"
                value={filters.course}
                onChange={(e) => handleChange('course', e.target.value)}
            >
                <option value="">All Courses</option>
                {Array.isArray(courses) && courses.map(c => <option key={c.id} value={c.course}>{c.course}</option>)}
            </select>

            <select 
                className="p-2 border rounded-lg text-sm bg-white focus:border-[#dbb212] outline-none"
                value={filters.campaign}
                onChange={(e) => handleChange('campaign', e.target.value)}
            >
                <option value="">All Campaigns</option>
                {Array.isArray(campaigns) && campaigns.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>

            <select 
                className="p-2 border rounded-lg text-sm bg-white focus:border-[#dbb212] outline-none"
                value={filters.score}
                onChange={(e) => handleChange('score', e.target.value)}
            >
                <option value="">All Scores</option>
                {ALL_SCORES.map(s => (
                    <option key={s} value={s}>{s}</option>
                ))}
            </select>
        </div>
    );
}

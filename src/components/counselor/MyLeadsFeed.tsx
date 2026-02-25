'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { CounselorService } from '@/services/counselorService';
import { CourseService } from '@/services/courseService';
import { LeadResponseDTO, LeadStatus, LeadScore, CourseDTO } from '@/types/api';
import {
    Search, RotateCcw, Mail, Globe, BookOpen, ChevronDown, GraduationCap, Phone
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import LeadNotes from '../LeadNotes';

const SCORE_COLORS: Record<string, string> = {
    'HOT': 'bg-rose-100 text-rose-700',
    'WARM': 'bg-orange-100 text-orange-700',
    'COLD': 'bg-blue-100 text-blue-700',
};

const STATUS_COLORS: Record<string, string> = {
    'NEW': 'bg-amber-100 text-amber-700 border-amber-200',
    'TELECALLER_ASSIGNED': 'bg-cyan-100 text-cyan-700 border-cyan-200',
    'QUALIFIED': 'bg-emerald-100 text-emerald-700 border-emerald-200',
    'COUNSELOR_ASSIGNED': 'bg-indigo-100 text-indigo-700 border-indigo-200',
    'EXTERNAL_ASSIGNED': 'bg-violet-100 text-violet-700 border-violet-200',
    'ADMISSION_IN_PROCESS': 'bg-amber-100 text-amber-700 border-amber-200',
    'ADMISSION_DONE': 'bg-green-100 text-green-800 border-green-200',
    'LOST': 'bg-slate-100 text-slate-700 border-slate-200',
    'UNASSIGNED': 'bg-gray-100 text-gray-600 border-gray-200',
    'CONTACTED': 'bg-blue-100 text-blue-700 border-blue-200',
    'TIMED_OUT': 'bg-rose-100 text-rose-700 border-rose-200',
    'REASSIGNED': 'bg-pink-100 text-pink-700 border-pink-200',
};

const ALL_STATUSES: LeadStatus[] = [
    'NEW', 'QUALIFIED', 'COUNSELOR_ASSIGNED', 'ADMISSION_IN_PROCESS', 'ADMISSION_DONE', 'LOST', 'CONTACTED'
];

const ALL_SCORES: LeadScore[] = ['HOT', 'WARM', 'COLD'];

type SearchType = 'ALL' | 'ID' | 'EMAIL' | 'SOURCE' | 'COURSE' | 'SCORE' | 'DATE';

interface MyLeadsFeedProps {
    counselorId: number;
    counselorType?: string;
    onLeadsUpdate?: (leads: LeadResponseDTO[]) => void;
    onActionComplete?: () => void;
}

export default function MyLeadsFeed({ counselorId, counselorType, onLeadsUpdate, onActionComplete }: MyLeadsFeedProps) {
    const [leads, setLeads] = useState<LeadResponseDTO[]>([]);
    const [courses, setCourses] = useState<CourseDTO[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [expandedLeadId, setExpandedLeadId] = useState<number | null>(null);

    // Search state
    const [searching, setSearching] = useState(false);
    const [searchType, setSearchType] = useState<SearchType>('ALL');
    const [searchValue, setSearchValue] = useState('');

    const loadLeads = useCallback(async () => {
        setLoading(true);
        try {
            const response = await CounselorService.getAssignedLeads(page, 10);
            const content = response.content || [];
            setLeads(content);
            setTotalPages(response.totalPages || 0);
            setSearching(false);
            if (onLeadsUpdate) onLeadsUpdate(content);
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to load leads');
        } finally {
            setLoading(false);
        }
    }, [page]);

    const loadCourses = useCallback(async () => {
        try {
            const data = await CourseService.getAllCourses();
            setCourses(data);
        } catch (err) {
            console.error('Failed to load courses', err);
        }
    }, []);

    const handleSearch = async () => {
        if (searchType === 'ALL' || !searchValue.trim()) {
            setPage(0);
            loadLeads();
            return;
        }

        setLoading(true);
        setSearching(true);
        try {
            let results: LeadResponseDTO[] = [];
            const val = searchValue.trim();

            switch (searchType) {
                case 'ID':
                    const lead = await CounselorService.searchLeadById(parseInt(val));
                    results = lead ? [lead] : [];
                    break;
                case 'EMAIL':
                    const leadByEmail = await CounselorService.searchLeadByEmail(val);
                    results = leadByEmail ? [leadByEmail] : [];
                    break;
                case 'SOURCE':
                    results = await CounselorService.searchLeadsBySource(val);
                    break;
                case 'COURSE':
                    results = await CounselorService.searchLeadsByCourse(val);
                    break;
                case 'SCORE':
                    results = await CounselorService.searchLeadsByScore(val as LeadScore);
                    break;
                case 'DATE':
                    results = await CounselorService.searchLeadsByDate(val);
                    break;
            }
            setLeads(results);
            setTotalPages(1);
            if (onLeadsUpdate) onLeadsUpdate(results);
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Search failed');
            setLeads([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (counselorId && !searching) loadLeads();
    }, [counselorId, loadLeads, searching]);

    useEffect(() => {
        loadCourses();
    }, [loadCourses]);

    const toggleExpand = (leadId: number) => {
        setExpandedLeadId(expandedLeadId === leadId ? null : leadId);
    };

    const handleScoreChange = async (leadId: number, newScore: LeadScore) => {
        try {
            await CounselorService.updateLeadScore(leadId, newScore);
            setLeads(prev => prev.map(l => (l.id === leadId) ? { ...l, score: newScore } : l));
            toast.success('Score updated');
            if (onActionComplete) onActionComplete();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to update score');
        }
    };

    const handleStatusChange = async (leadId: number, newStatus: string) => {
        try {
            await CounselorService.updateLeadStatus(leadId, newStatus);
            setLeads(prev => prev.map(l => (l.id === leadId) ? { ...l, status: newStatus as LeadStatus } : l));
            toast.success('Status updated');
            if (onActionComplete) onActionComplete();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to update status');
        }
    };

    const handleCourseChange = async (leadId: number, courseName: string) => {
        try {
            await CounselorService.updateLeadCourse(leadId, courseName);
            setLeads(prev => prev.map(l => (l.id === leadId) ? { ...l, course: { id: 0, course: courseName } } : l));
            toast.success('Course updated');
            if (onActionComplete) onActionComplete();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to update course');
        }
    };

    const getCourseName = (course: any) => {
        if (!course) return 'N/A';
        return typeof course === 'object' ? course.course : course;
    };

    return (
        <div className="space-y-4">
            {/* Search and Filters Header */}
            <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 p-6">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 flex gap-2">
                        <div className="relative flex-1">
                            {searchType === 'DATE' ? (
                                <input
                                    type="date"
                                    value={searchValue}
                                    onChange={(e) => setSearchValue(e.target.value)}
                                    className="w-full pl-4 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-medium"
                                />
                            ) : searchType === 'SCORE' ? (
                                <select
                                    value={searchValue}
                                    onChange={(e) => setSearchValue(e.target.value)}
                                    className="w-full pl-4 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold uppercase tracking-widest"
                                >
                                    <option value="">Select Score</option>
                                    {ALL_SCORES.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            ) : (
                                <>
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input
                                        type="text"
                                        placeholder={
                                            searchType === 'ID' ? "Enter Lead ID..." :
                                                searchType === 'EMAIL' ? "Enter Email..." :
                                                    searchType === 'SOURCE' ? "Enter Source..." :
                                                        searchType === 'COURSE' ? "Enter Course Name..." :
                                                            "Search assigned leads..."
                                        }
                                        value={searchValue}
                                        onChange={(e) => setSearchValue(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                        className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-medium placeholder:text-slate-400"
                                    />
                                </>
                            )}
                        </div>
                        <select
                            value={searchType}
                            onChange={(e) => {
                                setSearchType(e.target.value as SearchType);
                                setSearchValue('');
                            }}
                            className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-600 focus:ring-4 focus:ring-indigo-500/10 outline-none cursor-pointer"
                        >
                            <option value="ALL">All Leads</option>
                            <option value="ID">By ID</option>
                            <option value="EMAIL">By Email</option>
                            <option value="SOURCE">By Source</option>
                            <option value="COURSE">By Course</option>
                            <option value="SCORE">By Score</option>
                            <option value="DATE">By Date</option>
                        </select>
                        <button
                            onClick={handleSearch}
                            disabled={loading || (searchType !== 'ALL' && !searchValue)}
                            className="px-6 py-3 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-[#600202] transition-all shadow-lg shadow-rose-900/20 disabled:opacity-50 active:scale-95"
                        >
                            Search
                        </button>
                        {(searching || searchValue) && (
                            <button
                                onClick={() => {
                                    setSearchValue('');
                                    setSearchType('ALL');
                                    setSearching(false);
                                    setPage(0);
                                    loadLeads();
                                }}
                                className="p-3 text-slate-400 hover:text-slate-600 transition-colors"
                                title="Reset Search"
                            >
                                <RotateCcw className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Leads Table */}
            <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
                <div className="px-8 py-5 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
                    <div>
                        <h3 className="text-base font-black text-slate-900 uppercase tracking-tight">Assigned Portfolio</h3>
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mt-0.5">
                            {searching ? 'Filter Active' : `Page ${page + 1} of ${totalPages}`}
                        </p>
                    </div>
                    <button
                        onClick={loadLeads}
                        className="p-2.5 rounded-xl hover:bg-white hover:shadow-sm transition-all text-slate-400 hover:text-indigo-600 border border-transparent hover:border-slate-100"
                    >
                        <RotateCcw className="w-4 h-4" />
                    </button>
                </div>

                {loading ? (
                    <div className="p-24 text-center">
                        <div className="inline-block w-10 h-10 border-4 border-slate-100 border-t-indigo-600 rounded-full animate-spin" />
                        <p className="text-[10px] font-black text-slate-400 mt-6 uppercase tracking-[0.3em] animate-pulse">Syncing Database...</p>
                    </div>
                ) : leads.length === 0 ? (
                    <div className="p-24 text-center">
                        <div className="w-20 h-20 bg-slate-50 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 border border-slate-100">
                            <BookOpen className="w-10 h-10 text-slate-200" />
                        </div>
                        <p className="text-slate-400 font-black text-lg uppercase tracking-tight">No Leads Found</p>
                        <p className="text-xs text-slate-400 mt-2 font-medium">Your portfolio is currently empty or filtered.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-50">
                        {leads.map(lead => (
                            <div key={lead.id || lead.leadId} className="group transition-all hover:bg-slate-50/30">
                                <div
                                    className={`px-8 py-5 flex items-center gap-6 cursor-pointer relative ${expandedLeadId === (lead.id || lead.leadId) ? 'bg-indigo-50/30' : ''}`}
                                    onClick={() => toggleExpand((lead.id || lead.leadId) as number)}
                                >
                                    <div className={`absolute left-0 top-0 bottom-0 w-1.5 transition-all duration-300 ${expandedLeadId === (lead.id || lead.leadId) ? 'bg-[#dbb212]' : 'bg-transparent group-hover:bg-slate-200'}`} />

                                    <div className="w-12 h-12 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center justify-center text-slate-900 font-black text-lg shrink-0 group-hover:scale-105 transition-transform">
                                        {lead.name.charAt(0).toUpperCase()}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-3">
                                            <p className="font-black text-slate-900 truncate uppercase tracking-tight">{lead.name}</p>
                                            <span className="text-[10px] font-black text-slate-300 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-100">#{lead.id || lead.leadId}</span>
                                        </div>
                                        <div className="flex items-center gap-4 mt-1.5">
                                            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-bold">
                                                <Mail className="w-3.5 h-3.5 text-slate-300" />
                                                <span className="truncate max-w-[180px]">{lead.email}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-bold">
                                                <Globe className="w-3.5 h-3.5 text-slate-300" />
                                                <span className="uppercase tracking-wider">{lead.campaign?.name || 'Direct'}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col items-end gap-2 shrink-0">
                                        <div className="flex gap-2">
                                            <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black tracking-widest uppercase border-0 ${SCORE_COLORS[lead.score] || 'bg-slate-100 text-slate-500'}`}>
                                                {lead.score}
                                            </span>
                                            <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black tracking-widest uppercase border ${STATUS_COLORS[lead.status] || 'bg-white text-slate-400 border-slate-100'}`}>
                                                {lead.status?.replace(/_/g, ' ') || 'UNKNOWN'}
                                            </span>
                                        </div>
                                        <ChevronDown className={`w-5 h-5 text-slate-300 transition-transform duration-300 ${expandedLeadId === (lead.id || lead.leadId) ? 'rotate-180 text-indigo-500' : ''}`} />
                                    </div>
                                </div>

                                {expandedLeadId === (lead.id || lead.leadId) && (
                                    <div className="px-8 py-8 bg-white border-t border-slate-50 animate-in slide-in-from-top-4 duration-300">
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                                            <div className="space-y-8">
                                                {/* Interactive Controls */}
                                                <div className="space-y-6">
                                                    {/* Score and Status */}
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                                        <div className="p-4 bg-slate-50/50 rounded-[1.5rem] border border-slate-100">
                                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Update Priority</label>
                                                            <div className="flex gap-2">
                                                                {ALL_SCORES.map(s => (
                                                                    <button
                                                                        key={s}
                                                                        onClick={() => handleScoreChange((lead.id || lead.leadId) as number, s)}
                                                                        className={`flex-1 py-2 rounded-xl text-[10px] font-black transition-all ${lead.score === s ? SCORE_COLORS[s] + ' shadow-md scale-105' : 'bg-white text-slate-400 border border-slate-100 hover:bg-slate-50'}`}
                                                                    >
                                                                        {s}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>
                                                        <div className="p-4 bg-slate-50/50 rounded-[1.5rem] border border-slate-100">
                                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Workflow Status</label>
                                                            <select
                                                                value={lead.status}
                                                                onChange={(e) => handleStatusChange((lead.id || lead.leadId) as number, e.target.value)}
                                                                className="w-full text-xs font-black uppercase tracking-widest bg-white border border-slate-100 rounded-xl px-3 py-2.5 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all cursor-pointer text-slate-700"
                                                            >
                                                                {ALL_STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                                                            </select>
                                                        </div>
                                                    </div>

                                                    {/* Course Update */}
                                                    <div className="p-5 bg-slate-50/50 rounded-[1.5rem] border border-slate-100">
                                                        <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
                                                            <GraduationCap className="w-4 h-4 text-indigo-500" /> Target Program Update
                                                        </label>
                                                        <select
                                                            value={getCourseName(lead.course)}
                                                            onChange={(e) => handleCourseChange((lead.id || lead.leadId) as number, e.target.value)}
                                                            className="w-full text-xs font-bold bg-white border border-slate-100 rounded-xl p-3 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all cursor-pointer text-slate-900 shadow-sm"
                                                        >
                                                            <option value="">Enrollment Subject...</option>
                                                            {courses.map(c => <option key={c.id} value={c.course}>{c.course}</option>)}
                                                        </select>
                                                    </div>

                                                    {/* Contact Info */}
                                                    <div className="bg-slate-900 p-5 rounded-[1.5rem] border border-slate-800 flex items-center justify-between shadow-xl shadow-slate-900/20">
                                                        <div>
                                                            <label className="block text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">Direct Contact</label>
                                                            <p className="text-lg font-black text-white tracking-tight">{lead.phone}</p>
                                                        </div>
                                                        <a href={`tel:${lead.phone}`} className="w-12 h-12 bg-[#dbb212] text-[#600202] rounded-2xl flex items-center justify-center hover:scale-110 transition-transform animate-pulse cursor-pointer">
                                                            <Phone className="w-6 h-6" />
                                                        </a>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="border-l border-slate-100 pl-0 lg:pl-10">
                                                <LeadNotes leadId={(lead.id || lead.leadId) as number} />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {!searching && totalPages > 1 && (
                <div className="flex items-center justify-center gap-3 py-6">
                    <button
                        onClick={() => setPage(p => Math.max(0, p - 1))}
                        disabled={page === 0}
                        className="px-6 py-2.5 rounded-2xl bg-white border border-slate-200 text-xs font-black uppercase tracking-widest text-slate-600 shadow-sm hover:bg-slate-50 disabled:opacity-40 transition-all"
                    >
                        Prev
                    </button>
                    <div className="w-10 h-10 flex items-center justify-center bg-slate-900 text-white rounded-2xl text-xs font-black shadow-lg shadow-slate-900/20">
                        {page + 1}
                    </div>
                    <button
                        onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                        disabled={page >= totalPages - 1}
                        className="px-6 py-2.5 rounded-2xl bg-white border border-slate-200 text-xs font-black uppercase tracking-widest text-slate-600 shadow-sm hover:bg-slate-50 disabled:opacity-40 transition-all"
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    );
}

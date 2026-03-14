'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { CounselorService } from '@/services/counselorService';
import { CourseService } from '@/services/courseService';
import { LeadResponseDTO, LeadStatus, LeadScore, CourseDTO } from '@/types/api';
import {
    Search, RotateCcw, Mail, Globe, BookOpen, ChevronDown, GraduationCap, Phone, MapPin
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import LeadNotes from '../LeadNotes';
import LoadingButton from '@/components/ui/LoadingButton';

const SCORE_COLORS: Record<string, string> = {
    'HOT': 'bg-rose-100 text-rose-700',
    'WARM': 'bg-orange-100 text-orange-700',
    'COLD': 'bg-blue-100 text-blue-700',
};

const STATUS_COLORS: Record<string, string> = {
    'TELECALLER_ASSIGNED': 'bg-cyan-100 text-cyan-700 border-cyan-200',
    'COUNSELOR_ASSIGNED': 'bg-indigo-100 text-indigo-700 border-indigo-200',
    'LOST': 'bg-slate-100 text-slate-700 border-slate-200',
    'UNASSIGNED': 'bg-gray-100 text-gray-600 border-gray-200',
    'CONTACTED': 'bg-blue-100 text-blue-700 border-blue-200',
    'INTERESTED': 'bg-rose-100 text-rose-700 border-rose-200',
    'NEW': 'bg-emerald-100 text-emerald-700 border-emerald-200',
    'EXTERNAL_ASSIGNED': 'bg-orange-100 text-orange-700 border-orange-200',
    'ADMISSION_IN_PROCESS': 'bg-amber-100 text-amber-700 border-amber-200',
    'ADMISSION_DONE': 'bg-green-100 text-green-700 border-green-200',
    'TIMED_OUT': 'bg-red-100 text-red-700 border-red-200',
    'REASSIGNED': 'bg-purple-100 text-purple-700 border-purple-200',
    'IN_A_SESSION': 'bg-violet-100 text-violet-700 border-violet-200',
    'QUEUED': 'bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200',
};

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

type SearchType = 'ALL' | 'ID' | 'EMAIL' | 'COURSE' | 'SCORE' | 'DATE';

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
    const [selectedLead, setSelectedLead] = useState<LeadResponseDTO | null>(null);
    const [updateProcessing, setUpdateProcessing] = useState(false);
    const isSubmitting = React.useRef(false);

    // Search state
    const [searching, setSearching] = useState(false);
    const [searchType, setSearchType] = useState<SearchType>('ALL');
    const [searchValue, setSearchValue] = useState('');

    // Normalize any backend response shape into a flat LeadResponseDTO[]
    const normalizeResults = useCallback((raw: any): LeadResponseDTO[] => {
        if (!raw) return [];
        // Already a plain array
        if (Array.isArray(raw)) return raw;
        // Full wrapper not yet unwrapped: { success, data: { lead: [...] }, ... }
        if (raw.data && Array.isArray(raw.data.lead)) return raw.data.lead;
        // Full wrapper not yet unwrapped: { success, data: { content: [...] }, ... }
        if (raw.data && Array.isArray(raw.data.content)) return raw.data.content;
        // Full wrapper not yet unwrapped: { success, data: [...], ... }
        if (Array.isArray(raw.data)) return raw.data;
        // Interceptor already unwrapped — inner object: { lead: [...], count: N }
        if (Array.isArray(raw.lead)) return raw.lead;
        // Interceptor already unwrapped — inner object: { content: [...] }
        if (Array.isArray(raw.content)) return raw.content;
        // Other common keys
        if (Array.isArray(raw.leads)) return raw.leads;
        if (Array.isArray(raw.results)) return raw.results;
        // Single lead object (ID / EMAIL search)
        if (typeof raw === 'object' && (raw.id != null || raw.leadId != null)) return [raw];
        return [];
    }, []);

    const loadLeads = useCallback(async () => {
        setLoading(true);
        try {
            console.log('[loadLeads] Fetching page:', page, 'for counselorId:', counselorId);
            const raw = await CounselorService.getAssignedLeads(page, 10);
            console.log('[loadLeads] Raw response:', raw);
            const results = normalizeResults(raw);
            console.log('[loadLeads] Normalized results:', results);
            setLeads(results);
            
            // Extract pagination info if available
            if (raw && typeof raw === 'object') {
                const tp = raw.totalPages || (results.length > 0 ? 1 : 0);
                setTotalPages(tp);
            }
        } catch (error) {
            console.error('Failed to fetch leads', error);
            toast.error('Could not load your leads');
            setLeads([]);
        } finally {
            setLoading(false);
        }
    }, [page, counselorId, normalizeResults]);

    const loadCourses = useCallback(async () => {
        try {
            const raw: any = await CourseService.getAllCourses();
            // Normalize results similarly to leads
            let data: CourseDTO[] = [];
            if (Array.isArray(raw)) data = raw;
            else if (raw?.data && Array.isArray(raw.data)) data = raw.data;
            else if (raw?.content && Array.isArray(raw.content)) data = raw.content;
            else if (raw?.data?.content && Array.isArray(raw.data.content)) data = raw.data.content;
            
            setCourses(data);
        } catch (err) {
            console.error('Failed to load courses', err);
        }
    }, []);

    const handleSearch = async () => {
        console.log('[handleSearch] START — type:', searchType, '| value:', searchValue);

        if (searchType === 'ALL' || !searchValue.trim()) {
            setPage(0);
            setSearching(false);
            loadLeads();
            return;
        }

        setLoading(true);
        setSearching(true);
        try {
            let raw: any;
            const val = searchValue.trim();

            console.log('[handleSearch] calling service for:', searchType, val);

            switch (searchType) {
                case 'ID':
                    raw = await CounselorService.searchLeadById(parseInt(val));
                    break;
                case 'EMAIL':
                    raw = await CounselorService.searchLeadByEmail(val);
                    break;
                case 'COURSE':
                    raw = await CounselorService.searchLeadsByCourse(val);
                    break;
                case 'SCORE':
                    raw = await CounselorService.searchLeadsByScore(val as LeadScore);
                    break;
                case 'DATE':
                    raw = await CounselorService.searchLeadsByDate(val);
                    break;
            }

            console.log('[handleSearch] service returned raw:', raw);

            const results = normalizeResults(raw);

            console.log('[handleSearch] normalizeResults =>', results);

            setLeads(results);
            setTotalPages(1);
            if (onLeadsUpdate) onLeadsUpdate(results);
        } catch (err: any) {
            console.error('[handleSearch] ❌ CATCH ERROR:', err);
            toast.error(err.response?.data?.message || 'Search failed');
            setLeads([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!searching) loadLeads();
    }, [loadLeads, searching]); 

    useEffect(() => {
        loadCourses();
    }, [loadCourses]);

    const openDetails = (lead: LeadResponseDTO) => {
        setSelectedLead(lead);
    };

    const handleScoreChange = async (leadId: number, newScore: LeadScore) => {
        if (isSubmitting.current) return;
        isSubmitting.current = true;
        setUpdateProcessing(true);
        try {
            await CounselorService.updateLeadScore(leadId, newScore);
            setLeads(prev => prev.map(l => (l.id === leadId) ? { ...l, score: newScore } : l));
            if (selectedLead?.id === leadId) {
                setSelectedLead(prev => prev ? { ...prev, score: newScore } : null);
            }
            toast.success('Score updated');
            if (onActionComplete) onActionComplete();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to update score');
        } finally {
            setUpdateProcessing(false);
            isSubmitting.current = false;
        }
    };

    const handleStatusChange = async (leadId: number, newStatus: string) => {
        if (isSubmitting.current) return;
        isSubmitting.current = true;
        setUpdateProcessing(true);
        try {
            await CounselorService.updateLeadStatus(leadId, newStatus);
            setLeads(prev => prev.map(l => (l.id === leadId) ? { ...l, status: newStatus as LeadStatus } : l));
            if (selectedLead?.id === leadId) {
                setSelectedLead(prev => prev ? { ...prev, status: newStatus as LeadStatus } : null);
            }
            toast.success('Status updated');
            if (onActionComplete) onActionComplete();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to update status');
        } finally {
            setUpdateProcessing(false);
            isSubmitting.current = false;
        }
    };

    const handleCourseChange = async (leadId: number, courseName: string) => {
        if (isSubmitting.current) return;
        isSubmitting.current = true;
        setUpdateProcessing(true);
        try {
            await CounselorService.updateLeadCourse(leadId, courseName);
            setLeads(prev => prev.map(l => (l.id === leadId) ? { ...l, course: { id: 0, course: courseName } } : l));
            if (selectedLead?.id === leadId) {
                setSelectedLead(prev => prev ? { ...prev, course: { id: 0, course: courseName } } : null);
            }
            toast.success('Course updated');
            if (onActionComplete) onActionComplete();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to update course');
        } finally {
            setUpdateProcessing(false);
            isSubmitting.current = false;
        }
    };

    const getCourseName = (course: any) => {
        if (!course) return null;
        return typeof course === 'object' ? course.course : course;
    };

    return (
        <div className="space-y-4">
            {/* Search and Filters Header */}
            <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 p-4 md:p-6">
                <div className="flex flex-col lg:flex-row gap-4">
                    <div className="flex flex-col sm:flex-row flex-1 gap-3">
                        <div className="relative flex-1 min-w-0">
                            {searchType === 'DATE' ? (
                                <input
                                    type="date"
                                    value={searchValue}
                                    onChange={(e) => setSearchValue(e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-medium"
                                />
                            ) : searchType === 'SCORE' ? (
                                <select
                                    value={searchValue}
                                    onChange={(e) => setSearchValue(e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold uppercase tracking-widest cursor-pointer"
                                >
                                    <option value="">Select Score</option>
                                    {ALL_SCORES.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            ) : (
                                <div className="relative">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input
                                        type="text"
                                        placeholder={
                                            searchType === 'ID' ? "ID..." :
                                                searchType === 'EMAIL' ? "Email..." :
                                                    searchType === 'COURSE' ? "Course..." :
                                                        "Search leads..."
                                        }
                                        value={searchValue}
                                        onChange={(e) => setSearchValue(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                        className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-medium placeholder:text-slate-400"
                                    />
                                </div>
                            )}
                        </div>
                        <div className="flex gap-2">
                            <select
                                value={searchType}
                                onChange={(e) => {
                                    setSearchType(e.target.value as SearchType);
                                    setSearchValue('');
                                }}
                                className="flex-1 sm:flex-initial px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-600 focus:ring-4 focus:ring-indigo-500/10 outline-none cursor-pointer"
                            >
                                <option value="ALL">All Type</option>
                                <option value="ID">ID</option>
                                <option value="EMAIL">Email</option>
                                <option value="COURSE">Course</option>
                                <option value="SCORE">Score</option>
                                <option value="DATE">Date</option>
                            </select>
                            <LoadingButton
                                loading={loading}
                                loadingText="..."
                                onClick={handleSearch}
                                disabled={searchType !== 'ALL' && !searchValue}
                                className="px-5 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-[#600202] transition-all shadow-lg shadow-rose-900/20 disabled:opacity-50 active:scale-95"
                            >
                                Search
                            </LoadingButton>
                            {(searching || searchValue) && (
                                <button
                                    onClick={() => {
                                        setSearchValue('');
                                        setSearchType('ALL');
                                        setSearching(false);
                                        setPage(0);
                                        loadLeads();
                                    }}
                                    className="p-3 text-slate-400 hover:text-slate-600 transition-colors bg-slate-50 border border-slate-200 rounded-2xl"
                                    title="Reset Search"
                                >
                                    <RotateCcw className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Leads Table */}
            <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
                <div className="px-5 py-4 md:px-8 md:py-6 border-b border-slate-100/50 flex items-center justify-between bg-gradient-to-r from-slate-50/50 to-white/30 backdrop-blur-sm">
                    <div>
                        <h3 className="text-base md:text-lg font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                            Lead Portfolio
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        </h3>
                        <p className="text-[8px] md:text-[9px] text-slate-400 font-black uppercase tracking-[0.2em] mt-1 flex items-center gap-2">
                            {searching ? (
                                <span className="text-indigo-500 flex items-center gap-1">
                                    <Search className="w-3 h-3" /> search active
                                </span>
                            ) : (
                                <>
                                    <span className="text-slate-500">{leads.length}</span> results
                                </>
                            )}
                        </p>
                    </div>
                    <LoadingButton
                        loading={loading}
                        onClick={loadLeads}
                        className="p-2.5 rounded-xl hover:bg-white hover:shadow-xl hover:shadow-indigo-500/10 transition-all text-slate-400 hover:text-indigo-600 border border-slate-100/50 group"
                        title="Sync leads"
                    >
                        <RotateCcw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-700" />
                    </LoadingButton>
                </div>

                {loading ? (
                    <div className="p-16 md:p-24 text-center">
                        <div className="inline-block w-10 h-10 border-4 border-slate-100 border-t-indigo-600 rounded-full animate-spin" />
                        <p className="text-[10px] font-black text-slate-400 mt-6 uppercase tracking-[0.3em] animate-pulse">Syncing Portfolio...</p>
                    </div>
                ) : leads.length === 0 ? (
                    <div className="p-16 md:p-24 text-center">
                        <div className="w-16 h-16 bg-slate-50 rounded-2xl md:w-20 md:h-20 md:rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 border border-slate-100">
                            <BookOpen className="w-8 h-8 md:w-10 md:h-10 text-slate-200" />
                        </div>
                        <p className="text-slate-400 font-black text-base md:text-lg uppercase tracking-tight">No Leads Found</p>
                        <p className="text-[10px] md:text-xs text-slate-400 mt-2 font-medium">Your portfolio is currently empty.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-50">
                        {leads.map(lead => (
                            <div key={lead.id || lead.leadId} className="group transition-all hover:bg-indigo-50/10">
                                <div
                                    className="px-5 py-4 md:px-8 md:py-6 flex items-center gap-4 md:gap-6 cursor-pointer relative"
                                    onClick={() => openDetails(lead)}
                                >
                                    {/* Accent line on hover */}
                                    <div className="absolute left-0 top-0 bottom-0 w-1 transition-all duration-300 bg-transparent group-hover:bg-[#dbb212] group-hover:shadow-[0_0_15px_rgba(219,178,18,0.5)]" />

                                    {/* Modernized Avatar */}
                                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center justify-center text-slate-900 font-black text-sm md:text-base shrink-0 group-hover:scale-110 group-hover:-rotate-3 transition-all duration-300">
                                        <div className="w-full h-full rounded-xl md:rounded-2xl bg-gradient-to-br from-slate-50 to-white flex items-center justify-center border border-white">
                                            {lead.name.charAt(0).toUpperCase()}
                                        </div>
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 md:gap-3 flex-wrap">
                                            <p className="text-sm font-black text-slate-900 truncate uppercase tracking-tight group-hover:text-indigo-600 transition-colors">{lead.name}</p>
                                            <span className="text-[7px] md:text-[8px] font-black text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded-lg border border-slate-100 uppercase tracking-widest whitespace-nowrap">ID: {lead.id || lead.leadId}</span>
                                        </div>
                                        <div className="flex items-center gap-3 mt-1">
                                            <div className="flex items-center gap-1.5 truncate">
                                                <Mail className="w-3 h-3 text-slate-300 shrink-0" />
                                                <span className="text-[10px] md:text-[11px] text-slate-500 font-bold lowercase tracking-tight truncate">{lead.email}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 md:gap-8 shrink-0">
                                        {/* Status Badge */}
                                        <div className="flex flex-col items-end gap-1.5">
                                            <span className={`px-2 md:px-2.5 py-1 md:py-1.5 rounded-lg md:rounded-xl text-[8px] md:text-[9px] font-black tracking-widest uppercase border transition-all duration-300 group-hover:shadow-lg ${STATUS_COLORS[lead.status] || 'bg-white text-slate-400 border-slate-100'}`}>
                                                <span className="hidden sm:inline">{lead.status?.replace(/_/g, ' ') || 'UNKNOWN'}</span>
                                                <span className="sm:hidden">{lead.status?.substring(0, 4)}..</span>
                                            </span>
                                        </div>
                                        <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg md:rounded-xl flex items-center justify-center text-slate-300 group-hover:text-slate-900 group-hover:bg-white group-hover:shadow-sm transition-all duration-300 transform group-hover:translate-x-1">
                                            <ChevronDown className="w-4 h-4 md:w-5 md:h-5 -rotate-90" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Premium Lead Details Popup */}
            {selectedLead && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-2 sm:p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md transition-opacity duration-300" onClick={() => setSelectedLead(null)} />
                    <div className="bg-white w-full max-w-5xl max-h-[95vh] rounded-[2rem] md:rounded-[3rem] shadow-[0_30px_100px_rgba(0,0,0,0.3)] relative z-10 overflow-hidden flex flex-col md:flex-row animate-in zoom-in-95 duration-500 border border-white/50">
                        
                        {/* Left Side: Information Canvas */}
                        <div className="flex-1 overflow-y-auto p-6 md:p-10 border-b md:border-b-0 md:border-r border-slate-100/50 bg-white">
                            <div className="flex flex-col sm:flex-row justify-between items-start gap-6 mb-8 md:mb-12">
                                <div className="space-y-3 flex-1 min-w-0">
                                    <div className="flex items-center gap-3">
                                        <div className="px-3 py-1 bg-slate-900 text-white text-[9px] font-black uppercase tracking-[0.2em] rounded-lg shadow-lg shadow-slate-900/20">Lead Card</div>
                                        <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">#{selectedLead.id}</span>
                                    </div>
                                    <h2 className="text-2xl md:text-4xl font-black text-slate-900 uppercase tracking-tighter leading-tight break-words">{selectedLead.name}</h2>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <div className="flex items-center gap-2 bg-indigo-50 px-3 py-1.5 rounded-xl border border-indigo-100/50">
                                            <GraduationCap className="w-3.5 h-3.5 text-indigo-500" />
                                            <span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest">Intake: {selectedLead.intake || 'N/A'}</span>
                                        </div>
                                        <div className={`px-3 py-1.5 rounded-xl text-[9px] font-black tracking-widest uppercase border shadow-sm ${STATUS_COLORS[selectedLead.status] || 'bg-slate-100'}`}>
                                            {selectedLead.status?.replace(/_/g, ' ')}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-start w-full sm:w-auto gap-4">
                                    <button 
                                        onClick={() => setSelectedLead(null)} 
                                        className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-xl md:rounded-2xl bg-slate-50 text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition-all duration-300 md:hover:rotate-90 group"
                                    >
                                        <RotateCcw className="w-5 h-5 group-hover:scale-110" />
                                    </button>
                                    <div className="text-right">
                                        <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1">Registered</p>
                                        <p className="text-[9px] md:text-[10px] font-extrabold text-slate-400 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100 inline-block font-mono">
                                            {selectedLead.createdAt && !isNaN(new Date(selectedLead.createdAt).getTime()) ? new Date(selectedLead.createdAt).toLocaleDateString() : 'N/A'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Info Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-5 mb-8 md:mb-10">
                                <div className="group p-4 md:p-5 bg-gradient-to-br from-slate-50/80 to-slate-100/30 rounded-[1.5rem] md:rounded-[2rem] border border-slate-100/50 transition-all">
                                    <div className="flex items-center gap-3 mb-2 md:mb-3">
                                        <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg md:rounded-xl bg-white shadow-sm border border-slate-100 flex items-center justify-center text-slate-400">
                                            <MapPin className="w-4 h-4" />
                                        </div>
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Residence</p>
                                    </div>
                                    <p className="text-xs md:text-sm font-extrabold text-slate-700 leading-relaxed pl-1">{selectedLead.address || 'Not provided'}</p>
                                </div>
                                <div className="group p-4 md:p-5 bg-gradient-to-br from-slate-50/80 to-slate-100/30 rounded-[1.5rem] md:rounded-[2rem] border border-slate-100/50 transition-all">
                                    <div className="flex items-center gap-3 mb-2 md:mb-3">
                                        <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg md:rounded-xl bg-white shadow-sm border border-slate-100 flex items-center justify-center text-slate-400">
                                            <Globe className="w-4 h-4" />
                                        </div>
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Source</p>
                                    </div>
                                    <p className="text-xs md:text-sm font-extrabold text-slate-700 truncate pl-1">{selectedLead.campaign?.name || 'Manual CRM'}</p>
                                </div>
                            </div>

                            <div className="space-y-6 md:space-y-8">
                                {/* Status & Program Interaction */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                                    {/* Status Column */}
                                    <div className="space-y-3">
                                        <label className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Status Workflow</label>
                                        <div className="group relative">
                                            <select
                                                disabled={updateProcessing}
                                                value={selectedLead.status}
                                                onChange={(e) => selectedLead && handleStatusChange(selectedLead.id, e.target.value)}
                                                className="w-full text-xs font-black bg-slate-50/50 border-2 border-slate-100 rounded-2xl md:rounded-[1.5rem] p-4 md:p-5 focus:ring-0 focus:border-indigo-500/30 hover:border-indigo-100 outline-none transition-all duration-300 cursor-pointer text-slate-900 shadow-sm disabled:opacity-50 appearance-none"
                                            >
                                                {ALL_STATUSES.map(status => (
                                                    <option key={status} value={status}>
                                                        {status.replace(/_/g, ' ')}
                                                    </option>
                                                ))}
                                            </select>
                                            <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-300">
                                                <ChevronDown className="w-4 h-4 md:w-5 md:h-5" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Program Column */}
                                    <div className="space-y-3">
                                        <label className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Academic Program</label>
                                        <div className="group relative">
                                            <select
                                                disabled={updateProcessing}
                                                value={getCourseName(selectedLead.course) || ""}
                                                onChange={(e) => selectedLead && handleCourseChange(selectedLead.id, e.target.value)}
                                                className="w-full text-xs font-black bg-slate-50/50 border-2 border-slate-100 rounded-2xl md:rounded-[1.5rem] p-4 md:p-5 focus:ring-0 focus:border-indigo-500/30 hover:border-indigo-100 outline-none transition-all duration-300 cursor-pointer text-slate-900 shadow-sm disabled:opacity-50 appearance-none"
                                            >
                                                <option value="" disabled>{getCourseName(selectedLead.course) || 'Assign Program...'}</option>
                                                {courses.map(c => <option key={c.id} value={c.course}>{c.course}</option>)}
                                            </select>
                                            <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-300">
                                                <GraduationCap className="w-4 h-4 md:w-5 md:h-5" />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Premium Score Selector */}
                                {getCourseName(selectedLead.course) !== null && (
                                    <div className="p-5 md:p-8 bg-slate-50/50 rounded-3xl md:rounded-[2.5rem] border border-slate-100 shadow-sm">
                                        <div className="flex items-center justify-between mb-4 md:mb-6">
                                            <label className="text-[10px] md:text-[11px] font-black text-slate-500 uppercase tracking-[0.2em]">Investment Score</label>
                                            <span className="text-[9px] md:text-[10px] font-extrabold text-slate-400 bg-white px-2 py-1 rounded-lg border border-slate-100 shadow-sm">Current: {selectedLead.score}</span>
                                        </div>
                                        <div className="flex gap-2 md:gap-4">
                                            {ALL_SCORES.map(s => {
                                                const isCurrent = selectedLead.score === s;
                                                const isDisabled = !isCurrent && (
                                                    (selectedLead.score === 'HOT') ||
                                                    (selectedLead.score === 'WARM' && s === 'COLD')
                                                );

                                                return (
                                                    <button
                                                        key={s}
                                                        disabled={updateProcessing || isDisabled || isCurrent}
                                                        onClick={() => selectedLead && handleScoreChange(selectedLead.id, s)}
                                                        className={`flex-1 group relative overflow-hidden transition-all duration-500 rounded-2xl md:rounded-3xl p-3 md:p-4 flex flex-col items-center gap-1.5 md:gap-2 border-2 ${isCurrent ? SCORE_COLORS[s] + ' border-current shadow-lg md:shadow-xl md:scale-105' : isDisabled ? 'bg-slate-50/50 text-slate-200 border-slate-100 cursor-not-allowed opacity-40' : 'bg-white text-slate-400 border-slate-100 hover:border-indigo-200 hover:text-indigo-600'}`}
                                                    >
                                                        <span className="text-[9px] md:text-xs font-black uppercase tracking-widest relative z-10">{s}</span>
                                                        <div className={`w-1 md:w-1.5 h-1 md:h-1.5 rounded-full ${isCurrent ? 'bg-current animate-pulse' : 'bg-slate-200'} relative z-10`} />
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* Call to Action Section */}
                                <div className="group relative overflow-hidden bg-slate-900 p-6 md:p-8 rounded-[2rem] md:rounded-[3rem] shadow-2xl transition-all active:scale-[0.98]">
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none" />
                                    <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6 text-white text-center md:text-left">
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-center md:justify-start gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em]">Direct Contact</p>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-2xl md:text-4xl font-black tracking-tighter group-hover:text-emerald-400 transition-colors uppercase break-all">{selectedLead.phone}</p>
                                                <p className="text-[10px] md:text-xs font-extrabold opacity-60 truncate lowercase max-w-[250px] mx-auto md:mx-0">{selectedLead.email}</p>
                                            </div>
                                        </div>
                                        <a 
                                            href={`tel:${selectedLead.phone}`} 
                                            className="w-20 h-20 md:w-24 md:h-24 bg-gradient-to-br from-[#dbb212] to-[#b89512] text-[#600202] rounded-3xl md:rounded-[2.5rem] flex items-center justify-center hover:scale-110 transition-all duration-500 shadow-xl group border-4 border-white/10"
                                        >
                                            <Phone className="w-8 h-8 md:w-10 md:h-10 group-hover:rotate-12 transition-transform duration-300" fill="currentColor" />
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Side: Activity & Notes */}
                        <div className="w-full md:w-[350px] lg:w-[400px] bg-slate-50/80 backdrop-blur-xl h-[400px] md:h-auto overflow-y-auto p-6 md:p-10 flex flex-col">
                            <div className="mb-6 md:mb-10">
                                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-2">Lead Logs</h3>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Context & Intelligence</p>
                            </div>
                            <div className="flex-1">
                                <LeadNotes leadId={selectedLead.id} />
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

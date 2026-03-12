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


};

const ALL_STATUSES: LeadStatus[] = [
    'COUNSELOR_ASSIGNED', 'LOST', 'CONTACTED', 'INTERESTED'
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

    // Normalize any backend response shape into a flat LeadResponseDTO[]
    const normalizeResults = (raw: any): LeadResponseDTO[] => {
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
    };

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
        if (counselorId && !searching) loadLeads();
    }, [counselorId, loadLeads]); // intentionally NOT watching `searching` — just initial load

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
                            <option value="COURSE">By Course</option>
                            <option value="SCORE">By Score</option>
                            <option value="DATE">By Date</option>
                        </select>
                        <LoadingButton
                            loading={loading}
                            loadingText="Searching..."
                            onClick={handleSearch}
                            disabled={searchType !== 'ALL' && !searchValue}
                            className="px-6 py-3 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-[#600202] transition-all shadow-lg shadow-rose-900/20 disabled:opacity-50 active:scale-95"
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
                            {searching ? 'Filter Active' : `Total Leads: ${leads.length}`}
                        </p>
                    </div>
                    <LoadingButton
                        loading={loading}
                        onClick={loadLeads}
                        className="p-2.5 rounded-xl hover:bg-white hover:shadow-sm transition-all text-slate-400 hover:text-indigo-600 border border-transparent hover:border-slate-100"
                        title="Refresh leads"
                    >
                        <RotateCcw className="w-4 h-4" />
                    </LoadingButton>
                </div>

                {loading ? (
                    <div className="p-24 text-center">
                        <div className="inline-block w-10 h-10 border-4 border-slate-100 border-t-indigo-600 rounded-full animate-spin" />
                        <p className="text-[10px] font-black text-slate-400 mt-6 uppercase tracking-[0.3em] animate-pulse">Syncing Portfolio...</p>
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
                                    className="px-8 py-5 flex items-center gap-6 cursor-pointer relative"
                                    onClick={() => openDetails(lead)}
                                >
                                    <div className="absolute left-0 top-0 bottom-0 w-1.5 transition-all duration-300 bg-transparent group-hover:bg-[#dbb212]" />

                                    <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 shadow-sm flex items-center justify-center text-slate-900 font-black text-sm shrink-0 group-hover:scale-105 transition-transform">
                                        {lead.name.charAt(0).toUpperCase()}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-3">
                                            <p className="font-bold text-slate-900 truncate uppercase tracking-tight">{lead.name}</p>
                                            <span className="text-[9px] font-black text-slate-300 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-100">ID: {lead.id || lead.leadId}</span>
                                        </div>
                                        <div className="flex items-center gap-3 mt-1">
                                            <span className="text-[10px] text-slate-500 font-bold">{lead.email}</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-6 shrink-0">
                                        {/* Dynamic Category Labels based on status */}
                                        <div className="hidden md:flex flex-col items-end">
                                            <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest mb-1">Portfolio Segment</span>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase">
                                                {lead.status === 'TELECALLER_ASSIGNED' ? 'General' :
                                                    lead.status === 'CONTACTED' ? 'Warm Segment' :
                                                        lead.status === 'INTERESTED' ? 'Hot Segment' : 'Active'}
                                            </span>
                                        </div>
                                        <span className={`px-2 py-1 rounded-md text-[9px] font-black tracking-widest uppercase border ${STATUS_COLORS[lead.status] || 'bg-white text-slate-400 border-slate-100'}`}>
                                            {lead.status?.replace(/_/g, ' ') || 'UNKNOWN'}
                                        </span>
                                        <ChevronDown className="w-4 h-4 text-slate-300 -rotate-90" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Lead Details Popup */}
            {selectedLead && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={() => setSelectedLead(null)} />
                    <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-[2.5rem] shadow-2xl relative z-10 overflow-hidden flex flex-col md:flex-row animate-in zoom-in-95 duration-200">
                        {/* Left Side: Info & Actions */}
                        <div className="flex-1 overflow-y-auto p-8 border-r border-slate-100">
                            <div className="flex justify-between items-start mb-8">
                                <div>
                                    <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">{selectedLead.name}</h2>
                                    <div className="flex items-center gap-3 mt-1">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-1 rounded border border-slate-100">Lead ID: {selectedLead.id}</span>
                                        <span className={`px-2 py-1 rounded-md text-[9px] font-black tracking-widest uppercase ${STATUS_COLORS[selectedLead.status]}`}>
                                            {selectedLead.status?.replace(/_/g, ' ')}
                                        </span>
                                    </div>
                                </div>
                                <button onClick={() => setSelectedLead(null)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">✕</button>
                            </div>

                            <div className="space-y-6">
                                {/* Status Update: Mark as Contacted */}
                                {selectedLead.status !== 'CONTACTED' && selectedLead.status !== 'INTERESTED' && (
                                    <div className="p-6 bg-blue-50/50 rounded-[2rem] border border-blue-100/50">
                                        <label className="block text-[10px] font-black text-blue-400 uppercase tracking-widest mb-4">Initial Action Required</label>
                                        <button
                                            disabled={updateProcessing}
                                            onClick={() => selectedLead && handleStatusChange(selectedLead.id, 'CONTACTED')}
                                            className={`w-full py-4 rounded-2xl text-[11px] font-black tracking-widest transition-all shadow-lg active:scale-95 ${updateProcessing ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-blue-200'}`}
                                        >
                                            {updateProcessing ? 'PROCESSING...' : 'MARK AS CONTACTED'}
                                        </button>
                                    </div>
                                )}

                                {/* Conditional: Target Program Update - Always show if course is null (and contacted/interested) */}
                                {(selectedLead.status === 'CONTACTED' || selectedLead.status === 'INTERESTED') && getCourseName(selectedLead.course) === null && (
                                    <div className="p-6 bg-indigo-50/50 rounded-[2rem] border border-indigo-100/50">
                                        <label className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">
                                            <GraduationCap className="w-4 h-4 text-indigo-500" /> Target Program Update
                                        </label>
                                        <select
                                            disabled={updateProcessing}
                                            value=""
                                            onChange={(e) => selectedLead && handleCourseChange(selectedLead.id, e.target.value)}
                                            className="w-full text-xs font-bold bg-white border border-slate-200 rounded-2xl p-4 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all cursor-pointer text-slate-900 shadow-sm disabled:opacity-50"
                                        >
                                            <option value="">Enrollment Subject...</option>
                                            {courses.map(c => <option key={c.id} value={c.course}>{c.course}</option>)}
                                        </select>
                                    </div>
                                )}

                                {/* Conditional: Priority Update - only show after Program is updated/exists */}
                                {getCourseName(selectedLead.course) !== null && (
                                    <div className="p-6 bg-slate-50/50 rounded-[2rem] border border-slate-100">
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Update Priority</label>
                                        <div className="flex gap-2">
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
                                                        className={`flex-1 py-3 rounded-2xl text-[10px] font-black transition-all ${isCurrent ? SCORE_COLORS[s] + ' shadow-md scale-105' : isDisabled ? 'bg-slate-50 text-slate-200 border border-slate-100 cursor-not-allowed opacity-50' : 'bg-white text-slate-400 border border-slate-100 hover:bg-slate-50'}`}
                                                    >
                                                        {updateProcessing && !isCurrent && !isDisabled ? '...' : s}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* Contact Area */}
                                <div className="bg-slate-900 p-6 rounded-[2rem] flex items-center justify-between text-white shadow-xl shadow-slate-900/20">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Phone Contact</p>
                                        <p className="text-xl font-black tracking-tight">{selectedLead.phone}</p>
                                        <p className="text-[11px] text-slate-400 font-medium">{selectedLead.email}</p>
                                    </div>
                                    <a href={`tel:${selectedLead.phone}`} className="w-14 h-14 bg-[#dbb212] text-[#600202] rounded-2xl flex items-center justify-center hover:scale-105 transition-transform animate-pulse shadow-lg shadow-[#dbb212]/20">
                                        <Phone className="w-6 h-6" fill="currentColor" />
                                    </a>
                                </div>
                            </div>
                        </div>

                        {/* Right Side: Notes */}
                        <div className="w-full md:w-[350px] bg-slate-50 overflow-y-auto p-8">
                            <LeadNotes leadId={selectedLead.id} />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

<<<<<<< HEAD
import React, { useState, useEffect, useCallback } from 'react';
import { CounselorService } from '@/services/counselorService';
import { CourseService } from '@/services/courseService';
import { LeadResponseDTO, LeadStatus, LeadScore, CourseDTO } from '@/types/api';
import {
    Search, RotateCcw, Mail, Globe, BookOpen, ChevronDown, CheckCircle2, GraduationCap
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
=======
'use client';

import { useState, useEffect, useCallback } from 'react';
import { LeadService } from '@/services/leadService';
import { NoteService } from '@/services/noteService';
import { LeadResponseDTO, NoteDTO, LeadStatus, LeadScore } from '@/types/api';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
// Simplified - Icons removed

interface Props {
    counselorId: number;
    counselorType?: string;
    onLeadsUpdate?: (leads: LeadResponseDTO[]) => void;
    onActionComplete?: () => void;
}

const STATUS_COLORS: Record<string, string> = {
    NEW: 'bg-blue-100 text-blue-700',
    TELECALLER_ASSIGNED: 'bg-indigo-50 text-indigo-600 border border-indigo-100',
    QUALIFIED: 'bg-emerald-100 text-emerald-700 font-bold',
    COUNSELOR_ASSIGNED: 'bg-purple-100 text-purple-700',
    CONTACTED: 'bg-sky-50 text-sky-600 border border-sky-100',
    ADMISSION_IN_PROCESS: 'bg-amber-100 text-amber-700',
    ADMISSION_DONE: 'bg-green-100 text-green-800',
    LOST: 'bg-red-50 text-red-600',
    UNASSIGNED: 'bg-gray-100 text-gray-600',
};

const SCORE_COLORS: Record<string, string> = {
    HOT: 'bg-red-500 text-white shadow-sm ring-2 ring-red-100',
    WARM: 'bg-amber-400 text-white shadow-sm ring-2 ring-amber-100',
    COLD: 'bg-slate-400 text-white shadow-sm ring-2 ring-slate-100',
>>>>>>> f1fecf6a1b6dbef865b14d16ca3ad2d1260887be
};

const ALL_STATUSES: LeadStatus[] = [
    'NEW', 'QUALIFIED', 'COUNSELOR_ASSIGNED', 'ADMISSION_IN_PROCESS', 'ADMISSION_DONE', 'LOST', 'CONTACTED'
];

<<<<<<< HEAD
const ALL_SCORES: LeadScore[] = ['HOT', 'WARM', 'COLD'];

type SearchType = 'ALL' | 'ID' | 'EMAIL' | 'SOURCE' | 'COURSE' | 'SCORE' | 'DATE';

interface MyLeadsFeedProps {
    counselorId: number;
}

export default function MyLeadsFeed({ counselorId }: MyLeadsFeedProps) {
=======
export default function MyLeadsFeed({ counselorId, counselorType, onLeadsUpdate, onActionComplete }: Props) {
>>>>>>> f1fecf6a1b6dbef865b14d16ca3ad2d1260887be
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

    // Filter states
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('');
    const [scoreFilter, setScoreFilter] = useState<string>('');
    // Feed Mode states
    const [feedMode, setFeedMode] = useState<'MY_LEADS' | 'UNASSIGNED'>('MY_LEADS');
    const [isSearching, setIsSearching] = useState(false);

    const loadLeads = useCallback(async () => {
        setLoading(true);
        try {
<<<<<<< HEAD
            const response = await CounselorService.getAssignedLeads(page, 10);
            setLeads(response.content || []);
            setTotalPages(response.totalPages || 0);
            setSearching(false);
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
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Search failed');
=======
            let data;
            if (searchQuery || statusFilter || scoreFilter) {
                setIsSearching(true);
                data = await LeadService.searchLeads({
                    name: searchQuery,
                    status: statusFilter,
                    score: scoreFilter
                });
                const content = Array.isArray(data) ? data : (data as any)?.content || [];
                setLeads(content);
                setTotalPages(1);
                if (onLeadsUpdate) onLeadsUpdate(content);
            } else if (feedMode === 'UNASSIGNED') {
                setIsSearching(false);
                const response = await LeadService.getUnassignedRecentLeads(page, 10);
                const content = response?.content || [];
                setLeads(content);
                setTotalPages(response?.totalPages || 1);
                if (onLeadsUpdate) onLeadsUpdate(content);
            } else {
                setIsSearching(false);
                const response = await LeadService.getCounselorRecentLeads(counselorId, page, 10);
                const content = response?.content || [];
                setLeads(content);
                setTotalPages(response?.totalPages || 1);
                if (onLeadsUpdate) onLeadsUpdate(content);
            }
        } catch (err) {
            console.error(err);
            toast.error('Failed to load leads');
>>>>>>> f1fecf6a1b6dbef865b14d16ca3ad2d1260887be
            setLeads([]);
        } finally {
            setLoading(false);
        }
<<<<<<< HEAD
    };
=======
    }, [counselorId, page, searchQuery, statusFilter, scoreFilter, onLeadsUpdate, feedMode]);
>>>>>>> f1fecf6a1b6dbef865b14d16ca3ad2d1260887be

    useEffect(() => {
        if (counselorId && !searching) loadLeads();
    }, [counselorId, loadLeads, searching]);

<<<<<<< HEAD
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
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to update score');
        }
    };

    const handleStatusChange = async (leadId: number, newStatus: string) => {
        try {
            await CounselorService.updateLeadStatus(leadId, newStatus);
            setLeads(prev => prev.map(l => (l.id === leadId) ? { ...l, status: newStatus as LeadStatus } : l));
            toast.success('Status updated');
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to update status');
        }
    };

    const handleCourseChange = async (leadId: number, courseName: string) => {
        try {
            await CounselorService.updateLeadCourse(leadId, courseName);
            setLeads(prev => prev.map(l => (l.id === leadId) ? { ...l, course: { id: 0, course: courseName } } : l));
            toast.success('Course updated');
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
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 flex gap-2">
                        <div className="relative flex-1">
                            {searchType === 'DATE' ? (
                                <input
                                    type="date"
                                    value={searchValue}
                                    onChange={(e) => setSearchValue(e.target.value)}
                                    className="w-full pl-4 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#dbb212] outline-none"
                                />
                            ) : searchType === 'SCORE' ? (
                                <select
                                    value={searchValue}
                                    onChange={(e) => setSearchValue(e.target.value)}
                                    className="w-full pl-4 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#dbb212] outline-none"
                                >
                                    <option value="">Select Score</option>
                                    {ALL_SCORES.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            ) : (
                                <>
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
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
                                        className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#dbb212] outline-none"
                                    />
                                </>
=======
    const handleClaimLead = async (lead: LeadResponseDTO) => {
        try {
            // Priority 1: Direct assignment API (Admin/Manager level)
            await LeadService.assignLeadToCounselor(lead.email, counselorId);
            toast.success('Lead claimed successfully!');
            loadLeads();
            onActionComplete?.();
        } catch (error: any) {
            // Priority 2: Fallback to Counselor-level status update if 403 Forbidden
            if (error.response?.status === 403) {
                console.warn('Direct assignment forbidden. Attempting status-based claim fallback...');
                try {
                    await LeadService.updateLeadStatus(lead.id, 'TELECALLER_ASSIGNED');
                    toast.success('Lead claimed via status update!');
                    loadLeads();
                    onActionComplete?.();
                    return;
                } catch (fallbackError) {
                    console.error('Claim fallback failed:', fallbackError);
                }
            }
            console.error('Claim failed:', error);
            toast.error('Failed to claim lead. Permission denied.');
        }
    };

    const toggleExpand = async (leadId: number) => {
        if (expandedLeadId === leadId) {
            setExpandedLeadId(null);
            return;
        }
        setExpandedLeadId(leadId);
        if (!notes[leadId]) {
            setNotesLoading(leadId);
            try {
                const data = await NoteService.getLeadNotes(leadId);
                setNotes(prev => ({ ...prev, [leadId]: data }));
            } catch {
                toast.error('Failed to load notes');
            } finally {
                setNotesLoading(null);
            }
        }
    };

    const handleQuickAction = async (leadId: number, status: LeadStatus) => {
        try {
            await LeadService.updateLeadStatus(leadId, status);
            setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status } : l));
            toast.success(`Marked as ${status.replace(/_/g, ' ')}`);
            onActionComplete?.();
        } catch {
            toast.error('Action failed');
        }
    };

    const handleCallAction = async (leadId: number) => {
        try {
            await LeadService.updateLeadStatus(leadId, 'CONTACTED');
            await NoteService.createNote(leadId, 'Call initiated via Telecaller Dashboard.');
            
            setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: 'CONTACTED' as LeadStatus } : l));
            
            // Refresh notes if this lead is expanded
            if (expandedLeadId === leadId) {
                const data = await NoteService.getLeadNotes(leadId);
                setNotes(prev => ({ ...prev, [leadId]: data }));
            }
            
            toast.success('Call interaction logged');
        } catch {
            toast.error('Failed to log call');
        }
    };

    const handleScoreAction = async (leadId: number, score: LeadScore) => {
        try {
            await LeadService.updateLeadScore(leadId, score);
            
            // Automated Routing Logic based on USER requirements:
            // HOT -> INTERNAL COUNSELOR
            // WARM -> EXTERNAL COUNSELOR
            let status: LeadStatus | undefined;
            if (score === 'HOT') status = 'COUNSELOR_ASSIGNED';
            else if (score === 'WARM') status = 'EXTERNAL_ASSIGNED';

            if (status) {
                await LeadService.updateLeadStatus(leadId, status);
                toast.success(`Priority set to ${score}. Routing to ${score === 'HOT' ? 'Internal' : 'External'} Counselor.`);
                // If it's routed away, we might want to remove it from the telecaller's active list
                setLeads(prev => prev.filter(l => l.id !== leadId));
                onActionComplete?.();
            } else {
                setLeads(prev => prev.map(l => l.id === leadId ? { ...l, score } : l));
                toast.success(`Priority set to ${score}`);
            }
        } catch {
            toast.error('Failed to update priority');
        }
    };

    const handleAddNote = async (leadId: number) => {
        if (!noteInput.trim()) return;
        try {
            const newNote = await NoteService.createNote(leadId, noteInput.trim());
            setNotes(prev => ({
                ...prev,
                [leadId]: [...(prev[leadId] || []), newNote]
            }));
            setNoteInput('');
            toast.success('Note added');
        } catch {
            toast.error('Failed to add note');
        }
    };

    return (
        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
            {/* Header with Search & Filters */}
            <div className="px-8 py-6 border-b border-slate-50 bg-slate-50/30">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
                    <div>
                        <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                            {feedMode === 'MY_LEADS' ? 'Assignments' : 'Unassigned Pool'} 
                            <span className="bg-slate-900 text-white text-[10px] px-2.5 py-0.5 rounded-full uppercase tracking-tighter font-bold">{leads.length} Active</span>
                        </h3>
                        <p className="text-xs text-slate-500 font-medium mt-0.5">
                            {feedMode === 'MY_LEADS' ? 'Focus on high-priority follow-ups today' : 'Claim leads to add them to your assignments'}
                        </p>
                    </div>

                    <div className="flex bg-slate-100 p-1 rounded-2xl gap-1">
                        <button 
                            onClick={() => { setFeedMode('MY_LEADS'); setPage(0); }}
                            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${feedMode === 'MY_LEADS' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
                        >
                            My Leads
                        </button>
                        <button 
                            onClick={() => { setFeedMode('UNASSIGNED'); setPage(0); }}
                            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${feedMode === 'UNASSIGNED' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
                        >
                            Unassigned
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="relative group flex-1">
                        <input 
                            type="text"
                            placeholder="Search by name or email..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-4 focus:ring-slate-50 transition-all font-medium placeholder:text-slate-400"
                        />
                    </div>
                    <div className="flex gap-2">
                        <select 
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="flex-1 px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 outline-none cursor-pointer appearance-none"
                        >
                            <option value="">All Statuses</option>
                            {ALL_STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                        </select>
                        <select 
                            value={scoreFilter}
                            onChange={(e) => setScoreFilter(e.target.value)}
                            className="flex-1 px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 outline-none cursor-pointer appearance-none"
                        >
                            <option value="">All Priority</option>
                            <option value="HOT">HOT</option>
                            <option value="WARM">WARM</option>
                            <option value="COLD">COLD</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Leads List */}
            {loading ? (
                <div className="p-20 text-center">
                    <p className="text-sm text-slate-500 font-bold animate-pulse">Synchronizing assignments...</p>
                </div>
            ) : leads.length === 0 ? (
                <div className="p-20 text-center bg-slate-50/20">
                    <p className="text-slate-900 font-black text-lg uppercase tracking-tight">No Leads Found</p>
                    <p className="text-sm text-slate-500 mt-1">Try adjusting your filters or checking back later.</p>
                </div>
            ) : (
                <div className="divide-y divide-slate-100">
                    {leads.map(lead => (
                        <div key={lead.id} className={`group transition-all duration-300 ${expandedLeadId === lead.id ? 'bg-slate-50/50' : 'hover:bg-slate-50/20'}`}>
                            {/* Standard Row */}
                            <div className="px-8 py-5 flex items-center gap-5 cursor-pointer" onClick={() => toggleExpand(lead.id)}>
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-lg relative overflow-hidden ${
                                    lead.score === 'HOT' ? 'bg-rose-600' : 
                                    lead.score === 'WARM' ? 'bg-amber-500' : 
                                    'bg-slate-400'
                                }`}>
                                    {lead.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <h4 className="font-black text-slate-900 truncate leading-tight uppercase tracking-tight">{lead.name}</h4>
                                        <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest border ${STATUS_COLORS[lead.status] || 'bg-slate-100'}`}>
                                            {lead.status.replace(/_/g, ' ')}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <p className="text-[11px] text-slate-500 font-bold truncate">
                                            {lead.phone}
                                        </p>
                                        <p className="text-[11px] text-slate-400 font-medium truncate hidden md:block">{lead.email}</p>
                                    </div>
                                </div>

                                {/* Quick Actions */}
                                <div className="flex items-center gap-2">
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); handleCallAction(lead.id); }}
                                        className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-900 hover:text-white transition-all text-[10px] font-black uppercase tracking-widest"
                                    >
                                        Call
                                    </button>
                                    
                                    {/* Action context based on counselor type */}
                                    {counselorType === 'INTERNAL' && lead.status === 'QUALIFIED' && (
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); handleQuickAction(lead.id, 'ADMISSION_IN_PROCESS'); }}
                                            className="px-3 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 transition-all text-[10px] font-black uppercase tracking-widest shadow-sm"
                                        >
                                            Start Admission
                                        </button>
                                    )}

                                    {counselorType === 'EXTERNAL' && (
                                        <div className="px-3 py-2 rounded-xl bg-purple-50 text-purple-600 border border-purple-100 text-[10px] font-black uppercase tracking-widest">
                                            Partner Handled
                                        </div>
                                    )}

                                    {(lead.status === 'UNASSIGNED' || lead.status === 'NEW') ? (
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); handleClaimLead(lead); }}
                                            className="px-3 py-2 rounded-xl bg-slate-900 text-white hover:bg-[#600202] transition-all text-[10px] font-black uppercase tracking-widest shadow-sm"
                                        >
                                            Claim
                                        </button>
                                    ) : (
                                        lead.status !== 'QUALIFIED' && (
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); handleQuickAction(lead.id, 'QUALIFIED'); }}
                                                className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-900 hover:text-white transition-all text-[10px] font-black uppercase tracking-widest"
                                            >
                                                Qualify
                                            </button>
                                        )
                                    )}
                                </div>
                            </div>

                            {/* Detail Panel */}
                            {expandedLeadId === lead.id && (
                                <div className="px-8 pb-8 pt-2">
                                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 p-6 bg-white rounded-2xl border border-slate-200 mb-6">
                                        <div className="space-y-1">
                                            <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest block">Interested Course</span>
                                            <p className="text-xs font-black text-slate-900 uppercase">{typeof lead.course === 'object' ? lead.course?.course : lead.course || '—'}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest block">Lead Source</span>
                                            <p className="text-xs font-black text-slate-900 uppercase">Direct Application</p>
                                        </div>
                                        
                                        {lead.status !== 'UNASSIGNED' && lead.status !== 'NEW' && (
                                            <div className="space-y-1 col-span-2">
                                                <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest block mb-1.5">Set Priority & Route</span>
                                                <div className="flex gap-2">
                                                    {(['HOT', 'WARM', 'COLD'] as LeadScore[]).map((score) => (
                                                        <button
                                                            key={score}
                                                            onClick={() => handleScoreAction(lead.id, score)}
                                                            className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all border ${
                                                                lead.score === score 
                                                                    ? 'bg-slate-900 text-white border-slate-900' 
                                                                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
                                                            }`}
                                                        >
                                                            {score}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Action Hub */}
                                    <div className="space-y-4">
                                        <h5 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">
                                            Interaction Log
                                        </h5>
                                        
                                        <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                                            {notesLoading === lead.id ? (
                                                <div className="p-4 bg-slate-50 rounded-xl animate-pulse">
                                                    <div className="h-4 bg-slate-200 rounded w-3/4 mb-2" />
                                                </div>
                                            ) : (notes[lead.id] || []).length === 0 ? (
                                                <div className="p-8 text-center border border-slate-200 rounded-2xl">
                                                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">No Interaction Logs</p>
                                                </div>
                                            ) : (
                                                (notes[lead.id] || []).map(note => (
                                                    <div key={note.noteId} className="p-4 bg-white border border-slate-100 rounded-xl relative group/note">
                                                        <p className="text-xs text-slate-700 font-bold leading-relaxed mb-2 uppercase tracking-tight">{note.note}</p>
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-[9px] text-slate-400 font-black uppercase tracking-[0.1em]">{format(new Date(note.createdAt), 'MMM d, h:mm a')}</span>
                                                            <button 
                                                                onClick={() => {
                                                                    NoteService.deleteNote(note.noteId).then(() => {
                                                                        setNotes(p => ({ ...p, [lead.id]: p[lead.id].filter(n => n.noteId !== note.noteId) }));
                                                                        toast.success("Log removed");
                                                                    });
                                                                }}
                                                                className="text-rose-500 font-black text-[9px] uppercase tracking-widest opacity-0 group-hover/note:opacity-100 transition-opacity"
                                                            >
                                                                Delete
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>

                                        <div className="flex gap-2">
                                            <div className="relative flex-1">
                                                <input 
                                                    type="text"
                                                    value={noteInput}
                                                    onChange={(e) => setNoteInput(e.target.value)}
                                                    onKeyDown={(e) => e.key === 'Enter' && handleAddNote(lead.id)}
                                                    placeholder="Enter interaction outcome or notes..."
                                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:bg-white focus:border-slate-400 transition-all font-bold placeholder:uppercase placeholder:tracking-widest"
                                                />
                                            </div>
                                            <button 
                                                onClick={() => handleAddNote(lead.id)}
                                                disabled={!noteInput.trim()}
                                                className="px-6 py-3 bg-slate-900 text-white text-[10px] font-black rounded-xl hover:bg-[#600202] transition-all disabled:opacity-30 uppercase tracking-widest"
                                            >
                                                Save
                                            </button>
                                        </div>
                                    </div>
                                </div>
>>>>>>> f1fecf6a1b6dbef865b14d16ca3ad2d1260887be
                            )}
                        </div>
                        <select
                            value={searchType}
                            onChange={(e) => {
                                setSearchType(e.target.value as SearchType);
                                setSearchValue('');
                            }}
                            className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#dbb212] outline-none"
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
                            className="px-4 py-2 bg-[#4d0101] text-white rounded-xl text-sm font-bold hover:bg-[#600202] transition shadow-md shadow-rose-900/10 disabled:opacity-50"
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
                                className="p-2 text-gray-400 hover:text-gray-600 transition"
                                title="Reset Search"
                            >
                                <RotateCcw className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                </div>
            </div>

<<<<<<< HEAD
            {/* Leads Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between bg-slate-50/50">
                    <div>
                        <h3 className="text-base font-black text-gray-900 uppercase tracking-tight text-sm">My Assigned Leads</h3>
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                            {searching ? 'Search Results' : `Page ${page + 1} of ${totalPages}`}
                        </p>
                    </div>
                    <button
                        onClick={loadLeads}
                        className="p-2 rounded-lg hover:bg-white hover:shadow-sm transition text-gray-400 hover:text-indigo-600 border border-transparent hover:border-gray-100"
                    >
                        <RotateCcw className="w-4 h-4" />
                    </button>
                </div>

                {loading ? (
                    <div className="p-20 text-center">
                        <div className="inline-block w-8 h-8 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
                        <p className="text-xs font-bold text-gray-400 mt-4 uppercase tracking-widest">Synchronizing Leads...</p>
                    </div>
                ) : leads.length === 0 ? (
                    <div className="p-20 text-center">
                        <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <BookOpen className="w-8 h-8 text-gray-200" />
                        </div>
                        <p className="text-gray-500 font-bold">No leads found</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-50">
                        {leads.map(lead => (
                            <div key={lead.id || lead.leadId} className="group transition-all">
                                <div
                                    className={`px-6 py-4 flex items-center gap-4 cursor-pointer hover:bg-slate-50 relative ${expandedLeadId === (lead.id || lead.leadId) ? 'bg-indigo-50/20' : ''}`}
                                    onClick={() => toggleExpand((lead.id || lead.leadId) as number)}
                                >
                                    <div className={`absolute left-0 top-0 bottom-0 w-1 transition-colors ${expandedLeadId === (lead.id || lead.leadId) ? 'bg-[#dbb212]' : 'bg-transparent group-hover:bg-indigo-200'}`} />

                                    <div className="w-10 h-10 rounded-xl bg-white border border-gray-100 shadow-sm flex items-center justify-center text-indigo-600 font-black text-sm shrink-0">
                                        {lead.name.charAt(0).toUpperCase()}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <p className="font-bold text-gray-900 truncate text-sm">{lead.name}</p>
                                            <span className="text-[10px] font-bold text-gray-300">#{lead.id || lead.leadId}</span>
                                        </div>
                                        <div className="flex items-center gap-3 mt-0.5">
                                            <div className="flex items-center gap-1 text-[11px] text-gray-500 font-medium">
                                                <Mail className="w-3 h-3 text-gray-300" />
                                                <span className="truncate max-w-[150px]">{lead.email}</span>
                                            </div>
                                            <div className="flex items-center gap-1 text-[11px] text-gray-500 font-medium">
                                                <Globe className="w-3 h-3 text-gray-300" />
                                                <span>{lead.campaign?.name || 'Direct'}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                                        <div className="flex gap-1.5">
                                            <span className={`px-2 py-0.5 rounded text-[9px] font-black tracking-widest uppercase ${SCORE_COLORS[lead.score] || 'bg-gray-100 text-gray-500'}`}>
                                                {lead.score}
                                            </span>
                                            <span className={`px-2 py-0.5 rounded text-[9px] font-black tracking-widest uppercase border ${STATUS_COLORS[lead.status] || 'bg-white text-gray-400 border-gray-100'}`}>
                                                {lead.status?.replace(/_/g, ' ') || 'UNKNOWN'}
                                            </span>
                                        </div>
                                        <ChevronDown className={`w-4 h-4 text-gray-300 transition-transform ${expandedLeadId === (lead.id || lead.leadId) ? 'rotate-180' : ''}`} />
                                    </div>
                                </div>

                                {expandedLeadId === (lead.id || lead.leadId) && (
                                    <div className="px-6 py-6 bg-white border-t border-indigo-50/50 animate-in slide-in-from-top-2 duration-200">
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                            <div className="space-y-6">
                                                {/* Interactive Controls */}
                                                <div className="space-y-4">
                                                    {/* Score and Status */}
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                                                            <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">Update Score</label>
                                                            <div className="flex gap-1">
                                                                {ALL_SCORES.map(s => (
                                                                    <button
                                                                        key={s}
                                                                        onClick={() => handleScoreChange((lead.id || lead.leadId) as number, s)}
                                                                        className={`flex-1 py-1.5 rounded-lg text-[10px] font-black transition-all ${lead.score === s ? SCORE_COLORS[s] + ' shadow-sm' : 'bg-white text-gray-400 hover:bg-gray-100'}`}
                                                                    >
                                                                        {s}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>
                                                        <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 text-slate-800">
                                                            <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">Update Status</label>
                                                            <select
                                                                value={lead.status}
                                                                onChange={(e) => handleStatusChange((lead.id || lead.leadId) as number, e.target.value)}
                                                                className="w-full text-xs font-bold bg-white border border-gray-100 rounded-lg p-1.5 focus:ring-2 focus:ring-[#dbb212] outline-none"
                                                            >
                                                                {ALL_STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                                                            </select>
                                                        </div>
                                                    </div>

                                                    {/* Course Update */}
                                                    <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                                                        <label className="flex items-center gap-2 text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">
                                                            <GraduationCap className="w-3 h-3" /> Update Interested Course
                                                        </label>
                                                        <select
                                                            value={getCourseName(lead.course)}
                                                            onChange={(e) => handleCourseChange((lead.id || lead.leadId) as number, e.target.value)}
                                                            className="w-full text-xs font-bold bg-white border border-gray-100 rounded-lg p-2 focus:ring-2 focus:ring-[#dbb212] outline-none text-slate-900"
                                                        >
                                                            <option value="">Select a Course</option>
                                                            {courses.map(c => <option key={c.id} value={c.course}>{c.course}</option>)}
                                                        </select>
                                                    </div>

                                                    {/* Contact Info */}
                                                    <div className="bg-blue-50/50 p-3 rounded-xl border border-blue-100 flex items-center justify-between">
                                                        <div>
                                                            <label className="block text-[9px] font-black text-blue-400 uppercase tracking-widest">Phone</label>
                                                            <p className="text-sm font-bold text-blue-700">{lead.phone}</p>
                                                        </div>
                                                        <a href={`tel:${lead.phone}`} className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                                                            <Globe className="w-4 h-4" />
                                                        </a>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="border-l border-gray-50 pl-0 lg:pl-8">
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
                <div className="flex items-center justify-center gap-2 py-4">
                    <button
                        onClick={() => setPage(p => Math.max(0, p - 1))}
                        disabled={page === 0}
                        className="px-4 py-2 rounded-xl bg-white border border-gray-100 text-sm font-bold text-gray-600 shadow-sm hover:bg-gray-50 disabled:opacity-50 transition"
                    >
                        Previous
                    </button>
                    <div className="px-4 py-2 bg-[#dbb212] text-white rounded-xl text-sm font-black shadow-lg shadow-yellow-500/20">
                        {page + 1}
                    </div>
                    <button
                        onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                        disabled={page >= totalPages - 1}
                        className="px-4 py-2 rounded-xl bg-white border border-gray-100 text-sm font-bold text-gray-600 shadow-sm hover:bg-gray-50 disabled:opacity-50 transition"
=======
            {/* Pagination */}
            {!isSearching && totalPages > 1 && (
                <div className="px-8 py-6 border-t border-slate-50 bg-slate-50/10 flex items-center justify-between">
                    <button 
                         onClick={() => setPage(p => Math.max(0, p - 1))}
                         disabled={page === 0}
                         className="px-4 py-2 text-[10px] font-black text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-900 hover:text-white disabled:opacity-30 transition-all uppercase tracking-widest"
                    >
                        Previous
                    </button>
                    <div className="flex items-center gap-2">
                        {Array.from({ length: totalPages }, (_, i) => (
                            <button 
                                key={i}
                                onClick={() => setPage(i)}
                                className={`w-8 h-8 rounded-lg text-[10px] font-black transition-all ${page === i ? 'bg-slate-900 text-white' : 'text-slate-400 hover:bg-slate-100'}`}
                            >
                                {i + 1}
                            </button>
                        ))}
                    </div>
                    <button 
                        onClick={() => setPage(p => p + 1)}
                        disabled={page >= totalPages - 1}
                        className="px-4 py-2 text-[10px] font-black text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-900 hover:text-white disabled:opacity-30 transition-all uppercase tracking-widest"
>>>>>>> f1fecf6a1b6dbef865b14d16ca3ad2d1260887be
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    );
}

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
};

const ALL_STATUSES: LeadStatus[] = [
    'NEW', 'QUALIFIED', 'COUNSELOR_ASSIGNED', 'ADMISSION_IN_PROCESS', 'ADMISSION_DONE', 'LOST', 'CONTACTED'
];

const ALL_SCORES: LeadScore[] = ['HOT', 'WARM', 'COLD'];

type SearchType = 'ALL' | 'ID' | 'EMAIL' | 'SOURCE' | 'COURSE' | 'SCORE' | 'DATE';

interface MyLeadsFeedProps {
    counselorId: number;
}

export default function MyLeadsFeed({ counselorId }: MyLeadsFeedProps) {
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
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    );
}

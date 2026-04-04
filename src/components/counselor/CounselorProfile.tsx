'use client';

import { useState, useEffect, useCallback } from 'react';
import { CounselorService } from '@/services/counselorService';
import { CounselorDTO, CounselorStatus } from '@/types/api';
import toast from 'react-hot-toast';

interface Props {
    email: string;
    onProfileLoaded?: (counselor: CounselorDTO) => void;
    onProfileError?: () => void;
    refetchTrigger?: number;
}

const STATUS_OPTIONS: { value: CounselorStatus; label: string; color: string }[] = [
    { value: 'AVAILABLE', label: 'Available', color: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
    { value: 'BUSY', label: 'Busy', color: 'bg-rose-50 text-rose-700 border-rose-100' },
    { value: 'ON_LEAVE', label: 'On Leave', color: 'bg-amber-50 text-amber-700 border-amber-100' },
    { value: 'UNAVAILABLE', label: 'Unavailable', color: 'bg-slate-100 text-slate-700 border-slate-200' },
    { value: 'SUSPENDED', label: 'Suspended', color: 'bg-gray-100 text-gray-400 border-gray-200' },
];

export default function CounselorProfile({ email, onProfileLoaded, onProfileError, refetchTrigger }: Props) {
    const [counselor, setCounselor] = useState<CounselorDTO | null>(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [editForm, setEditForm] = useState({ name: '', phone: '', departments: '' });

    const loadProfile = useCallback(async () => {
        if (!email) return;
        setLoading(true);
        try {
            const data = await CounselorService.getCounselorByEmail(email);
            setCounselor(data);
            setEditForm({ 
                name: data.name, 
                phone: Array.isArray(data.phone) ? data.phone.join(', ') : '', 
                departments: Array.isArray(data.departments) ? data.departments.join(', ') : '' 
            });
            onProfileLoaded?.(data);
        } catch (error) {
            console.error('Profile Load Error:', error);
            toast.error('Failed to load profile');
            onProfileError?.();
        } finally {
            setLoading(false);
        }
    }, [email, onProfileLoaded, onProfileError]);

    useEffect(() => {
        loadProfile();
    }, [loadProfile, refetchTrigger]);

    const handleStatusChange = async (status: CounselorStatus) => {
        if (!counselor) return;
        try {
            const updated = await CounselorService.updateStatus(email, status);
            setCounselor(updated);
            toast.success(`Status changed to ${status}`);
        } catch {
            toast.error('Failed to update status');
        }
    };

    const handleSaveProfile = async () => {
        try {
            const payload = {
                ...editForm,
                phone: editForm.phone.split(',').map(p => p.trim()).filter(p => p !== ''),
                departments: editForm.departments.split(',').map(d => d.trim()).filter(d => d !== '')
            };
            const updated = await CounselorService.updateProfile(email, payload);
            setCounselor(updated);
            setEditing(false);
            toast.success('Profile updated');
        } catch {
            toast.error('Failed to update profile');
        }
    };

    if (loading) {
        return (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 animate-pulse">
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-gray-200" />
                    <div className="space-y-2 flex-1">
                        <div className="h-5 bg-gray-200 rounded w-1/3" />
                        <div className="h-4 bg-gray-200 rounded w-1/2" />
                    </div>
                </div>
            </div>
        );
    }

    if (!counselor) return null;

    const currentStatusConfig = STATUS_OPTIONS.find(s => s.value === counselor.status);

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Header gradient */}
            <div className="bg-gradient-to-br from-[#4d0101] via-[#600202] to-[#800303] h-28 relative">
                <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
                <div className="absolute -bottom-10 left-8">
                    <div className="w-20 h-20 rounded-2xl bg-white shadow-2xl flex items-center justify-center text-3xl font-black text-[#600202] border-4 border-white transform transition-transform hover:rotate-3">
                        {(counselor.name || 'C').charAt(0).toUpperCase()}
                    </div>
                </div>
            </div>

            <div className="pt-10 md:pt-12 px-4 md:px-6 pb-6">
                {/* Name & Info */}
                <div className="flex flex-col sm:flex-row items-start justify-between gap-4 mb-6">
                    <div className="flex-1 min-w-0">
                        {editing ? (
                            <input
                                value={editForm.name}
                                onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                                className="text-xl font-bold text-gray-900 border-b-2 border-indigo-300 focus:border-[#dbb212] outline-none bg-transparent w-full"
                            />
                        ) : (
                            <h2 className="text-xl font-bold text-gray-900 truncate">{counselor.name}</h2>
                        )}
                        <p className="text-sm text-gray-500 mt-1 truncate">{counselor.email}</p>
                        <div className="flex flex-wrap items-center gap-2 mt-3">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${currentStatusConfig?.color || 'bg-gray-100'}`}>
                                {currentStatusConfig?.label || counselor.status}
                            </span>
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 uppercase tracking-wider">
                                {counselor.counselorTypes?.join(', ')}
                            </span>
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-orange-50 text-orange-700 border border-orange-200 uppercase tracking-wider">
                                {counselor.priority}
                            </span>
                        </div>
                    </div>
                    <button
                        onClick={() => editing ? handleSaveProfile() : setEditing(true)}
                        className="w-full sm:w-auto px-5 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl bg-slate-900 text-white border border-slate-900 hover:bg-[#600202] transition-all shadow-sm active:scale-95"
                    >
                        {editing ? 'Save Profile' : 'Edit Profile'}
                    </button>
                </div>

                {/* Details grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
                    <div className="bg-gray-50 rounded-xl p-3 text-center border border-gray-100/50">
                        <p className="text-2xl font-black text-indigo-600 leading-none">{counselor.totalLeads}</p>
                        <p className="text-[9px] font-bold text-gray-400 mt-1.5 uppercase tracking-widest">Total Leads</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-3 text-center border border-gray-100/50">
                        <p className="text-sm font-black text-gray-700 truncate leading-none">{Array.isArray(counselor.phone) ? counselor.phone.join(', ') : (counselor.phone || '—')}</p>
                        <p className="text-[9px] font-bold text-gray-400 mt-1.5 uppercase tracking-widest">Phone</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-3 text-center border border-gray-100/50">
                        <p className="text-sm font-black text-gray-700 truncate leading-none">{counselor.departments?.join(', ') || '—'}</p>
                        <p className="text-[9px] font-bold text-gray-400 mt-1.5 uppercase tracking-widest">Depts</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-3 text-center border border-gray-100/50">
                        <p className="text-sm font-black text-gray-700 leading-none">#{counselor.counselorId}</p>
                        <p className="text-[9px] font-bold text-gray-400 mt-1.5 uppercase tracking-widest">ID</p>
                    </div>
                </div>

                {/* Edit fields */}
                {editing && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4 p-4 bg-indigo-50/50 rounded-xl">
                        <div>
                            <label className="text-xs font-medium text-gray-600 mb-1 block">Phone</label>
                            <input
                                value={editForm.phone}
                                onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-[#dbb212] focus:ring-1 focus:ring-[#dbb212] outline-none"
                                placeholder="10-digit phone"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-gray-600 mb-1 block">Departments</label>
                            <input
                                value={editForm.departments}
                                onChange={(e) => setEditForm(prev => ({ ...prev, departments: e.target.value }))}
                                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-[#dbb212] focus:ring-1 focus:ring-[#dbb212] outline-none"
                                placeholder="Dept names (comma separated)"
                            />
                        </div>
                    </div>
                )}

                {/* Status quick-switch */}
                <div>
                    <p className="text-xs font-medium text-gray-500 mb-2">Quick Status Switch</p>
                    <div className="flex flex-wrap gap-2">
                        {STATUS_OPTIONS.filter(s => s.value !== 'SUSPENDED').map(opt => (
                            <button
                                key={opt.value}
                                onClick={() => handleStatusChange(opt.value)}
                                disabled={counselor.status === opt.value}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                                    counselor.status === opt.value
                                        ? opt.color + ' ring-2 ring-offset-1 ring-indigo-300'
                                        : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                                }`}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

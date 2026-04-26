'use client';

import React, { useState, useEffect } from 'react';
import { X, Bell, Calendar, FileText } from 'lucide-react';
import { ReminderService, ReminderResponseDTO, SetReminderRequestDTO, UpdateReminderRequestDTO } from '@/services/reminderService';
import LoadingButton from '@/components/ui/LoadingButton';
import { toast } from 'react-hot-toast';

interface ReminderModalProps {
    isOpen: boolean;
    onClose: () => void;
    leadId: number;
    leadName: string;
    leadScore: string;
    existingReminder?: ReminderResponseDTO;   // For edit mode
    onSuccess: () => void;                    // Refresh parent after create/edit
}

export default function ReminderModal({
    isOpen,
    onClose,
    leadId,
    leadName,
    leadScore,
    existingReminder,
    onSuccess
}: ReminderModalProps) {
    const [reminderTime, setReminderTime] = useState('');
    const [note, setNote] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const isEditMode = !!existingReminder;

    // Set defaults when modal opens
    useEffect(() => {
        if (isOpen) {
            if (existingReminder) {
                // Edit mode: pre-fill with existing data
                setReminderTime(existingReminder.reminderTime?.slice(0, 16) || '');
                setNote(existingReminder.note || '');
            } else {
                // Create mode: default to tomorrow at 10:00 AM
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                tomorrow.setHours(10, 0, 0, 0);
                const iso = tomorrow.toISOString().slice(0, 16);
                setReminderTime(iso);
                setNote('');
            }
        }
    }, [isOpen, existingReminder]);

    const handleSubmit = async () => {
        if (!reminderTime) {
            toast.error('Please select a date & time');
            return;
        }

        setSubmitting(true);
        try {
            if (isEditMode && existingReminder) {
                const body: UpdateReminderRequestDTO = {
                    reminderTime,
                    note: note.trim() || undefined,
                };
                await ReminderService.updateReminder(existingReminder.id, body);
            } else {
                const body: SetReminderRequestDTO = {
                    reminderTime,
                    note: note.trim() || undefined,
                };
                await ReminderService.setReminder(leadId, body);
            }
            onSuccess();
            onClose();
        } catch (err: any) {
            // Global error toast is already handled by api.ts interceptor
            console.error('Reminder submission failed:', err);
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;

    const SCORE_BADGE: Record<string, string> = {
        HOT: 'bg-rose-50 text-rose-600 border-rose-200',
        WARM: 'bg-amber-50 text-amber-600 border-amber-200',
        COLD: 'bg-sky-50 text-sky-600 border-sky-200',
    };

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 animate-in fade-in duration-200">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm" onClick={onClose} />

            {/* Modal */}
            <div className="bg-white w-full max-w-md rounded-[2rem] shadow-2xl relative z-10 overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-400 border border-slate-100">
                {/* Header */}
                <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-white">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-[#4d0101] flex items-center justify-center shadow-lg shadow-[#4d0101]/20">
                            <Bell className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">
                                {isEditMode ? 'Edit Reminder' : 'Set Follow-up Reminder'}
                            </h3>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Schedule a callback</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition-all"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Body */}
                <div className="px-8 py-6 space-y-6">
                    {/* Lead Info */}
                    <div className="flex items-center justify-between bg-slate-50 rounded-2xl p-4 border border-slate-100">
                        <div className="min-w-0">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Lead</p>
                            <p className="text-sm font-black text-slate-900 uppercase tracking-tight truncate mt-0.5">{leadName}</p>
                        </div>
                        <span className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border shrink-0 ${SCORE_BADGE[leadScore] || 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                            {leadScore || 'N/A'}
                        </span>
                    </div>

                    {/* Date/Time Picker */}
                    <div className="space-y-2">
                        <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">
                            <Calendar className="w-3.5 h-3.5" />
                            Reminder Date & Time
                        </label>
                        <input
                            type="datetime-local"
                            value={reminderTime}
                            onChange={(e) => setReminderTime(e.target.value)}
                            min={new Date().toISOString().slice(0, 16)}
                            className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-bold text-slate-900 focus:ring-0 focus:border-[#4d0101]/30 outline-none transition-all cursor-pointer"
                        />
                    </div>

                    {/* Note */}
                    <div className="space-y-2">
                        <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">
                            <FileText className="w-3.5 h-3.5" />
                            Follow-up Note
                            <span className="text-slate-300 font-bold normal-case tracking-normal">(optional)</span>
                        </label>
                        <textarea
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            placeholder="e.g. Call again about MBA program..."
                            rows={3}
                            className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-medium text-slate-900 focus:ring-0 focus:border-[#4d0101]/30 outline-none transition-all resize-none placeholder:text-slate-300"
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="px-8 py-5 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end gap-3">
                    <button
                        onClick={onClose}
                        disabled={submitting}
                        className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 transition-all disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <LoadingButton
                        loading={submitting}
                        loadingText="Saving..."
                        onClick={handleSubmit}
                        className="px-6 py-3 bg-[#4d0101] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-[#600202] transition-all shadow-lg shadow-[#4d0101]/20 active:scale-95"
                    >
                        {isEditMode ? 'Update Reminder' : 'Set Reminder'}
                    </LoadingButton>
                </div>
            </div>
        </div>
    );
}

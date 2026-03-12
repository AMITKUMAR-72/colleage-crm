'use client';

import { useState } from 'react';
import { AxiosError } from 'axios';
import { LeadService } from '@/services/leadService';
import { LeadResponseDTO, LeadStatus, LeadScore } from '@/types/api';
import LoadingButton from '@/components/ui/LoadingButton';

interface LeadFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (lead: LeadResponseDTO) => void;
}

export default function LeadFormModal({ isOpen, onClose, onSuccess }: LeadFormModalProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        address: '',
        course: '',
        intake: '',
        status: 'NEW' as LeadStatus,
        score: 'WARM' as LeadScore
    });

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const newLead = await LeadService.createLead(formData);
            onSuccess(newLead);
            onClose();
            // Reset form
            setFormData({
                name: '',
                email: '',
                phone: '',
                address: '',
                course: '',
                intake: '',
                status: 'NEW',
                score: 'WARM'
            });
        } catch (err: unknown) {
            console.error("Failed to create lead", err);
            const axiosError = err as AxiosError<{ message: string }>;
            const errorMessage = axiosError.response?.data?.message || "Failed to create lead. Please try again.";
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <h3 className="font-bold text-lg text-gray-800">New Lead Entry</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        ✕
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
                    {error && (
                        <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Full Name <span className="text-red-500">*</span></label>
                        <input
                            type="text"
                            required
                            minLength={3}
                            maxLength={20}
                            pattern="^[A-Za-z ]+$"
                            title="Name must contain only alphabets and spaces (3-20 chars)"
                            className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#dbb212] focus:border-[#dbb212] outline-none transition-all"
                            placeholder="e.g. John Doe"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Email Address <span className="text-red-500">*</span></label>
                        <input
                            type="email"
                            required
                            className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#dbb212] focus:border-[#dbb212] outline-none transition-all"
                            placeholder="john@example.com"
                            value={formData.email}
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Phone Number <span className="text-red-500">*</span></label>
                        <input
                            type="tel"
                            required
                            pattern="^[0-9]{10}$"
                            title="Phone number must be exactly 10 digits"
                            className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#dbb212] focus:border-[#dbb212] outline-none transition-all"
                            placeholder="1234567890"
                            value={formData.phone}
                            onChange={e => setFormData({ ...formData, phone: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Address <span className="text-red-500">*</span></label>
                        <input
                            type="text"
                            required
                            minLength={10}
                            maxLength={50}
                            className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#dbb212] focus:border-[#dbb212] outline-none transition-all"
                            placeholder="e.g. 123 Main St, City"
                            value={formData.address}
                            onChange={e => setFormData({ ...formData, address: e.target.value })}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Course (Optional)</label>
                            <input
                                type="text"
                                className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#dbb212] focus:border-[#dbb212] outline-none transition-all"
                                placeholder="e.g. MBA"
                                value={formData.course}
                                onChange={e => setFormData({ ...formData, course: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Intake (Optional)</label>
                            <input
                                type="text"
                                className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#dbb212] focus:border-[#dbb212] outline-none transition-all"
                                placeholder="e.g. Fall 2024"
                                value={formData.intake}
                                onChange={e => setFormData({ ...formData, intake: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Initial Status</label>
                            <select
                                className="w-full p-2 border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-[#dbb212] outline-none"
                                value={formData.status}
                                onChange={e => setFormData({ ...formData, status: e.target.value as LeadStatus })}
                            >
                                <option value="NEW">New</option>
                                <option value="CONTACTED">Contacted</option>
                                <option value="QUALIFIED">Qualified</option>
                                <option value="NOT_INTERESTED">Not Interested</option>
                                <option value="TIMED_OUT">Timed Out</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Lead Score</label>
                            <select
                                className="w-full p-2 border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-[#dbb212] outline-none"
                                value={formData.score}
                                onChange={e => setFormData({ ...formData, score: e.target.value as LeadScore })}
                            >
                                <option value="HOT">Hot 🔥</option>
                                <option value="WARM">Warm ☀️</option>
                                <option value="COLD">Cold ❄️</option>
                            </select>
                        </div>
                    </div>

                    <div className="pt-4 flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-2 px-4 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 font-bold text-sm transition-all"
                        >
                            Cancel
                        </button>
                        <LoadingButton
                            type="submit"
                            loading={loading}
                            loadingText="Creating..."
                            className="flex-1 py-2 px-4 bg-[#4d0101] text-white rounded-xl hover:bg-[#4d0101] font-bold text-sm shadow-lg shadow-blue-200 transition-all"
                        >
                            Create Lead
                        </LoadingButton>
                    </div>
                </form>
            </div>
        </div>
    );
}

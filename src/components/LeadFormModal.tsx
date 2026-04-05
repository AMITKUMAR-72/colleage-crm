'use client';

import { useState, useEffect } from 'react';
import { AxiosError } from 'axios';
import { LeadService } from '@/services/leadService';
import { CampaignService } from '@/services/campaignService';
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
        intake: '2026',
        campaign: { name: '' }
    });
    const [sources, setSources] = useState<any[]>([]);

    useEffect(() => {
        const loadSources = async () => {
            try {
                const data = await CampaignService.getAllSources();
                setSources(data);
            } catch (err) {
                console.error("Failed to load sources", err);
            }
        };
        if (isOpen) loadSources();
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!formData.campaign.name) {
            setError("Please select a Source.");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const payload = {
                name: formData.name.trim(),
                email: formData.email.trim(),
                address: formData.address.trim(),
                phones: [formData.phone.trim()],
                course: formData.course.trim().toUpperCase(),
                intake: formData.intake,
                campaign: { name: formData.campaign.name }
            };
            const newLead = await LeadService.createLead(payload as any);
            onSuccess(newLead);
            onClose();
            // Reset form
            setFormData({
                name: '',
                email: '',
                phone: '',
                address: '',
                course: '',
                intake: '2026',
                campaign: { name: '' }
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
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Course <span className="text-red-500">*</span></label>
                            <input
                                type="text"
                                required
                                className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#dbb212] focus:border-[#dbb212] outline-none transition-all"
                                placeholder="e.g. B.TECH"
                                value={formData.course}
                                onChange={e => setFormData({ ...formData, course: e.target.value.toUpperCase() })}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Intake</label>
                            <input
                                type="text"
                                readOnly
                                className="w-full p-2 border border-gray-100 bg-gray-50 text-gray-500 rounded-lg outline-none cursor-not-allowed"
                                value="2026"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Source <span className="text-red-500">*</span></label>
                        <select
                            required
                            className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#dbb212] focus:border-[#dbb212] outline-none transition-all"
                            value={formData.campaign.name}
                            onChange={e => setFormData({ ...formData, campaign: { name: e.target.value } })}
                        >
                            <option value="">Select Source</option>
                            {sources.map(s => (
                                <option key={s.id} value={s.name}>{s.name}</option>
                            ))}
                        </select>
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

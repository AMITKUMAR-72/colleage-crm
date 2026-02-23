'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { LeadRequestDTO, LeadStatus, LeadScore } from '@/types/api';
import { LeadService } from '@/services/leadService';
import { Toaster, toast } from 'react-hot-toast';
import { UserPlus, Send, CheckCircle2, AlertCircle } from 'lucide-react';
import { AxiosError } from 'axios';

export default function AffiliateDashboard() {
    const [loading, setLoading] = useState(false);
    const [leadsLoading, setLeadsLoading] = useState(true);
    const [leads, setLeads] = useState<LeadResponseDTO[]>([]);
    const [formData, setFormData] = useState<Partial<LeadRequestDTO>>({
        name: '',
        email: '',
        phone: '',
        address: '',
        course: '',
        intake: ''
    });

    const fetchLeads = async () => {
        try {
            const data = await LeadService.getAffiliateLeads();
            setLeads(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Failed to fetch leads", err);
        } finally {
            setLeadsLoading(false);
        }
    };

    useEffect(() => {
        fetchLeads();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            await LeadService.integrateAffiliatePartner(formData as any);
            toast.success('Lead submitted successfully!', {
                icon: '🚀',
                style: {
                    borderRadius: '10px',
                    background: '#333',
                    color: '#fff',
                },
            });
            // Reset form
            setFormData({
                name: '',
                email: '',
                phone: '',
                address: '',
                course: '',
                intake: ''
            });
            // Refresh leads list
            fetchLeads();
        } catch (err: unknown) {
            console.error("Failed to submit lead", err);
            const axiosError = err as AxiosError<{ message: string }>;
            const errorMessage = axiosError.response?.data?.message || "Failed to submit lead. Please try again.";
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <DashboardLayout>
            <Toaster position="top-right" />

            <div className="max-w-2xl mx-auto py-8">
                <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
                    {/* Header */}
                    <div className="bg-[#4d0101] p-8 text-white relative overflow-hidden">
                        <div className="relative z-10">
                            <h1 className="text-2xl font-bold flex items-center gap-3">
                                <UserPlus className="w-8 h-8 text-[#dbb212]" />
                                Lead Submission Portal
                            </h1>
                            <p className="text-white/70 mt-2 text-sm max-w-md">
                                Submit new lead details directly to our system. All submissions are automatically tracked and validated.
                            </p>
                        </div>
                        {/* Decorative background element */}
                        <div className="absolute -right-8 -bottom-8 w-48 h-48 bg-[#dbb212]/10 rounded-full blur-3xl" />
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="p-8 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Full Name */}
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1">Full Name *</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-[#dbb212] focus:bg-white outline-none transition-all text-gray-700"
                                    placeholder="Enter full name"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>

                            {/* Email */}
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1">Email Address *</label>
                                <input
                                    type="email"
                                    required
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-[#dbb212] focus:bg-white outline-none transition-all text-gray-700"
                                    placeholder="email@example.com"
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>

                            {/* Phone */}
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1">Phone Number *</label>
                                <input
                                    type="tel"
                                    required
                                    pattern="[0-9]{10}"
                                    title="10 digit phone number"
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-[#dbb212] focus:bg-white outline-none transition-all text-gray-700"
                                    placeholder="10 digit number"
                                    value={formData.phone}
                                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                />
                            </div>

                            {/* Address */}
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1">Address *</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-[#dbb212] focus:bg-white outline-none transition-all text-gray-700"
                                    placeholder="City, State"
                                    value={formData.address}
                                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                                />
                            </div>

                            {/* Course */}
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1">Course (Optional)</label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-[#dbb212] focus:bg-white outline-none transition-all text-gray-700"
                                    placeholder="e.g. MBA, B.Tech"
                                    value={formData.course}
                                    onChange={e => setFormData({ ...formData, course: e.target.value })}
                                />
                            </div>

                            {/* Intake */}
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1">Intake (Optional)</label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-[#dbb212] focus:bg-white outline-none transition-all text-gray-700"
                                    placeholder="e.g. Fall 2024"
                                    value={formData.intake || ''}
                                    onChange={e => setFormData({ ...formData, intake: e.target.value })}
                                />
                            </div>
                        </div>

                        {/* Submit Button */}
                        <div className="pt-4">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-4 bg-[#4d0101] text-white rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-[#4d0101]/90 transition-all shadow-xl shadow-red-900/10 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
                            >
                                {loading ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        <Send className="w-5 h-5" />
                                        Submit Lead
                                    </>
                                )}
                            </button>
                        </div>
                    </form>

                    {/* Footer Info */}
                    <div className="px-8 py-6 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-400 font-medium">
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                            Secure Submission
                        </div>
                        <div className="flex items-center gap-2">
                            <AlertCircle className="w-3.5 h-3.5 text-blue-400" />
                            Data syncs in real-time
                        </div>
                    </div>
                </div>

                {/* My Leads Section */}
                <div className="mt-12 bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
                    <div className="p-8 border-b border-gray-50 flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-bold text-gray-800">My Submitted Leads</h2>
                            <p className="text-sm text-gray-500 mt-1">Recently submitted for further processing</p>
                        </div>
                        <button
                            onClick={fetchLeads}
                            className="p-2.5 text-gray-400 hover:text-[#4d0101] hover:bg-gray-50 rounded-xl transition-all"
                            title="Refresh List"
                        >
                            <Send className={`w-5 h-5 ${leadsLoading ? 'animate-spin' : ''}`} />
                        </button>
                    </div>

                    <div className="overflow-x-auto">
                        {leadsLoading ? (
                            <div className="p-12 text-center">
                                <div className="inline-block animate-spin w-8 h-8 border-4 border-[#4d0101] border-t-transparent rounded-full mb-4"></div>
                                <p className="text-sm text-gray-500 font-medium">Loading your leads...</p>
                            </div>
                        ) : leads.length > 0 ? (
                            <table className="w-full text-left">
                                <thead className="bg-gray-50/50">
                                    <tr>
                                        <th className="px-8 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Lead Info</th>
                                        <th className="px-8 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Contact Details</th>
                                        <th className="px-8 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Course & Intake</th>
                                        <th className="px-8 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {leads.map((lead) => (
                                        <tr key={lead.id} className="hover:bg-gray-50/50 transition-colors group">
                                            <td className="px-8 py-5">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-[#4d0101]/5 flex items-center justify-center text-[#4d0101] font-bold text-xs uppercase group-hover:bg-[#4d0101] group-hover:text-white transition-all">
                                                        {lead.name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-bold text-gray-800">{lead.name}</div>
                                                        <div className="text-[10px] font-medium text-gray-400 mt-0.5">ID: #{lead.id}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-1.5 text-xs text-gray-600">
                                                        <span className="text-gray-400">📧</span> {lead.email}
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-xs text-gray-600">
                                                        <span className="text-gray-400">📞</span> {lead.phone}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <div className="space-y-1">
                                                    <div className="text-xs font-bold text-gray-700">{lead.course || 'N/A'}</div>
                                                    <div className="text-[10px] font-medium text-gray-500">{lead.intake || 'No Intake Set'}</div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold tracking-wider uppercase ${lead.status === 'NEW' ? 'bg-blue-50 text-blue-600' :
                                                        lead.status === 'CONTACTED' ? 'bg-orange-50 text-orange-600' :
                                                            lead.status === 'QUALIFIED' ? 'bg-green-50 text-green-600' :
                                                                'bg-gray-50 text-gray-600'
                                                    }`}>
                                                    {lead.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div className="p-20 text-center">
                                <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-50 rounded-full mb-6">
                                    <Send className="w-8 h-8 text-gray-200" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-800">No leads found</h3>
                                <p className="text-sm text-gray-400 mt-2 max-w-[240px] mx-auto">You haven't submitted any leads yet. Start by filling out the form above.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}

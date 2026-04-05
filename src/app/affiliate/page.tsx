'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { LeadRequestDTO, LeadResponseDTO, LeadStatus, LeadScore } from '@/types/api';
import { LeadService } from '@/services/leadService';
import { Toaster, toast } from 'react-hot-toast';
import { UserPlus, Send, CheckCircle2, AlertCircle, X, Plus, BarChart3, Users, Clock } from 'lucide-react';
import { AxiosError } from 'axios';

export default function AffiliateDashboard() {
    const [loading, setLoading] = useState(false);
    const [leadsLoading, setLeadsLoading] = useState(true);
    const [leads, setLeads] = useState<LeadResponseDTO[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
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
        
        // Validation checks
        const address = formData.address || '';
        const phone = formData.phone || '';
        const course = (formData.course || '').toUpperCase();

        if (address.length < 10 || address.length > 50) {
            toast.error('Address must be between 10 and 50 characters');
            return;
        }

        if (!/^\d{10}$/.test(phone)) {
            toast.error('Phone number must be exactly 10 digits');
            return;
        }

        setLoading(true);

        try {
            // Transform form data to match the required AffiliatePartner integration payload format
            const payload = {
                name: formData.name,
                email: formData.email,
                address: address,
                phones: [phone], // Convert single phone string to array
                course: course
            };
            
            await LeadService.integrateAffiliatePartner(payload as any);
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
            setIsModalOpen(false);
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

            <div className="max-w-6xl mx-auto py-8 px-4">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
                    <div>
                        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Affiliate Dashboard</h1>
                        <p className="text-gray-500 mt-1 font-medium italic">Track your performances and manage leads in real-time</p>
                    </div>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center gap-2 px-6 py-3 bg-[#4d0101] text-white rounded-2xl font-bold hover:bg-[#4d0101]/90 transition-all shadow-xl shadow-[#4d0101]/20 active:scale-95 group"
                    >
                        <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                        Add New Lead
                    </button>
                </div>

                {/* Stats Section */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                                <Users className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Total Leads</p>
                                <p className="text-2xl font-black text-gray-900">{leads.length}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
                                <Clock className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Last Updated</p>
                                <p className="text-sm font-bold text-gray-900 mt-1">Just now</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Table Section */}
                <div className="bg-white rounded-[2rem] shadow-xl border border-gray-100 overflow-hidden">
                    <div className="p-8 border-b border-gray-50 flex items-center justify-between bg-white">
                        <div>
                            <h2 className="text-xl font-bold text-gray-800">Submitted Leads</h2>
                            <p className="text-sm text-gray-500 mt-1">Full history of your referrals</p>
                        </div>
                        <button
                            onClick={fetchLeads}
                            className="p-3 text-gray-400 hover:text-[#4d0101] hover:bg-gray-50 rounded-2xl transition-all"
                            title="Refresh List"
                        >
                            <Send className={`w-5 h-5 ${leadsLoading ? 'animate-spin' : ''}`} />
                        </button>
                    </div>

                    <div className="overflow-x-auto">
                        {leadsLoading ? (
                            <div className="p-20 text-center">
                                <div className="inline-block animate-spin w-10 h-10 border-4 border-[#4d0101] border-t-transparent rounded-full mb-4"></div>
                                <p className="text-sm text-gray-500 font-bold uppercase tracking-widest">Loading Records...</p>
                            </div>
                        ) : leads.length > 0 ? (
                            <table className="w-full text-left">
                                <thead className="bg-gray-50/50">
                                    <tr>
                                        <th className="px-8 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Lead Name</th>
                                        <th className="px-8 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Contact</th>
                                        <th className="px-8 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Preference</th>
                                        {/* <th className="px-8 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Status</th> */}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {leads.map((lead) => (
                                        <tr key={lead.id} className="hover:bg-gray-50/30 transition-colors group">
                                            <td className="px-8 py-5">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-11 h-11 rounded-2xl bg-[#4d0101]/5 flex items-center justify-center text-[#4d0101] font-bold text-sm uppercase group-hover:bg-[#4d0101] group-hover:text-white transition-all shadow-sm">
                                                        {lead.name?.charAt(0) || '?'}
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-bold text-gray-900">{lead.name || 'Anonymous'}</div>
                                                        <div className="text-[10px] font-bold text-gray-400 mt-0.5">#{lead.id}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <div className="space-y-1">
                                                    <div className="text-xs text-gray-600 font-medium">{lead.email}</div>
                                                    <div className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">{lead.phone}</div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <div className="space-y-1">
                                                    <div className="text-xs font-bold text-gray-800">
                                                        {typeof lead.course === 'object' ? lead.course.course : (lead.course || 'General Admission')}
                                                    </div>
                                                    <div className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">{lead.intake || '2025 Intake'}</div>
                                                </div>
                                            </td>
                                            {/* <td className="px-8 py-5 text-right">
                                                <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black tracking-widest uppercase border ${lead.status === 'NEW' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                                    lead.status === 'CONTACTED' ? 'bg-orange-50 text-orange-600 border-orange-100' :
                                                        lead.status === 'QUALIFIED' ? 'bg-green-50 text-green-600 border-green-100' :
                                                            'bg-gray-50 text-gray-600 border-gray-100'
                                                    }`}>
                                                    {lead.status}
                                                </span>
                                            </td> */}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div className="p-24 text-center">
                                <div className="inline-flex items-center justify-center w-24 h-24 bg-gray-50 rounded-[2rem] mb-6">
                                    <Users className="w-10 h-10 text-gray-200" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-800 tracking-tight">Empty Database</h3>
                                <p className="text-sm text-gray-400 mt-2 max-w-[280px] mx-auto font-medium">You haven't submitted any leads yet. Use the "Add Lead" button to get started.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Submission Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md p-4 animate-in fade-in duration-300">
                    <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-xl overflow-hidden border border-gray-100 animate-in zoom-in-95 duration-300">
                        {/* Modal Header */}
                        <div className="bg-[#4d0101] p-8 text-white relative overflow-hidden">
                            <div className="relative z-10 flex justify-between items-center">
                                <div>
                                    <h2 className="text-2xl font-black flex items-center gap-3 italic">
                                        <UserPlus className="w-7 h-7 text-[#dbb212]" />
                                        ADD LEAD
                                    </h2>
                                    <p className="text-white/60 text-xs font-bold uppercase tracking-[0.2em] mt-1">Submission Portal</p>
                                </div>
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="p-2 hover:bg-white/10 rounded-2xl transition-colors"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                            <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-[#dbb212]/10 rounded-full blur-3xl" />
                        </div>

                        {/* Modal Form */}
                        <form onSubmit={handleSubmit} className="p-8 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-1.5 group">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] ml-1 group-focus-within:text-[#dbb212] transition-colors">Full Name *</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full px-5 py-3.5 bg-gray-50 border border-transparent rounded-2xl focus:ring-2 focus:ring-[#dbb212] focus:bg-white focus:border-transparent outline-none transition-all text-sm font-bold text-gray-700 placeholder:text-gray-300 shadow-inner"
                                        placeholder="John Carter"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-1.5 group">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] ml-1 group-focus-within:text-[#dbb212] transition-colors">Email Address *</label>
                                    <input
                                        type="email"
                                        required
                                        className="w-full px-5 py-3.5 bg-gray-50 border border-transparent rounded-2xl focus:ring-2 focus:ring-[#dbb212] focus:bg-white focus:border-transparent outline-none transition-all text-sm font-bold text-gray-700 placeholder:text-gray-300 shadow-inner"
                                        placeholder="john@example.com"
                                        value={formData.email}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-1.5 group">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] ml-1 group-focus-within:text-[#dbb212] transition-colors">Phone Number *</label>
                                    <input
                                        type="tel"
                                        required
                                        pattern="[0-9]{10}"
                                        maxLength={10}
                                        className="w-full px-5 py-3.5 bg-gray-50 border border-transparent rounded-2xl focus:ring-2 focus:ring-[#dbb212] focus:bg-white focus:border-transparent outline-none transition-all text-sm font-bold text-gray-700 placeholder:text-gray-300 shadow-inner"
                                        placeholder="Mobile (10 digits)"
                                        value={formData.phone}
                                        onChange={e => {
                                            const val = e.target.value.replace(/\D/g, '');
                                            if (val.length <= 10) setFormData({ ...formData, phone: val });
                                        }}
                                    />
                                </div>

                                <div className="space-y-1.5 group">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] ml-1 group-focus-within:text-[#dbb212] transition-colors">Location *</label>
                                    <input
                                        type="text"
                                        required
                                        minLength={10}
                                        maxLength={50}
                                        className="w-full px-5 py-3.5 bg-gray-50 border border-transparent rounded-2xl focus:ring-2 focus:ring-[#dbb212] focus:bg-white focus:border-transparent outline-none transition-all text-sm font-bold text-gray-700 placeholder:text-gray-300 shadow-inner"
                                        placeholder="Full Resident Address (Min 10 chars)"
                                        value={formData.address}
                                        onChange={e => setFormData({ ...formData, address: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-1.5 group">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] ml-1 group-focus-within:text-[#dbb212] transition-colors">Target Course</label>
                                    <input
                                        type="text"
                                        className="w-full px-5 py-3.5 bg-gray-50 border border-transparent rounded-2xl focus:ring-2 focus:ring-[#dbb212] focus:bg-white focus:border-transparent outline-none transition-all text-sm font-bold text-gray-700 placeholder:text-gray-300 shadow-inner"
                                        placeholder="e.g. MBA, B.Tech"
                                        value={formData.course}
                                        onChange={e => setFormData({ ...formData, course: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-1.5 group">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] ml-1 group-focus-within:text-[#dbb212] transition-colors">Intake Year</label>
                                    <input
                                        type="text"
                                        className="w-full px-5 py-3.5 bg-gray-50 border border-transparent rounded-2xl focus:ring-2 focus:ring-[#dbb212] focus:bg-white focus:border-transparent outline-none transition-all text-sm font-bold text-gray-700 placeholder:text-gray-300 shadow-inner"
                                        placeholder="e.g. 2025"
                                        value={formData.intake || ''}
                                        onChange={e => setFormData({ ...formData, intake: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="pt-4 flex gap-4">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 py-4 px-6 text-gray-500 font-black rounded-2xl hover:bg-gray-50 transition-colors uppercase tracking-widest text-xs"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-[2] py-4 bg-[#4d0101] text-white rounded-[1.5rem] font-black uppercase tracking-[0.2em] text-xs flex items-center justify-center gap-3 hover:bg-[#4d0101]/90 transition-all shadow-xl shadow-[#4d0101]/20 active:scale-95 disabled:opacity-50"
                                >
                                    {loading ? (
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            <Send className="w-4 h-4" />
                                            Submit Entry
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}

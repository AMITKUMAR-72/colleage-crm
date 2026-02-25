'use client';

import { useState, useEffect } from 'react';
import { AffiliateService } from '@/services/affiliateService';
import { AffiliateDTO, AffiliateActive } from '@/types/api';
import toast from 'react-hot-toast';
import { AxiosError } from 'axios';
import { Building2, Mail, CreditCard, Percent, Search, ShieldCheck, ShieldAlert, Edit2, UserCircle2, ChevronDown, Plus } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function AffiliateManager() {
    const { role } = useAuth();
    const [affiliates, setAffiliates] = useState<AffiliateDTO[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingAffiliate, setEditingAffiliate] = useState<AffiliateDTO | null>(null);
    const [selectedAffiliateDetails, setSelectedAffiliateDetails] = useState<AffiliateDTO | null>(null);
    const [showDetailsPopup, setShowDetailsPopup] = useState(false);

    // Search states
    const [searchType, setSearchType] = useState<'ALL' | 'EMAIL' | 'COMPANY_NAME' | 'STATUS'>('ALL');
    const [searchValue, setSearchValue] = useState('');
    const [searchStatus, setSearchStatus] = useState<AffiliateActive>('ACTIVE');

    const [formData, setFormData] = useState({
        companyName: '',
        email: '',
        password: '',
        commissionPercent: '10.0',
        payoutMethod: 'Bank Transfer'
    });

    useEffect(() => {
        if (searchType === 'ALL') {
            loadAffiliates();
        }
    }, [searchType]);

    const loadAffiliates = async () => {
        setLoading(true);
        try {
            const data = await AffiliateService.getAllAffiliates();
            setAffiliates(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Failed to load affiliates', error);
            toast.error('Failed to load affiliates');
            setAffiliates([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async () => {
        setLoading(true);
        try {
            if (searchType === 'ALL') {
                await loadAffiliates();
                return;
            } else if (searchType === 'EMAIL' && searchValue) {
                const data = await AffiliateService.getAffiliateByEmail(searchValue);
                setAffiliates(data ? [data] : []);
            } else if (searchType === 'COMPANY_NAME' && searchValue) {
                const data = await AffiliateService.getAffiliateByCompanyName(searchValue);
                setAffiliates(data ? [data] : []);
            } else if (searchType === 'STATUS') {
                const data = await AffiliateService.getAffiliatesByActiveStatus(searchStatus);
                setAffiliates(Array.isArray(data) ? data : []);
            }
        } catch (error) {
            toast.error('Failed to search affiliates');
            setAffiliates([]);
        } finally {
            setLoading(false);
        }
    };

    const handleViewDetails = async (id: number) => {
        try {
            const details = await AffiliateService.getAffiliateById(id);
            setSelectedAffiliateDetails(details);
            setShowDetailsPopup(true);
        } catch (error) {
            toast.error('Failed to load affiliate details');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingAffiliate) {
                await AffiliateService.updateAffiliate(editingAffiliate.id, {
                    companyName: formData.companyName,
                    email: formData.email,
                    commissionPercent: parseFloat(formData.commissionPercent as string) || 0,
                    payoutMethod: formData.payoutMethod,
                    active: editingAffiliate.active
                });
                toast.success('Affiliate details updated');

                // If it was open in details, update details
                if (selectedAffiliateDetails && selectedAffiliateDetails.id === editingAffiliate.id) {
                    const freshDetails = await AffiliateService.getAffiliateById(editingAffiliate.id);
                    setSelectedAffiliateDetails(freshDetails);
                    setShowDetailsPopup(true);
                }
            } else {
                const payload = { ...formData, commissionPercent: parseFloat(formData.commissionPercent as string) || 0 };
                await AffiliateService.registerAffiliate(payload as any);
                toast.success('Affiliate partner created successfully');
            }
            setShowModal(false);
            setEditingAffiliate(null);
            setFormData({ companyName: '', email: '', password: '', commissionPercent: '10.0', payoutMethod: 'Bank Transfer' });
            if (searchType === 'ALL') {
                loadAffiliates();
            } else {
                handleSearch();
            }
        } catch (error) {
            const err = error as AxiosError<{ message: string }>;
            toast.error(err.response?.data?.message || 'Failed to process request');
        }
    };

    const handleUpdateStatus = async (id: number, status: AffiliateActive) => {
        try {
            await AffiliateService.updateAffiliateActiveStatus(id, status);
            toast.success('Status updated successfully');
            if (selectedAffiliateDetails) {
                setSelectedAffiliateDetails({ ...selectedAffiliateDetails, active: status });
            }
            // Update in list as well
            setAffiliates(affiliates.map(a => a.id === id ? { ...a, active: status } : a));
        } catch (error) {
            toast.error('Failed to update status');
        }
    };

    const openEditForm = () => {
        if (!selectedAffiliateDetails) return;
        setEditingAffiliate(selectedAffiliateDetails);
        setFormData({
            companyName: selectedAffiliateDetails.companyName,
            email: selectedAffiliateDetails.email,
            password: '',
            commissionPercent: selectedAffiliateDetails.commissionPercent.toString(),
            payoutMethod: selectedAffiliateDetails.payoutMethod
        });
        setShowDetailsPopup(false);
        setShowModal(true);
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500 font-poppins text-black">
            {/* Main List View */}
            <div style={{ display: showModal ? 'none' : 'block' }} className="space-y-8">

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-2 w-full sm:w-[65%] lg:w-[45%] xl:w-1/3">
                        <select
                            className="p-3 bg-white border border-gray-200 rounded-xl text-xs sm:text-sm font-bold text-gray-900 focus:ring-2 focus:ring-[#dbb212] outline-none transition-all cursor-pointer whitespace-nowrap"
                            value={searchType}
                            onChange={(e) => setSearchType(e.target.value as any)}
                        >
                            <option value="ALL">All Partners</option>
                            <option value="EMAIL">By Email</option>
                            <option value="COMPANY_NAME">By Company</option>
                            <option value="STATUS">By Status</option>
                        </select>

                        {searchType === 'EMAIL' || searchType === 'COMPANY_NAME' ? (
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search..."
                                    className="w-full pl-9 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-xs sm:text-sm font-bold text-gray-900 focus:ring-2 focus:ring-[#dbb212] outline-none transition-all"
                                    value={searchValue}
                                    onChange={(e) => setSearchValue(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                />
                            </div>
                        ) : searchType === 'STATUS' ? (
                            <select
                                className="flex-1 p-3 bg-white border border-gray-200 rounded-xl text-xs sm:text-sm font-bold text-gray-900 focus:ring-2 focus:ring-[#dbb212] outline-none transition-all cursor-pointer"
                                value={searchStatus}
                                onChange={(e) => {
                                    setSearchStatus(e.target.value as AffiliateActive);
                                    handleSearch();
                                }}
                            >
                                <option value="ACTIVE">Active</option>
                                <option value="DEACTIVE">Deactive</option>
                            </select>
                        ) : null}
                    </div>

                    {(role === 'ADMIN' || role === 'MANAGER') && (
                        <button
                            onClick={() => {
                                setEditingAffiliate(null);
                                setFormData({ companyName: '', email: '', password: '', commissionPercent: '10.0', payoutMethod: 'Bank Transfer' });
                                setShowModal(true);
                            }}
                            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#4d0101] text-white px-6 py-3.5 sm:py-3 rounded-2xl hover:bg-[#600202] active:scale-[0.98] transition-all font-bold shadow-lg shadow-rose-900/10"
                        >
                            <Plus className="w-4 h-4 sm:hidden" />
                            Add Affiliate
                        </button>
                    )}
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-20 text-indigo-500">
                        <img src="/raffles-logo.png" alt="Loading" className="h-12 w-20 object-contain animate-spin-y-ease-in" />
                    </div>
                ) : (
                    <div className="p-0 overflow-x-auto bg-white rounded-2xl border border-slate-100 shadow-sm">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-slate-500 uppercase bg-slate-50/50 border-b border-slate-200">
                                <tr>
                                    <th className="px-4 sm:px-6 py-4 font-bold text-xs sm:text-sm">Partner</th>
                                    <th className="hidden sm:table-cell px-6 py-4 font-bold text-xs sm:text-sm">Contact</th>
                                    <th className="px-4 sm:px-6 py-4 font-bold text-right text-xs sm:text-sm">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {affiliates.length > 0 ? (
                                    affiliates.map((affiliate) => (
                                        <tr
                                            key={affiliate.id}
                                            onClick={() => handleViewDetails(affiliate.id)}
                                            className="hover:bg-slate-50 cursor-pointer transition-colors group relative"
                                        >
                                            <td className="px-4 sm:px-6 py-4">
                                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-transparent group-hover:bg-[#dbb212] transition-colors"></div>
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold shadow-sm shrink-0 text-xs">
                                                        {affiliate.companyName.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-slate-800 uppercase tracking-tight text-xs sm:text-sm">{affiliate.companyName}</span>
                                                        <div className="sm:hidden flex items-center gap-1 mt-0.5 text-[10px] text-slate-500 font-medium truncate max-w-[120px]">
                                                            <Mail className="w-2.5 h-2.5" />
                                                            {affiliate.email}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="hidden sm:table-cell px-6 py-4">
                                                <div className="flex items-center gap-1.5 text-slate-600 font-medium text-xs">
                                                    <Mail className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                                                    {affiliate.email}
                                                </div>
                                            </td>
                                            <td className="px-4 sm:px-6 py-4 text-right">
                                                <div className={`ml-auto w-fit px-2 py-0.5 rounded-md text-[9px] font-bold tracking-widest uppercase border ${affiliate.active === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                                                    {affiliate.active}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={3} className="px-6 py-16 text-center">
                                            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                                <UserCircle2 className="w-8 h-8 text-slate-300" />
                                            </div>
                                            <h3 className="font-bold text-slate-700">No affiliates found</h3>
                                            <p className="text-slate-400 text-sm mt-1">Use the add affiliate button to onboard partners or adjust your search parameters.</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Form View */}
            <div
                className="flex items-start justify-center transition-all font-poppins"
                style={{ display: showModal ? 'flex' : 'none', backgroundColor: 'transparent' }}
            >
                <div className="bg-white rounded-[1.2rem] w-full overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200 border border-white/20 text-black">
                    <div className="from-indigo-600 to-purple-600 p-6 sm:p-8 text-white relative text-center">
                        <img src="/raffles-logo.png" alt="Raffles" className="h-16 sm:h-24 w-auto object-contain mx-auto mb-4" />
                        <h3 className="text-xl sm:text-2xl text-black font-semibold tracking-tight font-poppins">
                            {editingAffiliate ? 'Modify Affiliate' : 'Create Affiliate'}
                        </h3>
                        <p className="opacity-80 text-black font-medium text-[10px] sm:text-sm mt-1 max-w-md mx-auto px-4">
                            {editingAffiliate ? 'Update the details of the affiliate partner.' : 'Fill in the details to register a new affiliate partner.'}
                        </p>
                        <button
                            onClick={() => setShowModal(false)}
                            className="absolute top-4 right-4 sm:top-8 sm:right-8 w-8 h-8 sm:w-10 sm:h-10 bg-black/10 hover:bg-black/20 rounded-xl sm:rounded-2xl flex items-center justify-center transition-colors font-bold text-black"
                        >
                            ✕
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
                            <div>
                                <label htmlFor="companyName" className="block text-xs font-black text-black uppercase tracking-widest mb-2 ml-1 cursor-pointer">Company Name</label>
                                <div className="relative">
                                    <input
                                        id="companyName"
                                        required
                                        className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-[#dbb212] outline-none transition-all font-bold text-gray-900 text-sm"
                                        value={formData.companyName}
                                        onChange={e => setFormData({ ...formData, companyName: e.target.value })}
                                        placeholder="ENTER COMPANY NAME"
                                    />
                                </div>
                            </div>
                            <div>
                                <label htmlFor="affiliateEmail" className="block text-xs font-black text-black uppercase tracking-widest mb-2 ml-1 cursor-pointer">Email</label>
                                <div className="relative">
                                    <input
                                        id="affiliateEmail"
                                        required
                                        type="email"
                                        className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-[#dbb212] outline-none transition-all font-bold text-gray-900 text-sm"
                                        value={formData.email}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                        placeholder="PARTNER@EMAIL.COM"
                                    />
                                </div>
                            </div>
                            <div>
                                <label htmlFor="affiliatePassword" className="block text-xs font-black text-black uppercase tracking-widest mb-2 ml-1 cursor-pointer">
                                    {editingAffiliate ? 'New Password' : 'Password'}
                                </label>
                                <input
                                    id="affiliatePassword"
                                    required={!editingAffiliate}
                                    type="password"
                                    className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-[#dbb212] outline-none transition-all font-bold text-gray-900 text-sm"
                                    value={formData.password}
                                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                                    placeholder={editingAffiliate ? "Optional update" : "••••••••"}
                                />
                            </div>
                            <div>
                                <label htmlFor="commissionPercent" className="block text-xs font-black text-black uppercase tracking-widest mb-2 ml-1 cursor-pointer">Commission (%)</label>
                                <div className="relative">
                                    <input
                                        id="commissionPercent"
                                        required
                                        type="text"
                                        className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-[#dbb212] outline-none transition-all font-bold text-gray-900 text-sm"
                                        value={formData.commissionPercent}
                                        onChange={e => setFormData({ ...formData, commissionPercent: e.target.value })}
                                        placeholder="10.0"
                                    />
                                </div>
                            </div>
                            <div className="sm:col-span-2">
                                <label htmlFor="payoutMethod" className="block text-xs font-black text-black uppercase tracking-widest mb-2 ml-1 cursor-pointer">Payout Method</label>
                                <div className="relative">
                                    <input
                                        id="payoutMethod"
                                        required
                                        className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-[#dbb212] outline-none transition-all font-bold text-gray-900 text-sm"
                                        value={formData.payoutMethod}
                                        onChange={e => setFormData({ ...formData, payoutMethod: e.target.value })}
                                        placeholder="Bank Transfer / PayPal"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 flex flex-col sm:flex-row gap-3 sm:gap-4">
                            <button
                                type="button"
                                onClick={() => setShowModal(false)}
                                className="order-2 sm:order-1 flex-1 py-3.5 sm:py-4 rounded-2xl border border-gray-100 text-gray-500 font-bold hover:bg-gray-50 transition-all"
                            >
                                Dismiss
                            </button>
                            <button
                                type="submit"
                                className="order-1 sm:order-2 flex-1 py-4 rounded-2xl bg-[#4d0101] text-white font-black shadow-xl shadow-rose-900/10 hover:scale-[1.02] active:scale-[0.98] transition-all"
                            >
                                {editingAffiliate ? 'Update' : 'Register'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Details Popup */}
            <div
                className="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-md transition-all font-poppins"
                style={{ display: showDetailsPopup ? 'flex' : 'none', backgroundColor: 'rgba(17, 24, 39, 0.6)' }}
            >
                {selectedAffiliateDetails && (
                    <div className="bg-white rounded-[2rem] w-full max-w-lg p-6 relative shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                        <button
                            onClick={() => setShowDetailsPopup(false)}
                            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors"
                        >
                            ✕
                        </button>
                        <div className="flex items-center gap-4 mb-6 mt-2">
                            <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-[1.25rem] flex items-center justify-center text-white text-2xl font-bold shadow-md">
                                {selectedAffiliateDetails.companyName.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 uppercase tracking-tighter">{selectedAffiliateDetails.companyName}</h2>
                                <p className="text-sm font-medium text-gray-500">ID: {selectedAffiliateDetails.id}</p>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div className="p-4 bg-gray-50 rounded-2xl">
                                <label className="block text-[10px] font-black tracking-widest text-gray-400 uppercase mb-3">Contact Information</label>
                                <div className="text-sm font-medium text-gray-700 space-y-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm">
                                            <Mail className="w-4 h-4 text-indigo-500" />
                                        </div>
                                        {selectedAffiliateDetails.email}
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-gray-50 rounded-2xl">
                                    <label className="block text-[10px] font-black tracking-widest text-gray-400 uppercase mb-1">Commission %</label>
                                    <div className="text-sm font-bold text-gray-900">{selectedAffiliateDetails.commissionPercent}%</div>
                                </div>
                                <div className="p-4 bg-gray-50 rounded-2xl">
                                    <label className="block text-[10px] font-black tracking-widest text-gray-400 uppercase mb-1">Payout Method</label>
                                    <div className="text-sm font-bold text-gray-900">{selectedAffiliateDetails.payoutMethod}</div>
                                </div>
                                <div className="col-span-2 p-4 bg-gray-50 rounded-2xl">
                                    <label className="block text-[10px] font-black tracking-widest text-gray-400 uppercase mb-1">Status</label>
                                    <div className={`text-sm font-bold flex items-center gap-1.5 w-fit px-3 py-1.5 rounded-xl uppercase ${selectedAffiliateDetails.active === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'
                                        }`}>
                                        {selectedAffiliateDetails.active === 'ACTIVE' ? <ShieldCheck className="w-3.5 h-3.5" /> : <ShieldAlert className="w-3.5 h-3.5" />}
                                        {selectedAffiliateDetails.active}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 flex flex-col gap-3">
                            {(role === 'ADMIN' || role === 'MANAGER') && (
                                <>
                                    <div className="p-4 bg-gray-50 border border-gray-100 rounded-xl">
                                        <label className="block text-[10px] font-black tracking-widest text-gray-500 uppercase mb-3">Admin Actions: Update Status</label>
                                        <div className="relative group/status flex gap-2">
                                            <select
                                                onChange={(e) => handleUpdateStatus(selectedAffiliateDetails.id, e.target.value as AffiliateActive)}
                                                className="w-full p-3.5 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-900 focus:ring-2 focus:ring-[#dbb212] outline-none transition-all cursor-pointer appearance-none"
                                                value={selectedAffiliateDetails.active}
                                            >
                                                <option value="ACTIVE">Status: ACTIVE</option>
                                                <option value="DEACTIVE">Status: DEACTIVE</option>
                                            </select>
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                                <ChevronDown className="w-4 h-4" />
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        onClick={openEditForm}
                                        className="w-full py-3.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                        Update Details
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

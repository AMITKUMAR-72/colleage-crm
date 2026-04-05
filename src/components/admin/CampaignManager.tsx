'use client';

import { useState, useEffect } from 'react';
import { CampaignService } from '@/services/campaignService';
import { CampaignDTO } from '@/types/api';
import toast from 'react-hot-toast';
import { AxiosError } from 'axios';
import { Globe, Search, UserCircle2, ChevronDown, Plus } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function CampaignManager() {
    const { role } = useAuth();
    const [sources, setSources] = useState<CampaignDTO[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [selectedSourceDetails, setSelectedSourceDetails] = useState<CampaignDTO | null>(null);
    const [showDetailsPopup, setShowDetailsPopup] = useState(false);

    // Search states
    const [searchType, setSearchType] = useState<'ALL' | 'NAME'>('ALL');
    const [searchValue, setSearchValue] = useState('');

    const [formData, setFormData] = useState({
        name: ''
    });

    useEffect(() => {
        if (searchType === 'ALL') {
            loadSources();
        }
    }, [searchType]);

    const loadSources = async () => {
        setLoading(true);
        try {
            const data = await CampaignService.getAllSources();
            setSources(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Failed to load campaign sources', error);
            toast.error('Failed to load campaign sources');
            setSources([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async () => {
        setLoading(true);
        try {
            if (searchType === 'ALL') {
                await loadSources();
                return;
            } else if (searchType === 'NAME' && searchValue) {
                const data = await CampaignService.getSourceByName(searchValue);
                setSources(data ? [data] : []);
            }
        } catch (error) {
            toast.error('Failed to search campaign sources');
            setSources([]);
        } finally {
            setLoading(false);
        }
    };

    const handleViewDetails = async (id: number) => {
        try {
            const details = await CampaignService.getSourceById(id);
            setSelectedSourceDetails(details);
            setShowDetailsPopup(true);
        } catch (error) {
            toast.error('Failed to load source details');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await CampaignService.createSource(formData.name);
            toast.success('Campaign source created successfully');

            setShowModal(false);
            setFormData({ name: '' });

            if (searchType === 'ALL') {
                loadSources();
            } else {
                handleSearch();
            }
        } catch (error) {
            const err = error as AxiosError<{ message: string }>;
            toast.error(err.response?.data?.message || 'Failed to process request');
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500 font-poppins text-black">
            {/* Main List View */}
            <div style={{ display: showModal ? 'none' : 'block' }} className="space-y-8">

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-2 w-full sm:w-[60%] lg:w-[45%] xl:w-1/3">
                        <select
                            className="p-3 bg-white border border-gray-200 rounded-xl text-xs sm:text-sm font-bold text-gray-900 focus:ring-2 focus:ring-[#dbb212] outline-none transition-all cursor-pointer"
                            value={searchType}
                            onChange={(e) => setSearchType(e.target.value as any)}
                        >
                            <option value="ALL">All Sources</option>
                            <option value="NAME">By Name</option>
                        </select>

                        {searchType === 'NAME' && (
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 sm:w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search..."
                                    className="w-full pl-8 sm:pl-9 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-xs sm:text-sm font-bold text-gray-900 focus:ring-2 focus:ring-[#dbb212] outline-none transition-all"
                                    value={searchValue}
                                    onChange={(e) => setSearchValue(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                />
                            </div>
                        )}
                    </div>

                    {(role === 'ADMIN' || role === 'MANAGER') && (
                        <button
                            onClick={() => {
                                setFormData({ name: '' });
                                setShowModal(true);
                            }}
                            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#4d0101] text-white px-6 py-3.5 sm:py-3 rounded-2xl hover:bg-[#600202] active:scale-[0.98] transition-all font-bold shadow-lg shadow-rose-900/10"
                        >
                            <Plus className="w-4 h-4 sm:hidden" />
                            Add Source
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
                                    <th className="px-6 py-4 font-bold">Campaign Details</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {sources.length > 0 ? (
                                    sources.map((source) => (
                                        <tr
                                            key={source.id}
                                            onClick={() => handleViewDetails(source.id)}
                                            className="hover:bg-slate-50 cursor-pointer transition-colors group relative"
                                        >
                                            <td className="px-6 py-4">
                                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-transparent group-hover:bg-[#dbb212] transition-colors"></div>
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center font-bold shadow-sm shrink-0">
                                                        {source.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-slate-800 tracking-tight">{source.name}</span>

                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td className="px-6 py-16 text-center">
                                            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                                <Globe className="w-8 h-8 text-slate-300" />
                                            </div>
                                            <h3 className="font-bold text-slate-700">No sources found</h3>
                                            <p className="text-slate-400 text-sm mt-1">Use the add source button to register missing marketing sources or adjust your search parameters.</p>
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
                <div className="bg-white rounded-[1.2rem] w-full max-w-xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200 border border-white/20 text-black">
                    <div className="from-indigo-600 to-purple-600 p-6 sm:p-8 text-white relative text-center">
                        <img src="/raffles-logo.png" alt="Raffles" className="h-16 sm:h-24 w-auto object-contain mx-auto mb-4" />
                        <h3 className="text-xl sm:text-2xl text-black font-semibold tracking-tight font-sans">
                            Add New Source
                        </h3>
                        <p className="opacity-80 text-black font-medium text-[10px] sm:text-sm mt-1 max-w-md mx-auto px-4">
                            Fill in the details to register a new external marketing campaign.
                        </p>
                        <button
                            onClick={() => setShowModal(false)}
                            className="absolute top-4 right-4 sm:top-8 sm:right-8 w-8 h-8 sm:w-10 sm:h-10 bg-black/10 hover:bg-black/20 rounded-xl sm:rounded-2xl flex items-center justify-center transition-colors font-bold text-black"
                        >
                            ✕
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
                        <div className="flex flex-col gap-6">
                            <div className="w-full">
                                <label htmlFor="sourceName" className="block text-xs font-black text-black uppercase tracking-widest mb-2 ml-1 cursor-pointer">Source Name</label>
                                <div className="relative">
                                    <input
                                        id="sourceName"
                                        required
                                        className="w-full pl-6 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-[#dbb212] outline-none transition-all font-bold text-gray-900"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="ENTER THE CAMPAIGN NAME"
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
                                Create Source
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
                {selectedSourceDetails && (
                    <div className="bg-white rounded-[2rem] w-full max-w-md p-6 relative shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                        <button
                            onClick={() => setShowDetailsPopup(false)}
                            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors"
                        >
                            ✕
                        </button>
                        <div className="flex items-center gap-4 mb-6 mt-2">
                            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-[1.25rem] flex items-center justify-center text-2xl font-bold shadow-sm border border-blue-100">
                                <Globe className="w-8 h-8" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 uppercase tracking-tighter">{selectedSourceDetails.name}</h2>
                                <p className="text-sm font-medium text-gray-500">ID: {selectedSourceDetails.id}</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

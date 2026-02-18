'use client';

import { useState, useEffect, useCallback } from 'react';
import { CampaignService } from '@/services/campaignService';
import { CampaignDTO, AffiliateDTO } from '@/types/api';
import toast from 'react-hot-toast';
import { Globe, Users, Plus, Mail, Building2, ShieldCheck, ShieldAlert } from 'lucide-react';

export default function CampaignManager() {
    const [sources, setSources] = useState<CampaignDTO[]>([]);
    const [affiliates, setAffiliates] = useState<AffiliateDTO[]>([]);
    const [activeTab, setActiveTab] = useState<'source' | 'affiliate'>('source');
    
    // Forms
    const [sourceName, setSourceName] = useState('');
    const [affEmail, setAffEmail] = useState('');
    const [affCompany, setAffCompany] = useState('');
    
    const [loading, setLoading] = useState(false);

    const loadData = useCallback(async () => {
        try {
            const [srcData, affData] = await Promise.all([
                CampaignService.getAllSources(),
                CampaignService.getAllAffiliates()
            ]);
            setSources(Array.isArray(srcData) ? srcData : []);
            setAffiliates(Array.isArray(affData) ? affData : []);
        } catch {
            setSources([]);
            setAffiliates([]);
            toast.error('Failed to load campaign data');
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleCreateSource = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await CampaignService.createSource(sourceName);
            toast.success('Source created!');
            setSourceName('');
            loadData();
        } catch {
            toast.error('Failed to create source');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateAffiliate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await CampaignService.registerAffiliate({
                companyName: affCompany,
                email: affEmail,
            });
            toast.success('Affiliate registered!');
            setAffEmail('');
            setAffCompany('');
            loadData();
        } catch {
            toast.error('Failed to register affiliate');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-black text-gray-900 tracking-tight">Campaign & Affiliates</h2>
                    <p className="text-gray-500 mt-1">Manage lead sources and external partners.</p>
                </div>
                
                <div className="flex p-1 bg-gray-100/80 backdrop-blur-md rounded-xl self-start">
                    <button 
                        onClick={() => setActiveTab('source')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 text-sm font-bold ${activeTab === 'source' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        <Globe className="w-4 h-4" />
                        Sources
                    </button>
                    <button 
                        onClick={() => setActiveTab('affiliate')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 text-sm font-bold ${activeTab === 'affiliate' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        <Users className="w-4 h-4" />
                        Affiliates
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Registration Forms */}
                <div className="lg:col-span-1">
                    <div className="bg-white/70 backdrop-blur-xl border border-gray-100 p-6 rounded-3xl shadow-xl shadow-gray-200/50 sticky top-24">
                        <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                            <Plus className="w-5 h-5 text-blue-500" />
                            {activeTab === 'source' ? 'Add New Source' : 'Register Affiliate'}
                        </h3>
                        
                        {activeTab === 'source' ? (
                            <form onSubmit={handleCreateSource} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 ml-1">Source Name</label>
                                    <input 
                                        value={sourceName}
                                        onChange={(e) => setSourceName(e.target.value)}
                                        placeholder="e.g. Google Ads"
                                        className="w-full p-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-gray-300 font-medium"
                                        required
                                    />
                                </div>
                                <button 
                                    type="submit" 
                                    disabled={loading} 
                                    className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-500/25 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                                >
                                    Create Source
                                </button>
                            </form>
                        ) : (
                            <form onSubmit={handleCreateAffiliate} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 ml-1">Company Name</label>
                                    <div className="relative">
                                        <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <input 
                                            value={affCompany} 
                                            onChange={e => setAffCompany(e.target.value)} 
                                            placeholder="Raffles Digital" 
                                            className="w-full p-3 pl-11 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-gray-300 font-medium" 
                                            required 
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 ml-1">Email Address</label>
                                    <div className="relative">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <input 
                                            value={affEmail} 
                                            onChange={e => setAffEmail(e.target.value)} 
                                            type="email"
                                            placeholder="partner@example.com" 
                                            className="w-full p-3 pl-11 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-gray-300 font-medium" 
                                            required 
                                        />
                                    </div>
                                </div>
                                <button 
                                    type="submit" 
                                    disabled={loading} 
                                    className="w-full py-4 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-500/25 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                                >
                                    Register Partner
                                </button>
                            </form>
                        )}
                    </div>
                </div>

                {/* Data Lists */}
                <div className="lg:col-span-2 space-y-4">
                    {activeTab === 'source' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {(!Array.isArray(sources) || sources.length === 0) && (
                                <div className="col-span-full py-20 text-center text-gray-400">
                                    <div className="bg-gray-50 w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-4">
                                        <Globe className="w-8 h-8 opacity-20" />
                                    </div>
                                    <p className="font-semibold">No sources found</p>
                                    <p className="text-sm">Add your first lead source to get started.</p>
                                </div>
                            )}
                            {Array.isArray(sources) && sources.map(s => (
                                <div key={s.id} className="group bg-white p-5 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-gray-200/40 transition-all duration-300 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center font-bold">
                                            {s.name.charAt(0)}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{s.name}</h4>
                                            <span className="text-[10px] text-gray-400 uppercase font-black tracking-widest">ID #{s.id}</span>
                                        </div>
                                    </div>
                                    <div className="w-8 h-8 rounded-full border border-gray-100 flex items-center justify-center group-hover:bg-blue-600 group-hover:border-blue-600 transition-all">
                                        <div className="w-1.5 h-1.5 bg-gray-300 rounded-full group-hover:bg-white transition-all" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {(!Array.isArray(affiliates) || affiliates.length === 0) && (
                                <div className="py-20 text-center text-gray-400 bg-white rounded-3xl border border-gray-100">
                                    <div className="bg-gray-50 w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-4">
                                        <Users className="w-8 h-8 opacity-20" />
                                    </div>
                                    <p className="font-semibold">No affiliates found</p>
                                    <p className="text-sm">Register a partner to start tracking external leads.</p>
                                </div>
                            )}
                            {Array.isArray(affiliates) && affiliates.map(a => (
                                <div key={a.id} className="group bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-gray-200/40 transition-all duration-300 flex items-center justify-between">
                                    <div className="flex items-center gap-5">
                                        <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center text-xl font-bold">
                                            {a.companyName.charAt(0)}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-gray-900 text-lg group-hover:text-indigo-600 transition-colors leading-tight">{a.companyName}</h4>
                                            <div className="flex items-center gap-3 mt-1">
                                                <div className="flex items-center gap-1 text-sm text-gray-500">
                                                    <Mail className="w-3.5 h-3.5 opacity-50" />
                                                    {a.email}
                                                </div>
                                                <div className="w-1 h-1 bg-gray-300 rounded-full" />
                                                <div className="text-xs text-gray-400 font-medium">Joined {new Date(a.createdAt).toLocaleDateString()}</div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="flex flex-col items-end gap-2">
                                        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black tracking-widest uppercase border ${
                                            a.active === 'ACTIVE' 
                                            ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                                            : 'bg-rose-50 text-rose-600 border-rose-100'
                                        }`}>
                                            {a.active === 'ACTIVE' ? <ShieldCheck className="w-3 h-3" /> : <ShieldAlert className="w-3 h-3" />}
                                            {a.active}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

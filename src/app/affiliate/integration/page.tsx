'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import api from '@/services/api';
import { Toaster, toast } from 'react-hot-toast';
import { 
    Copy, 
    Check, 
    Terminal, 
    Key, 
    Info, 
    FileJson,
    Rocket,
    Globe
} from 'lucide-react';

interface IntegrationData {
    apiKey: string;
    method: string;
    integrationUrl: string;
}

export default function AffiliateIntegrationPage() {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<IntegrationData | null>(null);
    const [copiedField, setCopiedField] = useState<string | null>(null);

    useEffect(() => {
        const fetchIntegrationData = async () => {
            try {
                const response = await api.get('/api/campaign/affiliate/api-integration');
                setData(response.data?.data || response.data);
            } catch (err) {
                console.error("Failed to fetch integration data", err);
                toast.error("Failed to load integration settings");
            } finally {
                setLoading(false);
            }
        };

        fetchIntegrationData();
    }, []);

    const handleCopy = (text: string, field: string) => {
        navigator.clipboard.writeText(text);
        setCopiedField(field);
        toast.success(`${field} copied!`);
        setTimeout(() => setCopiedField(null), 2000);
    };

    const payloadExample = JSON.stringify({
        name: "Vinod",
        email: "vinod@gmail.com",
        address: "NeemRana Rajasthan",
        phones: ["4181415117"],
        course: "BTECH"
    }, null, 2);

    return (
        <DashboardLayout>
            <Toaster position="top-right" />

            <div className="max-w-5xl mx-auto py-10 px-6">
                <div className="mb-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-50 text-amber-600 rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-4 border border-amber-100/50">
                        <Terminal className="w-3 h-3" />
                        Developer Access
                    </div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-4">
                        API Integration
                        <Rocket className="w-8 h-8 text-[#4d0101]" />
                    </h1>
                    <p className="text-slate-500 mt-2 font-medium text-lg">Connect your systems directly to our CRM via secure API</p>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm">
                        <div className="w-12 h-12 border-4 border-[#4d0101]/20 border-t-[#4d0101] rounded-full animate-spin mb-4" />
                        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Generating your endpoints...</p>
                    </div>
                ) : data ? (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        
                        {/* Left Column: API Details */}
                        <div className="lg:col-span-12 space-y-8">
                            
                            {/* API Credentials Card */}
                            <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden">
                                <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
                                            <Key className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-bold text-slate-800">Your API Credentials</h2>
                                            <p className="text-sm text-slate-400 font-medium">Use these to authenticate your requests</p>
                                        </div>
                                    </div>
                                    <div className="px-4 py-1.5 bg-emerald-50 text-emerald-600 rounded-xl text-[10px] font-black uppercase tracking-widest border border-emerald-100 animate-pulse">
                                        Active
                                    </div>
                                </div>

                                <div className="p-8 space-y-6">
                                    {/* API KEY */}
                                    <div className="space-y-2 group">
                                        <div className="flex justify-between items-center px-1">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Personal API Key</label>
                                            <span className="text-[10px] text-indigo-500 font-bold">X-Api-Key Header</span>
                                        </div>
                                        <div className="relative">
                                            <div className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 font-mono text-sm text-slate-700 break-all pr-12">
                                                {data.apiKey}
                                            </div>
                                            <button 
                                                onClick={() => handleCopy(data.apiKey, 'API Key')}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 hover:bg-white rounded-xl transition-all shadow-sm group-hover:scale-110 active:scale-95"
                                            >
                                                {copiedField === 'API Key' ? (
                                                    <Check className="w-5 h-5 text-emerald-500" />
                                                ) : (
                                                    <Copy className="w-5 h-5 text-slate-400" />
                                                )}
                                            </button>
                                        </div>
                                    </div>

                                    {/* ENDPOINT URL */}
                                    <div className="space-y-2 group">
                                        <div className="flex justify-between items-center px-1">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Integration Endpoint</label>
                                            <div className="flex gap-2">
                                                <span className="px-2 py-0.5 bg-amber-50 text-amber-600 rounded-md text-[9px] font-black">{data.method}</span>
                                                <span className="px-2 py-0.5 bg-sky-50 text-sky-600 rounded-md text-[9px] font-black">HTTPS</span>
                                            </div>
                                        </div>
                                        <div className="relative">
                                            <div className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 font-mono text-sm text-emerald-400 break-all pr-12">
                                                {data.integrationUrl}
                                            </div>
                                            <button 
                                                onClick={() => handleCopy(data.integrationUrl, 'Endpoint URL')}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-all shadow-sm group-hover:scale-110 active:scale-95"
                                            >
                                                {copiedField === 'Endpoint URL' ? (
                                                    <Check className="w-5 h-5 text-emerald-400" />
                                                ) : (
                                                    <Copy className="w-5 h-5 text-slate-500" />
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Payload Documentation */}
                            <div className="grid grid-cols-1 gap-8">
                                <div className="bg-slate-900 rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-800">
                                    <div className="p-8 border-b border-white/5 flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 bg-sky-500/10 rounded-2xl text-sky-500">
                                                <FileJson className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-bold text-white tracking-tight">JSON Request Body</h3>
                                                <p className="text-sm text-slate-500 font-medium mt-0.5">Recommended payload format for integration</p>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => handleCopy(payloadExample, 'JSON Example')}
                                            className="px-6 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-bold uppercase tracking-widest transition-all"
                                        >
                                            Copy Code
                                        </button>
                                    </div>
                                    <div className="p-8 relative">
                                        <pre className="text-sm font-mono text-sky-300 overflow-auto no-scrollbar max-h-[400px] leading-relaxed">
                                            {payloadExample}
                                        </pre>
                                        <div className="mt-8 pt-8 border-t border-white/5 flex items-start gap-4">
                                            <div className="p-2 bg-amber-500/10 rounded-lg text-amber-500 shrink-0">
                                                <Info className="w-5 h-5" />
                                            </div>
                                            <p className="text-xs text-slate-400 font-medium leading-relaxed">
                                                <strong className="text-white block mb-1">Implementation Note:</strong>
                                                All fields are case-sensitive. The <span className="text-sky-400">phones</span> field must be an array of strings even for a single number.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>
                ) : (
                    <div className="bg-white p-20 rounded-[2.5rem] text-center border border-slate-100 shadow-sm">
                        <Globe className="w-12 h-12 text-slate-100 mx-auto mb-6" />
                        <h3 className="text-xl font-bold text-slate-800">No Integration Data</h3>
                        <p className="text-slate-400 max-w-xs mx-auto mt-2 font-medium">Your account may not have API access enabled. Please contact administrator.</p>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}

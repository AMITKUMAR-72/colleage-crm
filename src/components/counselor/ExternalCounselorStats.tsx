'use client';

import { LeadResponseDTO } from '@/types/api';

interface Props {
    leads: LeadResponseDTO[];
}

export default function ExternalCounselorStats({ leads }: Props) {
    const totalLeads = leads.length;
    // External partners care about leads assigned to them and their progress
    const externalAssigned = leads.filter(l => l.status === 'EXTERNAL_ASSIGNED').length;
    const qualifiedByPartner = leads.filter(l => l.status === 'QUALIFIED' || l.status === 'ADMISSION_IN_PROCESS').length;
    const admissionDone = leads.filter(l => l.status === 'ADMISSION_DONE').length;

    const performanceRate = totalLeads > 0 ? Math.round(((qualifiedByPartner + admissionDone) / totalLeads) * 100) : 0;

    const stats = [
        {
            label: 'Partner Leads',
            value: totalLeads,
        },
        {
            label: 'External Assigned',
            value: externalAssigned,
        },
        {
            label: 'Success Count',
            value: qualifiedByPartner + admissionDone,
        },
        {
            label: 'Quality Factor',
            value: `${performanceRate}%`,
        },
    ];

    const hotPartnerLeads = leads.filter(l => l.score === 'HOT').length;
    const warmPartnerLeads = leads.filter(l => l.score === 'WARM').length;

    return (
        <div className="space-y-6 mb-8">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat, idx) => (
                    <div
                        key={idx}
                        className="p-6 rounded-3xl border border-indigo-100 bg-white/50 backdrop-blur-md flex flex-col justify-between h-32 hover:border-indigo-200 transition-colors shadow-sm"
                    >
                        <div className="flex items-center gap-3">
                            <span className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em]">{stat.label}</span>
                        </div>
                        <div className="text-4xl font-black text-slate-900 tracking-tighter">{stat.value}</div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white/50 backdrop-blur-md p-8 rounded-3xl border border-slate-200/60 shadow-sm">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-black text-slate-900 tracking-tight uppercase text-xs">Partner Lead Pipeline</h3>
                    </div>
                    <div className="space-y-6">
                        {[
                            { label: 'Verified Hot', count: hotPartnerLeads, color: 'bg-rose-500', total: totalLeads },
                            { label: 'Active Warm', count: warmPartnerLeads, color: 'bg-amber-500', total: totalLeads },
                            { label: 'General Leads', count: totalLeads - hotPartnerLeads - warmPartnerLeads, color: 'bg-slate-400', total: totalLeads },
                        ].map((item, i) => (
                            <div key={i} className="space-y-2">
                                <div className="flex justify-between text-xs font-black text-slate-800 uppercase tracking-widest">
                                    <span>{item.label}</span>
                                    <span>{Math.round((item.count / (totalLeads || 1)) * 100)}%</span>
                                </div>
                                <div className="h-4 w-full bg-slate-100/50 rounded-lg overflow-hidden border border-slate-200/60">
                                    <div
                                        className={`h-full ${item.color}`}
                                        style={{ width: `${(item.count / (totalLeads || 1)) * 100}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white/50 backdrop-blur-md p-8 rounded-3xl border border-slate-200/60 shadow-sm flex flex-col">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-black text-slate-900 tracking-tight uppercase text-xs">Partnership Growth</h3>
                        <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-lg uppercase tracking-widest border border-emerald-100">Expanding</span>
                    </div>
                    <div className="flex-1 flex items-end gap-3 h-32 px-2">
                        {[35, 55, 40, 65, 50, 85, 90].map((h, i) => (
                            <div key={i} className="flex-1 group relative">
                                <div
                                    className="w-full bg-[#1e293b] rounded-t-md opacity-20 group-hover:opacity-60 transition-opacity"
                                    style={{ height: `${h}%` }}
                                />
                                <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-black text-slate-900 opacity-0 group-hover:opacity-100 transition-opacity">
                                    {h}%
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="pt-6 flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">
                        <span>W1</span>
                        <span>W2</span>
                        <span>W3</span>
                        <span>W4</span>
                        <span>W5</span>
                        <span>W6</span>
                        <span>W7</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

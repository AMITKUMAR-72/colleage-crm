'use client';

// Simplified - Icons removed
import { LeadResponseDTO } from '@/types/api';

interface Props {
    leads: LeadResponseDTO[];
}

export default function TelecallerStats({ leads }: Props) {
    const totalLeads = leads.length;
    const contacted = leads.filter(l => l.status === 'CONTACTED' || l.status === 'QUALIFIED' || l.status === 'ADMISSION_IN_PROCESS').length;
    const qualified = leads.filter(l => l.status === 'QUALIFIED' || l.status === 'ADMISSION_IN_PROCESS' || l.status === 'ADMISSION_DONE').length;
    
    // Simplistic conversion rate for display
    const conversionRate = totalLeads > 0 ? Math.round((qualified / totalLeads) * 100) : 0;

    const stats = [
        { 
            label: 'Total Leads', 
            value: totalLeads, 
        },
        { 
            label: 'Contacted', 
            value: contacted, 
        },
        { 
            label: 'Qualified', 
            value: qualified, 
        },
        { 
            label: 'Conversion', 
            value: `${conversionRate}%`, 
        },
    ];

    // Priority Distribution
    const highPriority = leads.filter(l => l.score === 'HOT').length;
    const midPriority = leads.filter(l => l.score === 'WARM').length;
    const lowPriority = leads.filter(l => l.score === 'COLD').length;

    return (
        <div className="space-y-4 md:space-y-6 mb-6 md:mb-8">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                {stats.map((stat, idx) => (
                    <div 
                        key={idx} 
                        className="p-4 md:p-6 rounded-2xl md:rounded-3xl border border-slate-200/60 bg-white/50 backdrop-blur-md flex flex-col justify-between h-28 md:h-32 hover:border-slate-300 transition-colors shadow-sm"
                    >
                        <div className="flex items-center gap-3">
                            <span className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{stat.label}</span>
                        </div>
                        <div className="text-2xl md:text-4xl font-black text-slate-900 tracking-tighter">{stat.value}</div>
                    </div>
                ))}
            </div>

            {/* Analytics Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                <div className="bg-white/50 backdrop-blur-md p-6 md:p-8 rounded-3xl border border-slate-200/60 shadow-sm">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-black text-slate-900 tracking-tight uppercase text-[10px] md:text-xs">Lead Quality Distribution</h3>
                    </div>
                    <div className="space-y-5 md:space-y-6">
                        {[
                            { label: 'Hot Leads', count: highPriority, color: 'bg-rose-500', total: totalLeads },
                            { label: 'Warm Leads', count: midPriority, color: 'bg-amber-500', total: totalLeads },
                            { label: 'Cold Leads', count: lowPriority, color: 'bg-slate-400', total: totalLeads },
                        ].map((item, i) => (
                            <div key={i} className="space-y-2">
                                <div className="flex justify-between text-[10px] font-black text-slate-800 uppercase tracking-widest">
                                    <span>{item.label}</span>
                                    <span>{Math.round((item.count / (totalLeads || 1)) * 100)}%</span>
                                </div>
                                <div className="h-3 md:h-4 w-full bg-slate-100/50 rounded-lg overflow-hidden border border-slate-200/60">
                                    <div 
                                        className={`h-full ${item.color}`}
                                        style={{ width: `${(item.count / (totalLeads || 1)) * 100}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white/50 backdrop-blur-md p-6 md:p-8 rounded-3xl border border-slate-200/60 shadow-sm flex flex-col">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-black text-slate-900 tracking-tight uppercase text-[10px] md:text-xs">Performance</h3>
                        <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg uppercase tracking-widest border border-emerald-100">On Track</span>
                    </div>
                    <div className="flex-1 flex items-end gap-2 md:gap-3 h-32 px-1">
                        {[40, 70, 45, 90, 65, 80, 55].map((h, i) => (
                            <div key={i} className="flex-1 group relative">
                                <div 
                                    className="w-full bg-[#4d0101] rounded-t-md md:rounded-t-lg opacity-30 group-hover:opacity-80 transition-opacity" 
                                    style={{ height: `${h}%` }} 
                                />
                                <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[9px] font-black text-slate-900 opacity-0 group-hover:opacity-100 transition-opacity">
                                    {h}%
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="pt-6 flex justify-between text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">
                        <span>Mon</span>
                        <span className="hidden sm:inline">Tue</span>
                        <span>Wed</span>
                        <span className="hidden sm:inline">Thu</span>
                        <span>Fri</span>
                        <span className="hidden sm:inline">Sat</span>
                        <span>Sun</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

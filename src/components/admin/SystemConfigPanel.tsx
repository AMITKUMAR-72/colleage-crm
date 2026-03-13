'use client';

import { useState, useEffect, useCallback } from 'react';
import { ConfigDTO, SlaUpdateResponseDTO } from '@/types/api';
import { ConfigService } from '@/services/adminService';
import toast from 'react-hot-toast';

// ─── Icons (inline SVG to avoid icon lib deps) ──────────────────────────────
const ClockIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
    </svg>
);
const UsersIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
);
const RefreshIcon = ({ spinning }: { spinning?: boolean }) => (
    <svg className={`w-4 h-4 ${spinning ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" />
        <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
    </svg>
);
const CheckIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
        <polyline points="20 6 9 17 4 12" />
    </svg>
);
const InfoIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
);

// ─── SLA Human-readable helper ───────────────────────────────────────────────
function formatHours(h: number): string {
    if (h < 24) return `${h}h`;
    const days = Math.floor(h / 24);
    const rem = h % 24;
    return rem > 0 ? `${days}d ${rem}h` : `${days}d`;
}

// ─── Stat Card ───────────────────────────────────────────────────────────────
function StatCard({
    icon,
    label,
    value,
    sub,
    accent,
}: {
    icon: React.ReactNode;
    label: string;
    value: React.ReactNode;
    sub?: string;
    accent: string; // tailwind gradient classes
}) {
    return (
        <div className={`relative overflow-hidden rounded-2xl p-6 border border-white/10 ${accent} text-white shadow-lg`}>
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.15em] opacity-70 mb-1">{label}</p>
                    <div className="text-4xl font-black tracking-tight">{value}</div>
                    {sub && <p className="text-xs font-bold opacity-60 mt-1">{sub}</p>}
                </div>
                <div className="opacity-30 mt-1">{icon}</div>
            </div>
            {/* decorative blob */}
            <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full opacity-10 bg-white" />
        </div>
    );
}

// ─── Edit Row ────────────────────────────────────────────────────────────────
function EditRow({
    id,
    label,
    description,
    unit,
    currentValue,
    min,
    max,
    onSave,
    saving,
}: {
    id: string;
    label: string;
    description: string;
    unit: string;
    currentValue: number;
    min: number;
    max: number;
    onSave: (val: number) => Promise<void>;
    saving: boolean;
}) {
    const [draft, setDraft] = useState(currentValue);
    const [dirty, setDirty] = useState(false);

    // Sync draft when external value changes (after fetch)
    useEffect(() => {
        setDraft(currentValue);
        setDirty(false);
    }, [currentValue]);

    const handleChange = (v: number) => {
        setDraft(v);
        setDirty(v !== currentValue);
    };

    const handleSave = async () => {
        if (!dirty || saving) return;
        await onSave(draft);
        setDirty(false);
    };

    return (
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-5 rounded-2xl bg-slate-50 border border-slate-200/60 hover:border-slate-300/60 transition-all duration-200">
            <div className="flex-1 min-w-0">
                <p className="font-bold text-slate-800 text-sm">{label}</p>
                <p className="text-xs text-slate-400 mt-0.5 font-medium">{description}</p>
            </div>

            <div className="flex items-center gap-3 flex-shrink-0">
                {/* Stepper row */}
                <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-sm">
                    <button
                        onClick={() => handleChange(Math.max(min, draft - (id === 'sla' ? 1 : 5)))}
                        disabled={draft <= min || saving}
                        className="w-6 h-6 flex items-center justify-center rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-30 font-black text-slate-600 text-sm transition"
                    >−</button>
                    <input
                        type="number"
                        id={`config-input-${id}`}
                        min={min}
                        max={max}
                        value={draft}
                        onChange={e => handleChange(Number(e.target.value))}
                        className="w-16 text-center font-black text-slate-800 bg-transparent border-none outline-none text-sm [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                    />
                    <button
                        onClick={() => handleChange(Math.min(max, draft + (id === 'sla' ? 1 : 5)))}
                        disabled={draft >= max || saving}
                        className="w-6 h-6 flex items-center justify-center rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-30 font-black text-slate-600 text-sm transition"
                    >+</button>
                </div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{unit}</span>

                {/* Save button */}
                <button
                    onClick={handleSave}
                    disabled={!dirty || saving}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-200
                        ${dirty && !saving
                            ? 'bg-[#4d0101] text-white shadow-lg shadow-rose-900/20 hover:bg-[#600202] scale-100'
                            : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                        }`}
                >
                    {saving ? (
                        <><RefreshIcon spinning /> Saving...</>
                    ) : (
                        <><CheckIcon /> Apply</>
                    )}
                </button>
            </div>
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function SystemConfigPanel() {
    const [config, setConfig] = useState<ConfigDTO | null>(null);
    const [loading, setLoading] = useState(true);
    const [savingSla, setSavingSla] = useState(false);
    const [savingCap, setSavingCap] = useState(false);
    const [lastSlaResult, setLastSlaResult] = useState<SlaUpdateResponseDTO | null>(null);

    const fetchConfig = useCallback(async () => {
        try {
            setLoading(true);
            const data = await ConfigService.getConfig();
            setConfig(data);
        } catch (err) {
            console.error('[SystemConfigPanel] Failed to fetch config', err);
            toast.error('Could not load system configuration.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchConfig();
    }, [fetchConfig]);

    const handleSlaUpdate = async (hours: number) => {
        setSavingSla(true);
        try {
            const result = await ConfigService.updateSlaHours(hours);
            setLastSlaResult(result);
            setConfig(prev => prev ? { ...prev, slaHours: result.slaHours } : prev);
        } catch {
            /* global toast already shown by api interceptor */
        } finally {
            setSavingSla(false);
        }
    };

    const handleCapUpdate = async (value: number) => {
        setSavingCap(true);
        try {
            const result = await ConfigService.updateMaxCapacity(value);
            setConfig(prev => prev ? { ...prev, maxCapacity: result.maxCapacity ?? value } : prev);
        } catch {
            /* global toast already shown by api interceptor */
        } finally {
            setSavingCap(false);
        }
    };

    // ── Skeleton ──────────────────────────────────────────────────────────────
    if (loading) {
        return (
            <div className="space-y-6 animate-pulse">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[0, 1].map(i => (
                        <div key={i} className="h-28 rounded-2xl bg-gradient-to-br from-slate-200 to-slate-300" />
                    ))}
                </div>
                <div className="h-32 rounded-2xl bg-slate-100" />
                <div className="h-32 rounded-2xl bg-slate-100" />
            </div>
        );
    }

    return (
        <div className="space-y-8">

            {/* ── Header ─────────────────────────────────────────────────── */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">System Configuration</h2>
                    <p className="text-slate-400 text-sm font-medium mt-0.5">Adjust global SLA timers and counselor capacity limits.</p>
                </div>
                <button
                    onClick={fetchConfig}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-black uppercase tracking-widest transition"
                >
                    <RefreshIcon spinning={loading} /> Refresh
                </button>
            </div>

            {/* ── Stats Cards ─────────────────────────────────────────────── */}
            {config && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <StatCard
                        icon={<ClockIcon />}
                        label="Current SLA Timer"
                        value={formatHours(config.slaHours)}
                        sub={`${config.slaHours} hours per lead`}
                        accent="bg-gradient-to-br from-[#4d0101] via-[#7a0a0a] to-[#b91c1c]"
                    />
                    <StatCard
                        icon={<UsersIcon />}
                        label="Max Counselor Capacity"
                        value={config.maxCapacity}
                        sub="leads per counselor"
                        accent="bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900"
                    />
                </div>
            )}

            {/* ── Edit Panel ──────────────────────────────────────────────── */}
            <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                    <h3 className="font-black text-slate-800 text-sm uppercase tracking-widest">Modify Global Settings</h3>
                    <p className="text-xs text-slate-400 font-medium mt-0.5">
                        Changes take effect immediately across the live system.
                    </p>
                </div>

                <div className="p-6 space-y-4">
                    <EditRow
                        id="sla"
                        label="SLA Hours"
                        description="Global SLA timer applied to every lead. Changing this mathematically shifts all active lead timers."
                        unit="hrs"
                        currentValue={config?.slaHours ?? 0}
                        min={1}
                        max={720}
                        onSave={handleSlaUpdate}
                        saving={savingSla}
                    />
                    <EditRow
                        id="cap"
                        label="Max Capacity"
                        description="Maximum number of queued leads any counselor can hold. Overflow leads are dynamically reassigned."
                        unit="leads"
                        currentValue={config?.maxCapacity ?? 0}
                        min={1}
                        max={500}
                        onSave={handleCapUpdate}
                        saving={savingCap}
                    />
                </div>
            </div>

            {/* ── SLA Update Result Banner ─────────────────────────────────── */}
            {lastSlaResult && (
                <div className="flex items-start gap-3 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <span className="mt-0.5 flex-shrink-0 text-emerald-500"><InfoIcon /></span>
                    <div>
                        <p className="text-sm font-bold">SLA Updated Successfully</p>
                        <p className="text-xs font-medium opacity-80 mt-0.5">{lastSlaResult.message}</p>
                        <p className="text-xs font-bold mt-1">
                            Active timers adjusted: <span className="font-black">{lastSlaResult.activeTimersAdjusted}</span>
                        </p>
                    </div>
                    <button
                        onClick={() => setLastSlaResult(null)}
                        className="ml-auto text-emerald-400 hover:text-emerald-600 text-lg leading-none"
                    >×</button>
                </div>
            )}

            {/* ── Info note ─────────────────────────────────────────────────── */}
            <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800">
                <span className="mt-0.5 flex-shrink-0"><InfoIcon /></span>
                <div className="text-xs font-medium leading-relaxed">
                    <span className="font-black">SLA Hours:</span> Shifting the SLA timer recalculates deadlines for all in-progress leads.
                    A positive delta extends deadlines; a negative delta accelerates them.
                    <br /><br />
                    <span className="font-black">Max Capacity:</span> Reducing capacity queues over-threshold leads for automatic reassignment on the next scheduler cycle.
                </div>
            </div>

        </div>
    );
}

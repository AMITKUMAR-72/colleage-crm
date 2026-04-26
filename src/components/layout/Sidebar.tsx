'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import api from '@/services/api';
import {
    Menu,
    X,
    Upload,
    Clock,
    User,
    ShieldCheck,
    LayoutDashboard,
    Users,
    UserSquare2,
    Calendar,
    Bell
} from 'lucide-react';

export default function Sidebar() {
    const { user, role, logout } = useAuth();
    const pathname = usePathname();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [counselorTypes, setCounselorTypes] = useState<string[]>([]);

    useEffect(() => {
        if (role === 'COUNSELOR') {
            api.get('/api/counselors/me')
                .then(res => {
                    const data = res.data?.data || res.data;
                    setCounselorTypes(data?.counselorTypes || []);
                })
                .catch(err => console.error('Sidebar specialization fetch error:', err));
        }
    }, [role]);

    const navItems = [
        { label: 'Admin Panel', href: '/admin/manage', roles: ['ADMIN'], icon: ShieldCheck },
        { label: 'Manager Hub', href: '/manager', roles: ['MANAGER', 'ADMIN'], icon: LayoutDashboard },
        { label: 'Counselor Leaves', href: '/admin/leaves', roles: ['ADMIN', 'MANAGER'], icon: Calendar },
        { label: 'Lead information', href: '/admin', roles: ['ADMIN', 'MANAGER'], icon: Users },
        { label: 'My Lead', href: '/counselor/leads', roles: ['COUNSELOR'], icon: Users },
        { label: 'My Leave', href: '/counselor/leave', roles: ['COUNSELOR'], icon: Calendar },
        { label: 'Partner Portal', href: '/affiliate', roles: ['AFFILIATE'], icon: UserSquare2 },
        { label: 'API Integration', href: '/affiliate/integration', roles: ['AFFILIATE'], icon: ShieldCheck },
        { label: 'Sessions', href: '/sessions', roles: ['COUNSELOR', 'MANAGER', 'ADMIN'], icon: Calendar },
        { label: 'Reminders', href: '/reminders', roles: ['COUNSELOR', 'MANAGER', 'ADMIN'], icon: Bell },
        { label: 'BULK-LEADS', href: '/bulk-leads', roles: ['ADMIN', 'MANAGER', 'AFFILIATE'], icon: Upload },
        { label: 'Timed-Out Leads', href: '/timeout-leads', roles: ['ADMIN', 'MANAGER'], icon: Clock },
        { label: 'Monitor', href: '/admin?tab=MONITOR', roles: ['ADMIN'], icon: ShieldCheck },
        { label: 'Mentor Hub', href: '/mentor', roles: ['MENTOR', 'ADMIN'], icon: User },
    ];

    const filteredItems = navItems.filter(item => {
        if (!item.roles.includes(role || '')) return false;
        if (role === 'COUNSELOR' && item.label === 'Sessions') {
            return counselorTypes.includes('INTERNAL') || counselorTypes.includes('EXTERNAL');
        }
        return true;
    });

    const sidebarContent = (
        <div className="flex flex-col h-full">
            <div className="p-6 md:p-8 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <img src="/raffles-logo.png" alt="Logo" className="w-10 h-10 object-contain bg-white rounded-xl p-1.5" />
                    <div className="font-sans">
                        <span className="block font-black text-white leading-none text-lg">RAFFLES</span>
                        <span className="text-[9px] text-[#dbb212] font-black tracking-widest uppercase opacity-80">Management</span>
                    </div>
                </div>
                <button onClick={() => setMobileOpen(false)} className="md:hidden p-2 text-slate-400 hover:text-white transition-colors">
                    <X className="w-5 h-5" />
                </button>
            </div>

            <nav className="flex-1 overflow-y-auto p-4 py-6 space-y-1.5 no-scrollbar">
                {filteredItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setMobileOpen(false)}
                            className={`flex items-center px-4 py-3 rounded-xl transition-all duration-300 group ${isActive
                                ? 'bg-[#4d0101] text-white shadow-lg shadow-black/20'
                                : 'text-slate-400 hover:bg-[#dbb212]/10 hover:text-[#dbb212]'
                            }`}
                        >
                            <item.icon className={`w-4 h-4 mr-3 ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-[#dbb212]'}`} />
                            <span className="font-bold text-[10px] uppercase tracking-[0.2em]">{item.label}</span>
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-white/5">
                <div className="px-4 py-4 mb-4 bg-white/5 rounded-2xl flex items-center gap-3 border border-white/5">
                    <div className="w-8 h-8 rounded-full bg-[#dbb212] flex items-center justify-center font-black text-[#600202] text-xs">
                        {(user?.name || 'U').charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-black text-white truncate uppercase tracking-tight">{user?.name}</p>
                        <p className="text-[9px] font-bold text-slate-500 truncate uppercase mt-0.5 tracking-widest">{role}</p>
                    </div>
                </div>
                <button
                    onClick={() => logout()}
                    className="flex items-center px-4 py-3 rounded-xl w-full text-slate-400 hover:bg-rose-500/10 hover:text-rose-500 transition-all group"
                >
                    <X className="w-4 h-4 mr-3" />
                    <span className="font-bold text-[10px] uppercase tracking-[0.2em]">Logout</span>
                </button>
            </div>
        </div>
    );

    return (
        <>
            {/* Mobile Header / TopBar */}
            <header className="fixed top-0 left-0 right-0 h-16 bg-[#600202] border-b border-white/5 flex items-center px-4 md:hidden z-40">
                <button
                    onClick={() => setMobileOpen(true)}
                    className="p-2 text-white hover:bg-white/10 rounded-xl transition-colors"
                >
                    <Menu className="w-6 h-6" />
                </button>
                <div className="flex-1 flex justify-center translate-x-[-12px]">
                    <img src="/raffles-logo.png" alt="Raffles" className="h-8 w-auto bg-white rounded-lg p-1" />
                </div>
            </header>

            {/* Mobile Overlay */}
            {mobileOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[48] md:hidden transition-all duration-300 transform-gpu"
                    onClick={() => setMobileOpen(false)}
                />
            )}

            {/* Mobile/Tablet Drawer - Slide from left */}
            <aside
                className={`fixed left-0 top-0 h-full w-[280px] glass-sidebar text-slate-300 flex flex-col z-[50] transition-transform duration-500 cubic-bezier(0.4, 0, 0.2, 1) transform-gpu md:hidden ${mobileOpen ? 'translate-x-0' : '-translate-x-full'
                    }`}
            >
                {sidebarContent}
            </aside>

            {/* Desktop Sidebar (Always Visible) */}
            <aside className="hidden md:flex w-64 glass-sidebar h-screen fixed left-0 top-0 text-slate-300 flex flex-col z-[50]">
                {sidebarContent}
            </aside>
        </>
    );
}

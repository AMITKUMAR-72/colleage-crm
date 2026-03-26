'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
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
    Calendar
} from 'lucide-react';

export default function Sidebar() {
    const { role, logout } = useAuth();
    const pathname = usePathname();
    const [mobileOpen, setMobileOpen] = useState(false);

    const navItems = [
        { label: 'Admin Panel', href: '/admin/manage', roles: ['ADMIN'], icon: ShieldCheck },
        { label: 'Manager Hub', href: '/manager', roles: ['MANAGER', 'ADMIN'], icon: LayoutDashboard },
        { label: 'Counselor Leaves', href: '/admin/leaves', roles: ['ADMIN', 'MANAGER'], icon: Calendar },
        { label: 'Lead information', href: '/admin', roles: ['ADMIN'], icon: Users },
        { label: 'My Lead', href: '/counselor/leads', roles: ['COUNSELOR'], icon: Users },
        { label: 'My Leave', href: '/counselor/leave', roles: ['COUNSELOR'], icon: Calendar },
        { label: 'Partner Portal', href: '/affiliate', roles: ['AFFILIATE'], icon: UserSquare2 },
        { label: 'Sessions', href: '/sessions', roles: ['COUNSELOR', 'MANAGER', 'ADMIN'], icon: Calendar },
        { label: 'BULK-LEADS', href: '/bulk-leads', roles: ['ADMIN', 'MANAGER', 'AFFILIATE'], icon: Upload },
        { label: 'Timed-Out Leads', href: '/timeout-leads', roles: ['ADMIN', 'MANAGER'], icon: Clock },
        { label: 'Monitor', href: '/admin?tab=MONITOR', roles: ['ADMIN'], icon: ShieldCheck },
        { label: 'Mentor Hub', href: '/mentor', roles: ['MENTOR', 'ADMIN'], icon: User },
    ];

    const filteredItems = navItems.filter(item => item.roles.includes(role || ''));

    const handleNavClick = () => {
        setMobileOpen(false);
    };

    const sidebarContent = (
        <>
            <div className="p-6 md:p-8 border-b border-white/5 flex items-center gap-3">
                <div className="relative">
                    <img
                        src="/raffles-logo.png"
                        alt="Raffles Logo"
                        className="w-12 h-12 shrink-0 object-contain bg-white rounded-xl p-1.5"
                    />
                </div>
                <div className="font-[var(--font-poppins)]">
                    <span className="block font-black text-white leading-none text-xl tracking-tight">RAFFLES</span>
                    <span className="text-[10px] text-[#dbb212] font-black tracking-[0.4em] uppercase leading-none mt-1.5 block opacity-90">Management</span>
                </div>
                {/* Mobile close button */}
                <button
                    onClick={() => setMobileOpen(false)}
                    className="ml-auto md:hidden p-1 text-slate-400 hover:text-white transition-colors"
                >
                    <X className="w-6 h-6" />
                </button>
            </div>

            <nav className="flex-1 p-4 space-y-1">
                {filteredItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={handleNavClick}
                            className={`flex items-center px-4 py-2.5 rounded-lg transition-all duration-200 group ${isActive
                                ? 'bg-[#4d0101] text-white shadow-md shadow-black/20'
                                : 'hover:bg-[#dbb212] hover:text-[#600202]'
                                }`}
                        >
                            <span className="font-bold text-xs uppercase tracking-widest">{item.label}</span>
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-slate-800">
                <button
                    onClick={() => { logout(); setMobileOpen(false); }}
                    className="flex items-center px-4 py-2.5 rounded-lg w-full text-slate-400 hover:bg-rose-500/10 hover:text-rose-500 transition-colors group"
                >
                    <span className="font-bold text-xs uppercase tracking-widest">Sign Out</span>
                </button>
            </div>
        </>
    );

    return (
        <>
            {/* Mobile hamburger trigger — rendered in DashboardLayout header */}
            <button
                onClick={() => setMobileOpen(true)}
                className="fixed top-4 left-4 z-[45] md:hidden p-2.5 bg-slate-900 text-white rounded-xl shadow-2xl border border-white/10 active:scale-95 transition-transform"
                aria-label="Open menu"
            >
                <Menu className="w-5 h-5" />
            </button>

            {/* Mobile overlay */}
            {mobileOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[48] md:hidden transition-opacity"
                    onClick={() => setMobileOpen(false)}
                />
            )}

            {/* Mobile sidebar (slide-in) */}
            <aside
                className={`fixed left-0 top-0 h-full w-72 glass-sidebar text-slate-300 flex flex-col z-[50] transition-transform duration-300 ease-out md:hidden ${mobileOpen ? 'translate-x-0' : '-translate-x-full'
                    }`}
            >
                {sidebarContent}
            </aside>

            {/* Desktop sidebar (always visible) */}
            <aside className="hidden md:flex w-64 glass-sidebar h-screen fixed left-0 top-0 text-slate-300 flex-col z-[50]">
                {sidebarContent}
            </aside>
        </>
    );
}

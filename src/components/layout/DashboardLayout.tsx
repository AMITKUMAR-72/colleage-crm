'use client';

import Sidebar from './Sidebar';
import { useAuth } from '@/context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const { user, role, isLoading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (!isLoading) {
            if (!user) {
                router.push('/login');
                return;
            }

            // Path Protection Logic
            const path = pathname || window.location.pathname;

            if (path.startsWith('/admin') && role !== 'ADMIN' && role !== 'COUNSELOR') {
                router.push('/login');
            } else if (path.startsWith('/manager') && role !== 'MANAGER' && role !== 'ADMIN') {
                router.push('/login');
            } else if (path.startsWith('/counselor') && role !== 'COUNSELOR' && role !== 'MANAGER' && role !== 'ADMIN') {
                router.push('/login');
            } else if (path.startsWith('/affiliate') && role !== 'AFFILIATE' && role !== 'ADMIN') {
                router.push('/login');
            } else if (path.startsWith('/mentor') && role !== 'MENTOR' && role !== 'ADMIN') {
                router.push('/login');
            }
        }
    }, [user, role, isLoading, pathname, router]);

    if (isLoading) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/60 backdrop-blur-sm transition-all min-h-screen">
                <img src="/raffles-logo.png" alt="Loading" className="h-32 w-auto object-contain animate-spin-y-ease-in" />
            </div>
        );
    }

    if (!user) return null;

    return (
        <div className="flex min-h-screen">
            <Sidebar />
            <main className="flex-1 ml-0 md:ml-64 p-4 md:p-8 relative min-w-0">
                <AnimatePresence mode="wait">
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3, ease: 'easeOut' }}
                    >
                        {children}
                    </motion.div>
                </AnimatePresence>
            </main>
        </div>
    );
}

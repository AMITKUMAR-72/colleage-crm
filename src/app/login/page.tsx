'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Role } from '@/types/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, ShieldCheck, ArrowRight, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function LoginPage() {
    const { login, signup, user, isLoading: authLoading } = useAuth();
    const router = useRouter();
    
    const [isLogin, setIsLogin] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        email: '',
        password: '',
        name: '',
        role: 'COUNSELOR' as Role
    });

    useEffect(() => {
        if (!authLoading && user) {
            const path = user.role === 'ADMIN' ? '/admin' 
                      : user.role === 'MANAGER' ? '/manager'
                      : user.role === 'COUNSELOR' ? '/counselor'
                      : user.role === 'AFFILIATE' ? '/affiliate'
                      : '/login';
            router.push(path);
        }
    }, [user, authLoading, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            if (isLogin) {
                await login(formData.email, formData.password);
            } else {
                await signup(formData.name, formData.email, formData.password);
            }
        } catch (err: unknown) {
            console.error("Login attempt failed:", err);
            let message = 'Authentication failed.';
            
            if (err && typeof err === 'object') {
                const axiosError = err as any; 
                const status = axiosError.response?.status;
                const data = axiosError.response?.data;
                const code = axiosError.code; // e.g., ERR_NETWORK
                
                // Construct a detailed debug message
                let detail = '';
                
                if (status) {
                    detail += ` [Status: ${status}]`;
                }
                if (code) {
                    detail += ` [Code: ${code}]`;
                }

                if (data) {
                     if (typeof data === 'string') {
                        message = data;
                     } else if (data.message) {
                        message = data.message;
                     } else if (data.error) {
                        message = typeof data.error === 'string' ? data.error : JSON.stringify(data.error);
                     } else {
                        message = JSON.stringify(data);
                     }
                } else if (axiosError.message) {
                    // Fallback to axios message if no response data (e.g. Network Error)
                    message = axiosError.message;
                }
                
                // Append technical details for the user to report
                message = `${message}${detail}`;
            }
            
            setError(message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen relative flex items-center justify-center bg-[#050505] overflow-hidden font-sans">
            {/* Ambient Background Elements */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px] animate-pulse" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/20 rounded-full blur-[120px] animate-pulse" />

            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative z-10 w-full max-w-md p-1"
            >
                <div className="glass-card p-10 backdrop-blur-3xl bg-white/5 border border-white/10 shadow-2xl overflow-hidden rounded-[2rem]">
                    {/* Header */}
                    <div className="text-center mb-10">
                        <motion.div 
                            initial={{ scale: 0.8 }}
                            animate={{ scale: 1 }}
                            className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-2xl shadow-lg shadow-blue-500/20 mb-6"
                        >
                            <ShieldCheck className="w-8 h-8 text-white" />
                        </motion.div>
                        <h1 className="text-4xl font-black text-white tracking-tight mb-2">
                            RAFFLES <span className="text-blue-500">CRM</span>
                        </h1>
                        <p className="text-slate-400 text-sm font-medium">
                            {isLogin ? 'Welcome back, please sign in' : 'Create your professional account'}
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Name Field (Signup Only) */}
                        <AnimatePresence mode="wait">
                            {!isLogin && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="mb-5"
                                >
                                    <div className="relative group">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                                        <input 
                                            type="text"
                                            placeholder="Full Name"
                                            required={!isLogin}
                                            value={formData.name}
                                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all font-medium"
                                        />
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Email Field */}
                        <div className="relative group">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                            <input 
                                type="email"
                                placeholder="Email Address"
                                required
                                value={formData.email}
                                onChange={(e) => setFormData({...formData, email: e.target.value})}
                                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all font-medium"
                            />
                        </div>

                        {/* Password Field */}
                        <div className="relative group">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                            <input 
                                type="password"
                                placeholder="Password"
                                required
                                value={formData.password}
                                onChange={(e) => setFormData({...formData, password: e.target.value})}
                                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all font-medium"
                            />
                        </div>

                        {/* Role selection is now handled server-side/auto-detected */}

                        {error && (
                            <motion.p 
                                initial={{ opacity: 0 }} 
                                animate={{ opacity: 1 }}
                                className="text-rose-500 text-xs font-bold text-center bg-rose-500/10 py-2 rounded-lg border border-rose-500/20"
                            >
                                {error}
                            </motion.p>
                        )}

                        <button 
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold py-4 rounded-2xl shadow-xl shadow-blue-600/20 hover:shadow-blue-600/40 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 group disabled:opacity-50 disabled:hover:scale-100"
                        >
                            {isLoading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    {isLogin ? 'Sign In' : 'Create Account'}
                                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-10 text-center">
                        <button 
                            onClick={() => setIsLogin(!isLogin)}
                            className="text-slate-400 text-sm font-medium hover:text-white transition-colors"
                        >
                            {isLogin ? "Don't have an account? " : "Already have an account? "}
                            <span className="text-blue-500 font-bold ml-1 hover:underline underline-offset-4 decoration-2">
                                {isLogin ? 'Create One' : 'Sign In'}
                            </span>
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Eye, EyeOff } from 'lucide-react';

const SignIn: React.FC = () => {
    const { login, user, isLoading: authLoading } = useAuth();
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        if (!authLoading && user) {
            const path = user.role === 'ADMIN' ? '/admin'
                : user.role === 'MANAGER' ? '/manager'
                    : user.role === 'COUNSELOR' ? '/counselor/leads'
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
            await login(email, password);
        } catch (err: unknown) {
            console.error("Login attempt failed:", err);
            setError('Invalid credentials');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-[#F5EEE6] min-h-screen flex flex-col transition-colors duration-300 font-sans text-slate-900">
            {isLoading && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/60 backdrop-blur-sm transition-all">
                    <img src="/raffles-logo.png" alt="Loading" className="h-32 w-auto object-contain animate-spin-y-ease-in" />
                </div>
            )}

            <main className="flex-grow flex items-center justify-center p-6">
                <div className="w-full max-w-[480px] space-y-8">
                    <div className="bg-white rounded-xl shadow-xl border border-stone-200 overflow-hidden">
                        <div className="p-8">
                            <div className="text-center mb-8 flex flex-col items-center">
                                <h1 className="text-stone-900 tracking-tight text-3xl font-bold mb-2">Welcome</h1>
                                <img src="/raffles-logo.png" alt="Raffles University" className="h-[80px] w-auto my-3 object-contain " />
                                <p className="text-stone-500 text-base font-normal">Welcome back to Raffles University</p>
                            </div>
                            <form className="space-y-5" onSubmit={handleSubmit}>
                                <div>
                                    <div className="flex flex-col gap-2 mb-5">
                                        <label className="text-stone-700 text-base font-medium">Username or Email</label>
                                        <input
                                            className="form-input w-full rounded-lg text-stone-900 border border-stone-300 bg-stone-50 focus:ring-2 focus:ring-[#dbb212] focus:border-[#dbb212] h-14 placeholder:text-stone-400 px-4 text-base font-normal transition-all outline-none"
                                            placeholder="e.g. john@globaledu.com"
                                            type="email"
                                            required
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                        />
                                    </div>
                                    <div className="flex flex-col gap-2 mb-1">
                                        <label className="text-stone-700 text-base font-medium">Password</label>
                                        <div className="flex w-full items-stretch rounded-lg group">
                                            <input
                                                className="form-input flex-1 rounded-l-lg text-stone-900 border border-stone-300 bg-stone-50 focus:ring-2 focus:ring-[#dbb212] focus:border-[#dbb212] border-r-0 h-14 placeholder:text-stone-400 px-4 text-base font-normal outline-none"
                                                placeholder="Enter your password"
                                                type={showPassword ? "text" : "password"}
                                                required
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                            />
                                            <button
                                                className="text-stone-400 flex border border-stone-300 bg-stone-50 border-l-0 items-center justify-center px-4 rounded-r-lg group-focus-within:border-primary/20 transition-all"
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                            >
                                                {showPassword ? (
                                                    <EyeOff className="w-5 h-5" />
                                                ) : (
                                                    <Eye className="w-5 h-5" />
                                                )}
                                            </button>
                                        </div>
                                        <div className="flex justify-end mt-1">
                                            <a className="text-sm font-semibold text-primary hover:underline transition-colors" href="#">Forgot password?</a>
                                        </div>
                                    </div>

                                    {error && (
                                        <p className="text-red-500 text-sm mt-2 font-medium">{error}</p>
                                    )}


                                    <button
                                        className="w-full h-14 bg-[#4d0101] hover:bg-[#4d0101] text-white font-bold text-lg rounded-lg transition-colors duration-200 shadow-lg shadow-primary/10 active:scale-[0.98] mt-2 flex justify-center items-center disabled:opacity-70 disabled:cursor-not-allowed"
                                        type="submit"
                                        disabled={isLoading}
                                    >
                                        {isLoading ? 'Please wait...' : 'Login'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>

                </div>
            </main>
            <footer className="p-6 text-center">
                <p className="text-xs text-stone-500">
                    © 2024 Global Education Management System. All performance tracking and performance data is subject to Terms of Service.
                </p>
            </footer>
        </div>
    );
};

export default SignIn;

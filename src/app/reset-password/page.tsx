'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff, Lock, CheckCircle2 } from 'lucide-react';
import LoadingButton from '@/components/ui/LoadingButton';
import { AuthService } from '@/services/authService';
import toast from 'react-hot-toast';

function ResetPasswordForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get('token');

    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    useEffect(() => {
        if (!token) {
            setError('Invalid or expired reset token. Please request a new one.');
        }
    }, [token]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!token) {
            setError('Missing reset token');
            return;
        }

        if (newPassword !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (newPassword.length < 6) {
            setError('Password must be at least 6 characters long');
            return;
        }

        setIsLoading(true);

        try {
            await AuthService.resetPassword({
                token,
                newPassword,
                confirmPassword
            });
            toast.success('Password reset successfully!');
            setIsSuccess(true);
            setTimeout(() => {
                router.push('/login');
            }, 3000);
        } catch (err: any) {
            console.error("Reset password attempt failed:", err);
            setError(err.response?.data?.message || 'Failed to reset password. Please try again.');
            toast.error('Reset failed');
        } finally {
            setIsLoading(false);
        }
    };

    if (isSuccess) {
        return (
            <div className="text-center p-8 space-y-6">
                <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-10 h-10" />
                </div>
                <h2 className="text-2xl font-bold text-stone-900">Password Reset Successful!</h2>
                <p className="text-stone-500">Your password has been reset. You will be redirected to the login page shortly.</p>
                <div className="pt-4">
                    <LoadingButton
                        onClick={() => router.push('/login')}
                        className="w-full h-14 bg-[#4d0101] hover:bg-[#4d0101] text-white font-bold text-lg rounded-lg transition-colors"
                    >
                        Go to Login
                    </LoadingButton>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8">
            <div className="text-center mb-8 flex flex-col items-center">
                <h1 className="text-stone-900 tracking-tight text-3xl font-bold mb-2">Create New Password</h1>
                <img src="/raffles-logo.png" alt="Raffles University" className="h-[80px] w-auto my-3 object-contain " />
                <p className="text-stone-500 text-base font-normal">Set a secure password for your account</p>
            </div>

            <form className="space-y-5" onSubmit={handleSubmit}>
                <div className="flex flex-col gap-2">
                    <label className="text-stone-700 text-base font-medium">New Password</label>
                    <div className="flex w-full items-stretch rounded-lg group transition-all">
                        <div className="flex items-center justify-center px-4 bg-stone-50 border border-stone-300 border-r-0 rounded-l-lg text-stone-400 group-hover:border-[#dbb212] group-focus-within:border-[#dbb212]">
                            <Lock className="w-5 h-5" />
                        </div>
                        <input
                            className="form-input flex-1 text-stone-900 border border-stone-300 bg-stone-50 group-hover:border-[#dbb212] focus:ring-2 focus:ring-[#dbb212]/20 focus:border-[#dbb212] border-r-0 h-14 placeholder:text-stone-400 px-4 text-base font-normal outline-none transition-all"
                            placeholder="Enter new password"
                            type={showPassword ? "text" : "password"}
                            required
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                        />
                        <button
                            className="text-stone-400 flex border border-stone-300 bg-stone-50 border-l-0 items-center justify-center px-4 rounded-r-lg group-hover:border-[#dbb212] group-focus-within:border-[#dbb212] hover:text-[#dbb212] transition-all"
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                        >
                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                    </div>
                </div>

                <div className="flex flex-col gap-2">
                    <label className="text-stone-700 text-base font-medium">Confirm Password</label>
                    <div className="flex w-full items-stretch rounded-lg group transition-all">
                        <div className="flex items-center justify-center px-4 bg-stone-50 border border-stone-300 border-r-0 rounded-l-lg text-stone-400 group-hover:border-[#dbb212] group-focus-within:border-[#dbb212]">
                            <Lock className="w-5 h-5" />
                        </div>
                        <input
                            className="form-input flex-1 text-stone-900 border border-stone-300 bg-stone-50 group-hover:border-[#dbb212] focus:ring-2 focus:ring-[#dbb212]/20 focus:border-[#dbb212] border-r-0 h-14 placeholder:text-stone-400 px-4 text-base font-normal outline-none transition-all"
                            placeholder="Confirm new password"
                            type={showConfirmPassword ? "text" : "password"}
                            required
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                        <button
                            className="text-stone-400 flex border border-stone-300 bg-stone-50 border-l-0 items-center justify-center px-4 rounded-r-lg group-hover:border-[#dbb212] group-focus-within:border-[#dbb212] hover:text-[#dbb212] transition-all"
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                            {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="p-3 bg-red-50 border border-red-100 rounded-lg">
                        <p className="text-red-500 text-sm font-medium">{error}</p>
                    </div>
                )}

                <LoadingButton
                    type="submit"
                    loading={isLoading}
                    loadingText="Updating Password..."
                    disabled={!token}
                    className="w-full h-14 bg-[#4d0101] hover:bg-[#4d0101] text-white font-bold text-lg rounded-lg transition-colors duration-200 shadow-lg shadow-primary/10 active:scale-[0.98] mt-2 flex justify-center items-center"
                >
                    Reset Password
                </LoadingButton>
            </form>
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <div className="bg-[#F5EEE6] min-h-screen flex flex-col transition-colors duration-300 font-sans text-slate-900">
            <main className="flex-grow flex items-center justify-center p-6">
                <div className="w-full max-w-[480px] space-y-8">
                    <div className="bg-white rounded-xl shadow-xl border border-stone-200 overflow-hidden">
                        <Suspense fallback={<div className="p-20 text-center">Loading...</div>}>
                            <ResetPasswordForm />
                        </Suspense>
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
}

'use client';

import React from 'react';

interface LoadingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    loading?: boolean;
    loadingText?: string;
    children: React.ReactNode;
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'success';
}

/**
 * A button that is automatically disabled and shows a spinner while `loading` is true.
 * Drop-in replacement for <button> — pass `loading` and optionally `loadingText`.
 */
export default function LoadingButton({
    loading = false,
    loadingText,
    children,
    disabled,
    className = '',
    variant,
    ...props
}: LoadingButtonProps) {
    const isDisabled = loading || disabled;

    return (
        <button
            {...props}
            disabled={isDisabled}
            className={`relative inline-flex items-center justify-center gap-2 transition-all duration-200
                ${isDisabled ? 'opacity-60 cursor-not-allowed pointer-events-none select-none' : ''}
                ${className}`}
            aria-busy={loading}
        >
            {loading && (
                <span className="inline-block w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin shrink-0" />
            )}
            <span className={loading ? 'opacity-90' : ''}>
                {loading && loadingText ? loadingText : children}
            </span>
        </button>
    );
}

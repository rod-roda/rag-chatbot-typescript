'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { verifyEmail } from '@/services/api';

type Status = 'loading' | 'success' | 'error';

function VerifyEmailContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [status, setStatus] = useState<Status>('loading');
    const [errorMessage, setErrorMessage] = useState('');
    const called = useRef(false);

    useEffect(() => {
        if (called.current) return;
        called.current = true;

        const token = searchParams.get('token');

        if (!token) {
            setErrorMessage('No verification token found.');
            setStatus('error');
            return;
        }

        verifyEmail(token)
            .then(() => {
                setStatus('success');
                setTimeout(() => router.replace('/'), 2000);
            })
            .catch((err: unknown) => {
                setErrorMessage(
                    err instanceof Error ? err.message : 'This link is invalid or expired.'
                );
                setStatus('error');
            });
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    if (status === 'loading') {
        return (
            <div className="flex flex-col items-center gap-3">
                <div className="w-5 h-5 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
                <p className="text-[13px] text-gray-500">Verifying your email…</p>
            </div>
        );
    }

    if (status === 'success') {
        return (
            <div className="text-center space-y-2">
                <p className="text-[13px] font-medium text-gray-800">Email verified!</p>
                <p className="text-[12px] text-gray-400">Redirecting you to the app…</p>
            </div>
        );
    }

    return (
        <div className="text-center space-y-4">
            <div className="text-[12px] text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {errorMessage || 'This link is invalid or expired.'}
            </div>
            <a
                href="/"
                className="inline-block text-[12px] text-blue-500 hover:text-blue-600 transition-colors"
            >
                Back to login
            </a>
        </div>
    );
}

export default function VerifyEmailPage() {
    return (
        <div className="flex items-center justify-center min-h-screen bg-[#f8f9fb]">
            <div className="w-full max-w-sm mx-4">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center gap-2 mb-3">
                        <span className="w-2 h-2 rounded-full bg-blue-500" />
                        <span className="text-sm font-medium text-gray-800 tracking-[0.06em] uppercase">
                            RAG Studio
                        </span>
                    </div>
                    <p className="text-xs text-gray-400">Email verification</p>
                </div>
                <div className="bg-white border border-gray-200 rounded-xl p-6">
                    <Suspense
                        fallback={
                            <div className="flex flex-col items-center gap-3">
                                <div className="w-5 h-5 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
                                <p className="text-[13px] text-gray-500">Loading…</p>
                            </div>
                        }
                    >
                        <VerifyEmailContent />
                    </Suspense>
                </div>
            </div>
        </div>
    );
}

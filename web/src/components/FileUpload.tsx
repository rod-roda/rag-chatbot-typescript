'use client';

import { useState, useRef } from 'react';
import { uploadDocument } from '@/services/api';

export default function FileUpload({ onUploadSuccess }: { onUploadSuccess?: () => void }) {
    const [status, setStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;

        setStatus('uploading');
        setMessage('');

        try {
            const data = await uploadDocument(file);
            setStatus('success');
            setMessage(`${file.name} - ${data.message}`);
            onUploadSuccess?.();
        } catch (err) {
            setStatus('error');
            setMessage(err instanceof Error ? err.message : 'Unknown error');
        } finally {
            if (inputRef.current) inputRef.current.value = '';
        }
    }

    return (

        <div className="rounded-lg border border-gray-800 bg-gray-900 p-4">
            <h2 className="text-sm font-semibold text-gray-400 mb-3">Document Upload</h2>

            <label className="flex items-center justify-center gap-2 cursor-pointer rounded-lg border-2 border-dashed border-gray-700 hover:border-gray-500 p-6 transition-colors">
                <span className="text-sm text-gray-400">
                    {status === 'uploading' ? 'Uploading...' : 'Click to upload PDF or TXT'}
                </span>
                <input
                    ref={inputRef}
                    type="file"
                    accept=".pdf,.txt"
                    onChange={handleUpload}
                    disabled={status === 'uploading'}
                    className="hidden"
                />
            </label>

            {message && (
                <p className={`mt-3 text-sm ${status === 'error' ? 'text-red-400' : 'text-green-400'}`}>
                    {message}
                </p>
            )}
        </div>
    );
}

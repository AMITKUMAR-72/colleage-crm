'use client';

import { useState } from 'react';
import api, { API_BASE_URL } from '../../services/api';

interface Props {
    affiliateId?: number;
}

export default function AffiliateApiPanel({ affiliateId }: Props) {
    const [copied, setCopied] = useState(false);

    // Use the PUBLIC URL for external integrations, not the internal proxy path
    const PUBLIC_API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8085';
    // const PUBLIC_API_URL = 'https://api.rafunirp.com';
    const webhookUrl = `${PUBLIC_API_URL}/api/leads/integration/AffiliatePartner`;

    const curlExample = `curl -X POST "${webhookUrl}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "address": "123 Main Street",
    "phone": "1234567890",
    "course": "Computer Science",
    "intake": "Fall 2026"
  }'`;

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-gray-100">
                <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                    🔌 API Integration
                </h3>
                <p className="text-xs text-gray-500 mt-1">Programmatically submit leads via REST API</p>
            </div>

            <div className="p-6 space-y-5">
                {/* Webhook URL */}
                <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 block">Webhook Endpoint</label>
                    <div className="flex items-center gap-2">
                        <code className="flex-1 px-3 py-2.5 bg-gray-900 text-green-400 text-xs rounded-lg font-mono overflow-x-auto">
                            POST {webhookUrl}
                        </code>
                        <button
                            onClick={() => handleCopy(webhookUrl)}
                            className="px-3 py-2.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-medium hover:bg-blue-100 transition flex-shrink-0"
                        >
                            {copied ? '✓ Copied' : '📋 Copy'}
                        </button>
                    </div>
                </div>

                {/* Request format */}
                <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 block">Request Body (JSON)</label>
                    <div className="bg-gray-900 rounded-lg p-4 relative group">
                        <pre className="text-xs text-green-400 font-mono overflow-x-auto whitespace-pre-wrap">{`{
  "name": "string (required, 3-20 chars, alphabets only)",
  "email": "string (required, valid email)",
  "address": "string (required, 10-50 chars)",
  "phone": "string (required, exactly 10 digits)",
  "course": "string (optional)",
  "intake": "string (optional)",
  "status": "NEW (default)",
  "score": "COLD | WARM | HOT (optional)"
}`}</pre>
                    </div>
                </div>

                {/* cURL example */}
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">cURL Example</label>
                        <button
                            onClick={() => handleCopy(curlExample)}
                            className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                        >
                            Copy command
                        </button>
                    </div>
                    <div className="bg-gray-900 rounded-lg p-4">
                        <pre className="text-xs text-green-400 font-mono overflow-x-auto whitespace-pre-wrap">{curlExample}</pre>
                    </div>
                </div>

                {/* Response info */}
                <div className="bg-blue-50 rounded-xl p-4">
                    <h4 className="text-xs font-bold text-blue-700 mb-2">Response</h4>
                    <ul className="text-xs text-blue-600 space-y-1">
                        <li>• <strong>201 Created</strong> — Lead submitted successfully</li>
                        <li>• <strong>400 Bad Request</strong> — Validation errors in request body</li>
                        <li>• <strong>409 Conflict</strong> — Lead with same email already exists</li>
                    </ul>
                </div>

                {affiliateId && (
                    <p className="text-[10px] text-gray-400 text-center">
                        Affiliate ID: {affiliateId}
                    </p>
                )}
            </div>
        </div>
    );
}

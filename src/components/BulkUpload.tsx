'use client';

import { useState, useRef } from 'react';
import { LeadService } from '../services/leadService';
import { 
    Upload, 
    FileSpreadsheet, 
    CheckCircle2, 
    AlertCircle, 
    Download,
    Info,
    FileUp
} from 'lucide-react';

const BulkUpload = () => {
    const [file, setFile] = useState<File | null>(null);
    const [status, setStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');
    const [uploadSummary, setUploadSummary] = useState<{
        total: number;
        success: number;
        duplicate: number;
        failed: string[];
    } | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setFile(e.target.files[0]);
            setStatus('idle');
            setUploadSummary(null);
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        setStatus('uploading');
        try {
            const result = await LeadService.bulkUploadLeads(file);
            
            if (result.success_leads > 0 || (result.failed_leads && result.failed_leads.length > 0)) {
                setStatus('success');
                setMessage(`Import completed: ${result.success_leads} succeeded, ${result.duplicate_leads} duplicates skipped.`);
                setUploadSummary({
                    total: result.total_leads,
                    success: result.success_leads,
                    duplicate: result.duplicate_leads,
                    failed: result.failed_leads || []
                });
            } else {
                setStatus('error');
                setMessage('No leads were imported. Please check your file format.');
            }
        } catch (err: any) {
            console.error("Upload failed", err);
            setStatus('error');
            
            if (err.response?.status === 403) {
                setMessage("Access Denied: Your account does not have permission to perform bulk uploads (Admin/Manager required).");
            } else {
                const serverMessage = err.response?.data?.message || err.response?.data?.failed_leads?.[0];
                const errorMessage = serverMessage || (err instanceof Error ? err.message : 'Failed to upload file.');
                setMessage(errorMessage);
            }
        }
    };

    const handleDownloadTemplate = () => {
        console.log("Downloading template...");
        alert("Template download functionality not yet implemented.");
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h2 className="font-bold text-gray-800 mb-6 flex items-center gap-2">
                <Upload className="w-5 h-5 text-blue-600" />
                Bulk Lead Upload
            </h2>

            <div 
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-colors ${
                    file ? 'border-blue-400 bg-blue-50/30' : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                }`}
            >
                <input 
                    type="file" 
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    accept=".xlsx,.xls"
                />
                <FileUp className={`w-10 h-10 mb-4 ${file ? 'text-blue-500' : 'text-gray-300'}`} />
                <p className="text-sm font-medium text-gray-600 text-center">
                    {file ? file.name : 'Click to select Excel file'}
                </p>
                <p className="text-xs text-gray-400 mt-1">Single file up to 10MB</p>
            </div>

            {status !== 'idle' && (
                <div className={`mt-6 p-4 rounded-lg flex items-start gap-3 ${
                    status === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                    status === 'error' ? 'bg-rose-50 text-rose-700 border border-rose-100' :
                    'bg-blue-50 text-blue-700 border border-blue-100'
                }`}>
                    {status === 'success' && <CheckCircle2 className="w-5 h-5 flex-shrink-0" />}
                    {status === 'error' && <AlertCircle className="w-5 h-5 flex-shrink-0" />}
                    {status === 'uploading' && <Upload className="w-5 h-5 flex-shrink-0 animate-bounce" />}
                    <div className="flex-1 text-sm font-medium">
                        {status === 'uploading' ? 'Processing file...' : message}
                    </div>
                </div>
            )}

            <button
                disabled={!file || status === 'uploading'}
                onClick={handleUpload}
                className="w-full mt-6 bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
                Start Import
            </button>

            <div className="mt-8 pt-8 border-t border-gray-100">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Required Excel Format</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-[11px] border-collapse">
                        <thead>
                            <tr className="bg-gray-50 text-gray-500">
                                <th className="p-2 border border-gray-100 rounded-tl-lg">Name</th>
                                <th className="p-2 border border-gray-100">Email</th>
                                <th className="p-2 border border-gray-100">Address</th>
                                <th className="p-2 border border-gray-100">Phone</th>
                                <th className="p-2 border border-gray-100">Course</th>
                                <th className="p-2 border border-gray-100">Intake</th>
                                <th className="p-2 border border-gray-100">Status</th>
                                <th className="p-2 border border-gray-100">Score</th>
                                <th className="p-2 border border-gray-100 rounded-tr-lg">Campaign</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr className="text-gray-400">
                                <td className="p-2 border border-gray-100">John Doe</td>
                                <td className="p-2 border border-gray-100">john@abc.com</td>
                                <td className="p-2 border border-gray-100">New York</td>
                                <td className="p-2 border border-gray-100">9876543210</td>
                                <td className="p-2 border border-gray-100">MBA</td>
                                <td className="p-2 border border-gray-100">2024</td>
                                <td className="p-2 border border-gray-100">NEW</td>
                                <td className="p-2 border border-gray-100">COLD</td>
                                <td className="p-2 border border-gray-100 italic">ID (1, 2...)</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <p className="text-[10px] text-gray-400 mt-3 flex items-center gap-1.5">
                    <AlertCircle className="w-3 h-3" />
                    Important: Campaign column must contain the Numeric ID of the source.
                </p>
            </div>
        </div>
    );
}

export default BulkUpload;

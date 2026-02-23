'use client';

import { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
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

const REQUIRED_HEADERS = ['Name', 'Email', 'Address', 'Phone', 'Course', 'Intake', 'Status', 'Score', 'Campaign'];

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
    const [isValidating, setIsValidating] = useState(false);
    const [validationError, setValidationError] = useState<string | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const selectedFile = e.target.files[0];
            setFile(selectedFile);
            setStatus('idle');
            setUploadSummary(null);
            setValidationError(null);

            // Validate format immediately
            await validateFile(selectedFile);
        }
    };

    const validateFile = (file: File): Promise<boolean> => {
        return new Promise((resolve) => {
            setIsValidating(true);
            setValidationError(null);

            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = new Uint8Array(e.target?.result as ArrayBuffer);
                    const workbook = XLSX.read(data, { type: 'array' });
                    const firstSheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[firstSheetName];
                    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

                    if (jsonData.length === 0) {
                        const error = "The selected file is empty.";
                        setValidationError(error);
                        resolve(false);
                        return;
                    }

                    const headers = (jsonData[0] as string[]).map(h => String(h).trim());
                    const missingHeaders = REQUIRED_HEADERS.filter(
                        required => !headers.some(h => h.toLowerCase() === required.toLowerCase())
                    );

                    if (missingHeaders.length > 0) {
                        const error = `Invalid format. Missing headers: ${missingHeaders.join(', ')}`;
                        setValidationError(error);
                        resolve(false);
                        return;
                    }

                    resolve(true);
                } catch (err) {
                    console.error("Validation failed", err);
                    setValidationError("Failed to read Excel file format.");
                    resolve(false);
                } finally {
                    setIsValidating(false);
                }
            };
            reader.readAsArrayBuffer(file);
        });
    };

    const handleUpload = async () => {
        if (!file) return;

        // Final validation check
        const isValid = await validateFile(file);
        if (!isValid) {
            setStatus('error');
            setMessage(validationError || "Invalid file format.");
            return;
        }

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
                setMessage("Access Denied: Your account does not have permission to perform bulk uploads (Admin/Manager/Partner required).");
            } else {
                const serverMessage = err.response?.data?.message || err.response?.data?.failed_leads?.[0];
                const errorMessage = serverMessage || (err instanceof Error ? err.message : 'Failed to upload file.');
                setMessage(errorMessage);
            }
        }
    };

    const simplifyReason = (rawReason: string) => {
        if (!rawReason) return "Unknown error";

        // Handle Enum constant errors (e.g., "No enum constant ... Status.FOLLOW-UP")
        if (rawReason.includes("No enum constant")) {
            const parts = rawReason.split('.');
            const value = parts[parts.length - 1];
            const field = rawReason.includes("Status") ? "Status" :
                rawReason.includes("Score") ? "Score" : "field";
            return `"${value}" is not a valid ${field}. Please use the standard labels.`;
        }

        // Handle SQL Not-Null constraints (usually missing required data)
        if (rawReason.includes("violates not-null constraint")) {
            if (rawReason.includes("course_id")) return "The 'Course' information is missing or incorrect for this lead.";
            if (rawReason.includes("campaign_id")) return "The 'Campaign ID' is missing or incorrect. Please use a numeric ID.";
            if (rawReason.includes("email")) return "Email address is required.";
            return "Some required information is missing for this row.";
        }

        // Handle common backend patterns
        if (rawReason.includes("Duplicate email")) {
            const email = rawReason.split("->")[1]?.trim() || "";
            return `This email is already in the system: ${email}`;
        }

        if (rawReason.includes("Required field")) {
            return `Missing a required information in this row.`;
        }

        if (rawReason.includes("Invalid status")) {
            return `The status is not valid. Use labels like NEW, COLD, etc.`;
        }

        // Default: just clean up slightly
        return rawReason.replace("Reason: ", "").trim();
    };

    const handleDownloadTemplate = () => {
        console.log("Downloading template...");
        alert("Template download functionality not yet implemented.");
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center">
            <h2 className="font-bold text-gray-800 mb-6 flex items-center justify-center gap-2 w-full">
                <Upload className="w-5 h-5 text-blue-600" />
                Bulk Lead Upload
            </h2>

            <div
                onClick={() => fileInputRef.current?.click()}
                className={`w-full border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center cursor-pointer transition-colors ${file ? 'border-blue-400 bg-blue-50/30' : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
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
                {isValidating && <p className="text-[10px] text-blue-500 mt-1 animate-pulse">Validating format...</p>}
                {validationError && <p className="text-[10px] text-rose-500 mt-1 text-center font-medium">⚠️ {validationError.replace("Invalid format. Missing headers:", "Please add these columns to your Excel:")}</p>}
                {!isValidating && !validationError && file && <p className="text-[10px] text-emerald-500 mt-1">Excellent! Your file format is correct ✓</p>}
                <p className="text-xs text-gray-400 mt-1">Single file up to 10MB</p>
            </div>

            {status !== 'idle' && (
                <div className={`mt-6 p-4 rounded-lg flex items-start gap-3 ${status === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                    status === 'error' ? 'bg-rose-50 text-rose-700 border border-rose-100' :
                        'bg-blue-50 text-blue-700 border border-blue-100'
                    }`}>
                    {status === 'success' && <CheckCircle2 className="w-5 h-5 flex-shrink-0" />}
                    {status === 'error' && <AlertCircle className="w-5 h-5 flex-shrink-0" />}
                    {status === 'uploading' && <Upload className="w-5 h-5 flex-shrink-0 animate-bounce" />}
                    <div className="flex-1 text-sm font-medium">
                        {status === 'uploading' ? 'Processing file...' :
                            status === 'success' ? 'All done! Your leads have been imported.' : message}
                    </div>
                </div>
            )}

            {uploadSummary && uploadSummary.failed.length > 0 && (
                <div className="mt-4 p-4 bg-amber-50 rounded-lg border border-amber-100">
                    <h4 className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5" />
                        Some rows were skipped ({uploadSummary.failed.length})
                    </h4>
                    <div className="max-h-40 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                        {uploadSummary.failed.map((fail, index) => {
                            const rowNum = fail.match(/Row: (\d+)/)?.[1] || index + 1;
                            const reason = fail.split(', Reason: ')[1] || fail;

                            return (
                                <div key={index} className="text-[11px] text-amber-700 bg-white/50 p-2 rounded border border-amber-50 flex items-start gap-2">
                                    <span className="bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded text-[10px] font-bold">
                                        Line {rowNum}
                                    </span>
                                    <span className="flex-1 leading-relaxed">
                                        {simplifyReason(reason)}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            <button
                disabled={!file || status === 'uploading' || !!validationError || isValidating}
                onClick={handleUpload}
                className="w-full mt-6 bg-[#4d0101] text-white font-bold py-3 rounded-xl hover:bg-[#4d0101] transition disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
                {status === 'uploading' ? 'Uploading...' : 'Start Import'}
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

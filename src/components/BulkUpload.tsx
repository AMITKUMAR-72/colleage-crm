'use client';

import { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { LeadService } from '../services/leadService';
import {
    Upload,
    CheckCircle2,
    AlertCircle,
    FileUp
} from 'lucide-react';

const REQUIRED_HEADERS = ['Campaign'];

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
            setStatus('idle');
            setUploadSummary(null);
            setValidationError(null);

            // Validate format immediately
            const { isValid, newFile } = await validateFile(selectedFile);
            setFile(newFile || selectedFile);
        }
    };

    const validateFile = (file: File): Promise<{ isValid: boolean; newFile?: File }> => {
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
                    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

                    if (jsonData.length <= 1) { // Only headers
                        setValidationError("The selected file is empty or missing data.");
                        resolve({ isValid: false });
                        return;
                    }

                    const headers = (jsonData[0] || []).map(h => String(h).trim());
                    const missingHeaders = REQUIRED_HEADERS.filter(
                        required => !headers.some(h => h.toLowerCase() === required.toLowerCase())
                    );

                    if (missingHeaders.length > 0) {
                        setValidationError(`Missing required column headers: ${missingHeaders.join(', ')}`);
                        resolve({ isValid: false });
                        return;
                    }

                    const hasEmail = headers.some(h => h.toLowerCase() === 'email');
                    const hasPhone = headers.some(h => h.toLowerCase() === 'phone');

                    if (!hasEmail && !hasPhone) {
                        setValidationError("Missing required column headers: You must provide either an 'Email' or 'Phone' column.");
                        resolve({ isValid: false });
                        return;
                    }

                    const emailIndex = headers.findIndex(h => h.toLowerCase() === 'email');
                    const phoneIndex = headers.findIndex(h => h.toLowerCase() === 'phone');
                    const campaignIndex = headers.findIndex(h => h.toLowerCase() === 'campaign');

                    let needsRewrite = false;

                    for (let i = 1; i < jsonData.length; i++) {
                        const row = jsonData[i];
                        if (!row || row.length === 0 || row.every(cell => !cell)) continue;

                        const email = emailIndex !== -1 ? row[emailIndex] : null;
                        const phone = phoneIndex !== -1 ? row[phoneIndex] : null;
                        let campaign = campaignIndex !== -1 ? row[campaignIndex] : null;

                        // Check mandatory fields
                        if (!email && !phone) {
                            setValidationError(`Row ${i + 1}: Either Email or Phone is mandatory.`);
                            resolve({ isValid: false });
                            return;
                        }

                        if (!campaign) {
                            setValidationError(`Row ${i + 1}: Campaign is mandatory.`);
                            resolve({ isValid: false });
                            return;
                        }

                        if (typeof campaign === 'number') {
                            setValidationError(`Row ${i + 1}: Campaign should be a name (e.g. "FACEBOOK"), not a numeric ID.`);
                            resolve({ isValid: false });
                            return;
                        }

                        if (typeof campaign === 'string' && campaign !== campaign.toUpperCase()) {
                            jsonData[i][campaignIndex] = campaign.toUpperCase();
                            needsRewrite = true;
                        }
                    }

                    let returnFile = file;
                    if (needsRewrite) {
                        const newWorksheet = XLSX.utils.aoa_to_sheet(jsonData);
                        workbook.Sheets[firstSheetName] = newWorksheet;
                        const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
                        returnFile = new File([wbout], file.name, { type: file.type || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
                    }

                    resolve({ isValid: true, newFile: returnFile });
                } catch (err) {
                    console.error("Validation failed", err);
                    setValidationError("Failed to read Excel file format.");
                    resolve({ isValid: false });
                } finally {
                    setIsValidating(false);
                }
            };
            reader.readAsArrayBuffer(file);
        });
    };

    const handleUpload = async () => {
        if (!file) return;

        // Final validation check just in case
        const { isValid, newFile } = await validateFile(file);
        if (!isValid) {
            setStatus('error');
            setMessage(validationError || "Invalid file format.");
            return;
        }

        const fileToUpload = newFile || file;

        setStatus('uploading');
        try {
            const result = await LeadService.bulkUploadLeads(fileToUpload);

            if (result.success_leads > 0 || (result.failed_leads && result.failed_leads.length > 0)) {
                setStatus('success');
                setMessage(`Import completed: ${result.success_leads} succeeded, ${result.duplicate_leads} duplicates skipped.`);
                setUploadSummary({
                    total: result.total_leads,
                    success: result.success_leads,
                    duplicate: result.duplicate_leads,
                    failed: result.failed_leads || []
                });
                setFile(null); // Reset after success
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

        if (rawReason.includes("No enum constant")) {
            const parts = rawReason.split('.');
            const value = parts[parts.length - 1];
            const field = rawReason.includes("Status") ? "Status" :
                rawReason.includes("Score") ? "Score" : "field";
            return `"${value}" is not a valid ${field}. Please use the standard labels.`;
        }
        if (rawReason.includes("violates not-null constraint")) {
            if (rawReason.includes("course")) return "The 'Course' information is missing or incorrect for this lead.";
            if (rawReason.includes("campaign")) return "The 'Campaign' name is missing or incorrect.";
            if (rawReason.includes("email")) return "Email address is required.";
            return "Some required information is missing for this row.";
        }
        if (rawReason.includes("Duplicate email")) {
            const email = rawReason.split("->")[1]?.trim() || "";
            return `This email is already in the system: ${email}`;
        }
        if (rawReason.includes("Required field")) return `Missing a required information in this row.`;
        if (rawReason.includes("Invalid status")) return `The status is not valid. Use labels like NEW, COLD, etc.`;

        return rawReason.replace("Reason: ", "").trim();
    };

    const groupedFailures = uploadSummary?.failed.reduce((acc, fail, idx) => {
        const rowNum = fail.match(/Row: (\d+)/)?.[1] || String(idx + 1);
        const rawReason = fail.split(', Reason: ')[1] || fail;
        const cleanReason = simplifyReason(rawReason);
        
        if (!acc[cleanReason]) {
            acc[cleanReason] = [];
        }
        acc[cleanReason].push(rowNum);
        return acc;
    }, {} as Record<string, string[]>) || {};

    return (
        <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-[0_0_40px_-15px_rgba(0,0,0,0.1)] border border-slate-100 flex flex-col items-center w-full max-w-4xl mx-auto font-sans text-black">
            <h2 className="font-extrabold text-2xl text-slate-900 mb-8 flex items-center justify-center gap-3 w-full tracking-tight">
                <Upload className="w-6 h-6 text-[#4d0101]" />
                Bulk Lead Import
            </h2>

            <div
                onClick={() => fileInputRef.current?.click()}
                className={`w-full border-2 border-dashed rounded-2xl p-8 sm:p-12 flex flex-col items-center justify-center cursor-pointer transition-all ${
                    file && !validationError ? 'border-[#4d0101] bg-[#4d0101]/5 shadow-sm' 
                    : validationError ? 'border-rose-300 bg-rose-50/50 hover:bg-rose-50' 
                    : 'border-slate-200 hover:border-[#4d0101]/30 hover:bg-slate-50'
                }`}
            >
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    accept=".xlsx,.xls"
                />
                <FileUp className={`w-12 h-12 mb-5 transition-colors ${file && !validationError ? 'text-[#4d0101]' : validationError ? 'text-rose-400' : 'text-slate-300'}`} />
                <p className="text-sm font-bold text-slate-700 text-center uppercase tracking-wider mb-2">
                    {file ? file.name : 'Click to select Excel file'}
                </p>
                
                {isValidating && <p className="text-xs font-bold text-[#4d0101] animate-pulse">Scanning file formatting...</p>}
                
                {validationError && (
                    <div className="text-center mt-2 px-4 py-2 bg-white rounded-lg border border-rose-100 shadow-sm">
                        <p className="text-xs font-bold text-rose-600 flex items-center gap-1.5 break-words max-w">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                            {validationError}
                        </p>
                    </div>
                )}
                
                {!isValidating && !validationError && file && (
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-white rounded-md shadow-sm border border-emerald-100">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600">Verification Passed</p>
                    </div>
                )}
                
                {!validationError && !file && <p className="text-xs text-slate-400 font-medium mt-1">Single file up to 10MB</p>}
            </div>

            {status !== 'idle' && (
                <div className={`w-full mt-6 p-5 rounded-xl flex items-start gap-4 transition-all shadow-sm ${
                    status === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-100' :
                    status === 'error' ? 'bg-rose-50 text-rose-800 border border-rose-100' :
                    'bg-slate-50 text-slate-700 border border-slate-200 shadow-inner'
                }`}>
                    {status === 'success' && <CheckCircle2 className="w-6 h-6 shrink-0 text-emerald-600" />}
                    {status === 'error' && <AlertCircle className="w-6 h-6 shrink-0 text-rose-600" />}
                    {status === 'uploading' && <Upload className="w-6 h-6 shrink-0 animate-bounce text-slate-500" />}
                    <div className="flex-1 text-sm font-bold flex flex-col justify-center min-h-[24px]">
                        {status === 'uploading' ? 'Transmitting records to CRM...' : message}
                    </div>
                </div>
            )}

            {uploadSummary && (
                <div className="w-full mt-5 grid grid-cols-3 gap-3">
                    <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex flex-col items-center justify-center shadow-sm">
                        <span className="text-2xl font-black text-slate-700">{uploadSummary.total}</span>
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Total Uploads</span>
                    </div>
                    <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl flex flex-col items-center justify-center shadow-sm">
                        <span className="text-2xl font-black text-emerald-600">{uploadSummary.success}</span>
                        <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mt-1">Succeeded</span>
                    </div>
                    <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex flex-col items-center justify-center shadow-sm">
                        <span className="text-2xl font-black text-amber-600">{uploadSummary.duplicate}</span>
                        <span className="text-[10px] font-bold text-amber-600 uppercase tracking-widest mt-1">Duplicates</span>
                    </div>
                </div>
            )}

            {uploadSummary && Object.keys(groupedFailures).length > 0 && (
                <div className="w-full mt-5 p-5 bg-rose-50 rounded-xl border border-rose-200/60 shadow-sm">
                    <h4 className="text-xs font-black text-rose-900 uppercase tracking-widest mb-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-rose-600" />
                            Rejection Summary ({uploadSummary.failed.length} Lines Dropped)
                        </div>
                    </h4>
                    <div className="max-h-60 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                        {Object.entries(groupedFailures).map(([reason, lines], index) => (
                            <div key={index} className="bg-white p-4 rounded-xl border border-rose-100 flex flex-col gap-3 shadow-sm">
                                <div className="flex items-start justify-between gap-4">
                                    <span className="font-bold text-sm text-slate-800 leading-relaxed">{reason}</span>
                                    <span className="text-rose-700 bg-rose-100 px-2.5 py-1 rounded-md text-xs font-black whitespace-nowrap shrink-0">
                                        {lines.length} {lines.length === 1 ? 'Issue' : 'Issues'}
                                    </span>
                                </div>
                                <div className="flex flex-wrap gap-1.5 p-2 bg-slate-50 rounded-lg border border-slate-100">
                                    {lines.map((l, i) => (
                                        <span key={i} className="bg-white border border-slate-200 text-slate-600 px-2.5 py-1 rounded text-[10px] font-bold shadow-sm">
                                            Row {l}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <button
                disabled={!file || status === 'uploading' || !!validationError || isValidating}
                onClick={handleUpload}
                className="w-full mt-8 bg-[#4d0101] text-white font-bold py-4 rounded-xl hover:bg-[#600202] transition-colors active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 disabled:cursor-not-allowed shadow-xl shadow-rose-900/10 flex items-center justify-center gap-2 uppercase tracking-widest text-sm"
            >
                {status === 'uploading' ? (
                    <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Processing...
                    </>
                ) : 'Execute Import'}
            </button>

            <div className="w-full mt-10 pt-10 border-t border-slate-100">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 ml-1">Documentation: Excel Schematic</h3>
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs whitespace-nowrap">
                            <thead>
                                <tr className="bg-slate-50 text-slate-500 border-b border-slate-200">
                                    <th className="px-4 py-3 font-bold uppercase tracking-wider text-[10px]">Name <span className="text-slate-400 font-normal normal-case">(Opt)</span></th>
                                    <th className="px-4 py-3 font-bold uppercase tracking-wider text-[10px]">Email</th>
                                    <th className="px-4 py-3 font-bold uppercase tracking-wider text-[10px]">Address <span className="text-slate-400 font-normal normal-case">(Opt)</span></th>
                                    <th className="px-4 py-3 font-bold uppercase tracking-wider text-[10px]">Phone</th>
                                    <th className="px-4 py-3 font-bold uppercase tracking-wider text-[10px]">Course <span className="text-slate-400 font-normal normal-case">(Opt)</span></th>
                                    <th className="px-4 py-3 font-bold uppercase tracking-wider text-[10px]">Intake <span className="text-slate-400 font-normal normal-case">(Opt)</span></th>
                                    <th className="px-4 py-3 font-bold uppercase tracking-wider text-[10px]">Status <span className="text-slate-400 font-normal normal-case">(Opt)</span></th>
                                    <th className="px-4 py-3 font-bold uppercase tracking-wider text-[10px]">Score <span className="text-slate-400 font-normal normal-case">(Opt)</span></th>
                                    <th className="px-4 py-3 font-black text-[#4d0101] uppercase tracking-wider text-[10px] bg-rose-50/50">Campaign</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                <tr className="text-slate-600 font-medium hover:bg-slate-50 transition-colors">
                                    <td className="px-4 py-3">Rohan Joshi</td>
                                    <td className="px-4 py-3 text-indigo-600">rohan@example.com</td>
                                    <td className="px-4 py-3">City 125</td>
                                    <td className="px-4 py-3 font-mono text-slate-500 text-[11px]">7568708446</td>
                                    <td className="px-4 py-3">BCA</td>
                                    <td className="px-4 py-3">2026</td>
                                    <td className="px-4 py-3"><span className="px-2 py-1 bg-slate-100 rounded text-[10px] font-bold">COLD</span></td>
                                    <td className="px-4 py-3"><span className="px-2 py-1 bg-slate-100 rounded text-[10px] font-bold">LOW</span></td>
                                    <td className="px-4 py-3 text-[#4d0101] font-black bg-rose-50/30">WEBSITE</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
                
                <div className="mt-4 flex flex-col gap-2">
                    <p className="text-[11px] font-bold text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-200 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
                        <span className="leading-relaxed">
                            <strong className="text-slate-700">MANDATORY RULE 1:</strong> You must provide either an <span className="text-indigo-600">Email Address</span> or a <span className="text-indigo-600">Phone Number</span>. Rows missing both will be rejected.
                        </span>
                    </p>
                    <p className="text-[11px] font-bold text-slate-500 bg-[#4d0101]/5 p-3 rounded-lg border border-[#4d0101]/10 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-[#4d0101] shrink-0" />
                        <span className="leading-relaxed">
                            <strong className="text-[#4d0101]">MANDATORY RULE 2:</strong> The <span className="text-[#4d0101]">Campaign</span> column is strictly required and formatted in uppercase (e.g. FACEBOOK, WEBSITE). The system will automatically convert them to uppercase for you.
                        </span>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default BulkUpload;

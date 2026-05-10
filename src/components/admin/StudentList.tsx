'use client';

import { useState, useEffect, useCallback } from 'react';
import { Student } from '@/types/api';
import { LeadService } from '@/services/leadService';
import toast from 'react-hot-toast';

const PAGE_SIZE = 10;

export default function StudentList() {
    const [students, setStudents] = useState<Student[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [counselorName, setCounselorName] = useState<string | null>(null);
    const [fetchingCounselor, setFetchingCounselor] = useState(false);

    const fetchStudents = useCallback(async () => {
        try {
            setLoading(true);
            const res = await LeadService.getAllStudents(page, PAGE_SIZE);
            if (res) {
                setStudents(res.content || []);
                setTotalCount(res.totalElements || 0);
            }
        } catch (err) {
            console.error('[StudentList] Failed to fetch students', err);
            toast.error('Could not load students');
        } finally {
            setLoading(false);
        }
    }, [page]);

    const handleStudentClick = async (studentId: string, email: string) => {
        try {
            setDetailLoading(true);
            setCounselorName(null);
            setFetchingCounselor(true);
            
            const [studentRes, cName] = await Promise.all([
                LeadService.getStudentById(studentId),
                LeadService.getCounselorByEmail(email).catch(() => 'Direct Applicant')
            ]);
            
            setSelectedStudent(studentRes);
            setCounselorName(cName && cName !== 'Not Found in Assignments' ? cName : 'Direct Applicant');
        } catch (err) {
            toast.error('Failed to fetch student details');
        } finally {
            setDetailLoading(false);
            setFetchingCounselor(false);
        }
    };

    useEffect(() => {
        fetchStudents();
    }, [fetchStudents]);

    const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
    const showPagination = totalCount > PAGE_SIZE;

    return (
        <div className="flex-1 min-w-0 w-full rounded-2xl overflow-hidden bg-white shadow-sm border border-gray-100 h-fit">
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/40 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                    <h2 className="font-black text-slate-800 tracking-tight">Verified Applicants (Students)</h2>
                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mt-0.5">
                        {totalCount} Total Registered
                    </p>
                </div>
                <button onClick={fetchStudents} disabled={loading} className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 transition">
                    <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M20 11a8.1 8.1 0 0 0-15.5-2m-.5 5v-5h5" /><path d="M4 13a8.1 8.1 0 0 0 15.5 2m.5-5v5h-5" /></svg>
                </button>
            </div>

            <div className="overflow-x-auto">
                {loading ? (
                    <div className="py-20 flex flex-col justify-center items-center gap-3">
                        <div className="w-10 h-10 border-4 border-[#4d0101]/20 border-t-[#4d0101] rounded-full animate-spin" />
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Loading...</p>
                    </div>
                ) : students.length === 0 ? (
                    <div className="py-20 text-center bg-slate-50/30">
                        <h3 className="text-sm font-black text-slate-900 uppercase">No Students Found</h3>
                    </div>
                ) : (
                    <table className="w-full text-sm text-left">
                        <thead className="text-[10px] text-slate-400 uppercase bg-slate-50/60 border-b border-slate-200 tracking-widest font-black sticky top-0 z-10">
                            <tr>
                                <th className="px-5 py-3">Full Name</th>
                                <th className="px-5 py-3">Email</th>
                                <th className="px-5 py-3">Mobile</th>
                                <th className="px-5 py-3">DOB</th>
                                <th className="px-5 py-3">Gender</th>
                                <th className="px-5 py-3">Course</th>
                                <th className="px-5 py-3">Address</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {students.map((student) => (
                                <tr key={student.id} onClick={() => handleStudentClick(student.id, student.email)} className="hover:bg-indigo-50/30 cursor-pointer transition-colors group">
                                    <td className="px-5 py-3">
                                        <div className="font-bold text-slate-800">{student.fullName}</div>
                                        <div className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">#{student.id}</div>
                                    </td>
                                    <td className="px-5 py-3 text-slate-600">{student.email}</td>
                                    <td className="px-5 py-3 text-slate-600">{student.mobileNumber}</td>
                                    <td className="px-5 py-3 text-slate-600">{student.dateOfBirth || '—'}</td>
                                    <td className="px-5 py-3 text-slate-600">{student.gender || '—'}</td>
                                    <td className="px-5 py-3 text-xs font-bold text-indigo-600 bg-indigo-50 rounded-full text-center">{student.course}</td>
                                    <td className="px-5 py-3 text-slate-400 max-w-[150px] truncate">{student.address || student.correspondenceAddress || '—'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Pagination ... */}
            {showPagination && !loading && (
                <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/30 flex justify-between items-center">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Page {page + 1} of {totalPages}</p>
                    <div className="flex gap-2">
                        <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} className="px-3 py-1 border rounded disabled:opacity-30">Prev</button>
                        <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1} className="px-3 py-1 border rounded disabled:opacity-30">Next</button>
                    </div>
                </div>
            )}

            {/* Detail Modal */}
            {selectedStudent && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col scale-100 animate-in zoom-in-95 duration-300">
                        {/* Modal Header */}
                        <div className="px-8 py-6 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex justify-between items-center">
                            <div className="flex items-center gap-6">
                                <div>
                                    <h2 className="text-2xl font-black tracking-tight">{selectedStudent.fullName}</h2>
                                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Student ID: {selectedStudent.id}</p>
                                </div>
                                <div className="h-10 w-px bg-white/10 hidden md:block" />
                                <div className="hidden md:block">
                                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Assigned Counselor</p>
                                    <p className="text-sm font-bold text-white">
                                        {fetchingCounselor ? 'Looking up...' : counselorName || 'Direct Applicant'}
                                    </p>
                                </div>
                            </div>
                            <button onClick={() => setSelectedStudent(null)} className="p-2 hover:bg-white/10 rounded-full transition">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="flex-1 overflow-y-auto p-8 space-y-8">
                            {/* Personal Information */}
                            <Section title="Personal Information">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                    <DetailItem label="Email" value={selectedStudent.email} />
                                    <DetailItem label="Mobile" value={selectedStudent.mobileNumber} />
                                    <DetailItem label="Date of Birth" value={selectedStudent.dateOfBirth} />
                                    <DetailItem label="Gender" value={selectedStudent.gender} />
                                    <DetailItem label="Aadhar No" value={selectedStudent.aadharNo} />
                                    <DetailItem label="Religion" value={selectedStudent.religion} />
                                    <DetailItem label="Category" value={selectedStudent.category} />
                                    <DetailItem label="Course" value={selectedStudent.course} highlight />
                                </div>
                            </Section>

                            {/* Family Details */}
                            <Section title="Family Information">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                                    <div className="space-y-4">
                                        <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Father's Details</h4>
                                        <div className="grid grid-cols-2 gap-4">
                                            <DetailItem label="Name" value={selectedStudent.fatherName} />
                                            <DetailItem label="Mobile" value={selectedStudent.fatherMobileNo} />
                                            <DetailItem label="Email" value={selectedStudent.fatherEmail} />
                                            <DetailItem label="Occupation" value={selectedStudent.fatherOccupation} />
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Mother's Details</h4>
                                        <div className="grid grid-cols-2 gap-4">
                                            <DetailItem label="Name" value={selectedStudent.motherName} />
                                            <DetailItem label="Mobile" value={selectedStudent.motherMobileNo} />
                                            <DetailItem label="Email" value={selectedStudent.motherEmail} />
                                            <DetailItem label="Occupation" value={selectedStudent.motherOccupation} />
                                        </div>
                                    </div>
                                </div>
                            </Section>

                            {/* Qualifications */}
                            <Section title="Academic Qualifications">
                                <div className="overflow-x-auto rounded-xl border border-slate-100">
                                    <table className="w-full text-xs">
                                        <thead className="bg-slate-50 text-slate-400 font-black uppercase tracking-widest">
                                            <tr>
                                                <th className="px-4 py-3">Level</th>
                                                <th className="px-4 py-3">Board/University</th>
                                                <th className="px-4 py-3">Year</th>
                                                <th className="px-4 py-3">Marks (Obt/Max)</th>
                                                <th className="px-4 py-3">Percentage</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            <QualRow label="10th" board={selectedStudent.tenthBoard} year={selectedStudent.tenthYear} obt={selectedStudent.tenthObtainedMarks} max={selectedStudent.tenthMaxMarks} per={selectedStudent.tenthPercentage} />
                                            <QualRow label="12th" board={selectedStudent.twelfthBoard} year={selectedStudent.twelfthYear} obt={selectedStudent.twelfthObtainedMarks} max={selectedStudent.twelfthMaxMarks} per={selectedStudent.twelfthPercentage} />
                                            <QualRow label="Grad" board={selectedStudent.graduationUniversity} year={selectedStudent.graduationYear} obt={selectedStudent.graduationObtainedMarks} max={selectedStudent.graduationMaxMarks} per={selectedStudent.graduationPercentage} />
                                            <QualRow label="PG" board={selectedStudent.pgUniversity} year={selectedStudent.pgYear} obt={selectedStudent.pgObtainedMarks} max={selectedStudent.pgMaxMarks} per={selectedStudent.pgPercentage} />
                                        </tbody>
                                    </table>
                                </div>
                            </Section>

                            {/* Addresses */}
                            <Section title="Address Details">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <DetailItem label="Correspondence Address" value={selectedStudent.correspondenceAddress} isArea />
                                    <DetailItem label="Permanent Address" value={selectedStudent.permanentAddress} isArea />
                                </div>
                            </Section>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="space-y-4">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
                <span className="w-1 h-4 bg-indigo-600 rounded-full" />
                {title}
            </h3>
            {children}
        </div>
    );
}

function DetailItem({ label, value, highlight, isArea }: { label: string; value: any; highlight?: boolean; isArea?: boolean }) {
    return (
        <div className={isArea ? "bg-slate-50 p-4 rounded-2xl" : ""}>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
            <p className={`text-sm font-bold ${highlight ? 'text-indigo-600' : 'text-slate-700'}`}>
                {value || '—'}
            </p>
        </div>
    );
}

function QualRow({ label, board, year, obt, max, per }: any) {
    if (!board && !year) return null;
    return (
        <tr className="hover:bg-slate-50/50">
            <td className="px-4 py-3 font-black text-slate-900">{label}</td>
            <td className="px-4 py-3 text-slate-600">{board || '—'}</td>
            <td className="px-4 py-3 text-slate-600">{year || '—'}</td>
            <td className="px-4 py-3 text-slate-600 font-bold">{obt || 0} / {max || 0}</td>
            <td className="px-4 py-3 font-black text-indigo-600">{per ? `${Number(per).toFixed(2)}%` : '—'}</td>
        </tr>
    );
}

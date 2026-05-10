'use client';

import { useState, useEffect } from 'react';
import { LeadService } from '@/services/leadService';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';

const DISCIPLINES = ['UG', 'PG', 'DIPLOMA', 'PHD'];
const COUNTRIES = ['INDIA', 'USA', 'UK', 'CANADA'];

export default function MultiStepRegistration() {
    const { user } = useAuth();
    const searchParams = useSearchParams();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [schools, setSchools] = useState<string[]>([]);
    const [courses, setCourses] = useState<string[]>([]);

    // Form States
    const [formData, setFormData] = useState({
        // Step 1: Initial Application
        studentName: '',
        mobile: '',
        email: '',
        discipline: '',
        school: '',
        course: '',
        country: 'INDIA',
        state: '',
        city: '',
        dateOfBirth: '',
        gender: '',

        // Step 2: Basic Details
        resident: '',
        aadharNo: '',
        religion: '',
        category: '',
        fatherName: '',
        fatherMobileNo: '',
        fatherEmail: '',
        fatherAadharNo: '',
        fatherOccupation: '',
        motherName: '',
        motherMobileNo: '',
        motherEmail: '',
        motherAadharNo: '',
        motherOccupation: '',
        guardianName: '',
        guardianMobileNo: '',
        guardianEmail: '',
        guardianAadharNo: '',
        correspondenceAddress: '',
        permanentAddress: '',

        // Step 3: Qualifications
        tenthBoard: '',
        tenthYear: '',
        tenthMaxMarks: '',
        tenthObtainedMarks: '',
        twelfthBoard: '',
        twelfthYear: '',
        twelfthMaxMarks: '',
        twelfthObtainedMarks: '',
        graduationUniversity: '',
        graduationYear: '',
        graduationMaxMarks: '',
        graduationObtainedMarks: '',
        pgUniversity: '',
        pgYear: '',
        pgMaxMarks: '',
        pgObtainedMarks: '',
        otherCourseName: '',
        otherYear: '',
        otherMaxMarks: '',
        otherObtainedMarks: '',
    });

    useEffect(() => {
        const fetchOptions = async () => {
            try {
                const [deptRes, courseRes] = await Promise.all([
                    LeadService.getDepartments(),
                    LeadService.getCourses()
                ]);
                
                if (Array.isArray(deptRes)) {
                    setSchools(deptRes.map((d: any) => d.department || d.name || d));
                }
                if (Array.isArray(courseRes)) {
                    setCourses(courseRes.map((c: any) => c.course || c.name || c));
                }
            } catch (error) {
                console.error("Failed to fetch department/course options", error);
            }
        };
        fetchOptions();
    }, []);

    useEffect(() => {
        const email = searchParams.get('email');
        const name = searchParams.get('name');
        const phone = searchParams.get('phone');
        
        if (email || name || phone) {
            setFormData(prev => ({ 
                ...prev, 
                email: email || prev.email,
                studentName: name || prev.studentName,
                mobile: phone || prev.mobile
            }));
        }
    }, [searchParams]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleStep1Submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const applicationData = {
                studentName: formData.studentName,
                mobile: formData.mobile,
                email: formData.email,
                discipline: formData.discipline,
                school: formData.school,
                course: formData.course,
                country: formData.country,
                state: formData.state,
                city: formData.city,
                dateOfBirth: formData.dateOfBirth,
                gender: formData.gender,
            };
            await LeadService.submitInitialApplication(applicationData);
            toast.success('Initial application saved! Please complete qualification details.');
            setStep(2);
        } catch (error) {
            toast.error('Failed to submit application');
        } finally {
            setLoading(false);
        }
    };

    const handleFinalSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            // Prepare the full student object
            const finalData = {
                ...formData,
                fullName: formData.studentName, // Map to entity field
                mobileNumber: formData.mobile, // Map to entity field
                tenthMaxMarks: parseFloat(formData.tenthMaxMarks) || 0,
                tenthObtainedMarks: parseFloat(formData.tenthObtainedMarks) || 0,
                tenthPercentage: (parseFloat(formData.tenthObtainedMarks) / parseFloat(formData.tenthMaxMarks)) * 100 || 0,
                twelfthMaxMarks: parseFloat(formData.twelfthMaxMarks) || 0,
                twelfthObtainedMarks: parseFloat(formData.twelfthObtainedMarks) || 0,
                twelfthPercentage: (parseFloat(formData.twelfthObtainedMarks) / parseFloat(formData.twelfthMaxMarks)) * 100 || 0,
                graduationMaxMarks: parseFloat(formData.graduationMaxMarks) || 0,
                graduationObtainedMarks: parseFloat(formData.graduationObtainedMarks) || 0,
                pgMaxMarks: parseFloat(formData.pgMaxMarks) || 0,
                pgObtainedMarks: parseFloat(formData.pgObtainedMarks) || 0,
            };

            await LeadService.finalizeStudentRegistration(finalData, user?.userId);
            toast.success('Student registered successfully!');
            setStep(3); // Success state
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    const isUG = formData.discipline === 'UG';

    return (
        <div className="max-w-5xl mx-auto py-10 px-4">
            <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100">
                {/* Header / Progress Bar */}
                <div className="bg-[#4d0101] p-8 text-white">
                    <h1 className="text-3xl font-black tracking-tight mb-2">Student Registration</h1>
                    <p className="text-white/60 text-sm font-medium">Complete the form to register a new student</p>
                    
                    <div className="flex items-center gap-4 mt-8">
                        {[1, 2].map((s) => (
                            <div key={s} className="flex items-center gap-2">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs transition-all ${step === s ? 'bg-white text-[#4d0101] scale-110 shadow-lg' : step > s ? 'bg-emerald-400 text-white' : 'bg-white/20 text-white'}`}>
                                    {step > s ? '✓' : s}
                                </div>
                                {s < 2 && <div className={`h-1 w-12 rounded-full transition-all ${step > s ? 'bg-emerald-400' : 'bg-white/10'}`} />}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="p-8">
                    {step === 1 && (
                        <form onSubmit={handleStep1Submit} className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <h2 className="text-xl font-black text-slate-800 border-b pb-4 mb-6">Step 1: Basic Information</h2>
                            
                            <SectionTitle title="Applicant Details" />
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                <FormInput label="Student Name" name="studentName" value={formData.studentName} onChange={handleInputChange} required />
                                <FormInput label="Mobile*" name="mobile" value={formData.mobile} onChange={handleInputChange} required />
                                <FormInput label="Email*" name="email" type="email" value={formData.email} onChange={handleInputChange} required />
                                <FormSelect label="Country" name="country" value={formData.country} options={COUNTRIES} onChange={handleInputChange} />
                                <FormInput label="Date of Birth*" name="dateOfBirth" type="date" value={formData.dateOfBirth} onChange={handleInputChange} required />
                                <FormSelect label="Gender*" name="gender" value={formData.gender} options={['MALE', 'FEMALE', 'OTHER']} onChange={handleInputChange} required />
                            </div>

                            <SectionTitle title="Academic Interest" />
                            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                                <FormSelect label="Discipline*" name="discipline" value={formData.discipline} options={DISCIPLINES} onChange={handleInputChange} required />
                                <FormSelect label="School*" name="school" value={formData.school} options={schools} onChange={handleInputChange} required />
                                <FormSelect label="Course*" name="course" value={formData.course} options={courses} onChange={handleInputChange} required />
                                <FormInput label="State*" name="state" value={formData.state} onChange={handleInputChange} required />
                                <FormInput label="City*" name="city" value={formData.city} onChange={handleInputChange} required />
                            </div>

                            <SectionTitle title="Family Details" />
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <FormInput label="Father's Name*" name="fatherName" value={formData.fatherName} onChange={handleInputChange} required />
                                <FormInput label="Father's Mobile*" name="fatherMobileNo" value={formData.fatherMobileNo} onChange={handleInputChange} required />
                                <FormInput label="Mother's Name" name="motherName" value={formData.motherName} onChange={handleInputChange} />
                                <FormInput label="Mother's Mobile" name="motherMobileNo" value={formData.motherMobileNo} onChange={handleInputChange} />
                                
                                <FormInput label="Guardian's Name" name="guardianName" value={formData.guardianName} onChange={handleInputChange} />
                                <FormInput label="Guardian's Mobile" name="guardianMobileNo" value={formData.guardianMobileNo} onChange={handleInputChange} />
                            </div>

                            <SectionTitle title="Addresses" />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FormTextArea label="Correspondence Address*" name="correspondenceAddress" value={formData.correspondenceAddress} onChange={handleInputChange} required />
                                <FormTextArea label="Permanent Address*" name="permanentAddress" value={formData.permanentAddress} onChange={handleInputChange} required />
                            </div>

                            <div className="flex justify-end pt-8">
                                <SubmitButton loading={loading} text="Next: Qualification Details →" />
                            </div>
                        </form>
                    )}

                    {step === 2 && (
                        <form onSubmit={handleFinalSubmit} className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                            <h2 className="text-xl font-black text-slate-800 border-b pb-4 mb-6">Step 2: Qualification Details</h2>
                            
                            <div className="overflow-x-auto rounded-xl border border-slate-200">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                        <tr>
                                            <th className="px-4 py-4">Education Level</th>
                                            <th className="px-4 py-4">Board/University</th>
                                            <th className="px-4 py-4">Year</th>
                                            <th className="px-4 py-4">Max Marks</th>
                                            <th className="px-4 py-4">Obtained Marks</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        <QualRow label="10th" name="tenth" data={formData} onChange={handleInputChange} required />
                                        <QualRow label="12th" name="twelfth" data={formData} onChange={handleInputChange} required />
                                        
                                        {!isUG && (
                                            <>
                                                <QualRow label="Graduation" name="graduation" data={formData} onChange={handleInputChange} />
                                                <QualRow label="Post-Graduation" name="pg" data={formData} onChange={handleInputChange} />
                                                <QualRow label="Other Course" name="otherCourse" data={formData} onChange={handleInputChange} />
                                            </>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            <div className="flex justify-between pt-8">
                                <button type="button" onClick={() => setStep(2)} className="px-6 py-3 font-black text-slate-400 uppercase tracking-widest text-xs hover:text-slate-600 transition">← Back</button>
                                <SubmitButton loading={loading} text="Finalize Registration ✓" />
                            </div>
                        </form>
                    )}

                    {step === 3 && (
                        <div className="text-center py-20 animate-in zoom-in duration-500">
                            <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                            </div>
                            <h2 className="text-4xl font-black text-slate-800 mb-4">Registration Successful!</h2>
                            <p className="text-slate-500 font-medium mb-10 max-w-md mx-auto">Student profile has been created and the lead status has been updated to APPLICANT.</p>
                            <button onClick={() => window.location.reload()} className="px-10 py-4 bg-[#4d0101] text-white rounded-xl font-black uppercase tracking-widest text-sm hover:shadow-2xl hover:bg-[#600202] transition-all">Register Another Student</button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function FormInput({ label, name, type = 'text', value, onChange, required = false, disabled = false }: any) {
    return (
        <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</label>
            <input
                type={type}
                name={name}
                value={value}
                onChange={onChange}
                required={required}
                disabled={disabled}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-[#4d0101] focus:ring-4 focus:ring-[#4d0101]/5 outline-none transition text-sm font-medium disabled:bg-slate-50 disabled:text-slate-400"
            />
        </div>
    );
}

function FormSelect({ label, name, value, options, onChange, required = false }: any) {
    return (
        <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</label>
            <select
                name={name}
                value={value}
                onChange={onChange}
                required={required}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-[#4d0101] focus:ring-4 focus:ring-[#4d0101]/5 outline-none transition text-sm font-medium bg-white"
            >
                <option value="">Select {label}</option>
                {options.map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
            </select>
        </div>
    );
}

function FormTextArea({ label, name, value, onChange }: any) {
    return (
        <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</label>
            <textarea
                name={name}
                value={value}
                onChange={onChange}
                rows={3}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-[#4d0101] focus:ring-4 focus:ring-[#4d0101]/5 outline-none transition text-sm font-medium resize-none"
            />
        </div>
    );
}

function SectionTitle({ title }: { title: string }) {
    return <h3 className="text-xs font-black text-[#4d0101] uppercase tracking-[0.2em] pt-4 mb-2">{title}</h3>;
}

function QualRow({ label, name, data, onChange, required = false }: any) {
    return (
        <tr className="hover:bg-slate-50/50 transition">
            <td className="px-4 py-4 font-bold text-slate-700">{label}</td>
            <td className="px-2 py-2">
                <input name={`${name}Board`} value={data[`${name}Board`]} onChange={onChange} required={required} placeholder={`Board/University`} className="w-full px-3 py-2 text-xs border rounded-lg outline-none focus:border-[#4d0101]" />
            </td>
            <td className="px-2 py-2">
                <input name={`${name}Year`} value={data[`${name}Year`]} onChange={onChange} required={required} placeholder={`Year`} className="w-full px-3 py-2 text-xs border rounded-lg outline-none focus:border-[#4d0101]" />
            </td>
            <td className="px-2 py-2">
                <input name={`${name}MaxMarks`} type="number" value={data[`${name}MaxMarks`]} onChange={onChange} required={required} placeholder={`Max`} className="w-full px-3 py-2 text-xs border rounded-lg outline-none focus:border-[#4d0101]" />
            </td>
            <td className="px-2 py-2">
                <input name={`${name}ObtainedMarks`} type="number" value={data[`${name}ObtainedMarks`]} onChange={onChange} required={required} placeholder={`Obtained`} className="w-full px-3 py-2 text-xs border rounded-lg outline-none focus:border-[#4d0101]" />
            </td>
        </tr>
    );
}

function SubmitButton({ loading, text }: { loading: boolean; text: string }) {
    return (
        <button
            type="submit"
            disabled={loading}
            className="px-8 py-4 bg-[#4d0101] text-white rounded-xl font-black uppercase tracking-widest text-xs hover:shadow-2xl hover:bg-[#600202] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
            {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" /> : text}
        </button>
    );
}

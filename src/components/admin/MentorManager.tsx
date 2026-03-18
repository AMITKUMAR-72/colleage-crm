'use client';

import { useState, useEffect } from 'react';
import { MentorDTO, MentorService } from '@/services/mentorService';
import toast from 'react-hot-toast';

export default function MentorManager() {
    const [mentors, setMentors] = useState<MentorDTO[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchName, setSearchName] = useState('');
    const [selectedMentor, setSelectedMentor] = useState<MentorDTO | null>(null);
    const [availability, setAvailability] = useState<boolean | null>(null);

    // Form inputs for create/update
    const [formData, setFormData] = useState<MentorDTO>({
        name: '',
        email: '',
        phone: '',
        departmentName: '',
        password: ''
    });

    const [isEditing, setIsEditing] = useState(false);

    const loadMentors = async () => {
        try {
            setLoading(true);
            const data = await MentorService.getAllMentors();
            setMentors(Array.isArray(data) ? data : []);
        } catch (error) {
            toast.error('Failed to load mentors');
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async () => {
        if (!searchName.trim()) {
            loadMentors();
            return;
        }
        try {
            setLoading(true);
            const data = await MentorService.searchMentorsByName(searchName);
            setMentors(Array.isArray(data) ? data : []);
        } catch (error) {
            toast.error('Failed to search mentors');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadMentors();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (isEditing && formData.email) {
                await MentorService.updateMentorByAdmin(formData.email, formData);
                toast.success('Mentor updated successfully');
            } else {
                await MentorService.createMentor(formData);
                toast.success('Mentor created successfully');
            }
            // Reset form
            setFormData({ name: '', email: '', phone: '', departmentName: '', password: '' });
            setIsEditing(false);
            loadMentors();
        } catch (error) {
            toast.error(isEditing ? 'Failed to update mentor' : 'Failed to create mentor');
        }
    };

    const handleMentorClick = async (id: number, email: string) => {
        try {
            // Get detailed info
            const detailedMentor = await MentorService.getMentorById(id);
            setSelectedMentor(detailedMentor);

            // Check availability linearly
            const isAvail = await MentorService.checkMentorAvailability(id);
            setAvailability(isAvail);

        } catch (error) {
            toast.error('Failed to fetch mentor details');
        }
    };

    const handleEditClick = (mentor: MentorDTO) => {
        setFormData(mentor);
        setIsEditing(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-6">
                <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">{isEditing ? 'Update Mentor' : 'Create Mentor'}</h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-600 mb-1">Name</label>
                                <input required type="text" name="name" value={formData.name || ''} onChange={handleChange} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#dbb212] transition-colors" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-600 mb-1">Email</label>
                                <input required type="email" name="email" value={formData.email || ''} onChange={handleChange} disabled={isEditing} className={`w-full p-2.5 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#dbb212] transition-colors ${isEditing ? 'bg-gray-100 text-gray-500' : 'bg-gray-50'}`} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-600 mb-1">Phone</label>
                                <input type="text" name="phone" value={formData.phone || ''} onChange={handleChange} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#dbb212] transition-colors" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-600 mb-1">Department</label>
                                <input type="text" name="departmentName" value={formData.departmentName || ''} onChange={handleChange} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#dbb212] transition-colors" />
                            </div>
                            {!isEditing && (
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 mb-1">Password</label>
                                    <input required type="password" name="password" value={formData.password || ''} onChange={handleChange} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#dbb212] transition-colors" />
                                </div>
                            )}
                        </div>
                        <div className="flex gap-2">
                            <button type="submit" className="bg-[#4d0101] text-white px-5 py-2.5 rounded-xl font-bold shadow-md hover:bg-[#600202] active:scale-95 transition-all text-sm">
                                {isEditing ? 'Update Mentor' : 'Create Mentor'}
                            </button>
                            {isEditing && (
                                <button type="button" onClick={() => { setIsEditing(false); setFormData({ name: '', email: '', phone: '', departmentName: '', password: '' }); }} className="bg-gray-200 text-gray-700 px-5 py-2.5 rounded-xl font-bold hover:bg-gray-300 active:scale-95 transition-all text-sm">
                                    Cancel
                                </button>
                            )}
                        </div>
                    </form>
                </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-6">
                <div className="flex-1">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                        <h2 className="text-xl font-bold text-gray-800">Mentors</h2>
                        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                            <input
                                type="text"
                                placeholder="Search by name..."
                                value={searchName}
                                onChange={(e) => setSearchName(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#dbb212] w-full sm:w-64 text-black"
                            />
                            <button onClick={handleSearch} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold shadow-sm hover:bg-blue-700 active:scale-95 transition-all text-sm w-full sm:w-auto">
                                Search
                            </button>
                        </div>
                    </div>

                    {loading ? (
                        <div className="text-center py-10"><img src="/raffles-logo.png" alt="Loading" className="h-10 mx-auto animate-pulse" /></div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left whitespace-nowrap">
                                <thead className="text-xs text-slate-500 bg-slate-50 border-b border-gray-100 uppercase font-bold text-black">
                                    <tr>
                                        <th className="px-6 py-4">Name</th>
                                        <th className="hidden sm:table-cell px-6 py-4">Email</th>
                                        <th className="hidden md:table-cell px-6 py-4">Department</th>
                                        <th className="px-6 py-4 text-center">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {mentors.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-8 text-center text-gray-400">No mentors found.</td>
                                        </tr>
                                    ) : (
                                        mentors.map(mentor => (
                                            <tr key={mentor.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4 font-bold text-gray-800">
                                                    <button onClick={() => mentor.id && mentor.email && handleMentorClick(mentor.id, mentor.email)} className="hover:text-blue-600 hover:underline text-left">
                                                        {mentor.name}
                                                        <div className="sm:hidden text-xs text-gray-500 font-normal mt-1 block">{mentor.email}</div>
                                                    </button>
                                                </td>
                                                <td className="hidden sm:table-cell px-6 py-4 text-gray-600">{mentor.email}</td>
                                                <td className="hidden md:table-cell px-6 py-4">
                                                    <span className="bg-purple-50 text-purple-700 px-2.5 py-1 rounded border border-purple-100 text-xs font-bold whitespace-normal inline-block">{mentor.departmentName || '—'}</span>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <button onClick={() => handleEditClick(mentor)} className="text-indigo-600 font-bold hover:underline text-xs bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100 whitespace-nowrap">
                                                        Edit / Update
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {selectedMentor && (
                    <div className="w-full md:w-1/3 bg-slate-50 border border-slate-100 rounded-xl p-6 h-fit animate-in fade-in zoom-in-95">
                        <div className="flex justify-between items-start mb-4">
                            <h3 className="font-bold text-lg text-slate-800">Mentor Details</h3>
                            <button onClick={() => { setSelectedMentor(null); setAvailability(null); }} className="text-slate-400 hover:text-slate-600">✕</button>
                        </div>
                        <div className="space-y-3 text-sm text-slate-700">
                            <div><span className="font-bold text-slate-500 uppercase text-xs">Name:</span> <p className="font-medium text-black">{selectedMentor.name}</p></div>
                            <div><span className="font-bold text-slate-500 uppercase text-xs">Email:</span> <p className="font-medium text-black">{selectedMentor.email}</p></div>
                            <div><span className="font-bold text-slate-500 uppercase text-xs">Phone:</span> <p className="font-medium text-black">{selectedMentor.phone || '—'}</p></div>
                            <div><span className="font-bold text-slate-500 uppercase text-xs">Department:</span> <p className="font-medium text-black">{selectedMentor.departmentName || '—'}</p></div>
                            <div className="pt-3 border-t border-slate-200">
                                <span className="font-bold text-slate-500 uppercase text-xs">Current Availability:</span>
                                <p className="mt-1">
                                    {availability === null ? (
                                        <span className="text-gray-400 text-xs animate-pulse">Checking...</span>
                                    ) : availability ? (
                                        <span className="bg-emerald-100 text-emerald-700 font-bold px-3 py-1 rounded shadow-sm inline-block text-xs border border-emerald-200">AVAILABLE</span>
                                    ) : (
                                        <span className="bg-rose-100 text-rose-700 font-bold px-3 py-1 rounded shadow-sm inline-block text-xs border border-rose-200">UNAVAILABLE</span>
                                    )}
                                </p>
                            </div>
                        </div>
                        <button onClick={() => handleEditClick(selectedMentor)} className="mt-6 w-full bg-slate-200 text-slate-800 font-bold py-2 rounded-lg hover:bg-slate-300 transition-colors">
                            Update Details
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

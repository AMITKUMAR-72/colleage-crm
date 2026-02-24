'use client';

import { useState } from 'react';

export interface TimeoutLeadFilters {
    email: string;
    name: string;
    counselorEmail: string;
    startDate: string;
    endDate: string;
}

interface FilterProps {
    onFilterChange: (filters: TimeoutLeadFilters) => void;
}

export default function TimeoutSearchFilters({ onFilterChange }: FilterProps) {
    const [filterType, setFilterType] = useState<'' | 'email' | 'name' | 'counselorEmail' | 'dateRange'>('');

    const [filters, setFilters] = useState<TimeoutLeadFilters>({
        email: '',
        name: '',
        counselorEmail: '',
        startDate: '',
        endDate: ''
    });

    const handleChange = (key: keyof TimeoutLeadFilters, value: string) => {
        const newFilters = { ...filters, [key]: value };
        setFilters(newFilters);
        onFilterChange(newFilters);
    };

    return (
        <div className="mb-6">
            <div className="flex items-center gap-4 w-full">
                <div className="relative flex-1 animate-in fade-in duration-300">
                    {filterType === 'email' && (
                        <input
                            placeholder="Search by Lead Email..."
                            className="w-full pl-4 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:border-[#dbb212] focus:ring-1 focus:ring-[#dbb212] outline-none shadow-sm transition-all text-gray-900 font-medium"
                            value={filters.email}
                            onChange={(e) => handleChange('email', e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && onFilterChange(filters)}
                        />
                    )}
                    {filterType === 'name' && (
                        <input
                            placeholder="Search by Lead Name..."
                            className="w-full pl-4 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:border-[#dbb212] focus:ring-1 focus:ring-[#dbb212] outline-none shadow-sm transition-all text-gray-900 font-medium"
                            value={filters.name}
                            onChange={(e) => handleChange('name', e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && onFilterChange(filters)}
                        />
                    )}
                    {filterType === 'counselorEmail' && (
                        <input
                            placeholder="Search by Counselor Email..."
                            className="w-full pl-4 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:border-[#dbb212] focus:ring-1 focus:ring-[#dbb212] outline-none shadow-sm transition-all text-gray-900 font-medium"
                            value={filters.counselorEmail}
                            onChange={(e) => handleChange('counselorEmail', e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && onFilterChange(filters)}
                        />
                    )}
                    {filterType === 'dateRange' && (
                        <div className="flex gap-3 w-full animate-in fade-in duration-300">
                            <div className="flex-1">
                                <label className="text-xs font-bold text-gray-500 mb-1 block">Start Date</label>
                                <input
                                    type="datetime-local"
                                    className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium focus:border-[#dbb212] focus:ring-1 focus:ring-[#dbb212] outline-none shadow-sm transition-all text-gray-900"
                                    value={filters.startDate}
                                    onChange={(e) => handleChange('startDate', e.target.value)}
                                />
                            </div>
                            <div className="flex-1">
                                <label className="text-xs font-bold text-gray-500 mb-1 block">End Date</label>
                                <input
                                    type="datetime-local"
                                    className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium focus:border-[#dbb212] focus:ring-1 focus:ring-[#dbb212] outline-none shadow-sm transition-all text-gray-900"
                                    value={filters.endDate}
                                    onChange={(e) => handleChange('endDate', e.target.value)}
                                />
                            </div>
                        </div>
                    )}
                </div>

                <div className="relative w-[20%]">
                    <select
                        className="w-full appearance-none bg-[#4d0101] text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-md hover:bg-[#600202] active:scale-[0.98] transition-all cursor-pointer outline-none focus:ring-2 focus:ring-[#dbb212] text-left"
                        value={filterType}
                        onChange={(e) => {
                            setFilterType(e.target.value as any);
                            const resetFilters = { email: '', name: '', counselorEmail: '', startDate: '', endDate: '' };
                            setFilters(resetFilters);
                            onFilterChange(resetFilters);
                        }}
                    >
                        <option value="" disabled className="bg-white text-gray-500 text-center">Filters</option>
                        <option value="name" className="bg-white text-gray-800">Filter Expected Name</option>
                        <option value="email" className="bg-white text-gray-800">Filter Expected Email</option>
                        <option value="counselorEmail" className="bg-white text-gray-800">Filter Counselor Email</option>
                        <option value="dateRange" className="bg-white text-gray-800">Filter Date Range</option>
                    </select>
                </div>
            </div>
        </div>
    );
}

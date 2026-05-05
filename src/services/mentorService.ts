import api from './api';

export interface MentorDTO {
    id?: number;
    name: string;
    email: string;
    phone?: string;
    departmentName?: string;
    availability?: boolean;
    password?: string;
}

export const MentorService = {
    // Admin/Manager Endpoint: Create mentor profile
    createMentor: async (mentorData: MentorDTO) => {
        const response = await api.post<MentorDTO>('/api/mentors/create', mentorData);
        return response.data;
    },

    // List all mentors (Admin/Manager)
    getAllMentors: async () => {
        const response = await api.get<MentorDTO[]>('/api/mentors');
        return response.data;
    },

    // Get mentor by ID
    getMentorById: async (id: number) => {
        const response = await api.get<MentorDTO>(`/api/mentors/id/${id}`);
        return response.data;
    },

    // 92. Get mentor by phone
    getMentorByPhone: async (phone: string) => {
        const response = await api.get<MentorDTO>(`/api/mentors/phone/${encodeURIComponent(phone)}`);
        return response.data;
    },

    // Check mentor availability
    checkMentorAvailability: async (id: number) => {
        const response = await api.get<boolean>(`/api/mentors/check-availability/${id}`);
        return response.data;
    },

    // Search mentors by name
    searchMentorsByName: async (name: string) => {
        const response = await api.get<MentorDTO[]>(`/api/mentors/name/${name}`);
        return response.data;
    },

    // Update mentor details (Admin)
    updateMentorByAdmin: async (email: string, data: Partial<MentorDTO>) => {
        const response = await api.put<MentorDTO>(`/api/mentors/update/${email}`, data);
        return response.data;
    },

    // MENTOR ONLY ENDPOINTS 
    // Get mentor profile (Self)
    getMyProfile: async () => {
        const response = await api.get<MentorDTO>('/api/mentors/profile');
        return response.data;
    },

    // Get my sessions (Mentor)
    getMySessions: async () => {
        const response = await api.get<any>('/api/mentors/my-sessions');
        return response.data?.data || response.data || [];
    },

    // Get upcoming sessions (Mentor)
    getMyUpcomingSessions: async () => {
        const response = await api.get<any>('/api/mentors/my-upcoming-sessions');
        return response.data?.data || response.data || [];
    },

    // #67 - Update mentor professional profile (Admin)
    updateMentor: async (email: string, data: Partial<MentorDTO>) => {
        const response = await api.patch<MentorDTO>(`/api/mentors/update/${encodeURIComponent(email)}`, data);
        return response.data;
    },

    // Self profile update (Mentor - uses the update endpoint with own email)
    updateMyProfile: async (email: string, data: Partial<MentorDTO>) => {
        const response = await api.patch<MentorDTO>(`/api/mentors/update/${encodeURIComponent(email)}`, data);
        return response.data;
    }
};

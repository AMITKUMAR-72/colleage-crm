import api from './api';

export interface MentorDTO {
    id: number;
    name: string;
    email?: string;
    phone?: string;
    availability?: boolean;
    // Add other fields as per your backend
}

export const MentorService = {
    // Create mentor profile
    createMentor: async (mentorData: Omit<MentorDTO, 'id'>) => {
        const response = await api.post<MentorDTO>('/api/mentors/create', mentorData);
        return response.data;
    },

    // List all mentors
    getAllMentors: async () => {
        const response = await api.get<MentorDTO[]>('/api/mentors');
        return response.data;
    },

    // Get mentor by ID
    getMentorById: async (id: number) => {
        const response = await api.get<MentorDTO>(`/api/mentors/id/${id}`);
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
    }
};

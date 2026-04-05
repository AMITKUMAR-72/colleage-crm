import api from './api';

export interface SystemConfig {
    maxCapacity: number;
    slaHours: number;
}

export const ConfigService = {
    // 161. View current global SLA hours and Max Capacity
    getConfig: async () => {
        const response = await api.get<SystemConfig>('/api/config');
        return response.data;
    },

    // 162. Update global counselor max capacity
    updateMaxCapacity: async (value: number) => {
        const response = await api.patch(`/api/config/maxCapacity/${value}`);
        return response.data;
    },

    // 163. Update global SLA timer
    updateSlaHours: async (hours: number) => {
        const response = await api.patch(`/api/config/slaHours/${hours}`);
        return response.data;
    },
};

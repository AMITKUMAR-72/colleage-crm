import api from './api';

// ─── Reminder Types ───────────────────────────────────────────────────────────

export type ReminderStatus = 'PENDING' | 'DUE' | 'SEEN' | 'MISSED' | 'CANCELLED';

export interface ReminderResponseDTO {
    id: number;
    leadId: number;
    leadName?: string;
    counselorId?: string | number;
    counselorName?: string;
    reminderTime: string;
    note?: string;
    status: ReminderStatus;
    seen: boolean;
    createdAt?: string;
    updatedAt?: string;
    score?: string;
}

export interface SetReminderRequestDTO {
    reminderTime: string;   // ISO datetime e.g. "2026-04-30T10:00:00"
    note?: string;
}

export interface UpdateReminderRequestDTO {
    reminderTime?: string;
    note?: string;
}

export interface PagedReminders {
    content: ReminderResponseDTO[];
    totalPages: number;
    totalElements: number;
    number: number;
    size: number;
    first: boolean;
    last: boolean;
}

// ─── Reminder Service ─────────────────────────────────────────────────────────

export const ReminderService = {
    /** Create a new reminder for a lead */
    setReminder: async (leadId: number, body: SetReminderRequestDTO) => {
        const response = await api.post<ReminderResponseDTO>(`/api/reminders/lead/${leadId}`, body);
        return response.data;
    },

    /** Get all due reminders (triggered but not seen) */
    getMyDueReminders: async (page: number, size: number) => {
        const response = await api.get<PagedReminders>(`/api/reminders/me/due/page/${page}/size/${size}`);
        return response.data;
    },

    /** Get all missed reminders (past-due, never acknowledged) */
    getMyMissedReminders: async (page: number, size: number) => {
        const response = await api.get<PagedReminders>(`/api/reminders/me/missed/page/${page}/size/${size}`);
        return response.data;
    },

    /** Get all pending reminders (scheduled for the future) */
    getMyPendingReminders: async (page: number, size: number) => {
        const response = await api.get<PagedReminders>(`/api/reminders/me/pending/page/${page}/size/${size}`);
        return response.data;
    },

    /** Get all reminders for the current user (any status) */
    getMyReminders: async (page: number, size: number) => {
        const response = await api.get<PagedReminders>(`/api/reminders/me/${page}/${size}`);
        return response.data;
    },

    /** Get reminders filtered by lead score */
    getRemindersByScore: async (score: string, page: number, size: number) => {
        const response = await api.get<PagedReminders>(`/api/reminders/me/score/${score}/page/${page}/size/${size}`);
        return response.data;
    },

    /** Mark a reminder as seen */
    markAsSeen: async (reminderId: number) => {
        const response = await api.put<ReminderResponseDTO>(`/api/reminders/${reminderId}/seen`);
        return response.data;
    },

    /** Update a reminder (reschedule or change note) */
    updateReminder: async (reminderId: number, body: UpdateReminderRequestDTO) => {
        const response = await api.put<ReminderResponseDTO>(`/api/reminders/${reminderId}`, body);
        return response.data;
    },

    /** Cancel a reminder */
    cancelReminder: async (reminderId: number) => {
        const response = await api.delete<ReminderResponseDTO>(`/api/reminders/${reminderId}`);
        return response.data;
    },
};

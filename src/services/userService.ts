import api from "./api";
import { UserDTO, RoleDTO } from "@/types/api";

export const UserService = {
  // 63. Update User Role
  updateUserRole: async (email: string, role: string) => {
    const response = await api.post<UserDTO>(
      `/api/users/update/${email}/role/${role}`,
    );
    return response.data;
  },

  // Get all users
  getAllUsers: async () => {
    const response = await api.get<UserDTO[]>("/api/users/all");
    return response.data;
  },

  // Get User by Name
  getUserByName: async (name: string) => {
    const response = await api.get<UserDTO>(`/api/users/name/${name}`);
    return response.data;
  },

  // Update User Basic Details
  updateUser: async (id: number, data: { name?: string; email?: string }) => {
    const response = await api.put<UserDTO>(`/api/users/update/${id}`, data);
    return response.data;
  },

  // Update User Password
  updatePassword: async (id: number, password: string) => {
    const response = await api.post(`/api/users/update/${id}/password`, { password });
    return response.data;
  },

  // Create New User
  createUser: async (data: any) => {
    const response = await api.post<UserDTO>("/api/users/create", data);
    return response.data;
  },

  // Get User by ID
  getUserById: async (id: string | number) => {
    const response = await api.get<UserDTO>(`/api/users/id/${id}`);
    return response.data;
  },
};

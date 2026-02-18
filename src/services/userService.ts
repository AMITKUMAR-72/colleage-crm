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
};

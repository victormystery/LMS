import api from "@/lib/api_clean";

export interface User {
  id: number;
  username: string;
  full_name: string;
  role: string;
  is_active: boolean;
}

export interface CreateUserData {
  username: string;
  password: string;
  full_name: string;
  role: string;
}

export const userService = {
  // Get all users (librarian only)
  getAllUsers: async (): Promise<User[]> => {
    const response = await api.get("/api/users/");
    return response.data;
  },

  // Get user by ID
  getUserById: async (userId: number): Promise<User> => {
    const response = await api.get(`/api/users/${userId}`);
    return response.data;
  },

  // Create new user (librarian only)
  createUser: async (userData: CreateUserData): Promise<User> => {
    const response = await api.post("/api/users/", userData);
    return response.data;
  },

  // Delete user (librarian only)
  deleteUser: async (userId: number): Promise<void> => {
    await api.delete(`/api/users/${userId}`);
  },
};

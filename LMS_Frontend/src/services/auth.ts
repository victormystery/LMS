import api from "@/lib/api_clean";

export const authService = {
  login: async (username: string, password: string) => {
    const response = await api.post("/api/auth/login", { username, password });
    return response.data;
  },

  register: async (userData: any) => {
    const response = await api.post("/api/auth/register", userData);
    return response.data;
  },

  getCurrentUser: async () => {
    const response = await api.get("/api/users/me");
    return response.data;
  },
};

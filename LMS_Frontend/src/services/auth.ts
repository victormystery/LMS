import api from "@/lib/api";

export const authService = {
  login: async (username: string, password: string) => {
    const formData = new FormData();
    formData.append("username", username);
    formData.append("password", password);
    const response = await api.post("/api/auth/access-token", formData);
    return response.data;
  },

  register: async (userData: any) => {
    const response = await api.post("/api/users/", userData);
    return response.data;
  },

  getCurrentUser: async () => {
    const response = await api.get("/api/users/me");
    return response.data;
  },
};

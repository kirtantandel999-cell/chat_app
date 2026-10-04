import api from "./axios";

export const authApi = {
  register: async (data) => {
    const res = await api.post("/auth/register", data);
    return res.data.data;
  },

  login: async (data) => {
    const res = await api.post("/auth/login", data);
    return res.data.data;
  },

  getCurrentUser: async () => {
    const res = await api.get("/auth/me");
    return res.data.data;
  },

  changePassword: async (data) => {
    const res = await api.patch("/auth/change-password", data);
    return res.data.data;
  },
};

export default authApi;

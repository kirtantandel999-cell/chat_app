import api from "./axios";

export const userApi = {
  getMe: async () => {
    const res = await api.get("/users/me");
    return res.data.data;
  },

  updateMe: async (data) => {
    const res = await api.patch("/users/me", data);
    return res.data.data;
  },

  deleteMe: async () => {
    const res = await api.delete("/users/me");
    return res.data;
  },

  getAllUsers: async (params = {}) => {
    const res = await api.get("/users", { params });
    return {
      users: res.data.data,
      pagination: res.data.pagination,
    };
  },
};

export default userApi;

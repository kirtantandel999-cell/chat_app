import api from "./axios";

export const chatApi = {
  getUsers: async (search = "") => {
    const res = await api.get("/users", {
      params: { search },
    });
    return res.data.data;
  },

  getConversations: async () => {
    const res = await api.get("/conversations");
    return res.data.data;
  },

  createConversation: async (userId) => {
    const res = await api.post("/conversations", { userId });
    return res.data.data;
  },

  getMessages: async (conversationId, params = {}) => {
    const res = await api.get(`/conversations/${conversationId}/messages`, {
      params,
    });
    return res.data.data;
  },

  markRead: async (conversationId) => {
    const res = await api.post(`/conversations/${conversationId}/read`);
    return res.data;
  },

  sendMessage: async (conversationId, text) => {
    const res = await api.post(`/conversations/${conversationId}/messages`, {
      text,
    });
    return res.data.data;
  },

  sendAttachment: async (conversationId, file, text = "", onUploadProgress) => {
    const formData = new FormData();
    formData.append("file", file);
    if (text) {
      formData.append("text", text);
    }

    const res = await api.post(
      `/conversations/${conversationId}/messages`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress,
      }
    );
    return res.data.data;
  },

  fetchFileBlob: async (fileId) => {
    const res = await api.get(`/files/${fileId}`, {
      responseType: "blob",
    });
    return res.data;
  },

  deleteMessage: async (messageId) => {
    const res = await api.delete(`/messages/${messageId}`);
    return res.data.data;
  },

  deleteForMe: async (messageId) => {
    const res = await api.post(`/messages/${messageId}/delete-for-me`);
    return res.data.data;
  },
};

export default chatApi;

import api from "./axios.js";

export const createChat = (payload = {}) =>
  api.post("/chats", payload).then((r) => r.data.data);

export const getChats = (search = "") =>
  api.get("/chats", { params: search ? { search } : {} }).then((r) => r.data.data);

export const getChatById = (chatId) =>
  api.get(`/chats/${chatId}`).then((r) => r.data.data);

export const updateChat = (chatId, payload) =>
  api.patch(`/chats/${chatId}`, payload).then((r) => r.data.data);

export const deleteChat = (chatId) =>
  api.delete(`/chats/${chatId}`).then((r) => r.data.data);

export const getChatMessages = (chatId) =>
  api.get(`/chats/${chatId}/messages`).then((r) => r.data.data);

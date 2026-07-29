import api from "./axios.js";

export const uploadFiles = (files, chatId, onUploadProgress) => {
  const formData = new FormData();
  files.forEach((file) => formData.append("files", file));
  if (chatId) formData.append("chatId", chatId);

  return api
    .post("/files/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress,
    })
    .then((r) => r.data.data);
};

export const getLibraryFiles = (type) =>
  api.get("/files", { params: type ? { type } : {} }).then((r) => r.data.data);

export const deleteFile = (fileId) =>
  api.delete(`/files/${fileId}`).then((r) => r.data.data);

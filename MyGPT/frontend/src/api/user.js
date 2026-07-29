import api from "./axios.js";

export const getApiKeyStatus = () =>
  api.get("/users/api-keys").then((r) => r.data.data);

export const saveApiKey = (provider, apiKey) =>
  api.put("/users/api-keys", { provider, apiKey }).then((r) => r.data.data);

export const deleteApiKey = (provider) =>
  api.delete(`/users/api-keys/${provider}`).then((r) => r.data.data);

export const setLastUsedProvider = (provider) =>
  api.patch("/users/last-provider", { provider }).then((r) => r.data.data);

import api from "./axios.js";

export const sendMessage = (payload) =>
  api.post("/messages", payload).then((r) => r.data.data);

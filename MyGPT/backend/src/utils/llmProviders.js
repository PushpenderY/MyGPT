import fs from "fs";
import { ApiError } from "./ApiError.js";
import { PROVIDERS } from "../constants.js";

/**
 * Reads a file from disk and returns its base64 content.
 */
const fileToBase64 = (filePath) => {
  const buffer = fs.readFileSync(filePath);
  return buffer.toString("base64");
};

const isImage = (mimetype) => mimetype?.startsWith("image/");
const isPdf = (mimetype) => mimetype === "application/pdf";

/* -------------------------------------------------------------------- */
/*  GEMINI                                                               */
/* -------------------------------------------------------------------- */
const callGemini = async ({ apiKey, model, history, attachments }) => {
  const contents = history.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content || "" }],
  }));

  // Attach files to the most recent (last) user turn
  if (attachments?.length) {
    const lastTurn = contents[contents.length - 1];
    for (const file of attachments) {
      lastTurn.parts.push({
        inlineData: {
          mimeType: file.mimetype,
          data: fileToBase64(file.path),
        },
      });
    }
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contents }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new ApiError(
      response.status,
      data?.error?.message || "Gemini API request failed"
    );
  }

  const text =
    data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join("\n") ||
    "(No response generated)";

  return { text, raw: data };
};

/* -------------------------------------------------------------------- */
/*  OPENAI                                                               */
/* -------------------------------------------------------------------- */
const callOpenAI = async ({ apiKey, model, history, attachments }) => {
  const messages = history.map((m) => ({ role: m.role, content: m.content }));

  if (attachments?.length) {
    const lastMessage = messages[messages.length - 1];
    const parts = [{ type: "text", text: lastMessage.content || "" }];

    for (const file of attachments) {
      const base64 = fileToBase64(file.path);
      if (isImage(file.mimetype)) {
        parts.push({
          type: "image_url",
          image_url: { url: `data:${file.mimetype};base64,${base64}` },
        });
      } else if (isPdf(file.mimetype)) {
        parts.push({
          type: "file",
          file: {
            filename: file.originalname,
            file_data: `data:${file.mimetype};base64,${base64}`,
          },
        });
      }
    }
    lastMessage.content = parts;
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ model, messages }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new ApiError(
      response.status,
      data?.error?.message || "OpenAI API request failed"
    );
  }

  const text = data?.choices?.[0]?.message?.content || "(No response generated)";
  return { text, raw: data };
};

/* -------------------------------------------------------------------- */
/*  CLAUDE                                                               */
/* -------------------------------------------------------------------- */
const callClaude = async ({ apiKey, model, history, attachments }) => {
  const messages = history.map((m) => ({
    role: m.role === "assistant" ? "assistant" : "user",
    content: m.content || "",
  }));

  if (attachments?.length) {
    const lastMessage = messages[messages.length - 1];
    const parts = [{ type: "text", text: lastMessage.content || "" }];

    for (const file of attachments) {
      const base64 = fileToBase64(file.path);
      if (isImage(file.mimetype)) {
        parts.push({
          type: "image",
          source: { type: "base64", media_type: file.mimetype, data: base64 },
        });
      } else if (isPdf(file.mimetype)) {
        parts.push({
          type: "document",
          source: {
            type: "base64",
            media_type: "application/pdf",
            data: base64,
          },
        });
      }
    }
    lastMessage.content = parts;
  }

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({ model, max_tokens: 4096, messages }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new ApiError(
      response.status,
      data?.error?.message || "Claude API request failed"
    );
  }

  const text =
    data?.content?.map((c) => c.text).filter(Boolean).join("\n") ||
    "(No response generated)";

  return { text, raw: data };
};

/* -------------------------------------------------------------------- */
/*  PUBLIC ENTRY POINT                                                   */
/* -------------------------------------------------------------------- */
export const generateChatResponse = async ({
  provider,
  apiKey,
  model,
  history,
  attachments = [],
}) => {
  if (!PROVIDERS[provider]) {
    throw new ApiError(400, `Unsupported provider: ${provider}`);
  }
  if (!apiKey) {
    throw new ApiError(
      400,
      `No API key found for ${PROVIDERS[provider].label}. Add one in Settings.`
    );
  }

  const selectedModel = model || PROVIDERS[provider].defaultModel;
  const args = { apiKey, model: selectedModel, history, attachments };

  switch (provider) {
    case "gemini":
      return callGemini(args);
    case "openai":
      return callOpenAI(args);
    case "claude":
      return callClaude(args);
    default:
      throw new ApiError(400, `Unsupported provider: ${provider}`);
  }
};

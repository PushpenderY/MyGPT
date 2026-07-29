import { Chat } from "../models/chat.model.js";
import { Message } from "../models/message.model.js";
import { File } from "../models/file.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { decrypt } from "../utils/encryption.js";
import { generateChatResponse } from "../utils/llmProviders.js";
import { MAX_HISTORY_MESSAGES, PROVIDERS } from "../constants.js";

/**
 * GET /api/v1/chats/:chatId/messages
 */
export const getChatMessages = asyncHandler(async (req, res) => {
  const chat = await Chat.findOne({ _id: req.params.chatId, user: req.user._id });
  if (!chat) {
    throw new ApiError(404, "Chat not found");
  }

  const messages = await Message.find({ chat: chat._id })
    .sort({ createdAt: 1 })
    .populate("attachments");

  return res.status(200).json(new ApiResponse(200, messages, "Messages fetched"));
});

/**
 * POST /api/v1/messages
 * Body: { chatId, content, attachmentIds?: string[], provider?, model? }
 *
 * 1. Saves the user's message (with any attachments already uploaded via /files/upload)
 * 2. Pulls recent chat history for context
 * 3. Calls the selected LLM provider using the user's own stored API key
 * 4. Saves and returns the assistant's reply
 */
export const sendMessage = asyncHandler(async (req, res) => {
  const { chatId, content, attachmentIds = [], provider, model } = req.body;

  if (!chatId) throw new ApiError(400, "chatId is required");
  if (!content?.trim() && attachmentIds.length === 0) {
    throw new ApiError(400, "Message content or an attachment is required");
  }

  const chat = await Chat.findOne({ _id: chatId, user: req.user._id });
  if (!chat) throw new ApiError(404, "Chat not found");

  const activeProvider = provider || chat.provider || "gemini";
  const activeModel = model || chat.model || PROVIDERS[activeProvider].defaultModel;

  // 1. Save user message
  const userMessage = await Message.create({
    chat: chat._id,
    user: req.user._id,
    role: "user",
    content: content || "",
    attachments: attachmentIds,
    provider: activeProvider,
    model: activeModel,
  });

  // Auto-title new chats from the first message
  if (chat.title === "New chat" && content?.trim()) {
    chat.title = content.trim().slice(0, 60);
  }
  chat.provider = activeProvider;
  chat.model = activeModel;
  await chat.save();

  // 2. Build conversation history for context
  const pastMessages = await Message.find({ chat: chat._id })
    .sort({ createdAt: 1 })
    .limit(MAX_HISTORY_MESSAGES);

  const history = pastMessages.map((m) => ({ role: m.role, content: m.content }));

  // 3. Resolve attachments to local file info for multimodal providers
  let attachmentFiles = [];
  if (attachmentIds.length > 0) {
    const files = await File.find({ _id: { $in: attachmentIds }, user: req.user._id });
    attachmentFiles = files.map((f) => ({
      path: f.localPath,
      mimetype: f.mimetype,
      originalname: f.originalName,
    }));
  }

  // 4. Get & decrypt the user's API key for this provider
  const user = await User.findById(req.user._id).select("apiKeys");
  const encryptedKey = user.apiKeys?.[activeProvider];
  const apiKey = encryptedKey ? decrypt(encryptedKey) : null;

  let assistantMessage;
  try {
    const { text } = await generateChatResponse({
      provider: activeProvider,
      apiKey,
      model: activeModel,
      history,
      attachments: attachmentFiles,
    });

    assistantMessage = await Message.create({
      chat: chat._id,
      user: req.user._id,
      role: "assistant",
      content: text,
      provider: activeProvider,
      model: activeModel,
    });
  } catch (error) {
    assistantMessage = await Message.create({
      chat: chat._id,
      user: req.user._id,
      role: "assistant",
      content: error?.message || "Something went wrong calling the model.",
      provider: activeProvider,
      model: activeModel,
      isError: true,
    });
  }

  const populatedUserMessage = await userMessage.populate("attachments");

  return res.status(201).json(
    new ApiResponse(
      201,
      { userMessage: populatedUserMessage, assistantMessage, chat },
      "Message sent"
    )
  );
});

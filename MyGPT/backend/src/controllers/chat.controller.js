import { Chat } from "../models/chat.model.js";
import { Message } from "../models/message.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

/**
 * POST /api/v1/chats
 * Creates a new empty chat (the "New chat" button).
 */
export const createChat = asyncHandler(async (req, res) => {
  const { provider = "gemini", model } = req.body;

  const chat = await Chat.create({
    user: req.user._id,
    provider,
    model,
    title: "New chat",
  });

  return res.status(201).json(new ApiResponse(201, chat, "Chat created"));
});

/**
 * GET /api/v1/chats?search=...
 * Lists all chats for the logged in user, newest first. Powers the
 * sidebar's "Recents" list and the search modal.
 */
export const getUserChats = asyncHandler(async (req, res) => {
  const { search } = req.query;

  const filter = { user: req.user._id };
  if (search) {
    filter.title = { $regex: search, $options: "i" };
  }

  const chats = await Chat.find(filter).sort({ isPinned: -1, updatedAt: -1 });

  return res.status(200).json(new ApiResponse(200, chats, "Chats fetched"));
});

/**
 * GET /api/v1/chats/:chatId
 */
export const getChatById = asyncHandler(async (req, res) => {
  const chat = await Chat.findOne({ _id: req.params.chatId, user: req.user._id });

  if (!chat) {
    throw new ApiError(404, "Chat not found");
  }

  return res.status(200).json(new ApiResponse(200, chat, "Chat fetched"));
});

/**
 * PATCH /api/v1/chats/:chatId
 * Body can include: { title, isPinned, provider, model }
 */
export const updateChat = asyncHandler(async (req, res) => {
  const { title, isPinned, provider, model } = req.body;

  const update = {};
  if (title !== undefined) update.title = title;
  if (isPinned !== undefined) update.isPinned = isPinned;
  if (provider !== undefined) update.provider = provider;
  if (model !== undefined) update.model = model;

  const chat = await Chat.findOneAndUpdate(
    { _id: req.params.chatId, user: req.user._id },
    { $set: update },
    { new: true }
  );

  if (!chat) {
    throw new ApiError(404, "Chat not found");
  }

  return res.status(200).json(new ApiResponse(200, chat, "Chat updated"));
});

/**
 * DELETE /api/v1/chats/:chatId
 */
export const deleteChat = asyncHandler(async (req, res) => {
  const chat = await Chat.findOneAndDelete({
    _id: req.params.chatId,
    user: req.user._id,
  });

  if (!chat) {
    throw new ApiError(404, "Chat not found");
  }

  await Message.deleteMany({ chat: chat._id });

  return res.status(200).json(new ApiResponse(200, {}, "Chat deleted"));
});

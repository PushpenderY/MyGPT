import fs from "fs";
import { File } from "../models/file.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

/**
 * POST /api/v1/files/upload
 * multipart/form-data, field name: "file" (also accepts multiple under "files")
 * Body can include optional chatId to associate the file with a conversation.
 */
export const uploadFile = asyncHandler(async (req, res) => {
  const files = req.files?.length ? req.files : req.file ? [req.file] : [];

  if (files.length === 0) {
    throw new ApiError(400, "No file uploaded");
  }

  const { chatId } = req.body;

  const savedFiles = await Promise.all(
    files.map((file) =>
      File.create({
        user: req.user._id,
        chat: chatId || undefined,
        originalName: file.originalname,
        url: `/uploads/${file.filename}`,
        localPath: file.path,
        mimetype: file.mimetype,
        type: file.mimetype === "application/pdf" ? "pdf" : "image",
        size: file.size,
      })
    )
  );

  return res
    .status(201)
    .json(new ApiResponse(201, savedFiles, "File(s) uploaded successfully"));
});

/**
 * GET /api/v1/files?type=image|pdf
 * Powers the sidebar "Library" - all images & pdfs the user has ever uploaded.
 */
export const getUserFiles = asyncHandler(async (req, res) => {
  const { type } = req.query;

  const filter = { user: req.user._id };
  if (type && ["image", "pdf"].includes(type)) {
    filter.type = type;
  }

  const files = await File.find(filter).sort({ createdAt: -1 });

  return res.status(200).json(new ApiResponse(200, files, "Files fetched"));
});

/**
 * DELETE /api/v1/files/:fileId
 */
export const deleteFile = asyncHandler(async (req, res) => {
  const file = await File.findOneAndDelete({
    _id: req.params.fileId,
    user: req.user._id,
  });

  if (!file) {
    throw new ApiError(404, "File not found");
  }

  fs.unlink(file.localPath, () => {}); // best-effort disk cleanup

  return res.status(200).json(new ApiResponse(200, {}, "File deleted"));
});

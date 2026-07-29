import mongoose, { Schema } from "mongoose";

const fileSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    chat: {
      type: Schema.Types.ObjectId,
      ref: "Chat",
    },
    originalName: {
      type: String,
      required: true,
    },
    url: {
      type: String, // public URL the frontend can use to preview/download
      required: true,
    },
    localPath: {
      type: String, // disk path used internally when sending file to the LLM
      required: true,
    },
    mimetype: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["image", "pdf"],
      required: true,
    },
    size: {
      type: Number, // bytes
      required: true,
    },
  },
  { timestamps: true }
);

fileSchema.index({ user: 1, type: 1, createdAt: -1 });

export const File = mongoose.model("File", fileSchema);

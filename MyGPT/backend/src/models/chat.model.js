import mongoose, { Schema } from "mongoose";

const chatSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: {
      type: String,
      default: "New chat",
      trim: true,
    },
    provider: {
      type: String,
      enum: ["gemini", "openai", "claude"],
      default: "gemini",
    },
    model: {
      type: String,
      default: "gemini-2.5-flash",
    },
    isPinned: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

chatSchema.index({ user: 1, updatedAt: -1 });
chatSchema.index({ title: "text" });

export const Chat = mongoose.model("Chat", chatSchema);

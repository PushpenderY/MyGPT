import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken";

const userSchema = new Schema(
  {
    googleId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    avatar: {
      type: String, // Google profile picture URL
    },
    // Long-lived refresh token (raw JWT) for the currently active session.
    // In production you may want to store a hash + support multiple sessions.
    refreshToken: {
      type: String,
    },
    // Per-provider API keys, AES encrypted at rest. Never returned raw to the client.
    apiKeys: {
      gemini: { type: String, default: null },
      openai: { type: String, default: null },
      claude: { type: String, default: null },
    },
    // Which provider/model the user last used, so the UI can default to it
    lastUsedProvider: {
      type: String,
      enum: ["gemini", "openai", "claude"],
      default: "gemini",
    },
    lastLoginAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      _id: this._id,
      email: this.email,
      name: this.name,
    },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
  );
};

userSchema.methods.generateRefreshToken = function () {
  return jwt.sign({ _id: this._id }, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
  });
};

export const User = mongoose.model("User", userSchema);

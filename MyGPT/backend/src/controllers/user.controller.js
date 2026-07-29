import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { encrypt, decrypt, maskKey } from "../utils/encryption.js";
import { PROVIDERS } from "../constants.js";

/**
 * GET /api/v1/users/api-keys
 * Returns which providers have a key saved + a masked preview (never the raw key).
 */
export const getApiKeyStatus = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select("apiKeys lastUsedProvider");

  const status = {};
  for (const provider of Object.keys(PROVIDERS)) {
    const encrypted = user.apiKeys?.[provider];
    status[provider] = {
      connected: Boolean(encrypted),
      preview: encrypted ? maskKey(decrypt(encrypted)) : null,
    };
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { keys: status, lastUsedProvider: user.lastUsedProvider },
        "API key status fetched"
      )
    );
});

/**
 * PUT /api/v1/users/api-keys
 * Body: { provider: "gemini" | "openai" | "claude", apiKey: "..." }
 * Encrypts and saves the user's pasted key.
 */
export const saveApiKey = asyncHandler(async (req, res) => {
  const { provider, apiKey } = req.body;

  if (!provider || !PROVIDERS[provider]) {
    throw new ApiError(400, "A valid provider is required (gemini, openai, claude)");
  }
  if (!apiKey || apiKey.trim().length < 10) {
    throw new ApiError(400, "Please paste a valid API key");
  }

  const encrypted = encrypt(apiKey.trim());

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { $set: { [`apiKeys.${provider}`]: encrypted, lastUsedProvider: provider } },
    { new: true }
  ).select("apiKeys lastUsedProvider");

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { provider, preview: maskKey(apiKey.trim()) },
        `${PROVIDERS[provider].label} key saved`
      )
    );
});

/**
 * DELETE /api/v1/users/api-keys/:provider
 */
export const deleteApiKey = asyncHandler(async (req, res) => {
  const { provider } = req.params;

  if (!PROVIDERS[provider]) {
    throw new ApiError(400, "Invalid provider");
  }

  await User.findByIdAndUpdate(req.user._id, {
    $set: { [`apiKeys.${provider}`]: null },
  });

  return res
    .status(200)
    .json(new ApiResponse(200, { provider }, "API key removed"));
});

/**
 * PATCH /api/v1/users/last-provider
 * Body: { provider }
 */
export const setLastUsedProvider = asyncHandler(async (req, res) => {
  const { provider } = req.body;
  if (!PROVIDERS[provider]) {
    throw new ApiError(400, "Invalid provider");
  }

  await User.findByIdAndUpdate(req.user._id, { lastUsedProvider: provider });

  return res
    .status(200)
    .json(new ApiResponse(200, { provider }, "Preference saved"));
});

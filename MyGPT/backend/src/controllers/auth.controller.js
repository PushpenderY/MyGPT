import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { COOKIE_OPTIONS } from "../constants.js";

const generateAccessAndRefreshTokens = async (userId) => {
  const user = await User.findById(userId);
  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();

  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  return { accessToken, refreshToken };
};

/**
 * GET /api/v1/auth/google/callback
 * Hit after passport's GoogleStrategy has authenticated the user (req.user is set).
 * Issues access/refresh token cookies then redirects back to the React app.
 */
export const googleAuthCallback = asyncHandler(async (req, res) => {
  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    req.user._id
  );

  const redirectUrl = process.env.CLIENT_SUCCESS_REDIRECT_URL;

  res
    .status(200)
    .cookie("accessToken", accessToken, {
      ...COOKIE_OPTIONS,
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    })
    .cookie("refreshToken", refreshToken, {
      ...COOKIE_OPTIONS,
      maxAge: 10 * 24 * 60 * 60 * 1000, // 10 days
    })
    .redirect(redirectUrl);
});

/**
 * POST /api/v1/auth/refresh-token
 * Reads the refresh token cookie, validates it against what's stored in
 * MongoDB for that user, and issues a brand new access + refresh token pair.
 */
export const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies?.refreshToken || req.body?.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "Unauthorized request - no refresh token");
  }

  let decoded;
  try {
    decoded = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);
  } catch (error) {
    throw new ApiError(401, "Refresh token is expired or invalid");
  }

  const user = await User.findById(decoded._id);

  if (!user) {
    throw new ApiError(401, "Invalid refresh token");
  }

  if (incomingRefreshToken !== user.refreshToken) {
    throw new ApiError(401, "Refresh token is expired or has been used");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id
  );

  res
    .status(200)
    .cookie("accessToken", accessToken, {
      ...COOKIE_OPTIONS,
      maxAge: 24 * 60 * 60 * 1000,
    })
    .cookie("refreshToken", refreshToken, {
      ...COOKIE_OPTIONS,
      maxAge: 10 * 24 * 60 * 60 * 1000,
    })
    .json(new ApiResponse(200, { accessToken }, "Access token refreshed"));
});

/**
 * POST /api/v1/auth/logout
 */
export const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, {
    $unset: { refreshToken: 1 },
  });

  res
    .status(200)
    .clearCookie("accessToken", COOKIE_OPTIONS)
    .clearCookie("refreshToken", COOKIE_OPTIONS)
    .json(new ApiResponse(200, {}, "Logged out successfully"));
});

/**
 * GET /api/v1/auth/me
 * Returns the logged in user's profile (used by the frontend on app load
 * to decide whether to show the login screen or the chat UI).
 */
export const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "Current user fetched"));
});

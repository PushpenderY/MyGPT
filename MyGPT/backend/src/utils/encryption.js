import crypto from "crypto";

const ALGORITHM = "aes-256-cbc";

// ENCRYPTION_KEY must be exactly 32 characters (see .env.sample)
const getKey = () => {
  const key = process.env.ENCRYPTION_KEY;
  if (!key || key.length !== 32) {
    throw new Error(
      "ENCRYPTION_KEY must be set in .env and must be exactly 32 characters long"
    );
  }
  return Buffer.from(key);
};

/**
 * Encrypts a plain text string (e.g. a raw API key pasted by the user).
 * Returns "iv:cipherText" hex encoded, safe to store in MongoDB.
 */
export const encrypt = (text) => {
  if (!text) return null;
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  return `${iv.toString("hex")}:${encrypted}`;
};

/**
 * Decrypts a string produced by encrypt().
 */
export const decrypt = (encryptedText) => {
  if (!encryptedText) return null;
  const [ivHex, encryptedHex] = encryptedText.split(":");
  if (!ivHex || !encryptedHex) return null;
  const iv = Buffer.from(ivHex, "hex");
  const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), iv);
  let decrypted = decipher.update(encryptedHex, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
};

/**
 * Masks a decrypted key for safe display in the UI, e.g. "sk-abc...wxyz"
 */
export const maskKey = (key) => {
  if (!key || key.length < 8) return "••••••••";
  return `${key.slice(0, 4)}••••${key.slice(-4)}`;
};

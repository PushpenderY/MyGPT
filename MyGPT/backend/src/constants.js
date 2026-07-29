export const DB_NAME = "mygpt";

export const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
};

// Providers supported by the LLM proxy. Each maps to the default model used
// when the user does not explicitly pick one in the model selector.
export const PROVIDERS = {
  gemini: {
    label: "Google Gemini",
    defaultModel: "gemini-2.5-flash",
    supportsFiles: true,
  },
  openai: {
    label: "OpenAI GPT",
    defaultModel: "gpt-4o-mini",
    supportsFiles: true,
  },
  claude: {
    label: "Anthropic Claude",
    defaultModel: "claude-3-5-sonnet-20241022",
    supportsFiles: true,
  },
};

export const MAX_HISTORY_MESSAGES = 20; // how many past messages we feed back as context

export const ERROR_MESSAGES = {
  EMPTY_PROMPT: "Please enter a prompt.",
  PROMPT_TOO_LONG: "Prompt is too long. Please shorten it.",
  MISSING_IMAGE: "Please upload an image.",
  IMAGE_TOO_LARGE: "Image must be under 7 MB.",
  INVALID_IMAGE_FORMAT: "Supported formats: JPEG, PNG, WebP.",
  INVALID_ASPECT_RATIO: "Invalid aspect ratio.",
  INVALID_RESOLUTION: "Resolution must be 1K, 2K, or 4K.",
  GENERATION_FAILED: "Image generation failed. Please try again.",
  SAFETY_BLOCKED:
    "The request was blocked by content safety filters. Try rephrasing your prompt.",
  TIMEOUT: "Request timed out. Try a simpler prompt or lower resolution.",
  INVALID_BODY: "Invalid request body.",
} as const;

export const VALID_ASPECT_RATIOS = [
  "1:1",
  "3:2",
  "2:3",
  "4:3",
  "3:4",
  "16:9",
  "9:16",
  "21:9",
] as const;

export const VALID_RESOLUTIONS = ["1K", "2K", "4K"] as const;
export const VALID_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;
export const MAX_IMAGE_SIZE_BYTES = 7 * 1024 * 1024; // 7 MB
export const MAX_PROMPT_LENGTH = 10_000;
export const GEMINI_TIMEOUT_MS = 115_000; // 115s (5s buffer before Vercel's maxDuration)

export const ASPECT_RATIOS = [
  { value: "1:1", label: "1:1", widthFactor: 1, heightFactor: 1 },
  { value: "3:2", label: "3:2", widthFactor: 1.5, heightFactor: 1 },
  { value: "2:3", label: "2:3", widthFactor: 1, heightFactor: 1.5 },
  { value: "4:3", label: "4:3", widthFactor: 1.33, heightFactor: 1 },
  { value: "3:4", label: "3:4", widthFactor: 1, heightFactor: 1.33 },
  { value: "16:9", label: "16:9", widthFactor: 1.78, heightFactor: 1 },
  { value: "9:16", label: "9:16", widthFactor: 1, heightFactor: 1.78 },
  { value: "21:9", label: "21:9", widthFactor: 2.33, heightFactor: 1 },
] as const;

export const RESOLUTIONS = [
  { value: "1K", label: "1K", cost: "$0.13" },
  { value: "2K", label: "2K", cost: "$0.13" },
  { value: "4K", label: "4K", cost: "$0.24" },
] as const;

export type AspectRatio = (typeof ASPECT_RATIOS)[number]["value"];
export type Resolution = (typeof RESOLUTIONS)[number]["value"];

// OpenAI fallback configuration
export const OPENAI_API_URL = "https://api.openai.com/v1/images/generations";
export const OPENAI_MODEL = "gpt-image-1.5";
export const OPENAI_TIMEOUT_MS = 90_000; // 90s — leave buffer within Vercel's 120s maxDuration

// Map Gemini aspect ratios to OpenAI size strings
// OpenAI gpt-image-1.5 supports: "1024x1024", "1536x1024", "1024x1536"
export const ASPECT_RATIO_TO_OPENAI_SIZE: Record<string, string> = {
  "1:1": "1024x1024",
  "3:2": "1536x1024",
  "4:3": "1536x1024",
  "16:9": "1536x1024",
  "21:9": "1536x1024",
  "2:3": "1024x1536",
  "3:4": "1024x1536",
  "9:16": "1024x1536",
};

// Map Gemini resolution to OpenAI quality parameter
export const RESOLUTION_TO_OPENAI_QUALITY: Record<string, string> = {
  "1K": "medium",
  "2K": "high",
  "4K": "high",
};

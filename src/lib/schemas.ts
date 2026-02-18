import { z } from "zod";
import {
  VALID_ASPECT_RATIOS,
  VALID_RESOLUTIONS,
  VALID_MIME_TYPES,
  ERROR_MESSAGES,
  MAX_PROMPT_LENGTH,
} from "@/lib/constants";

export const generateRequestSchema = z
  .object({
    prompt: z
      .string({ error: ERROR_MESSAGES.EMPTY_PROMPT })
      .min(1, ERROR_MESSAGES.EMPTY_PROMPT)
      .max(MAX_PROMPT_LENGTH, ERROR_MESSAGES.PROMPT_TOO_LONG),
    mode: z.enum(["text-to-image", "image-to-image"]).default("text-to-image"),
    aspectRatio: z
      .enum([...VALID_ASPECT_RATIOS], {
        error: ERROR_MESSAGES.INVALID_ASPECT_RATIO,
      })
      .default("1:1"),
    resolution: z
      .enum([...VALID_RESOLUTIONS], {
        error: ERROR_MESSAGES.INVALID_RESOLUTION,
      })
      .default("1K"),
    image: z.string().optional(),
    imageMimeType: z
      .enum([...VALID_MIME_TYPES], {
        error: ERROR_MESSAGES.INVALID_IMAGE_FORMAT,
      })
      .optional(),
  })
  .refine(
    (data) => {
      if (data.mode === "image-to-image") {
        return !!data.image && !!data.imageMimeType;
      }
      return true;
    },
    {
      message: ERROR_MESSAGES.MISSING_IMAGE,
      path: ["image"],
    }
  );

export type GenerateRequest = z.infer<typeof generateRequestSchema>;

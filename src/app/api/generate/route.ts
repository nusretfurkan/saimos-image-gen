import { NextRequest } from "next/server";
import { ThinkingLevel as GeminiThinkingLevel } from "@google/genai";
import { getAI, MODEL_ID } from "@/lib/gemini";
import { generateRequestSchema } from "@/lib/schemas";
import { ERROR_MESSAGES, GEMINI_TIMEOUT_MS } from "@/lib/constants";
import { generateWithOpenAI } from "@/lib/openai";

export const maxDuration = 120;

export async function POST(req: NextRequest) {
  // 1. Parse request body
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json(
      { error: ERROR_MESSAGES.INVALID_BODY },
      { status: 400 }
    );
  }

  // 2. Validate with Zod
  const parsed = generateRequestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  const {
    prompt,
    mode,
    aspectRatio,
    resolution,
    thinkingLevel,
    image,
    imageMimeType,
  } = parsed.data;

  // 3. Build Gemini request parts
  const parts: Array<
    { text: string } | { inlineData: { data: string; mimeType: string } }
  > = [{ text: prompt }];

  if (mode === "image-to-image" && image && imageMimeType) {
    // Strip data URL prefix if present
    const base64Data = image.includes(",") ? image.split(",")[1] : image;
    parts.push({
      inlineData: { data: base64Data, mimeType: imageMimeType },
    });
  }

  // 4. Build Gemini config
  const baseConfig = {
    responseModalities: ["TEXT", "IMAGE"] as string[],
    imageConfig: { aspectRatio, imageSize: resolution },
  };

  const thinkingConfig = {
    thinkingLevel: thinkingLevel as GeminiThinkingLevel,
  };

  // Helper: detect if error is a Gemini 503 or 429 (eligible for OpenAI fallback)
  function isFallbackEligible(err: unknown): boolean {
    if (typeof err === "object" && err !== null && "status" in err) {
      const status = (err as { status: number }).status;
      return status === 429 || status === 503;
    }
    return false;
  }

  // Helper: detect if error is specifically about thinkingConfig
  function isThinkingConfigError(err: unknown): boolean {
    if (!(err instanceof Error)) return false;
    const msg = err.message.toLowerCase();
    return (
      msg.includes("thinking") ||
      msg.includes("thinkingconfig") ||
      msg.includes("invalid config")
    );
  }

  // Helper: call Gemini with timeout
  async function callGemini(includeThinking: boolean) {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error("TIMEOUT")), GEMINI_TIMEOUT_MS);
    });

    const config = includeThinking
      ? { ...baseConfig, thinkingConfig }
      : baseConfig;

    const generatePromise = getAI().models.generateContent({
      model: MODEL_ID,
      contents: [{ role: "user", parts }],
      config,
    });

    return Promise.race([generatePromise, timeoutPromise]);
  }

  // 5. Call Gemini -- attempt with thinkingConfig, fallback without
  try {
    let response;
    try {
      response = await callGemini(true);
    } catch (err) {
      if (isThinkingConfigError(err)) {
        console.warn(
          "thinkingConfig not supported, retrying without:",
          err instanceof Error ? err.message : err
        );
        response = await callGemini(false);
      } else {
        throw err;
      }
    }

    // 6. Safety filter detection
    if (response.promptFeedback?.blockReason) {
      return Response.json(
        { error: ERROR_MESSAGES.SAFETY_BLOCKED },
        { status: 422 }
      );
    }

    const candidate = response.candidates?.[0];

    if (candidate?.finishReason === "SAFETY") {
      return Response.json(
        { error: ERROR_MESSAGES.SAFETY_BLOCKED },
        { status: 422 }
      );
    }

    // 7. Extract image and text from response parts
    let imageData: string | null = null;
    let mimeType = "image/png";
    let textResponse: string | null = null;

    for (const part of candidate?.content?.parts ?? []) {
      if (part.inlineData?.data) {
        imageData = part.inlineData.data;
        mimeType = part.inlineData.mimeType || "image/png";
      }
      if (part.text) {
        textResponse = part.text;
      }
    }

    if (!imageData) {
      return Response.json(
        { error: ERROR_MESSAGES.SAFETY_BLOCKED },
        { status: 422 }
      );
    }

    // 8. Return binary image response
    const binaryData = Buffer.from(imageData, "base64");

    return new Response(binaryData, {
      status: 200,
      headers: {
        "Content-Type": mimeType,
        "Content-Length": binaryData.length.toString(),
        "X-Text-Response": textResponse
          ? encodeURIComponent(textResponse)
          : "",
        "X-Image-Provider": "gemini",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    // Timeout — no fallback, return immediately
    if (error instanceof Error && error.message === "TIMEOUT") {
      return Response.json(
        { error: ERROR_MESSAGES.TIMEOUT },
        { status: 504 }
      );
    }

    // Attempt OpenAI fallback only for 429/503 + text-to-image + key present
    if (
      isFallbackEligible(error) &&
      mode === "text-to-image" &&
      process.env.OPENAI_API_KEY
    ) {
      console.warn(
        `Gemini returned ${(error as { status: number }).status}, falling back to OpenAI`
      );

      try {
        const result = await generateWithOpenAI(prompt, aspectRatio, resolution);
        const fallbackData = Buffer.from(result.imageData, "base64");

        return new Response(fallbackData, {
          status: 200,
          headers: {
            "Content-Type": result.mimeType,
            "Content-Length": fallbackData.length.toString(),
            "X-Text-Response": "",
            "X-Image-Provider": "openai",
            "Cache-Control": "no-store",
          },
        });
      } catch (fallbackError) {
        console.error("OpenAI fallback also failed:", fallbackError);
      }
    }

    console.error("Gemini API error:", error);
    return Response.json(
      { error: ERROR_MESSAGES.GENERATION_FAILED },
      { status: 502 }
    );
  }
}

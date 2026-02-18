import { NextRequest } from "next/server";
import { ai, MODEL_ID } from "@/lib/gemini";
import { generateRequestSchema } from "@/lib/schemas";
import { ERROR_MESSAGES, GEMINI_TIMEOUT_MS } from "@/lib/constants";

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

  const { prompt, mode, aspectRatio, resolution, image, imageMimeType } =
    parsed.data;

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

  // 4. Call Gemini with timeout
  try {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error("TIMEOUT")), GEMINI_TIMEOUT_MS);
    });

    const generatePromise = ai.models.generateContent({
      model: MODEL_ID,
      contents: [{ role: "user", parts }],
      config: {
        responseModalities: ["TEXT", "IMAGE"],
        imageConfig: { aspectRatio, imageSize: resolution },
      },
    });

    const response = await Promise.race([generatePromise, timeoutPromise]);

    // 5. Safety filter detection
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

    // 6. Extract image and text from response parts
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

    // 7. Return binary image response
    const binaryData = Buffer.from(imageData, "base64");

    return new Response(binaryData, {
      status: 200,
      headers: {
        "Content-Type": mimeType,
        "Content-Length": binaryData.length.toString(),
        "X-Text-Response": textResponse
          ? encodeURIComponent(textResponse)
          : "",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "TIMEOUT") {
      return Response.json(
        { error: ERROR_MESSAGES.TIMEOUT },
        { status: 504 }
      );
    }

    console.error("Gemini API error:", error);
    return Response.json(
      { error: ERROR_MESSAGES.GENERATION_FAILED },
      { status: 502 }
    );
  }
}
